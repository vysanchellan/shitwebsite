/**
 * Park Square, uMhlanga Ridge — as a plan.
 *
 * Modelled from Nedport Developments' own leasing brochure (architect: MAP
 * Group, engineer: Arup, completed November 2018) and the ground and
 * upper-ground floor plans in it. What the drawings establish, and what this
 * file rebuilds:
 *
 *   - A rounded-corner rectangular site on a roughly 8.4 m structural grid,
 *     with the south-east corner chamfered.
 *   - The whole precinct stands on a podium above the street. The western half
 *     is parking with the public piazza raised a full storey over it; the
 *     eastern half is retail, anchored by a double-volume Spar.
 *   - A pedestrian arcade runs east-west through the retail wing and ties the
 *     piazza to it. In the renders it is double-height, with splayed concrete
 *     columns, a dark steel soffit, radiating linear lights and a first-floor
 *     gallery down both sides.
 *   - Restaurants ring the piazza on its north, east and west edges, with an
 *     angled unit taking the south-west corner.
 *   - Offices sit above in a north and a south bar, with projecting floor
 *     slabs, glass balustrade balconies and close-spaced vertical fins.
 *   - The campus sits on its own terrace above the piazza, reached by a ramp.
 *
 * `terrain.ts` holds the height field; everything here reads its own ground off
 * it, so nothing has to know which level it is on.
 *
 * Tenancies are laid out as **frontages**: a run of units butted against each
 * other along one line, sharing party walls, which is how a centre is actually
 * planned. Laying each unit out on its own is what produced buildings growing
 * through each other and signage fighting for the same air.
 *
 * One honest departure: the brochure's plans are generic leasing drawings and
 * label units "RETAIL TENANCY", not by name. Tenant positions here are inferred
 * from unit size, servicing and frontage — not copied from a directory.
 */

import { ACCENT_HEX } from './accents';
import { EDGES, SLOPE_SIDES, TERRACES, heightAt, type SlopeSide } from './terrain';

/** Structural grid. Column lines run east-west, row lines north-south. */
export const BAY = 8.4;

/** Grid column 1–21 to world x. Column 1 is the western site boundary. */
export const col = (n: number) => -84 + (n - 1) * BAY;

/** Grid row 0–15 (A–P) to world z. Row A is the northern site boundary. */
export const row = (n: number) => -63 + n * BAY;

export const SITE = {
  minX: -96,
  maxX: 88,
  minZ: -70,
  maxZ: 68,
  /** The south-east corner is cut back on the drawings. */
  chamfer: 22,
};

/** Floor-to-floor, taken from the section proportions in the renders. */
export const LEVEL = 5.6;
export const OFFICE_LEVEL = 3.9;

export type UnitKind = 'anchor' | 'shop' | 'restaurant' | 'kiosk' | 'institution';

export type Unit = {
  /** The RiskSense content this unit carries, if any. */
  node?: string;
  /** The Park Square tenancy whose footprint this is. */
  tenant: string;
  /** What the shopfront reads in our world. */
  label: string;
  kind: UnitKind;
  /** Centre of the footprint. */
  x: number;
  z: number;
  w: number;
  d: number;
  /** Which way the shopfront faces; the marker is placed on that side. */
  facing: 'n' | 's' | 'e' | 'w';
  rotY?: number;
  accent: string;
  /** Back-of-house: a shell with no shopfront, glazing or sign. */
  blank?: boolean;
  /** Carries the glazed lift shaft that ties the two levels together. */
  lift?: boolean;
};

const A = ACCENT_HEX;

type Slot = Omit<Unit, 'x' | 'z' | 'w' | 'd' | 'facing'> & { span: number };

/**
 * Lays a run of tenancies along one line, each taking its share of the
 * frontage and butting against its neighbour.
 *
 * `from`/`to` bound the run along the frontage; `back`/`front` are the two
 * edges across it, `front` being the side the shopfronts open onto.
 */
function frontage(
  axis: 'x' | 'z',
  from: number,
  to: number,
  back: number,
  front: number,
  slots: Slot[],
): Unit[] {
  const total = slots.reduce((n, s) => n + s.span, 0);
  const scale = (to - from) / total;
  const depth = Math.abs(front - back);
  const mid = (front + back) / 2;
  const facing: Unit['facing'] =
    axis === 'x' ? (front > back ? 's' : 'n') : front > back ? 'e' : 'w';

  let cursor = from;
  return slots.map(({ span, ...rest }) => {
    const width = span * scale;
    const centre = cursor + width / 2;
    cursor += width;
    return axis === 'x'
      ? { ...rest, x: centre, z: mid, w: width, d: depth, facing }
      : { ...rest, x: mid, z: centre, w: depth, d: width, facing };
  });
}

/* -------------------------------------------------------------------------- */
/* The eastern retail wing — on the podium, Spar-anchored                      */
/* -------------------------------------------------------------------------- */

/**
 * The arcade's northern frontage. The plans put Spar's back-of-house and its
 * delivery dock at the western end, against the level change, so that is what
 * closes the run rather than the blank paving that used to be there.
 */
const ARCADE_NORTH = frontage('x', -12, 86, -32, -4, [
  {
    tenant: 'Spar service dock',
    label: '',
    kind: 'shop',
    span: 14,
    blank: true,
    accent: A.plum,
  },
  {
    node: 'insurance',
    tenant: 'Spar',
    label: 'Insurance Pavilion',
    kind: 'anchor',
    span: 42,
    accent: A.plum,
  },
  {
    node: 'recovery',
    tenant: 'TOPS at Spar',
    label: 'Recovery',
    kind: 'shop',
    span: 18,
    accent: A.amber,
  },
  {
    node: 'disclaimer',
    tenant: 'Park Square Pharmacy',
    label: 'Medical Disclaimer',
    kind: 'shop',
    span: 18,
    accent: A.amber,
  },
  {
    node: 'awareness',
    tenant: 'Exquisite Blooms',
    label: 'Why Earlier Matters',
    kind: 'shop',
    span: 10,
    accent: A.amber,
  },
]);

/**
 * The arcade's southern frontage: the circulation core at the level change,
 * then the food court and the smaller line shops.
 */
const ARCADE_SOUTH = frontage('x', -12, 86, 42, 18, [
  {
    tenant: 'Piazza circulation core',
    label: '',
    kind: 'shop',
    span: 20,
    blank: true,
    lift: true,
    accent: A.azure,
  },
  {
    node: 'problem-fragmented',
    tenant: 'Pizza Hut',
    label: 'Fragmented Data',
    kind: 'restaurant',
    span: 16,
    accent: A.ember,
  },
  {
    node: 'problem-delayed',
    tenant: 'KFC',
    label: 'Delayed Action',
    kind: 'restaurant',
    span: 16,
    accent: A.ember,
  },
  {
    node: 'handoff',
    tenant: 'PostNet',
    label: 'Registration Handoff',
    kind: 'shop',
    span: 14,
    accent: A.plum,
  },
  {
    node: 'boundaries',
    tenant: '5G SmartFix',
    label: 'System Boundaries',
    kind: 'kiosk',
    span: 12,
    accent: A.azure,
  },
  {
    node: 'heart-model',
    tenant: 'The Eye Gallery',
    label: 'Heart Disease Model',
    kind: 'shop',
    span: 20,
    accent: A.ember,
  },
]);

export const RETAIL_UNITS: Unit[] = [
  ...ARCADE_NORTH,
  ...ARCADE_SOUTH,

  // The institution on the chamfered south-east corner of the site.
  {
    node: 'diabetes-model',
    tenant: 'Discovery',
    label: 'Diabetes v1 Model',
    kind: 'institution',
    x: 70,
    z: 56,
    w: 28,
    d: 20,
    facing: 'w',
    accent: A.verdant,
  },
];

/* -------------------------------------------------------------------------- */
/* The piazza — restaurants and retail ringing the open square                 */
/* -------------------------------------------------------------------------- */

/** North edge of the square: the coffee and cake row. */
const PIAZZA_NORTH = frontage('x', -54, -16, -56, -44, [
  {
    node: 'arrival',
    tenant: 'Cappello',
    label: 'Arrival',
    kind: 'restaurant',
    span: 14,
    accent: A.aether,
  },
  {
    node: 'journey-1',
    tenant: 'Milk & Honey Cakery',
    label: 'Create Profile',
    kind: 'restaurant',
    span: 12,
    accent: A.azure,
  },
  {
    node: 'journey-2',
    tenant: 'Seattle Coffee Co',
    label: 'Connect Clinician',
    kind: 'restaurant',
    span: 12,
    accent: A.azure,
  },
]);

/**
 * East edge, north of the grand flight. The flight's mouth breaks the frontage
 * in two, which is why this is laid as two runs rather than one.
 */
const PIAZZA_EAST_N = frontage('z', -36, -18, -14, -28, [
  {
    node: 'journey-3',
    tenant: 'Xpresso Cafe',
    label: 'Activate Access',
    kind: 'restaurant',
    span: 12,
    accent: A.azure,
  },
  {
    node: 'journey-4',
    tenant: 'Victory Lounge',
    label: 'Add Health Info',
    kind: 'restaurant',
    span: 12,
    accent: A.azure,
  },
]);

const PIAZZA_EAST_S = frontage('z', 18, 42, -14, -28, [
  {
    node: 'journey-5',
    tenant: 'Monakko',
    label: 'Run Risk Analysis',
    kind: 'restaurant',
    span: 12,
    accent: A.azure,
  },
  {
    node: 'journey-6',
    tenant: 'Armitage Outfitters',
    label: 'Review Results',
    kind: 'shop',
    span: 12,
    accent: A.azure,
  },
]);

/** The west colonnade, under the office bar, facing back across the square. */
const PIAZZA_WEST = frontage('z', -38, 22, -76, -62, [
  {
    node: 'clinician',
    tenant: 'Old Mutual',
    label: 'Clinician Link',
    kind: 'institution',
    span: 20,
    accent: A.jade,
  },
  {
    node: 'security',
    tenant: 'Nedbank',
    label: 'Security Vault',
    kind: 'institution',
    span: 20,
    accent: A.verdant,
  },
  {
    node: 'problem-silent',
    tenant: 'Aura Hair & Beauty',
    label: 'Silent Risk',
    kind: 'shop',
    span: 20,
    accent: A.ember,
  },
]);

export const PIAZZA_UNITS: Unit[] = [
  ...PIAZZA_NORTH,
  ...PIAZZA_EAST_N,
  ...PIAZZA_EAST_S,
  ...PIAZZA_WEST,

  // The angled restaurant closing the square's south-west corner.
  {
    node: 'faq',
    tenant: 'The Business Exchange',
    label: 'FAQ',
    kind: 'restaurant',
    x: -52,
    z: 44,
    w: 20,
    d: 16,
    facing: 'n',
    rotY: 0.18,
    accent: A.aether,
  },

  // A freestanding kiosk on the square, the last thing before the south steps.
  {
    node: 'contact',
    tenant: 'IBV',
    label: 'Contact',
    kind: 'kiosk',
    x: -45,
    z: 21,
    w: 10,
    d: 10,
    facing: 'n',
    accent: A.jade,
  },
];

/* -------------------------------------------------------------------------- */
/* The campus — on its own terrace, up the ramp                                */
/* -------------------------------------------------------------------------- */

export const CAMPUS_UNITS: Unit[] = [
  {
    node: 'response',
    tenant: 'Richfield Graduate Institute of Technology',
    label: 'The Response',
    kind: 'institution',
    x: -85,
    z: -55,
    w: 14,
    d: 18,
    facing: 'e',
    accent: A.aether,
  },
];

export const UNITS: Unit[] = [...RETAIL_UNITS, ...PIAZZA_UNITS, ...CAMPUS_UNITS];

/* -------------------------------------------------------------------------- */
/* The precinct's fixed pieces                                                 */
/* -------------------------------------------------------------------------- */

/** The open public square, raised over the parking. */
export const PIAZZA = { minX: -57, maxX: -33, minZ: -43, maxZ: 43 };

/**
 * The pedestrian arcade: double-height, splayed columns, dark steel soffit,
 * gallery over. Runs the width of the retail wing between its two frontages.
 */
export const ARCADE = {
  minX: 8,
  maxX: 86,
  z: 7,
  width: BAY * 1.8,
  height: 11.4,
  /** Column pairs down its length. */
  bays: 10,
};

/** Column centres down the arcade, shared by the geometry and the colliders. */
export const ARCADE_COLUMNS: number[] = Array.from(
  { length: ARCADE.bays },
  (_, i) => ARCADE.minX + ((i + 0.5) / ARCADE.bays) * (ARCADE.maxX - ARCADE.minX),
);

/** Office bars above: north and south over the retail wing, one over the piazza. */
export const OFFICE_BLOCKS = [
  { id: 'north', x: 47, z: -18, w: 78, d: 28, levels: 6, base: LEVEL * 2 },
  { id: 'south', x: 47, z: 30, w: 78, d: 24, levels: 5, base: 7.2 },
  { id: 'piazza-west', x: -69, z: -14, w: 14, d: 60, levels: 8, base: 9.0 },
];

/**
 * Benches: timber slats on steel frames, down both sides of the piazza with a
 * facing pair in the middle of the square.
 */
export const BENCHES: { x: number; z: number; rotY: number }[] = (() => {
  const out: { x: number; z: number; rotY: number }[] = [];
  const n = 7;
  for (let i = 0; i < n; i++) {
    const z = PIAZZA.minZ + ((i + 0.5) / n) * (PIAZZA.maxZ - PIAZZA.minZ);
    out.push({ x: PIAZZA.minX + 3.2, z, rotY: Math.PI / 2 });
    out.push({ x: PIAZZA.maxX - 3.2, z, rotY: -Math.PI / 2 });
  }
  out.push({ x: -49, z: 2, rotY: 0 });
  out.push({ x: -41, z: 2, rotY: Math.PI });
  return out;
})();

/**
 * Planters, in two rows flanking the square's axis. Down the centre they would
 * close the one clear view through the piazza, which is the whole point of it.
 */
export const PLANTERS: { x: number; z: number; w: number; d: number }[] = [
  -36, -20, -4, 12, 28,
].flatMap((z) => [
  { x: -50, z, w: 6, d: 6 },
  { x: -40, z, w: 6, d: 6 },
]);

/**
 * Lighting columns, on the planter lines rather than the square's axis — that
 * axis is the one clear view through the piazza, and it is also where you
 * arrive.
 */
export const PIAZZA_LAMPS: [number, number][] = [-28, -12, 4, 20].flatMap(
  (z) => [[-50, z], [-40, z]] as [number, number][],
);

/** Café tables and their red umbrellas, spilling out of every restaurant. */
export const CAFE_SETS: { x: number; z: number; rotY: number }[] = (() => {
  const out: { x: number; z: number; rotY: number }[] = [];
  for (const u of UNITS) {
    if (u.kind !== 'restaurant') continue;
    const sideways = u.facing === 'n' || u.facing === 's';
    const fx = u.facing === 'e' ? u.x + u.w / 2 : u.facing === 'w' ? u.x - u.w / 2 : u.x;
    const fz = u.facing === 's' ? u.z + u.d / 2 : u.facing === 'n' ? u.z - u.d / 2 : u.z;
    const n = Math.max(1, Math.min(3, Math.floor((sideways ? u.w : u.d) / 5)));
    for (let i = 0; i < n; i++) {
      const t = (i - (n - 1) / 2) * 4.2;
      out.push({
        x: fx + (sideways ? t : u.facing === 'e' ? 3.2 : -3.2),
        z: fz + (sideways ? (u.facing === 's' ? 3.2 : -3.2) : t),
        rotY: i * 0.4,
      });
    }
  }
  return out;
})();

/** Taxi drop-off and delivery yard behind the southern frontage, as drawn. */
export const SERVICE_YARD = { x: 29, z: 52, w: 42, d: 16 };

/* -------------------------------------------------------------------------- */
/* Collision                                                                   */
/* -------------------------------------------------------------------------- */

export type Box = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  height: number;
  /** The level this box stands on, read off the height field. */
  baseY: number;
};

/** Height of a unit's shell, by kind. */
export function shellHeight(kind: UnitKind) {
  if (kind === 'anchor') return 11.2;
  if (kind === 'institution') return 8.4;
  if (kind === 'kiosk') return 3.6;
  return 5.6;
}

/**
 * Everything solid in the precinct.
 *
 * The arcade's soffit and the office bars overhead are deliberately absent:
 * you walk under both. Only what meets the paving is here.
 */
export const PARK_SQUARE_COLLIDERS: Box[] = [
  // The terrace masses themselves. Standing on one, its own box is under your
  // feet and is skipped; standing below it, it is the retaining wall that stops
  // you walking into the side of the podium. Without these the levels are a
  // drawing rather than a building.
  ...TERRACES.map((t) => ({
    minX: t.minX,
    maxX: t.maxX,
    minZ: t.minZ,
    maxZ: t.maxZ,
    height: t.y,
    baseY: 0,
  })),

  ...UNITS.map((u) => {
    // Rotated units are approximated by their bounding square.
    const spread = u.rotY ? Math.max(u.w, u.d) : 0;
    const hw = Math.max(u.w, spread) / 2 + 0.3;
    const hd = Math.max(u.d, spread) / 2 + 0.3;
    return {
      minX: u.x - hw,
      maxX: u.x + hw,
      minZ: u.z - hd,
      maxZ: u.z + hd,
      height: shellHeight(u.kind),
      baseY: heightAt(u.x, u.z),
    };
  }),

  // The arcade's splayed columns.
  ...ARCADE_COLUMNS.flatMap((x) =>
    [-1, 1].map((s) => ({
      minX: x - 0.75,
      maxX: x + 0.75,
      minZ: ARCADE.z + s * (ARCADE.width / 2 + 0.9) - 0.75,
      maxZ: ARCADE.z + s * (ARCADE.width / 2 + 0.9) + 0.75,
      height: ARCADE.height,
      baseY: heightAt(x, ARCADE.z),
    })),
  ),

  // Planters. Above step height, so you walk round them.
  ...PLANTERS.map((p) => ({
    minX: p.x - p.w / 2,
    maxX: p.x + p.w / 2,
    minZ: p.z - p.d / 2,
    maxZ: p.z + p.d / 2,
    height: 0.82,
    baseY: heightAt(p.x, p.z),
  })),

  // Benches. The seat is above step height, so you go round rather than over.
  ...BENCHES.map((b) => {
    const alongX = Math.abs(Math.sin(b.rotY)) < 0.5;
    const hw = alongX ? 1.15 : 0.45;
    const hd = alongX ? 0.45 : 1.15;
    return {
      minX: b.x - hw,
      maxX: b.x + hw,
      minZ: b.z - hd,
      maxZ: b.z + hd,
      height: 0.9,
      baseY: heightAt(b.x, b.z),
    };
  }),

  // Lighting columns.
  ...PIAZZA_LAMPS.map(([x, z]) => ({
    minX: x - 0.2,
    maxX: x + 0.2,
    minZ: z - 0.2,
    maxZ: z + 0.2,
    height: 6.8,
    baseY: heightAt(x, z),
  })),

  // Café tables, taken as one round obstacle each rather than chair by chair.
  ...CAFE_SETS.map((c) => ({
    minX: c.x - 1.1,
    maxX: c.x + 1.1,
    minZ: c.z - 1.1,
    maxZ: c.z + 1.1,
    height: 0.8,
    baseY: heightAt(c.x, c.z),
  })),

  // Balustrades, everywhere a level's edge is not a stair mouth.
  ...EDGES.map((e) => ({
    minX: e.minX,
    maxX: e.maxX,
    minZ: e.minZ,
    maxZ: e.maxZ,
    height: 1.15,
    baseY: e.baseY,
  })),

  // The cheek walls down both sides of every flight and the ramp.
  ...SLOPE_SIDES.map((s: SlopeSide) => ({
    minX: s.minX,
    maxX: s.maxX,
    minZ: s.minZ,
    maxZ: s.maxZ,
    height: s.height,
    baseY: s.baseY,
  })),
];

/** Where the player starts: on the square's axis, the arcade away to the east. */
export const SPAWN: [number, number] = [-45, 0];

/**
 * The supported-provider boards, ranged along the Spar frontage between the
 * arcade's columns, where a centre puts its promotional stands.
 */
export const INSURER_SLOTS: { pos: [number, number]; rotY: number }[] = Array.from(
  { length: 8 },
  (_, i) => {
    const gap = (ARCADE.maxX - ARCADE.minX) / ARCADE.bays;
    return {
      pos: [ARCADE_COLUMNS[0] + gap * (i + 0.5), ARCADE.z - ARCADE.width / 2 - 1.9],
      rotY: 0,
    } as { pos: [number, number]; rotY: number };
  },
);

for (const slot of INSURER_SLOTS) {
  PARK_SQUARE_COLLIDERS.push({
    minX: slot.pos[0] - 1.4,
    maxX: slot.pos[0] + 1.4,
    minZ: slot.pos[1] - 0.9,
    maxZ: slot.pos[1] + 0.9,
    height: 2.9,
    baseY: heightAt(slot.pos[0], slot.pos[1]),
  });
}
