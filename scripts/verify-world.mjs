import { COLLIDERS, CITY, BOUNDS, STREET_PROPS, VEHICLES } from './layout.js';
import { SPAWN, UNITS } from './parkSquare.js';
import { move, blocked, STEP_HEIGHT } from './collision.js';
import { heightAt, TERRACES, SLOPES } from './terrain.js';
import { NODES } from './content.js';

const R = 0.55, WALK = 7.4, SPRINT = 13.2, DT = 1 / 60;

function step(yaw, fwd, right, p, speed = WALK) {
  const sin = Math.sin(yaw), cos = Math.cos(yaw);
  let tx = fwd * sin - right * cos, tz = fwd * cos + right * sin;
  const len = Math.hypot(tx, tz) || 1;
  const y = heightAt(p.x, p.z);
  return move(p.x, p.z, (tx / len) * speed * DT, (tz / len) * speed * DT, R, y);
}
function walk(yaw, fwd, right, from, frames, speed) {
  let p = { ...from };
  for (let i = 0; i < frames; i++) p = step(yaw, fwd, right, p, speed);
  return p;
}

const pass = [], fail = [];
const t = (name, ok, extra = '') => (ok ? pass : fail).push(name + (extra ? '  ' + extra : ''));

const spawn = { x: SPAWN[0], z: SPAWN[1] }, YAW = Math.PI;

/* -- Direction ------------------------------------------------------------ */

t('spawn is clear', !blocked(spawn.x, spawn.z, R, heightAt(spawn.x, spawn.z)));
t('W walks forward', walk(YAW, 1, 0, spawn, 60).z < spawn.z - 3);
t('S retreats', walk(YAW, -1, 0, spawn, 60).z > spawn.z + 3);
t('D strafes screen-right', walk(YAW, 0, 1, spawn, 60).x > spawn.x + 3);
t('A strafes screen-left', walk(YAW, 0, -1, spawn, 60).x < spawn.x - 3);

/* -- Collision behaviour -------------------------------------------------- */

// Sliding: walk diagonally into a building face and check you keep moving along it.
const wall = COLLIDERS.find(c => c.height > 8 && c.maxX - c.minX > 10);
const start = { x: (wall.minX + wall.maxX) / 2, z: wall.maxZ + R + 2.5 };
let p = { ...start };
for (let i = 0; i < 180; i++) {
  const y = heightAt(p.x, p.z);
  p = move(p.x, p.z, -WALK * DT * 0.707, -WALK * DT * 0.707, R, y);
}
t('slides along a wall instead of sticking', Math.abs(p.x - start.x) > 5,
  `travelled ${Math.abs(start.x - p.x).toFixed(1)}m along the face`);
t('never enters the wall', !blocked(p.x, p.z, R, heightAt(p.x, p.z)));

// Tunnelling: sprint straight at a thin obstacle and make sure it stops you.
const thin = COLLIDERS.find(c => c.height > STEP_HEIGHT && (c.maxZ - c.minZ) < 0.9);
if (thin) {
  const before = { x: (thin.minX + thin.maxX) / 2, z: thin.maxZ + R + 1.2 };
  const after = walk(0, -1, 0, before, 40, SPRINT * 2);
  t('a sprint cannot tunnel a thin obstacle', after.z > thin.maxZ,
    `z=${after.z.toFixed(2)} vs face ${thin.maxZ.toFixed(2)}`);
}

// Depenetration: start inside a building and confirm one move ejects you.
const box = COLLIDERS.find(c => c.height > 8);
const bx = (box.minX + box.maxX) / 2, bz = (box.minZ + box.maxZ) / 2;
const inside = move(bx, bz, 0, 0, R, heightAt(bx, bz));
t('ejects a body stuck inside geometry', !blocked(inside.x, inside.z, R, heightAt(inside.x, inside.z)));

// A steppable box must never block on its own account. Some sit inside a solid
// one (a bench pushed against a planter), so exclude those.
const low = COLLIDERS.filter(c => c.height <= STEP_HEIGHT);
const solid = COLLIDERS.filter(c => c.height > STEP_HEIGHT);
const inSolid = (x, z) => solid.some(c => x > c.minX && x < c.maxX && z > c.minZ && z < c.maxZ);
const wrong = low.filter(c => {
  const x = (c.minX + c.maxX) / 2, z = (c.minZ + c.maxZ) / 2;
  return blocked(x, z, 0.01, heightAt(x, z)) && !inSolid(x, z);
});
t('kerb-height props never block', wrong.length === 0, `${low.length} steppable, ${wrong.length} wrongly solid`);

/* -- The plan ------------------------------------------------------------- */

// Two tenancies sharing ground is the failure that reads as "the names overlap":
// the shells interpenetrate and both fascias fight for the same air.
const foot = (u) => {
  const spread = u.rotY ? Math.max(u.w, u.d) : 0;
  const hw = Math.max(u.w, spread) / 2, hd = Math.max(u.d, spread) / 2;
  return { minX: u.x - hw, maxX: u.x + hw, minZ: u.z - hd, maxZ: u.z + hd };
};
const clashes = [];
for (let i = 0; i < UNITS.length; i++) {
  for (let j = i + 1; j < UNITS.length; j++) {
    const a = foot(UNITS[i]), b = foot(UNITS[j]);
    const ox = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX);
    const oz = Math.min(a.maxZ, b.maxZ) - Math.max(a.minZ, b.minZ);
    if (ox > 0.5 && oz > 0.5) {
      clashes.push(`${UNITS[i].tenant} x ${UNITS[j].tenant} (${ox.toFixed(1)}x${oz.toFixed(1)}m)`);
    }
  }
}
t('no two tenancies share ground', clashes.length === 0, clashes.join('; '));

// A unit straddling a level change is a building with one foot in the air.
const straddling = UNITS.filter((u) => {
  const f = foot(u), base = heightAt(u.x, u.z);
  for (const [x, z] of [[f.minX, f.minZ], [f.maxX, f.minZ], [f.minX, f.maxZ], [f.maxX, f.maxZ]]) {
    if (Math.abs(heightAt(x, z) - base) > 0.05) return true;
  }
  return false;
}).map(u => u.tenant);
t('every tenancy stands on one level', straddling.length === 0, straddling.join(', '));

/* -- Reachability --------------------------------------------------------- */

// Flood fill the walkable surface from spawn. A neighbour is reachable when it
// is clear AND within a step of the current height, so the only way between
// levels is a stair or a ramp — exactly as it is on foot.
const GRID = 1.5;
const gx0 = Math.floor(-100 / GRID), gx1 = Math.ceil(105 / GRID);
const gz0 = Math.floor(-95 / GRID), gz1 = Math.ceil(90 / GRID);
const seen = new Set();
const heights = new Set();
// Offset so the key stays a positive integer: floor/modulo round the wrong way
// on negative coordinates, and half this grid is negative.
const gkey = (i, j) => (i + 1024) * 4096 + (j + 1024);
const standable = (i, j) => {
  const x = i * GRID, z = j * GRID;
  return !blocked(x, z, R, heightAt(x, z));
};
// A stair is a real gradient, not a kerb: the test here is whether the ground
// between two cells is climbable, which STEP_HEIGHT (a collider's top) is not.
const MAX_RISE = 1.2;

const si = Math.round(spawn.x / GRID), sj = Math.round(spawn.z / GRID);
const queue = [[si, sj]];
seen.add(gkey(si, sj));
heights.add(Math.round(heightAt(si * GRID, sj * GRID) * 20) / 20);
while (queue.length) {
  const [i, j] = queue.pop();
  const y = heightAt(i * GRID, j * GRID);
  for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const ni = i + di, nj = j + dj;
    if (ni < gx0 || ni > gx1 || nj < gz0 || nj > gz1) continue;
    const k = gkey(ni, nj);
    if (seen.has(k)) continue;
    const ny = heightAt(ni * GRID, nj * GRID);
    if (Math.abs(ny - y) > MAX_RISE) continue;
    if (!standable(ni, nj)) continue;
    seen.add(k);
    heights.add(Math.round(ny * 20) / 20);
    queue.push([ni, nj]);
  }
}

const reached = (x, z) => {
  const i0 = Math.round(x / GRID), j0 = Math.round(z / GRID);
  for (let di = -2; di <= 2; di++)
    for (let dj = -2; dj <= 2; dj++)
      if (seen.has(gkey(i0 + di, j0 + dj))) return true;
  return false;
};

// Every level has to be on foot from spawn, or the stairs are decoration.
const reachedLevel = (y) => [...heights].some((h) => Math.abs(h - y) < 0.06);
const unreachedLevels = TERRACES.filter((tr) => !reachedLevel(tr.y)).map((tr) => `y=${tr.y}`);
t('every level is walkable from spawn', unreachedLevels.length === 0, unreachedLevels.join(', '));

// Street level too: you have to be able to get off the podium and back on.
t('the street is walkable from the podium', reachedLevel(0));

// And every marker has to be somewhere you can actually stand.
const stranded = NODES.filter((n) => !reached(n.position[0], n.position[2]))
  .map(n => `${n.id} (${n.position[0]}, ${n.position[2]})`);
t('every marker is reachable on foot', stranded.length === 0, stranded.join(', '));

// A marker must also be at the front of its own unit, not inside it.
const buried = NODES.filter((n) => {
  const u = UNITS.find(u => u.node === n.id);
  if (!u) return false;
  const f = foot(u);
  return n.position[0] > f.minX && n.position[0] < f.maxX
      && n.position[2] > f.minZ && n.position[2] < f.maxZ;
}).map(n => n.id);
t('no marker is buried inside its building', buried.length === 0, buried.join(', '));

/* -- Perf ----------------------------------------------------------------- */

const t0 = performance.now();
let q = { x: -45, z: 0 };
for (let i = 0; i < 20000; i++) q = move(q.x, q.z, 0.02, -0.01, R, heightAt(q.x, q.z));
const us = ((performance.now() - t0) / 20000) * 1000;
t('move() stays cheap', us < 40, `${us.toFixed(1)}us per call, ${COLLIDERS.length} colliders`);

/* -- Report --------------------------------------------------------------- */

console.log('PASS');
for (const p of pass) console.log('  ' + p);
if (fail.length) { console.log('FAIL'); for (const f of fail) console.log('  ' + f); }
console.log(`\n${pass.length} passed, ${fail.length} failed`);
console.log(`colliders ${COLLIDERS.length}  (precinct units ${UNITS.length}, city ${CITY.length}, props ${STREET_PROPS.length}, vehicles ${VEHICLES.length})`);
console.log(`levels ${TERRACES.length}, slopes ${SLOPES.length}, walkable cells reached ${seen.size}`);
if (fail.length) process.exit(1);
