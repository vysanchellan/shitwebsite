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

export { ACCENT_HEX } from './accents';
import { ACCENT_HEX } from './accents';
import { PARK_SQUARE_COLLIDERS } from './parkSquare';

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

/**
 * The hand-placed district structures are gone: Park Square replaces them, and
 * is declared in parkSquare.ts straight off the building's floor plans. This
 * list is kept empty so the minimap and collision code have one shape to read.
 */
export const STRUCTURES: Structure[] = [];

/** Road strips through the content districts. */
export const ROADS: { pos: [number, number]; size: [number, number]; rot?: number }[] = [
  // Centenary Boulevard along the eastern boundary, Park Avenue to the south.
  { pos: [100, 0], size: [18, 200] },
  { pos: [0, 80], size: [220, 16] },
];

/** Planted areas — the park and the plaza verges. */
export const GREENS: { pos: [number, number]; size: [number, number] }[] = [
  // CJ Saunders Park, which the piazza is a natural extension of.
  { pos: [-122, -10], size: [58, 120] },
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

/** CJ Saunders Park, west of the precinct. */
export const TREES: Scatter[] = scatterIn(rng, GREENS[0], 54, 0.9, 1.8);

/* -------------------------------------------------------------------------- */
/* The wider city                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Nothing is generated inside this box: it is the Park Square site, which is
 * built by hand from the real plans. The generated city is uMhlanga Ridge
 * around it.
 */
const CORE = { minX: -92, maxX: 92, minZ: -72, maxZ: 72 };

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
  // Centenary Boulevard and Park Avenue, both sides.
  for (let z = -96; z <= 96; z += 14) out.push([92, z], [110, z]);
  for (let x = -108; x <= 108; x += 14) out.push([x, 72], [x, 90]);
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

/**
 * Obstacles are boxes with a height, so the collision system can tell a kerb
 * from a wall and let you step over the first without opening the second.
 */
export type Collider = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  height: number;
};

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
    height: s.size[1],
  };
}

export const COLLIDERS: Collider[] = STRUCTURES.filter((s) => s.solid !== false).flatMap((s) =>
  s.parts
    ? s.parts.map(([dx, dz, hw, hd]) => ({
        minX: s.pos[0] + dx - hw,
        maxX: s.pos[0] + dx + hw,
        minZ: s.pos[1] + dz - hd,
        maxZ: s.pos[1] + dz + hd,
        height: s.size[1],
      }))
    : [boxFor(s, 0.35)],
);

/** The precinct, built from the real plans. */
for (const b of PARK_SQUARE_COLLIDERS) COLLIDERS.push(b);

/** Every generated building is solid at its podium footprint. */
for (const b of CITY) {
  COLLIDERS.push({
    minX: b.pos[0] - b.size[0] / 2 - 0.35,
    maxX: b.pos[0] + b.size[0] / 2 + 0.35,
    minZ: b.pos[1] - b.size[2] / 2 - 0.35,
    maxZ: b.pos[1] + b.size[2] / 2 + 0.35,
    height: b.size[1] + b.tower[1],
  });
}

/** Street furniture. Low pieces are left steppable by their height alone. */
const PROP_SIZE: Record<StreetProp['kind'], [number, number, number]> = {
  bollard: [0.4, 1.1, 0.4],
  bench: [2.2, 0.45, 0.6],
  planter: [2.4, 0.8, 1.1],
  hydrant: [0.5, 0.95, 0.5],
  bin: [0.8, 1.05, 0.8],
  signal: [0.5, 4.4, 0.5],
  vent: [1.5, 1.0, 1.2],
  barrier: [2.6, 1.0, 0.35],
};

for (const p of STREET_PROPS) {
  const [w, h, d] = PROP_SIZE[p.kind];
  // Props are only ever rotated a quarter turn, so swap rather than rotate.
  const halfW = (p.rotY === 0 ? w : d) / 2 + 0.15;
  const halfD = (p.rotY === 0 ? d : w) / 2 + 0.15;
  COLLIDERS.push({
    minX: p.pos[0] - halfW,
    maxX: p.pos[0] + halfW,
    minZ: p.pos[1] - halfD,
    maxZ: p.pos[1] + halfD,
    height: h,
  });
}

/** Parked vehicles are solid; you walk round them, not through them. */
const VEHICLE_FOOTPRINT: Record<Vehicle['kind'], [number, number, number]> = {
  car: [2.0, 1.5, 4.4],
  van: [2.3, 2.1, 5.4],
  ambulance: [2.4, 2.5, 6.0],
};

for (const v of VEHICLES) {
  const [w, h, d] = VEHICLE_FOOTPRINT[v.kind];
  const halfW = (v.rotY === 0 ? w : d) / 2 + 0.2;
  const halfD = (v.rotY === 0 ? d : w) / 2 + 0.2;
  COLLIDERS.push({
    minX: v.pos[0] - halfW,
    maxX: v.pos[0] + halfW,
    minZ: v.pos[1] - halfD,
    maxZ: v.pos[1] + halfD,
    height: h,
  });
}
