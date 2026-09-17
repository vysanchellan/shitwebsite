/**
 * The RiskSense District — city plan.
 *
 * Twelve content districts sit in the middle of a real city rather than on an
 * empty plane. The bespoke structures are declared by hand; everything around
 * them is generated on a street grid and rendered as instanced geometry, so the
 * wider city costs a handful of draw calls rather than hundreds.
 *
 * The scene renders from these lists and the collision system builds its boxes
 * from the same lists, so a building can never look solid and be walk-through
 * at the same time.
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

export const BOUNDS = { minX: -206, maxX: 206, minZ: -266, maxZ: 206 };

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

/** Road strips through the content districts. */
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
/* Deterministic scatter                                                       */
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

/* -------------------------------------------------------------------------- */
/* The wider city                                                              */
/* -------------------------------------------------------------------------- */

/** Nothing is generated inside this box; it belongs to the content districts. */
const CORE = { minX: -58, maxX: 58, minZ: -94, maxZ: 80 };

/** Block pitch, and the carriageway left between blocks. */
const CELL = 40;
const STREET = 12;
const LOT = CELL - STREET;

export type Facade = 'office' | 'hospital' | 'residential' | 'retail' | 'industrial';

export type RoofItem = {
  kind: 'box' | 'tank' | 'mast';
  pos: [number, number];
  size: number;
  on: 'podium' | 'tower';
};

export type CityBuilding = {
  pos: [number, number];
  /** Podium footprint and height. */
  size: [number, number, number];
  /** Tower rising from the podium; height 0 means the podium stands alone. */
  tower: [number, number, number];
  /** Tower offset within the podium, so setbacks are not always centred. */
  towerOffset: [number, number];
  facade: Facade;
  /** 0–1 jitter used for the emissive tint. */
  tint: number;
  roof: RoofItem[];
  /** A lit band near the top of the tower. */
  crown: boolean;
};

export type StreetProp = {
  kind: 'bollard' | 'bench' | 'planter' | 'hydrant' | 'bin' | 'signal' | 'vent' | 'barrier';
  pos: [number, number];
  rotY: number;
};

export type Vehicle = {
  pos: [number, number];
  rotY: number;
  tint: number;
  kind: 'car' | 'van' | 'ambulance';
};

export type Crossing = { pos: [number, number]; rotY: number; width: number };

const FACADES: Facade[] = ['office', 'hospital', 'residential', 'retail', 'industrial'];

function overlapsCore(x: number, z: number, w: number, d: number, pad = 7) {
  return (
    x + w / 2 + pad > CORE.minX &&
    x - w / 2 - pad < CORE.maxX &&
    z + d / 2 + pad > CORE.minZ &&
    z - d / 2 - pad < CORE.maxZ
  );
}

const generated = (() => {
  const r = mulberry32(48291017);
  const buildings: CityBuilding[] = [];
  const streets: { pos: [number, number]; size: [number, number] }[] = [];
  const props: StreetProp[] = [];
  const vehicles: Vehicle[] = [];
  const crossings: Crossing[] = [];

  const xs: number[] = [];
  for (let x = -CELL * 5; x <= CELL * 5; x += CELL) xs.push(x);
  const zs: number[] = [];
  for (let z = -CELL * 6; z <= CELL * 5; z += CELL) zs.push(z);

  // Carriageways along every grid line, running the full extent of the map.
  for (const x of xs) {
    streets.push({ pos: [x, -24], size: [STREET, BOUNDS.maxZ - BOUNDS.minZ] });
  }
  for (const z of zs) {
    streets.push({ pos: [0, z], size: [BOUNDS.maxX - BOUNDS.minX, STREET] });
  }

  for (const cx of xs) {
    for (const cz of zs) {
      // Blocks sit between the grid lines, never on them.
      const bx = cx + CELL / 2;
      const bz = cz + CELL / 2;
      if (bx < BOUNDS.minX + 12 || bx > BOUNDS.maxX - 12) continue;
      if (bz < BOUNDS.minZ + 12 || bz > BOUNDS.maxZ - 12) continue;
      if (overlapsCore(bx, bz, LOT, LOT)) continue;

      // Distance from downtown — the middle builds taller.
      const density = Math.max(0.25, 1 - Math.hypot(bx, bz + 20) / 260);

      const cols = r() > 0.28 ? 2 : 1;
      const rows = r() > 0.32 ? 2 : 1;
      const lotW = LOT / cols;
      const lotD = LOT / rows;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          if (r() > 0.96) continue; // the occasional empty lot

          const lx = bx - LOT / 2 + lotW * (i + 0.5);
          const lz = bz - LOT / 2 + lotD * (j + 0.5);

          const w = lotW * (0.62 + r() * 0.26);
          const d = lotD * (0.62 + r() * 0.26);
          const podiumH = 6 + r() * 12;

          const hasTower = r() < 0.5 + density * 0.35;
          const towerH = hasTower ? (14 + r() * 58) * (0.5 + density) : 0;
          const towerW = w * (0.5 + r() * 0.32);
          const towerD = d * (0.5 + r() * 0.32);

          const roof: RoofItem[] = [];
          const roofCount = 1 + Math.floor(r() * 3);
          for (let k = 0; k < roofCount; k++) {
            const on: RoofItem['on'] = towerH > 0 && r() > 0.45 ? 'tower' : 'podium';
            const span = on === 'tower' ? Math.min(towerW, towerD) : Math.min(w, d);
            roof.push({
              kind: r() > 0.72 ? 'tank' : r() > 0.4 ? 'mast' : 'box',
              pos: [(r() - 0.5) * span * 0.5, (r() - 0.5) * span * 0.5],
              size: 0.7 + r() * 1.8,
              on,
            });
          }

          buildings.push({
            pos: [lx, lz],
            size: [w, podiumH, d],
            tower: [towerW, towerH, towerD],
            towerOffset: [(r() - 0.5) * (w - towerW) * 0.7, (r() - 0.5) * (d - towerD) * 0.7],
            facade: FACADES[Math.floor(r() * FACADES.length)],
            tint: r(),
            roof,
            crown: towerH > 34 && r() > 0.45,
          });
        }
      }

      // Pavement furniture along the block's frontage.
      const kinds: StreetProp['kind'][] = [
        'bollard', 'bench', 'planter', 'hydrant', 'bin', 'vent', 'barrier',
      ];
      const frontage = 5 + Math.floor(r() * 6);
      for (let k = 0; k < frontage; k++) {
        const side = Math.floor(r() * 4);
        const t = (r() - 0.5) * LOT;
        const edge = LOT / 2 + 2.5;
        const pos: [number, number] =
          side === 0 ? [bx + t, bz - edge]
          : side === 1 ? [bx + t, bz + edge]
          : side === 2 ? [bx - edge, bz + t]
          : [bx + edge, bz + t];
        props.push({
          kind: kinds[Math.floor(r() * kinds.length)],
          pos,
          rotY: side < 2 ? 0 : Math.PI / 2,
        });
      }

      // Vehicles at the kerb.
      const parked = 1 + Math.floor(r() * 3);
      for (let k = 0; k < parked; k++) {
        const horizontal = r() > 0.5;
        const t = (r() - 0.5) * LOT * 0.8;
        const edge = LOT / 2 + 5;
        vehicles.push({
          pos: horizontal
            ? [bx + t, bz + (r() > 0.5 ? edge : -edge)]
            : [bx + (r() > 0.5 ? edge : -edge), bz + t],
          rotY: horizontal ? 0 : Math.PI / 2,
          tint: r(),
          kind: r() > 0.88 ? 'ambulance' : r() > 0.6 ? 'van' : 'car',
        });
      }

      // A zebra crossing on roughly half the junctions.
      if (r() > 0.5) {
        crossings.push({ pos: [bx - LOT / 2 - STREET / 2, bz], rotY: Math.PI / 2, width: STREET });
      }
      if (r() > 0.6) {
        crossings.push({ pos: [bx, bz - LOT / 2 - STREET / 2], rotY: 0, width: STREET });
      }
    }
  }

  // Traffic signals on the junctions that ring the core.
  for (const x of [-CELL, CELL]) {
    for (const z of [-CELL * 2, -CELL, 0, CELL]) {
      props.push({ kind: 'signal', pos: [x + STREET / 2 + 1, z + STREET / 2 + 1], rotY: r() * Math.PI });
    }
  }

  return { buildings, streets, props, vehicles, crossings };
})();

export const CITY: CityBuilding[] = generated.buildings;
export const CITY_STREETS = generated.streets;
export const STREET_PROPS: StreetProp[] = generated.props;
export const VEHICLES: Vehicle[] = generated.vehicles;
export const CROSSINGS: Crossing[] = generated.crossings;

/** Street lamps down the district avenues and along the city grid. */
export const LAMPS: [number, number][] = (() => {
  const out: [number, number][] = [];
  for (let z = 68; z >= -80; z -= 12) out.push([-10.5, z], [10.5, z]);
  for (let x = -54; x <= 54; x += 12) {
    if (Math.abs(x) > 11) out.push([x, 9.5], [x, -37.5]);
  }
  // One pair per city block frontage, set back from the kerb.
  for (const b of CITY) {
    if (Math.abs(b.pos[0]) > 140 || b.pos[1] < -200) continue;
    out.push([b.pos[0] + b.size[0] / 2 + 3.5, b.pos[1]]);
  }
  return out;
})();

/** Far towers beyond the walkable grid, purely for the horizon. */
export type SkylineTower = { pos: [number, number]; size: [number, number, number]; tint: number };

export const SKYLINE: SkylineTower[] = (() => {
  const out: SkylineTower[] = [];
  const srng = mulberry32(99117);
  const ring = [
    { x: [-620, -230], z: [-560, 470] },
    { x: [230, 620], z: [-560, 470] },
    { x: [-620, 620], z: [-660, -300] },
    { x: [-620, 620], z: [250, 560] },
  ];
  for (const r of ring) {
    for (let i = 0; i < 95; i++) {
      const x = r.x[0] + srng() * (r.x[1] - r.x[0]);
      const z = r.z[0] + srng() * (r.z[1] - r.z[0]);
      out.push({
        pos: [x, z],
        size: [16 + srng() * 34, 30 + srng() * 150, 16 + srng() * 34],
        tint: srng(),
      });
    }
  }
  return out;
})();

/* -------------------------------------------------------------------------- */
/* Collision                                                                   */
/* -------------------------------------------------------------------------- */

export type Collider = { minX: number; maxX: number; minZ: number; maxZ: number };

/** The institutes are drawn with a podium wider than their nominal footprint. */
const EXTRA_PAD: Partial<Record<StructureKind, number>> = { tower: 1.4, lab: 1.4 };

function boxFor(s: Structure, pad: number): Collider {
  pad += EXTRA_PAD[s.kind] ?? 0;
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

/** Every generated building is solid at its podium footprint. */
for (const b of CITY) {
  COLLIDERS.push({
    minX: b.pos[0] - b.size[0] / 2 - 0.35,
    maxX: b.pos[0] + b.size[0] / 2 + 0.35,
    minZ: b.pos[1] - b.size[2] / 2 - 0.35,
    maxZ: b.pos[1] + b.size[2] / 2 + 0.35,
  });
}

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
