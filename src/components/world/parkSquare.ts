/**
 * Park Square, uMhlanga Ridge — as a plan.
 *
 * Modelled from Nedport Developments' own leasing brochure (architect: MAP
 * Group, engineer: Arup, completed November 2018) and the ground and
 * upper-ground floor plans in it. What the drawings establish, and what this
 * file rebuilds:
 *
 *   - A rounded-corner rectangular site on a roughly 8.4 m structural grid,
 *     21 column lines east-west by 16 row lines north-south, with the
 *     south-east corner chamfered.
 *   - The western half is parking at ground level with the public piazza
 *     raised over it; the eastern half is retail, anchored by a double-volume
 *     Spar in its north-west corner.
 *   - A pedestrian arcade on grid row H runs east-west and ties the piazza to
 *     the retail wing. In the renders it is double-height, with splayed
 *     concrete columns, a dark steel soffit, radiating linear lights and a
 *     first-floor gallery down both sides.
 *   - Restaurants ring the piazza on its north, east and west edges, with an
 *     angled unit taking the south-west corner.
 *   - Offices sit above in a north and a south bar, with projecting floor
 *     slabs, glass balustrade balconies and close-spaced vertical fins.
 *
 * Two honest departures:
 *
 *   1. The walkable plane is flat. The real piazza is a level above the
 *      parking, and holding two walkable levels would need a height-aware
 *      controller. The level change is expressed instead as the retaining edge
 *      and the amphitheatre steps where the site drops to Centenary Boulevard,
 *      which is how it reads on approach anyway.
 *   2. The brochure's plans are generic leasing drawings and label units
 *      "RETAIL TENANCY", not by name. Tenant positions here are inferred from
 *      unit size, servicing and frontage — not copied from a directory.
 */

import { ACCENT_HEX } from './accents';

/** Structural grid. Column lines run east-west, row lines north-south. */
export const BAY = 8.4;

/** Grid column 1–21 to world x. Column 1 is the western site boundary. */
export const col = (n: number) => -84 + (n - 1) * BAY;

/** Grid row 0–15 (A–P) to world z. Row A is the northern site boundary. */
export const row = (n: number) => -63 + n * BAY;

export const SITE = {
  minX: col(1),
  maxX: col(21),
  minZ: row(0),
  maxZ: row(15),
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
};

const A = ACCENT_HEX;

/* -------------------------------------------------------------------------- */
/* The eastern retail wing — ground level, Spar-anchored                       */
/* -------------------------------------------------------------------------- */

export const RETAIL: Unit[] = [
  // The anchor: double-volume on the drawings, north-west of the retail wing,
  // with its service yard and bulk store behind it on the northern boundary.
  {
    node: 'insurance',
    tenant: 'Spar',
    label: 'Insurance Pavilion',
    kind: 'anchor',
    x: (col(12) + col(16)) / 2,
    z: (row(2) + row(7)) / 2,
    w: col(16) - col(12),
    d: row(7) - row(2),
    facing: 's',
    accent: A.plum,
  },
  {
    node: 'recovery',
    tenant: 'TOPS at Spar',
    label: 'Recovery',
    kind: 'shop',
    x: col(17) + BAY * 0.9,
    z: row(1) + BAY * 0.9,
    w: BAY * 1.8,
    d: BAY * 1.8,
    facing: 's',
    accent: A.amber,
  },
  {
    node: 'disclaimer',
    tenant: 'Park Square Pharmacy',
    label: 'Medical Disclaimer',
    kind: 'shop',
    x: col(18) + BAY * 1.1,
    z: row(3) + BAY * 1.1,
    w: BAY * 2.2,
    d: BAY * 2.2,
    facing: 'w',
    accent: A.amber,
  },
  {
    node: 'heart-model',
    tenant: 'The Eye Gallery',
    label: 'Heart Disease Model',
    kind: 'shop',
    x: col(18) + BAY * 1.1,
    z: row(5) + BAY * 1.0,
    w: BAY * 2.2,
    d: BAY * 2.0,
    facing: 'w',
    accent: A.ember,
  },
  {
    node: 'awareness',
    tenant: 'Exquisite Blooms',
    label: 'Why Earlier Matters',
    kind: 'shop',
    x: col(20) + BAY * 0.55,
    z: row(6) + BAY * 0.9,
    w: BAY * 1.1,
    d: BAY * 1.8,
    facing: 'w',
    accent: A.amber,
  },

  // South of the arcade.
  {
    node: 'problem-fragmented',
    tenant: 'Pizza Hut',
    label: 'Fragmented Data',
    kind: 'restaurant',
    x: col(12) + BAY * 1.1,
    z: row(10) + BAY * 1.1,
    w: BAY * 2.2,
    d: BAY * 2.2,
    facing: 'n',
    accent: A.ember,
  },
  {
    node: 'problem-delayed',
    tenant: 'KFC',
    label: 'Delayed Action',
    kind: 'restaurant',
    x: col(14) + BAY * 1.2,
    z: row(10) + BAY * 1.1,
    w: BAY * 2.4,
    d: BAY * 2.2,
    facing: 'n',
    accent: A.ember,
  },
  {
    node: 'handoff',
    tenant: 'PostNet',
    label: 'Registration Handoff',
    kind: 'shop',
    x: col(16) + BAY * 0.8,
    z: row(10) + BAY * 1.1,
    w: BAY * 1.6,
    d: BAY * 2.2,
    facing: 'n',
    accent: A.plum,
  },
  {
    node: 'boundaries',
    tenant: '5G SmartFix',
    label: 'System Boundaries',
    kind: 'kiosk',
    x: col(18) + BAY * 0.7,
    z: row(10) + BAY * 0.9,
    w: BAY * 1.4,
    d: BAY * 1.8,
    facing: 'n',
    accent: A.azure,
  },
  // Takes the chamfered south-east corner of the site.
  {
    node: 'diabetes-model',
    tenant: 'Discovery',
    label: 'Diabetes v1 Model',
    kind: 'institution',
    x: col(19) - BAY * 0.2,
    z: row(12) + BAY * 0.7,
    w: BAY * 3.0,
    d: BAY * 2.6,
    facing: 'w',
    rotY: -0.42,
    accent: A.verdant,
  },
];

/* -------------------------------------------------------------------------- */
/* The piazza — restaurants and retail ringing the open square                 */
/* -------------------------------------------------------------------------- */

export const PIAZZA_UNITS: Unit[] = [
  // North edge, rows A–C.
  {
    node: 'arrival',
    tenant: 'Cappello',
    label: 'Arrival',
    kind: 'restaurant',
    x: col(3) + BAY * 1.4,
    z: row(1) + BAY * 0.7,
    w: BAY * 2.8,
    d: BAY * 1.4,
    facing: 's',
    accent: A.aether,
  },
  {
    node: 'journey-1',
    tenant: 'Milk & Honey Cakery',
    label: 'Create Profile',
    kind: 'restaurant',
    x: col(6) + BAY * 1.1,
    z: row(1) + BAY * 0.7,
    w: BAY * 2.2,
    d: BAY * 1.4,
    facing: 's',
    accent: A.azure,
  },
  {
    node: 'journey-2',
    tenant: 'Seattle Coffee Co',
    label: 'Connect Clinician',
    kind: 'restaurant',
    x: col(8) + BAY * 0.9,
    z: row(1) + BAY * 0.7,
    w: BAY * 1.8,
    d: BAY * 1.4,
    facing: 's',
    accent: A.azure,
  },

  // East edge: the long north-south strip of restaurants, rows C–G.
  {
    node: 'journey-3',
    tenant: 'Xpresso Cafe',
    label: 'Activate Access',
    kind: 'restaurant',
    x: col(9) + BAY * 0.8,
    z: row(3) + BAY * 0.8,
    w: BAY * 1.6,
    d: BAY * 1.6,
    facing: 'w',
    accent: A.azure,
  },
  {
    node: 'journey-4',
    tenant: 'Victory Lounge',
    label: 'Add Health Info',
    kind: 'restaurant',
    x: col(9) + BAY * 0.8,
    z: row(5) + BAY * 0.9,
    w: BAY * 1.6,
    d: BAY * 1.8,
    facing: 'w',
    accent: A.azure,
  },

  // East edge below the arcade, rows J–N.
  {
    node: 'journey-5',
    tenant: 'Monakko',
    label: 'Run Risk Analysis',
    kind: 'restaurant',
    x: col(9) + BAY * 0.8,
    z: row(10) + BAY * 0.9,
    w: BAY * 1.6,
    d: BAY * 1.8,
    facing: 'w',
    accent: A.azure,
  },
  {
    node: 'journey-6',
    tenant: 'Armitage Outfitters',
    label: 'Review Results',
    kind: 'shop',
    x: col(9) + BAY * 0.8,
    z: row(12) + BAY * 0.9,
    w: BAY * 1.6,
    d: BAY * 1.8,
    facing: 'w',
    accent: A.azure,
  },

  // West edge, rows K–M.
  {
    node: 'problem-silent',
    tenant: 'Aura Hair & Beauty',
    label: 'Silent Risk',
    kind: 'shop',
    x: col(2) + BAY * 0.9,
    z: row(11) + BAY * 1.2,
    w: BAY * 1.8,
    d: BAY * 2.4,
    facing: 'e',
    accent: A.ember,
  },

  // The angled restaurant on the south-west corner of the piazza.
  {
    node: 'faq',
    tenant: 'The Business Exchange',
    label: 'FAQ',
    kind: 'restaurant',
    x: col(4) + BAY * 1.0,
    z: row(13) + BAY * 0.6,
    w: BAY * 3.2,
    d: BAY * 1.8,
    facing: 'n',
    rotY: 0.26,
    accent: A.aether,
  },
];

/* -------------------------------------------------------------------------- */
/* Institutions — the office and campus tenancies                             */
/* -------------------------------------------------------------------------- */

export const INSTITUTIONS: Unit[] = [
  {
    node: 'response',
    tenant: 'Richfield Graduate Institute of Technology',
    label: 'The Response',
    kind: 'institution',
    x: col(2) + BAY * 1.0,
    z: row(2) + BAY * 1.1,
    w: BAY * 2.0,
    d: BAY * 2.2,
    facing: 'e',
    accent: A.aether,
  },
  {
    node: 'clinician',
    tenant: 'Old Mutual',
    label: 'Clinician Link',
    kind: 'institution',
    x: col(2) + BAY * 1.0,
    z: row(5) + BAY * 1.1,
    w: BAY * 2.0,
    d: BAY * 2.2,
    facing: 'e',
    accent: A.jade,
  },
  {
    node: 'security',
    tenant: 'Nedbank',
    label: 'Security Vault',
    kind: 'institution',
    x: col(2) + BAY * 1.0,
    z: row(8) + BAY * 1.1,
    w: BAY * 2.0,
    d: BAY * 2.2,
    facing: 'e',
    accent: A.verdant,
  },
  {
    node: 'contact',
    tenant: 'IBV',
    label: 'Contact',
    kind: 'kiosk',
    x: col(6) + BAY * 0.7,
    z: row(12) + BAY * 0.7,
    w: BAY * 1.4,
    d: BAY * 1.4,
    facing: 'n',
    accent: A.jade,
  },
];

export const UNITS: Unit[] = [...RETAIL, ...PIAZZA_UNITS, ...INSTITUTIONS];

/* -------------------------------------------------------------------------- */
/* The precinct's fixed pieces                                                 */
/* -------------------------------------------------------------------------- */

/** The open public square, raised over the parking in the real building. */
export const PIAZZA = {
  minX: col(3) + BAY * 0.3,
  maxX: col(9) - BAY * 0.2,
  minZ: row(2) - BAY * 0.2,
  maxZ: row(13) + BAY * 0.2,
};

/**
 * The pedestrian arcade on grid row H: double-height, splayed columns, dark
 * steel soffit, gallery over. Runs from the piazza's east edge to the eastern
 * site boundary.
 */
export const ARCADE = {
  minX: col(9),
  maxX: col(21) - BAY * 0.5,
  z: row(8) + BAY * 0.3,
  width: BAY * 1.8,
  height: 11.4,
  /** Column pairs down its length. */
  bays: 11,
};

/** Office bars above: north and south over the retail wing, one over the piazza's west edge. */
export const OFFICE_BLOCKS = [
  {
    id: 'north',
    x: (col(12) + col(21)) / 2,
    z: row(3) + BAY * 0.4,
    w: col(21) - col(12) - BAY * 0.6,
    d: BAY * 4.2,
    levels: 6,
    base: LEVEL * 2,
  },
  {
    id: 'south',
    x: (col(12) + col(20)) / 2,
    z: row(12),
    w: col(20) - col(12),
    d: BAY * 3.4,
    levels: 5,
    base: LEVEL * 2,
  },
  {
    id: 'piazza-west',
    x: col(2) + BAY * 0.6,
    z: (row(3) + row(11)) / 2,
    w: BAY * 1.8,
    d: row(11) - row(3),
    levels: 8,
    base: LEVEL,
  },
];

/** Parking deck under the western half, expressed at the retaining edge. */
export const PARKING = {
  minX: col(1),
  maxX: col(11),
  minZ: row(0),
  maxZ: row(15),
  cols: 10,
  rows: 15,
};

/** The broad amphitheatre steps where the site drops to Centenary Boulevard. */
export const STEPS = [
  { x: col(10) + BAY * 0.6, z: row(5), w: BAY * 1.2, d: BAY * 5.0, treads: 7, facing: 'e' as const },
  { x: col(5), z: row(14) + BAY * 0.4, w: BAY * 6.0, d: BAY * 1.0, treads: 6, facing: 's' as const },
];

/** Planters set into the piazza paving, as drawn. */
export const PLANTERS: { x: number; z: number; w: number; d: number }[] = [
  { x: col(5) + BAY * 0.2, z: row(4) + BAY * 0.2, w: BAY * 1.3, d: BAY * 1.3 },
  { x: col(7) - BAY * 0.2, z: row(6) - BAY * 0.1, w: BAY * 0.9, d: BAY * 2.0 },
  { x: col(4), z: row(10) + BAY * 0.3, w: BAY * 1.1, d: BAY * 1.1 },
  { x: col(7) - BAY * 0.3, z: row(11), w: BAY * 1.2, d: BAY * 0.9 },
  { x: col(3) + BAY * 0.3, z: row(7), w: BAY * 0.9, d: BAY * 1.6 },
];

/** Taxi drop-off and delivery yard on the southern boundary, as drawn. */
export const SERVICE_YARD = {
  x: (col(12) + col(16)) / 2,
  z: row(13) + BAY * 0.7,
  w: col(16) - col(12),
  d: BAY * 2.0,
};

/* -------------------------------------------------------------------------- */
/* Collision                                                                   */
/* -------------------------------------------------------------------------- */

export type Box = { minX: number; maxX: number; minZ: number; maxZ: number; height: number };

/** Height of a unit's shell, by kind. */
function shellHeight(kind: UnitKind) {
  if (kind === 'anchor') return 11.2;
  if (kind === 'institution') return 8.4;
  return 5.6;
}

/**
 * Everything solid in the precinct.
 *
 * The arcade's soffit and the office bars overhead are deliberately absent:
 * you walk under both. Only what meets the paving is here.
 */
export const PARK_SQUARE_COLLIDERS: Box[] = [
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
    };
  }),

  // The arcade's splayed columns.
  ...Array.from({ length: ARCADE.bays }).flatMap((_, i) => {
    const x = ARCADE.minX + ((i + 0.5) / ARCADE.bays) * (ARCADE.maxX - ARCADE.minX);
    return [-1, 1].map((s) => ({
      minX: x - 0.75,
      maxX: x + 0.75,
      minZ: ARCADE.z + s * (ARCADE.width / 2 + 0.9) - 0.75,
      maxZ: ARCADE.z + s * (ARCADE.width / 2 + 0.9) + 0.75,
      height: ARCADE.height,
    }));
  }),

  // Planters. Above step height, so you walk round them.
  ...PLANTERS.map((p) => ({
    minX: p.x - p.w / 2,
    maxX: p.x + p.w / 2,
    minZ: p.z - p.d / 2,
    maxZ: p.z + p.d / 2,
    height: 0.68,
  })),
];

/** Where the player starts: on the piazza, with the square opening ahead. */
export const SPAWN: [number, number] = [-48, -6];

/**
 * The supported-provider boards, set out on the Spar forecourt in an arc,
 * where the real anchor's trolley bays and promotional stands stand.
 */
export const INSURER_SLOTS: { pos: [number, number]; rotY: number }[] = Array.from(
  { length: 8 },
  (_, i) => {
    const spar = RETAIL[0];
    const t = (i / 7 - 0.5) * 1.35;
    return {
      pos: [spar.x + Math.sin(t) * 17, spar.z + spar.d / 2 + 7 + Math.cos(t) * 3.5],
      rotY: -t,
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
  });
}
