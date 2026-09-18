import { BOUNDS, COLLIDERS, type Collider } from './layout';
import { heightAt } from './terrain';

/**
 * Collision for the precinct.
 *
 * Bodies are circles, obstacles are axis-aligned boxes, and the test is
 * closest-point-on-box, which is correct at corners where an overlap test on
 * each axis separately is not.
 *
 * Four things this gets right that a naive push-out does not:
 *
 *  - **Sliding.** Resolving the shortest overlap on one combined move makes a
 *    player scrape along a wall in jerks. Each axis is tried on its own, so a
 *    blocked X leaves Z free and you slide along the facade smoothly.
 *  - **Tunnelling.** A sprint step is large enough to jump a thin kerb or a
 *    railing between frames. Movement is substepped to under a body radius.
 *  - **Cost.** Testing every box every frame gets worse as the world grows, so
 *    colliders are bucketed into a uniform grid and only the buckets the body
 *    touches are ever queried.
 *  - **Levels.** Which boxes are solid depends on the height you are standing
 *    at, and that height is read from the terrain here, per substep.
 *
 * That last point is the one that bit. The height used to be passed in by the
 * caller, which passed the *damped* value it uses to move the avatar smoothly
 * up a flight of stairs. That value lags the real ground by design, so during
 * any level change every box was tested against a height the body was not
 * actually at — walls and balustrades were skipped, and the depenetration
 * sweep then hunted metres outward for somewhere "free", which is what walking
 * through a building looked like from the inside.
 *
 * Collision owns the height now, and a body only ever moves to a point it has
 * tested clear at that point's own ground. That makes being inside geometry
 * unreachable rather than recoverable, so nothing has to teleport.
 */

/** Anything no taller than this is a kerb, a rail or a planter: step over it. */
export const STEP_HEIGHT = 0.5;

/** Shoulder height. Anything whose underside clears this is walked under. */
export const BODY_HEIGHT = 1.9;

const CELL = 16;

function key(cx: number, cz: number) {
  // Cell coordinates are small enough that this packs into one safe integer.
  return (cx + 4096) * 16384 + (cz + 4096);
}

/** Uniform grid over the collider set, built once. */
const GRID = new Map<number, Collider[]>();

// Everything goes in the grid. Whether a box blocks depends on where the body
// is standing, which is only known at query time now that the site has levels.
for (const c of COLLIDERS) {
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

/**
 * True when a body of radius `r` standing on the ground at (x, z) overlaps
 * anything solid.
 *
 * The vertical test is what makes a multi-level site work: a box whose top is
 * within a step of your feet is walked over, and one whose underside clears
 * your shoulders is walked under. The arcade soffit and the office overhangs
 * pass the second test; kerbs, planters and benches pass the first.
 *
 * `y` defaults to the terrain height at the point being tested, which is what
 * every movement query wants. Pass it explicitly only to ask a hypothetical —
 * the camera boom does, because it sweeps at the player's height rather than
 * at the ground under each sample.
 */
export function blocked(x: number, z: number, r: number, y = heightAt(x, z)): boolean {
  const list = gather(x, z, r);
  for (let i = 0; i < list.length; i++) {
    const c = list[i];
    if (c.baseY + c.height <= y + STEP_HEIGHT) continue;
    if (c.baseY >= y + BODY_HEIGHT) continue;
    if (distanceSq(c, x, z) < r * r) return true;
  }
  return false;
}

/**
 * Pushes a body out of anything it has ended up inside.
 *
 * With movement testing every candidate point this is only needed when
 * something is *placed* badly — a spawn, or a layout change under a standing
 * player. It is deliberately short-range: a body that cannot free itself
 * within a couple of metres stays where it is rather than being flung across
 * the precinct, because a teleport through a wall is worse than a snag.
 */
export function depenetrate(x: number, z: number, r: number): [number, number] {
  let px = x;
  let pz = z;

  for (let pass = 0; pass < 8; pass++) {
    let moved = false;
    const y = heightAt(px, pz);
    const list = gather(px, pz, r);

    for (let i = 0; i < list.length; i++) {
      const c = list[i];
      if (c.baseY + c.height <= y + STEP_HEIGHT) continue;
      if (c.baseY >= y + BODY_HEIGHT) continue;
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

  if (!blocked(px, pz, r)) return [px, pz];

  // Deep inside a dense block the passes above can trade the body between two
  // boxes forever. Sweep outward for the nearest free spot, but only a short
  // way, and test each candidate against its own ground.
  for (let ring = 1; ring <= 6; ring++) {
    const radius = ring * r * 0.8;
    for (let a = 0; a < 16; a++) {
      const angle = (a / 16) * Math.PI * 2;
      const tx = x + Math.cos(angle) * radius;
      const tz = z + Math.sin(angle) * radius;
      if (!blocked(tx, tz, r)) return [tx, tz];
    }
  }

  return [x, z];
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
 * head-on collision into a slide instead of a stop. Every candidate point is
 * tested against the ground at that point, so stepping onto a stair, a ramp or
 * another level re-reads which boxes are solid before committing to the step.
 */
export function move(x: number, z: number, dx: number, dz: number, r: number): MoveResult {
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

  // Only ever needed if the body was already inside something when it arrived.
  if (blocked(px, pz, r)) [px, pz] = depenetrate(px, pz, r);

  return {
    x: Math.max(BOUNDS.minX + r, Math.min(BOUNDS.maxX - r, px)),
    z: Math.max(BOUNDS.minZ + r, Math.min(BOUNDS.maxZ - r, pz)),
    hitX,
    hitZ,
  };
}

/** Line-of-sight test along the camera boom, at the player's own height. */
export function occupied(x: number, z: number, pad = 0.6, y = 0): boolean {
  return blocked(x, z, pad, y);
}
