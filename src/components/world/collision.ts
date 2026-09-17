import { BOUNDS, COLLIDERS, type Collider } from './layout';

/**
 * Collision for the district.
 *
 * Three things the old single-pass push-out got wrong, and this fixes:
 *
 *  - **Sliding.** Resolving the shortest overlap on one combined move makes a
 *    player scrape along a wall in jerks. Here each axis is tried on its own, so
 *    a blocked X leaves Z free and you slide along the facade smoothly.
 *  - **Tunnelling.** A sprint step is large enough to jump a thin kerb or a
 *    railing between frames. Movement is substepped to under a body radius.
 *  - **Cost.** Testing ~300 boxes every frame is wasteful and gets worse as the
 *    city grows, so colliders are bucketed into a uniform grid and only the
 *    buckets the body touches are ever queried.
 *
 * Bodies are circles, obstacles are axis-aligned boxes, and the test is
 * closest-point-on-box, which is correct at corners where an overlap test on
 * each axis separately is not.
 */

/** Anything no taller than this is a kerb, a rail or a planter: step over it. */
export const STEP_HEIGHT = 0.5;

const CELL = 16;

function key(cx: number, cz: number) {
  // Cell coordinates are small enough that this packs into one safe integer.
  return (cx + 4096) * 16384 + (cz + 4096);
}

/** Uniform grid over the collider set, built once. */
const GRID = new Map<number, Collider[]>();

for (const c of COLLIDERS) {
  if (c.height <= STEP_HEIGHT) continue;
  const x0 = Math.floor(c.minX / CELL);
  const x1 = Math.floor(c.maxX / CELL);
  const z0 = Math.floor(c.minZ / CELL);
  const z1 = Math.floor(c.maxZ / CELL);
  for (let cx = x0; cx <= x1; cx++) {
    for (let cz = z0; cz <= z1; cz++) {
      const k = key(cx, cz);
      const bucket = GRID.get(k);
      if (bucket) bucket.push(c);
      else GRID.set(k, [c]);
    }
  }
}

/** Scratch list, reused so the hot path allocates nothing. */
const near: Collider[] = [];

function gather(x: number, z: number, r: number) {
  near.length = 0;
  const x0 = Math.floor((x - r) / CELL);
  const x1 = Math.floor((x + r) / CELL);
  const z0 = Math.floor((z - r) / CELL);
  const z1 = Math.floor((z + r) / CELL);

  for (let cx = x0; cx <= x1; cx++) {
    for (let cz = z0; cz <= z1; cz++) {
      const bucket = GRID.get(key(cx, cz));
      if (!bucket) continue;
      for (let i = 0; i < bucket.length; i++) {
        const c = bucket[i];
        // A box can sit in several cells; skip the ones already collected.
        if (near.indexOf(c) === -1) near.push(c);
      }
    }
  }
  return near;
}

/** Squared distance from a point to a box, zero when the point is inside. */
function distanceSq(c: Collider, x: number, z: number) {
  const dx = x < c.minX ? c.minX - x : x > c.maxX ? x - c.maxX : 0;
  const dz = z < c.minZ ? c.minZ - z : z > c.maxZ ? z - c.maxZ : 0;
  return dx * dx + dz * dz;
}

/** True when a body of radius `r` centred at (x, z) overlaps anything solid. */
export function blocked(x: number, z: number, r: number): boolean {
  const list = gather(x, z, r);
  for (let i = 0; i < list.length; i++) {
    if (distanceSq(list[i], x, z) < r * r) return true;
  }
  return false;
}

/**
 * Pushes a body out of anything it has ended up inside.
 *
 * Only ever needed when something spawns badly or the layout changes under a
 * standing player, but without it those cases trap you permanently.
 */
export function depenetrate(x: number, z: number, r: number): [number, number] {
  let px = x;
  let pz = z;

  for (let pass = 0; pass < 8; pass++) {
    let moved = false;
    const list = gather(px, pz, r);

    for (let i = 0; i < list.length; i++) {
      const c = list[i];
      if (distanceSq(c, px, pz) >= r * r) continue;

      // Inside the box: leave by the nearest face. Outside but overlapping:
      // push along the vector from the closest point on the box.
      const inside = px > c.minX && px < c.maxX && pz > c.minZ && pz < c.maxZ;

      if (inside) {
        const toLeft = px - (c.minX - r);
        const toRight = c.maxX + r - px;
        const toNear = pz - (c.minZ - r);
        const toFar = c.maxZ + r - pz;
        const min = Math.min(toLeft, toRight, toNear, toFar);
        if (min === toLeft) px = c.minX - r;
        else if (min === toRight) px = c.maxX + r;
        else if (min === toNear) pz = c.minZ - r;
        else pz = c.maxZ + r;
      } else {
        const cx = Math.max(c.minX, Math.min(px, c.maxX));
        const cz = Math.max(c.minZ, Math.min(pz, c.maxZ));
        let nx = px - cx;
        let nz = pz - cz;
        const len = Math.hypot(nx, nz) || 1;
        nx /= len;
        nz /= len;
        px = cx + nx * r;
        pz = cz + nz * r;
      }
      moved = true;
    }

    if (!moved) break;
  }

  // Deep inside a dense block, pushing out of one box can land inside the next,
  // and the passes above can trade the body back and forth. Rather than leave
  // someone welded into a building, sweep outwards for the nearest free spot.
  if (blocked(px, pz, r)) {
    for (let ring = 1; ring <= 24; ring++) {
      const radius = ring * r * 1.5;
      for (let a = 0; a < 16; a++) {
        const angle = (a / 16) * Math.PI * 2;
        const tx = x + Math.cos(angle) * radius;
        const tz = z + Math.sin(angle) * radius;
        if (!blocked(tx, tz, r)) return [tx, tz];
      }
    }
  }

  return [px, pz];
}

export type MoveResult = {
  x: number;
  z: number;
  /** Set when that axis was refused, so the caller can shed its velocity. */
  hitX: boolean;
  hitZ: boolean;
};

/**
 * Advances a body by (dx, dz), sliding along whatever it meets.
 *
 * Each axis is attempted separately within each substep: that is what turns a
 * head-on collision into a slide instead of a stop.
 */
export function move(
  x: number,
  z: number,
  dx: number,
  dz: number,
  r: number,
): MoveResult {
  let px = x;
  let pz = z;
  let hitX = false;
  let hitZ = false;

  const dist = Math.hypot(dx, dz);
  const steps = dist > 0 ? Math.min(8, Math.ceil(dist / (r * 0.7))) : 1;
  const sx = dx / steps;
  const sz = dz / steps;

  for (let s = 0; s < steps; s++) {
    if (sx !== 0) {
      const nx = px + sx;
      if (blocked(nx, pz, r)) hitX = true;
      else px = nx;
    }
    if (sz !== 0) {
      const nz = pz + sz;
      if (blocked(px, nz, r)) hitZ = true;
      else pz = nz;
    }
  }

  [px, pz] = depenetrate(px, pz, r);

  return {
    x: Math.max(BOUNDS.minX + r, Math.min(BOUNDS.maxX - r, px)),
    z: Math.max(BOUNDS.minZ + r, Math.min(BOUNDS.maxZ - r, pz)),
    hitX,
    hitZ,
  };
}

/** Line-of-sight test along the camera boom. */
export function occupied(x: number, z: number, pad = 0.6): boolean {
  return blocked(x, z, pad);
}
