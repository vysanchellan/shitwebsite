import { COLLIDERS, CITY, BOUNDS, STREET_PROPS, VEHICLES } from './layout.js';
import { SPAWN, UNITS } from './parkSquare.js';
import { move, blocked, STEP_HEIGHT } from './collision.js';

const R = 0.55, WALK = 7.4, SPRINT = 13.2, DT = 1 / 60;

function step(yaw, fwd, right, p, speed = WALK) {
  const sin = Math.sin(yaw), cos = Math.cos(yaw);
  let tx = fwd * sin - right * cos, tz = fwd * cos + right * sin;
  const len = Math.hypot(tx, tz) || 1;
  return move(p.x, p.z, (tx / len) * speed * DT, (tz / len) * speed * DT, R);
}
function walk(yaw, fwd, right, from, frames, speed) {
  let p = { ...from };
  for (let i = 0; i < frames; i++) p = step(yaw, fwd, right, p, speed);
  return p;
}

const pass = [], fail = [];
const t = (name, ok, extra = '') => (ok ? pass : fail).push(name + (extra ? '  ' + extra : ''));

const spawn = { x: SPAWN[0], z: SPAWN[1] }, YAW = Math.PI;

// Direction
t('spawn is clear', !blocked(spawn.x, spawn.z, R));
t('W walks forward', walk(YAW, 1, 0, spawn, 60).z < spawn.z - 3);
t('S retreats', walk(YAW, -1, 0, spawn, 60).z > spawn.z + 3);
t('D strafes screen-right', walk(YAW, 0, 1, spawn, 60).x > spawn.x + 3);
t('A strafes screen-left', walk(YAW, 0, -1, spawn, 60).x < spawn.x - 3);

// Sliding: walk diagonally into a building face and check you keep moving along it.
const wall = COLLIDERS.find(c => c.height > 8 && c.maxX - c.minX > 10);
const start = { x: (wall.minX + wall.maxX) / 2, z: wall.maxZ + R + 2.5 };
let p = { ...start };
for (let i = 0; i < 180; i++) {
  // Push north-west into the wall at 45 degrees.
  p = move(p.x, p.z, -WALK * DT * 0.707, -WALK * DT * 0.707, R);
}
t('slides along a wall instead of sticking', Math.abs(p.x - start.x) > 5,
  `travelled ${(start.x - p.x).toFixed(1)}m along the face`);
t('never enters the wall', !blocked(p.x, p.z, R));

// Tunnelling: sprint straight at a thin obstacle and make sure it stops you.
const thin = COLLIDERS.find(c => c.height > STEP_HEIGHT && (c.maxZ - c.minZ) < 0.9);
if (thin) {
  const before = { x: (thin.minX + thin.maxX) / 2, z: thin.maxZ + R + 1.2 };
  const after = walk(0, -1, 0, before, 40, SPRINT * 2);
  t('a sprint cannot tunnel a thin obstacle', after.z > thin.maxZ, `z=${after.z.toFixed(2)} vs face ${thin.maxZ.toFixed(2)}`);
}

// Depenetration: start inside a building and confirm one move ejects you.
const box = COLLIDERS.find(c => c.height > 8);
const inside = move((box.minX + box.maxX) / 2, (box.minZ + box.maxZ) / 2, 0, 0, R);
t('ejects a body stuck inside geometry', !blocked(inside.x, inside.z, R));

// Steppables stay steppable.
// A steppable box must never block on its own account. Some sit inside a solid
// one (a bench pushed against a planter), so exclude those.
const low = COLLIDERS.filter(c => c.height <= STEP_HEIGHT);
const solid = COLLIDERS.filter(c => c.height > STEP_HEIGHT);
const inSolid = (x, z) => solid.some(c => x > c.minX && x < c.maxX && z > c.minZ && z < c.maxZ);
const wrong = low.filter(c => {
  const x = (c.minX + c.maxX) / 2, z = (c.minZ + c.maxZ) / 2;
  return blocked(x, z, 0.01) && !inSolid(x, z);
});
t('kerb-height props never block', wrong.length === 0, `${low.length} steppable, ${wrong.length} wrongly solid`);

// Perf: the broad phase must not degrade as the city grows.
const t0 = performance.now();
let q = { x: 0, z: 40 };
for (let i = 0; i < 20000; i++) q = move(q.x, q.z, 0.02, -0.01, R);
const us = ((performance.now() - t0) / 20000) * 1000;
t('move() stays cheap', us < 40, `${us.toFixed(1)}us per call, ${COLLIDERS.length} colliders`);

// Every unit's marker must have somewhere standable within reading range, or
// a shopfront is unreadable and nobody finds out until they walk there.
const RANGE = 5.2;
const front = (u) => {
  switch (u.facing) {
    case 'n': return [u.x, u.z - u.d / 2 - 3.2];
    case 's': return [u.x, u.z + u.d / 2 + 3.2];
    case 'e': return [u.x + u.w / 2 + 3.2, u.z];
    default:  return [u.x - u.w / 2 - 3.2, u.z];
  }
};
const unreachable = UNITS.filter((u) => {
  if (!u.node) return false;
  const [nx, nz] = front(u);
  for (let r = 0; r <= RANGE - 0.3; r += 0.3)
    for (let a = 0; a < 32; a++) {
      const x = nx + Math.cos((a / 32) * Math.PI * 2) * r;
      const z = nz + Math.sin((a / 32) * Math.PI * 2) * r;
      if (!blocked(x, z, R)) return false;
    }
  return true;
}).map((u) => `${u.tenant} (${u.node})`);
t('every shopfront can be reached', unreachable.length === 0,
  unreachable.length ? unreachable.join(', ') : `${UNITS.filter(u=>u.node).length} units`);

console.log('PASS');
for (const p of pass) console.log('  ' + p);
if (fail.length) { console.log('FAIL'); for (const f of fail) console.log('  ' + f); }
console.log(`\n${pass.length} passed, ${fail.length} failed`);
console.log(`colliders ${COLLIDERS.length}  (precinct units ${UNITS.length}, city ${CITY.length}, props ${STREET_PROPS.length}, vehicles ${VEHICLES.length})`);
