/**
 * Places every interactable in front of the shopfront it belongs to.
 *
 * Marker positions used to be written out by hand in content.ts, which meant
 * that moving a tenancy silently buried its marker inside the building or left
 * it hanging over a level below. They are derived from the plan instead, and
 * this script is what writes them back.
 */
import fs from 'node:fs';
import path from 'node:path';
import { UNITS } from './parkSquare.js';
import { heightAt } from './terrain.js';

const target = process.argv[2];

/** How far in front of the glass the marker floats, by unit size. */
const standoff = (u) => (u.kind === 'kiosk' ? 4.4 : 5.6);

const positions = new Map();

for (const u of UNITS) {
  if (!u.node) continue;
  const s = standoff(u);
  let x = u.x;
  let z = u.z;
  if (u.facing === 'n') z = u.z - u.d / 2 - s;
  else if (u.facing === 's') z = u.z + u.d / 2 + s;
  else if (u.facing === 'e') x = u.x + u.w / 2 + s;
  else x = u.x - u.w / 2 - s;
  positions.set(u.node, [Math.round(x * 10) / 10, Math.round(z * 10) / 10]);
}

// The one node that is not a tenancy: it stands at the head of the grand
// flight, where the piazza hands over to the retail wing.
positions.set('activation', [-20, 0]);

let content = fs.readFileSync(target, 'utf8');
const missing = [];
let patched = 0;

for (const [id, [x, z]] of positions) {
  const re = new RegExp(`(id:\\s*'${id}',[\\s\\S]{0,2000}?position:\\s*)\\[[^\\]]*\\]`);
  if (!re.test(content)) {
    missing.push(id);
    continue;
  }
  content = content.replace(re, `$1[${x}, 0, ${z}]`);
  patched++;
}

fs.writeFileSync(target, content);

console.log(`${patched} marker positions written to ${path.basename(target)}`);
for (const [id, [x, z]] of positions) {
  console.log(`  ${id.padEnd(20)} ${String(x).padStart(7)}, ${String(z).padStart(7)}   y=${heightAt(x, z).toFixed(1)}`);
}
if (missing.length) {
  console.log(`\nnot found in content.ts: ${missing.join(', ')}`);
  process.exit(1);
}
