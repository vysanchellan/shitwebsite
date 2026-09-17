/**
 * The RiskSense District — city plan.
 *
 * Every structure is declared here once. The scene renders from this list and
 * the collision system builds its boxes from the same list, so a building can
 * never look solid and walk-through at the same time.
 */

export const ACCENT_HEX: Record<string, string> = {
  cyan: '#45d7e8',
  teal: '#1fb8a6',
  blue: '#2f6bff',
  amber: '#e9a63c',
  coral: '#ff6a55',
  green: '#2fc27a',
  violet: '#9a7cff',
};

export const BOUNDS = { minX: -64, maxX: 64, minZ: -92, maxZ: 80 };

export type StructureKind =
  | 'gate'
  | 'pillar'
  | 'tower'
  | 'lab'
  | 'clinic'
  | 'vault'
  | 'kiosk'
  | 'pavilion'
  | 'obelisk'
  | 'monolith'
  | 'terminal'
  | 'plinth';

export type Structure = {
  id: string;
  kind: StructureKind;
  pos: [number, number];
  size: [number, number, number];
  rotY?: number;
  accent: string;
  sign?: string;
  subSign?: string;
  /** Structures default to solid; set false for things you walk under or past. */
  solid?: boolean;
  /**
   * Archways are hollow: the box that matches the silhouette would also wall off
   * the opening you are meant to walk through. Where this is set, these boxes
   * replace the silhouette — each is [offsetX, offsetZ, halfWidth, halfDepth]
   * relative to the structure's position.
   */
  parts?: [number, number, number, number][];
};

export const STRUCTURES: Structure[] = [
  /* Arrival */
  // Only the two pylons collide — the span between them is the way in.
  { id: 'gate', kind: 'gate', pos: [0, 70], size: [26, 13, 3], accent: ACCENT_HEX.cyan, sign: 'RISKSENSE DISTRICT', subSign: 'DECISION SUPPORT · HEART & DIABETES', parts: [[-13, 0, 1.8, 1.8], [13, 0, 1.8, 1.8]] },

  /* Journey Boulevard — six markers, six plinths */
  { id: 'p1', kind: 'pillar', pos: [-11, 50], size: [3.2, 5.4, 3.2], accent: ACCENT_HEX.blue, sign: '01' },
  { id: 'p2', kind: 'pillar', pos: [11, 40], size: [3.2, 5.4, 3.2], accent: ACCENT_HEX.blue, sign: '02' },
  { id: 'p3', kind: 'pillar', pos: [-11, 30], size: [3.2, 5.4, 3.2], accent: ACCENT_HEX.blue, sign: '03' },
  { id: 'p4', kind: 'pillar', pos: [11, 20], size: [3.2, 5.4, 3.2], accent: ACCENT_HEX.blue, sign: '04' },
  { id: 'p5', kind: 'pillar', pos: [-11, 10], size: [3.2, 5.4, 3.2], accent: ACCENT_HEX.blue, sign: '05' },
  { id: 'p6', kind: 'pillar', pos: [11, 0], size: [3.2, 5.4, 3.2], accent: ACCENT_HEX.blue, sign: '06' },

  /* Awareness Park — statistic obelisks */
  { id: 'ob1', kind: 'obelisk', pos: [-46, 54], size: [2.2, 11, 2.2], accent: ACCENT_HEX.amber },
  { id: 'ob2', kind: 'obelisk', pos: [-34, 50], size: [2.2, 9, 2.2], accent: ACCENT_HEX.amber },
  { id: 'ob3', kind: 'obelisk', pos: [-46, 40], size: [2.2, 13, 2.2], accent: ACCENT_HEX.amber },
  { id: 'ob4', kind: 'obelisk', pos: [-34, 36], size: [2.2, 8, 2.2], accent: ACCENT_HEX.amber },
  { id: 'park-plinth', kind: 'plinth', pos: [-40, 46], size: [5, 1.1, 5], accent: ACCENT_HEX.amber, sign: 'AWARENESS PARK' },

  /* The Problem — three leaning monoliths */
  { id: 'm1', kind: 'monolith', pos: [40, 50], size: [7, 12, 2.4], rotY: -0.22, accent: ACCENT_HEX.coral, sign: 'SILENT' },
  { id: 'm2', kind: 'monolith', pos: [40, 38], size: [7, 10, 2.4], rotY: 0.16, accent: ACCENT_HEX.coral, sign: 'FRAGMENTED' },
  { id: 'm3', kind: 'monolith', pos: [40, 26], size: [7, 14, 2.4], rotY: -0.1, accent: ACCENT_HEX.coral, sign: 'DELAYED' },

  /* Clinician Link + Security Vault flank the plaza approach */
  { id: 'clinic', kind: 'clinic', pos: [-40, 2], size: [18, 11, 16], accent: ACCENT_HEX.green, sign: 'CLINICIAN LINK', subSign: 'VERIFY · CONFIRM · CONNECT' },
  { id: 'vault', kind: 'vault', pos: [40, 2], size: [16, 14, 16], accent: ACCENT_HEX.teal, sign: 'SECURITY VAULT', subSign: 'ZERO-TRUST · RBAC · AUDIT' },

  /* Central Plaza */
  { id: 'plaza-core', kind: 'monolith', pos: [0, -12], size: [4.6, 16, 4.6], accent: ACCENT_HEX.cyan, sign: 'RESPONSE' },
  { id: 'boundaries', kind: 'kiosk', pos: [-15, -18], size: [3.4, 4.4, 3.4], accent: ACCENT_HEX.blue, sign: 'SYSTEMS' },
  { id: 'disclaimer-stone', kind: 'plinth', pos: [0, -24], size: [7, 1.5, 3.4], accent: ACCENT_HEX.amber, sign: 'DISCLAIMER' },

  /* Information kiosks */
  { id: 'faq-kiosk', kind: 'kiosk', pos: [-16, -34], size: [3.6, 4.6, 3.6], accent: ACCENT_HEX.cyan, sign: 'FAQ' },
  { id: 'contact-kiosk', kind: 'kiosk', pos: [16, -34], size: [3.6, 4.6, 3.6], accent: ACCENT_HEX.green, sign: 'CONTACT' },

  /* Model institutes */
  { id: 'cardiac', kind: 'tower', pos: [-40, -44], size: [20, 34, 18], accent: ACCENT_HEX.coral, sign: 'CARDIAC INSTITUTE', subSign: 'HEART DISEASE MODEL' },
  { id: 'metabolic', kind: 'lab', pos: [40, -44], size: [20, 28, 18], accent: ACCENT_HEX.teal, sign: 'METABOLIC LAB', subSign: 'DIABETES V1 · ADULT' },

  /* Insurance Pavilion */
  { id: 'pavilion', kind: 'pavilion', pos: [0, -60], size: [42, 9, 20], accent: ACCENT_HEX.violet, sign: 'INSURANCE PAVILION', subSign: 'DEMONSTRATION PROVIDERS', solid: false },
  { id: 'handoff-kiosk', kind: 'kiosk', pos: [-17, -50], size: [3.4, 4.4, 3.4], accent: ACCENT_HEX.violet, sign: 'HANDOFF' },
  { id: 'recovery-kiosk', kind: 'kiosk', pos: [17, -50], size: [3.4, 4.4, 3.4], accent: ACCENT_HEX.amber, sign: 'RECOVERY' },

  /* Activation Terminal */
  { id: 'terminal', kind: 'terminal', pos: [0, -78], size: [24, 16, 8], accent: ACCENT_HEX.cyan, sign: 'ACTIVATION TERMINAL', subSign: 'RETURN TO APP', parts: [[-12, 0, 2.15, 4.35], [12, 0, 2.15, 4.35]] },
];

/** Road strips painted on the ground plane. */
export const ROADS: { pos: [number, number]; size: [number, number]; rot?: number }[] = [
  { pos: [0, 30], size: [16, 96] }, // Journey Boulevard
  { pos: [0, -46], size: [16, 76] }, // Plaza to terminal
  { pos: [0, 2], size: [96, 14] }, // Clinic–vault cross street
  { pos: [0, -44], size: [92, 12] }, // Institute cross street
  { pos: [-40, 40], size: [12, 40] }, // Park lane
  { pos: [40, 38], size: [12, 44] }, // Problem lane
];

/** Planted areas — the park and the plaza verges. */
export const GREENS: { pos: [number, number]; size: [number, number] }[] = [
  { pos: [-42, 46], size: [30, 34] },
  { pos: [-24, -14], size: [14, 20] },
  { pos: [24, -14], size: [14, 20] },
  { pos: [42, 62], size: [22, 18] },
];

/* -------------------------------------------------------------------------- */
/* Deterministic scatter — trees, lamps, background skyline                     */
/* -------------------------------------------------------------------------- */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Scatter = { pos: [number, number]; scale: number; rot: number };

function scatterIn(
  rng: () => number,
  area: { pos: [number, number]; size: [number, number] },
  count: number,
  minScale = 0.8,
  maxScale = 1.4,
): Scatter[] {
  const out: Scatter[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      pos: [
        area.pos[0] + (rng() - 0.5) * area.size[0],
        area.pos[1] + (rng() - 0.5) * area.size[1],
      ],
      scale: minScale + rng() * (maxScale - minScale),
      rot: rng() * Math.PI * 2,
    });
  }
  return out;
}

const rng = mulberry32(20260917);

export const TREES: Scatter[] = [
  ...scatterIn(rng, GREENS[0], 26, 0.9, 1.7),
  ...scatterIn(rng, GREENS[1], 7, 0.8, 1.2),
  ...scatterIn(rng, GREENS[2], 7, 0.8, 1.2),
  ...scatterIn(rng, GREENS[3], 12, 0.9, 1.5),
];

/** Street lamps down both sides of every avenue. */
export const LAMPS: [number, number][] = (() => {
  const out: [number, number][] = [];
  for (let z = 68; z >= -80; z -= 12) {
    out.push([-10.5, z], [10.5, z]);
  }
  for (let x = -54; x <= 54; x += 12) {
    if (Math.abs(x) > 11) out.push([x, 9.5], [x, -37.5]);
  }
  return out;
})();

/** Background skyline: non-walkable towers that give the district a horizon. */
export type SkylineTower = { pos: [number, number]; size: [number, number, number]; tint: number };

export const SKYLINE: SkylineTower[] = (() => {
  const out: SkylineTower[] = [];
  const srng = mulberry32(99117);
  const ring = [
    { x: [-150, -74], z: [-130, 110] },
    { x: [74, 150], z: [-130, 110] },
    { x: [-150, 150], z: [-190, -104] },
    { x: [-150, 150], z: [92, 170] },
  ];
  for (const r of ring) {
    for (let i = 0; i < 44; i++) {
      const x = r.x[0] + srng() * (r.x[1] - r.x[0]);
      const z = r.z[0] + srng() * (r.z[1] - r.z[0]);
      const h = 18 + srng() * 78;
      const w = 10 + srng() * 18;
      const d = 10 + srng() * 18;
      out.push({ pos: [x, z], size: [w, h, d], tint: srng() });
    }
  }
  return out;
})();

/* -------------------------------------------------------------------------- */
/* Collision                                                                   */
/* -------------------------------------------------------------------------- */

export type Collider = { minX: number; maxX: number; minZ: number; maxZ: number };

function boxFor(s: Structure, pad: number): Collider {
  // Rotated structures are approximated by their bounding square — close enough
  // at these angles, and far cheaper than an OBB test every frame.
  const spread = s.rotY ? Math.max(s.size[0], s.size[2]) : 0;
  const w = Math.max(s.size[0], spread) / 2 + pad;
  const d = Math.max(s.size[2], spread) / 2 + pad;
  return {
    minX: s.pos[0] - w,
    maxX: s.pos[0] + w,
    minZ: s.pos[1] - d,
    maxZ: s.pos[1] + d,
  };
}

export const COLLIDERS: Collider[] = STRUCTURES.filter((s) => s.solid !== false).flatMap((s) =>
  s.parts
    ? s.parts.map(([dx, dz, hw, hd]) => ({
        minX: s.pos[0] + dx - hw,
        maxX: s.pos[0] + dx + hw,
        minZ: s.pos[1] + dz - hd,
        maxZ: s.pos[1] + dz + hd,
      }))
    : [boxFor(s, 0.35)],
);

/** Pavilion columns are solid even though the canopy is not. */
export const PAVILION_COLUMNS: [number, number][] = [-19, -9.5, 9.5, 19].flatMap((x) => [
  [x, -68] as [number, number],
  [x, -52] as [number, number],
]);

for (const [x, z] of PAVILION_COLUMNS) {
  COLLIDERS.push({ minX: x - 0.9, maxX: x + 0.9, minZ: z - 0.9, maxZ: z + 0.9 });
}

/** The eight insurer kiosks, arranged in an arc inside the pavilion. */
export const INSURER_SLOTS: { pos: [number, number]; rotY: number }[] = Array.from(
  { length: 8 },
  (_, i) => {
    const t = (i / 7 - 0.5) * 1.5;
    return {
      pos: [Math.sin(t) * 17, -60 + Math.cos(t) * 5 - 3],
      rotY: -t,
    } as { pos: [number, number]; rotY: number };
  },
);

for (const slot of INSURER_SLOTS) {
  COLLIDERS.push({
    minX: slot.pos[0] - 1.4,
    maxX: slot.pos[0] + 1.4,
    minZ: slot.pos[1] - 0.9,
    maxZ: slot.pos[1] + 0.9,
  });
}
