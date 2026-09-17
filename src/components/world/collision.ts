import { BOUNDS, COLLIDERS, type Collider } from './layout';

/**
 * Axis-aligned push-out. The player is a circle of radius `r`; every structure
 * is a box. On overlap we resolve along the shallowest axis, which is stable
 * enough to slide along a wall without the jitter a naive stop() produces.
 */
export function resolve(x: number, z: number, r: number): [number, number] {
  let px = x;
  let pz = z;

  for (let i = 0; i < COLLIDERS.length; i++) {
    const c = COLLIDERS[i];
    if (px + r <= c.minX || px - r >= c.maxX || pz + r <= c.minZ || pz - r >= c.maxZ) {
      continue;
    }

    const toRight = c.maxX + r - px;
    const toLeft = px - (c.minX - r);
    const toFar = c.maxZ + r - pz;
    const toNear = pz - (c.minZ - r);

    const min = Math.min(toRight, toLeft, toFar, toNear);
    if (min === toRight) px = c.maxX + r;
    else if (min === toLeft) px = c.minX - r;
    else if (min === toFar) pz = c.maxZ + r;
    else pz = c.minZ - r;
  }

  return [
    Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, px)),
    Math.max(BOUNDS.minZ, Math.min(BOUNDS.maxZ, pz)),
  ];
}

/** True when a point sits inside any structure — used to pull the camera in. */
export function occupied(x: number, z: number, pad = 0.6): boolean {
  for (let i = 0; i < COLLIDERS.length; i++) {
    const c: Collider = COLLIDERS[i];
    if (x > c.minX - pad && x < c.maxX + pad && z > c.minZ - pad && z < c.maxZ + pad) {
      return true;
    }
  }
  return false;
}
