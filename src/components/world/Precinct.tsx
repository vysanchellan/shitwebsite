'use client';

import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import {
  ARCADE,
  BAY,
  OFFICE_BLOCKS,
  OFFICE_LEVEL,
  PARKING,
  PIAZZA,
  PLANTERS,
  SERVICE_YARD,
  SITE,
  STEPS,
  UNITS,
  col,
  row,
  type Unit,
} from './parkSquare';
import { signTexture } from './textures';

/**
 * Park Square, built.
 *
 * The palette here is the building's own — off-white and board-marked
 * concrete, clear glass, black steel and dark shopfront bands. Only the
 * signage and the marker light carry our world's brass, which is what keeps it
 * recognisably Park Square and recognisably ours at the same time.
 */

const O = new THREE.Object3D();

/* Materials, shared so the whole precinct is a handful of programs. */
function useMaterials() {
  return useMemo(() => {
    const concrete = new THREE.MeshStandardMaterial({
      color: '#b9b4ab',
      roughness: 0.92,
      metalness: 0.02,
    });
    const concreteDark = new THREE.MeshStandardMaterial({
      color: '#8d887f',
      roughness: 0.95,
      metalness: 0.02,
    });
    const soffit = new THREE.MeshStandardMaterial({
      color: '#1c1d21',
      roughness: 0.85,
      metalness: 0.35,
      side: THREE.DoubleSide,
    });
    const glass = new THREE.MeshStandardMaterial({
      color: '#243036',
      roughness: 0.08,
      metalness: 0.9,
      transparent: true,
      opacity: 0.72,
    });
    const shopfront = new THREE.MeshStandardMaterial({
      color: '#14151a',
      roughness: 0.55,
      metalness: 0.3,
    });
    const steel = new THREE.MeshStandardMaterial({
      color: '#2a2c31',
      roughness: 0.5,
      metalness: 0.75,
    });
    const paving = new THREE.MeshStandardMaterial({
      color: '#9c968c',
      roughness: 0.94,
      metalness: 0.02,
    });
    const paving2 = new THREE.MeshStandardMaterial({
      color: '#7d766d',
      roughness: 0.94,
      metalness: 0.02,
    });
    return { concrete, concreteDark, soffit, glass, shopfront, steel, paving, paving2 };
  }, []);
}

/* -------------------------------------------------------------------------- */
/* Ground planes                                                               */
/* -------------------------------------------------------------------------- */

function Decks() {
  const m = useMaterials();

  return (
    <group>
      {/* The whole site slab */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow material={m.paving2}>
        <planeGeometry args={[SITE.maxX - SITE.minX + 12, SITE.maxZ - SITE.minZ + 12]} />
      </mesh>

      {/* The piazza, a lighter paving field inside it */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[(PIAZZA.minX + PIAZZA.maxX) / 2, 0.05, (PIAZZA.minZ + PIAZZA.maxZ) / 2]}
        receiveShadow
        material={m.paving}
      >
        <planeGeometry args={[PIAZZA.maxX - PIAZZA.minX, PIAZZA.maxZ - PIAZZA.minZ]} />
      </mesh>

      {/* A banded paving inlay down the piazza, as the drawings show */}
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[
            (PIAZZA.minX + PIAZZA.maxX) / 2,
            0.07,
            PIAZZA.minZ + ((i + 0.5) / 9) * (PIAZZA.maxZ - PIAZZA.minZ),
          ]}
          material={m.paving2}
        >
          <planeGeometry args={[PIAZZA.maxX - PIAZZA.minX - 6, 0.7]} />
        </mesh>
      ))}

      {/* Service yard tarmac */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[SERVICE_YARD.x, 0.04, SERVICE_YARD.z]}
        receiveShadow
        material={m.paving2}
      >
        <planeGeometry args={[SERVICE_YARD.w, SERVICE_YARD.d]} />
      </mesh>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* Parking deck under the western half                                         */
/* -------------------------------------------------------------------------- */

/**
 * The deck is read from outside: a long horizontal slab edge on the boundary,
 * a rhythm of columns behind it, and the ramp. The bays themselves are dark.
 */
function ParkingDeck() {
  const m = useMaterials();
  const columns = useRef<THREE.InstancedMesh>(null);

  const posts = useMemo(() => {
    const out: [number, number][] = [];
    for (let c = 1; c <= PARKING.cols; c += 2) {
      for (let r = 1; r < PARKING.rows; r += 3) {
        out.push([col(c) + BAY / 2, row(r) + BAY / 2]);
      }
    }
    return out;
  }, []);

  useLayoutEffect(() => {
    posts.forEach((p, i) => {
      O.position.set(p[0], -2.7, p[1]);
      O.rotation.set(0, 0, 0);
      O.scale.set(1, 1, 1);
      O.updateMatrix();
      columns.current?.setMatrixAt(i, O.matrix);
    });
    if (columns.current) columns.current.instanceMatrix.needsUpdate = true;
  }, [posts]);

  const w = PARKING.maxX - PARKING.minX;
  const d = PARKING.maxZ - PARKING.minZ;
  const cx = (PARKING.minX + PARKING.maxX) / 2;
  const cz = (PARKING.minZ + PARKING.maxZ) / 2;

  return (
    <group>
      {/*
        The deck is an undercroft: the piazza is its roof, so the whole mass
        sits below the walkable plane and is read from the boundary, where the
        site drops away to the street.
      */}
      <mesh position={[cx, -2.7, cz]} material={m.concreteDark} receiveShadow>
        <boxGeometry args={[w, 5.4, d]} />
      </mesh>

      {/* The slab edge that caps it, flush with the piazza paving */}
      <mesh position={[cx, -0.15, cz]} material={m.concrete} castShadow>
        <boxGeometry args={[w + 1.8, 0.6, d + 1.8]} />
      </mesh>

      {/* Ventilation slots along the exposed south and west faces */}
      {Array.from({ length: 24 }).map((_, i) => (
        <mesh
          key={`s${i}`}
          position={[PARKING.minX + ((i + 0.5) / 24) * w, -2.0, PARKING.maxZ + 0.95]}
          material={m.steel}
        >
          <boxGeometry args={[w / 32, 1.6, 0.2]} />
        </mesh>
      ))}
      {Array.from({ length: 16 }).map((_, i) => (
        <mesh
          key={`w${i}`}
          position={[PARKING.minX - 0.95, -2.0, PARKING.minZ + ((i + 0.5) / 16) * d]}
          rotation={[0, Math.PI / 2, 0]}
          material={m.steel}
        >
          <boxGeometry args={[d / 22, 1.6, 0.2]} />
        </mesh>
      ))}

      <instancedMesh
        ref={columns}
        args={[undefined, undefined, posts.length]}
        material={m.concreteDark}
      >
        <boxGeometry args={[0.85, 5.4, 0.85]} />
      </instancedMesh>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* The arcade — the building's signature space                                 */
/* -------------------------------------------------------------------------- */

/**
 * Double-height, splayed concrete columns leaning in from both sides, a dark
 * steel soffit over, radiating linear lights beneath it and a gallery walkway
 * on the first floor down each side.
 */
function Arcade() {
  const m = useMaterials();
  const lights = useRef<(THREE.Mesh | null)[]>([]);

  const span = ARCADE.maxX - ARCADE.minX;
  const half = ARCADE.width / 2;
  const bays = ARCADE.bays;

  useFrame(({ clock }) => {
    // The strips breathe very slightly, so the ceiling is never quite static.
    const t = clock.elapsedTime;
    lights.current.forEach((l, i) => {
      if (!l) return;
      const mat = l.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.75 + Math.sin(t * 0.6 + i * 0.4) * 0.1;
    });
  });

  return (
    <group position={[0, 0, ARCADE.z]}>
      {/* Splayed columns: an A-frame pair per bay, leaning into the walkway */}
      {Array.from({ length: bays }).map((_, i) => {
        const x = ARCADE.minX + ((i + 0.5) / bays) * span;
        return (
          <group key={i} position={[x, 0, 0]}>
            {[-1, 1].map((s) => (
              <mesh
                key={s}
                position={[0, ARCADE.height * 0.42, s * (half + 0.9)]}
                rotation={[s * -0.22, 0, 0]}
                material={m.concrete}
                castShadow
              >
                <cylinderGeometry args={[0.42, 0.62, ARCADE.height * 0.86, 6]} />
              </mesh>
            ))}
          </group>
        );
      })}

      {/* Dark steel soffit over the walkway */}
      <mesh position={[(ARCADE.minX + ARCADE.maxX) / 2, ARCADE.height, 0]} material={m.soffit}>
        <boxGeometry args={[span, 0.5, ARCADE.width + 3.4]} />
      </mesh>

      {/* Exposed truss lines under the soffit */}
      {Array.from({ length: bays * 2 }).map((_, i) => (
        <mesh
          key={i}
          position={[ARCADE.minX + ((i + 0.5) / (bays * 2)) * span, ARCADE.height - 0.5, 0]}
          material={m.steel}
        >
          <boxGeometry args={[0.16, 0.5, ARCADE.width + 3.0]} />
        </mesh>
      ))}

      {/* Radiating linear lights, the ceiling's signature */}
      {Array.from({ length: bays * 2 }).map((_, i) => {
        const t = i / (bays * 2 - 1);
        const x = ARCADE.minX + t * span;
        // Alternating diagonals give the herringbone of the render.
        const tilt = (i % 2 === 0 ? 1 : -1) * 0.5;
        return (
          <mesh
            key={i}
            ref={(el) => {
              lights.current[i] = el;
            }}
            position={[x, ARCADE.height - 0.85, 0]}
            rotation={[0, tilt, 0]}
          >
            <boxGeometry args={[0.13, 0.07, ARCADE.width + 1.6]} />
            <meshBasicMaterial color="#fff3dd" transparent opacity={0.8} toneMapped={false} />
          </mesh>
        );
      })}

      {/* Sprinkler run, the red line in the render */}
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[(ARCADE.minX + ARCADE.maxX) / 2, ARCADE.height - 0.62, s * (half - 0.4)]}
        >
          <cylinderGeometry args={[0.055, 0.055, span, 6]} />
          <meshStandardMaterial color="#8e2b22" roughness={0.6} metalness={0.4} />
        </mesh>
      ))}

      {/* First-floor gallery down each side, with a glass balustrade */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh
            position={[(ARCADE.minX + ARCADE.maxX) / 2, ARCADE.height * 0.52, s * (half + 2.1)]}
            material={m.concrete}
            castShadow
          >
            <boxGeometry args={[span, 0.42, 3.6]} />
          </mesh>
          <mesh
            position={[(ARCADE.minX + ARCADE.maxX) / 2, ARCADE.height * 0.52 + 0.75, s * (half + 0.4)]}
            material={m.glass}
          >
            <boxGeometry args={[span, 1.1, 0.07]} />
          </mesh>
        </group>
      ))}

      {/* Arcade floor, a darker band than the piazza */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[(ARCADE.minX + ARCADE.maxX) / 2, 0.08, 0]}
        material={m.paving}
        receiveShadow
      >
        <planeGeometry args={[span, ARCADE.width + 3.4]} />
      </mesh>

      {/* A wash of light on the floor so the arcade reads from a distance */}
      <pointLight position={[ARCADE.minX + span * 0.25, 5, 0]} color="#ffe6bd" intensity={40} distance={44} decay={2} />
      <pointLight position={[ARCADE.minX + span * 0.72, 5, 0]} color="#ffe6bd" intensity={40} distance={44} decay={2} />
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* Tenancies                                                                   */
/* -------------------------------------------------------------------------- */

/** Where a unit's shopfront sits, given which way it faces. */
function frontOf(u: Unit): { x: number; z: number; rot: number } {
  switch (u.facing) {
    case 'n':
      return { x: u.x, z: u.z - u.d / 2, rot: Math.PI };
    case 's':
      return { x: u.x, z: u.z + u.d / 2, rot: 0 };
    case 'e':
      return { x: u.x + u.w / 2, z: u.z, rot: Math.PI / 2 };
    default:
      return { x: u.x - u.w / 2, z: u.z, rot: -Math.PI / 2 };
  }
}

/**
 * One tenancy: a concrete shell, a glazed shopfront under a dark fascia, and
 * the unit's name on the fascia in our world's brass.
 */
function Tenancy({ unit }: { unit: Unit }) {
  const m = useMaterials();
  const front = frontOf(unit);
  const tall = unit.kind === 'anchor' ? 11.2 : unit.kind === 'institution' ? 8.4 : 5.6;
  const frontWidth = unit.facing === 'n' || unit.facing === 's' ? unit.w : unit.d;

  const sign = useMemo(
    () => signTexture(unit.label, unit.tenant, unit.accent, 1024),
    [unit.label, unit.tenant, unit.accent],
  );

  return (
    <group position={[unit.x, 0, unit.z]} rotation={[0, unit.rotY ?? 0, 0]}>
      {/* Shell */}
      <mesh position={[0, tall / 2, 0]} material={m.concrete} castShadow receiveShadow>
        <boxGeometry args={[unit.w, tall, unit.d]} />
      </mesh>

      {/* Parapet */}
      <mesh position={[0, tall + 0.3, 0]} material={m.concreteDark} castShadow>
        <boxGeometry args={[unit.w + 0.5, 0.6, unit.d + 0.5]} />
      </mesh>

      <group
        position={[front.x - unit.x, 0, front.z - unit.z]}
        rotation={[0, front.rot, 0]}
      >
        {/* Full-height glazing */}
        <mesh position={[0, 2.3, 0.06]} material={m.glass}>
          <planeGeometry args={[frontWidth * 0.94, 4.2]} />
        </mesh>

        {/* Mullions */}
        {Array.from({ length: Math.max(3, Math.round(frontWidth / 2.1)) }).map((_, i, arr) => (
          <mesh
            key={i}
            position={[(i / (arr.length - 1) - 0.5) * frontWidth * 0.94, 2.3, 0.1]}
            material={m.shopfront}
          >
            <boxGeometry args={[0.1, 4.2, 0.12]} />
          </mesh>
        ))}

        {/* Dark fascia band with the name on it */}
        <mesh position={[0, 4.9, 0.12]} material={m.shopfront}>
          <boxGeometry args={[frontWidth * 0.98, 1.25, 0.22]} />
        </mesh>
        <mesh position={[0, 4.9, 0.25]}>
          <planeGeometry args={[frontWidth * 0.9, (frontWidth * 0.9) / 4]} />
          <meshBasicMaterial map={sign} transparent depthWrite={false} toneMapped={false} />
        </mesh>

        {/* Spill from the shopfront onto the paving */}
        <pointLight position={[0, 3, 2.6]} color={unit.accent} intensity={9} distance={13} decay={2} />
      </group>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* Office bars above                                                           */
/* -------------------------------------------------------------------------- */

/**
 * The upper storeys: a projecting slab per level, a glass balustrade set back
 * behind it, and a screen of close-spaced vertical fins. That combination is
 * what the elevations read as from the street.
 */
function OfficeBar({
  x,
  z,
  w,
  d,
  levels,
  base,
}: {
  x: number;
  z: number;
  w: number;
  d: number;
  levels: number;
  base: number;
}) {
  const m = useMaterials();
  const fins = useRef<THREE.InstancedMesh>(null);

  const finList = useMemo(() => {
    const out: { x: number; y: number; z: number; rot: number }[] = [];
    const step = 1.35;
    for (let l = 0; l < levels; l++) {
      const y = base + l * OFFICE_LEVEL + OFFICE_LEVEL / 2;
      // Fins only on the two long elevations.
      for (let i = 0; i * step < w; i++) {
        const px = -w / 2 + i * step + step / 2;
        out.push({ x: px, y, z: d / 2 + 0.28, rot: 0 });
        out.push({ x: px, y, z: -d / 2 - 0.28, rot: 0 });
      }
    }
    return out;
  }, [w, d, levels, base]);

  useLayoutEffect(() => {
    finList.forEach((f, i) => {
      O.position.set(f.x, f.y, f.z);
      O.rotation.set(0, f.rot, 0);
      O.scale.set(1, 1, 1);
      O.updateMatrix();
      fins.current?.setMatrixAt(i, O.matrix);
    });
    if (fins.current) fins.current.instanceMatrix.needsUpdate = true;
  }, [finList]);

  return (
    <group position={[x, 0, z]}>
      {/* The mass itself, glazed */}
      {Array.from({ length: levels }).map((_, l) => (
        <group key={l} position={[0, base + l * OFFICE_LEVEL, 0]}>
          {/* Glazing band */}
          <mesh position={[0, OFFICE_LEVEL / 2, 0]} material={m.glass}>
            <boxGeometry args={[w - 0.4, OFFICE_LEVEL - 0.55, d - 0.4]} />
          </mesh>
          {/* Projecting slab, the horizontal that defines the elevation */}
          <mesh position={[0, OFFICE_LEVEL - 0.28, 0]} material={m.concrete} castShadow receiveShadow>
            <boxGeometry args={[w + 1.5, 0.55, d + 1.5]} />
          </mesh>
          {/* Glass balustrade set back on the balcony */}
          {[-1, 1].map((s) => (
            <mesh
              key={s}
              position={[0, OFFICE_LEVEL + 0.55, s * (d / 2 + 0.7)]}
              material={m.glass}
            >
              <boxGeometry args={[w + 1.4, 1.05, 0.06]} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Vertical fin screen */}
      <instancedMesh
        ref={fins}
        args={[undefined, undefined, Math.max(1, finList.length)]}
        material={m.concrete}
        castShadow
      >
        <boxGeometry args={[0.16, OFFICE_LEVEL - 0.6, 0.42]} />
      </instancedMesh>

      {/* Roof plant */}
      <mesh position={[w * 0.18, base + levels * OFFICE_LEVEL + 1.1, 0]} material={m.concreteDark} castShadow>
        <boxGeometry args={[w * 0.3, 2.2, d * 0.42]} />
      </mesh>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* Piazza furniture                                                            */
/* -------------------------------------------------------------------------- */

function Steps() {
  const m = useMaterials();

  return (
    <group>
      {STEPS.map((s, i) => {
        const along = s.facing === 'e' ? 'z' : 'x';
        return (
          <group key={i} position={[s.x, 0, s.z]}>
            {Array.from({ length: s.treads }).map((_, t) => {
              const inset = t * 0.62;
              const y = 0.1 + t * 0.17;
              return (
                <mesh
                  key={t}
                  position={[
                    s.facing === 'e' ? inset : 0,
                    y,
                    s.facing === 's' ? inset : 0,
                  ]}
                  material={m.paving}
                  receiveShadow
                >
                  <boxGeometry
                    args={
                      along === 'z'
                        ? [s.w - inset * 0.6, 0.18, s.d]
                        : [s.w, 0.18, s.d - inset * 0.6]
                    }
                  />
                </mesh>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}

function Planters() {
  const m = useMaterials();

  return (
    <group>
      {PLANTERS.map((p, i) => (
        <group key={i} position={[p.x, 0, p.z]}>
          <mesh position={[0, 0.34, 0]} material={m.concrete} castShadow receiveShadow>
            <boxGeometry args={[p.w, 0.68, p.d]} />
          </mesh>
          <mesh position={[0, 0.72, 0]}>
            <boxGeometry args={[p.w - 0.5, 0.12, p.d - 0.5]} />
            <meshStandardMaterial color="#2f4a2c" roughness={0.95} />
          </mesh>
          {/* A tree per planter, matching the light canopies in the renders */}
          <mesh position={[0, 2.6, 0]} castShadow>
            <cylinderGeometry args={[0.13, 0.2, 4.0, 6]} />
            <meshStandardMaterial color="#3a2e26" roughness={0.94} />
          </mesh>
          <mesh position={[0, 5.2, 0]} castShadow>
            <icosahedronGeometry args={[2.0, 1]} />
            <meshStandardMaterial color="#3f6b40" roughness={0.9} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Café seating with the red umbrellas the renders put along the frontages. */
function Terraces() {
  const m = useMaterials();

  const sets = useMemo(() => {
    const out: { x: number; z: number; rot: number }[] = [];
    for (const u of UNITS) {
      if (u.kind !== 'restaurant') continue;
      const f = frontOf(u);
      const n = 3;
      for (let i = 0; i < n; i++) {
        const t = (i - (n - 1) / 2) * 3.2;
        const sideways = u.facing === 'n' || u.facing === 's';
        out.push({
          x: f.x + (sideways ? t : (u.facing === 'e' ? 3.4 : -3.4)),
          z: f.z + (sideways ? (u.facing === 's' ? 3.4 : -3.4) : t),
          rot: i * 0.4,
        });
      }
    }
    return out;
  }, []);

  return (
    <group>
      {sets.map((s, i) => (
        <group key={i} position={[s.x, 0, s.z]} rotation={[0, s.rot, 0]}>
          <mesh position={[0, 0.74, 0]} material={m.steel} castShadow>
            <cylinderGeometry args={[0.55, 0.55, 0.07, 12]} />
          </mesh>
          <mesh position={[0, 0.37, 0]} material={m.steel}>
            <cylinderGeometry args={[0.07, 0.07, 0.74, 6]} />
          </mesh>
          {/* Umbrella */}
          <mesh position={[0, 1.55, 0]} material={m.steel}>
            <cylinderGeometry args={[0.05, 0.05, 2.3, 6]} />
          </mesh>
          <mesh position={[0, 2.5, 0]} castShadow>
            <coneGeometry args={[1.85, 0.62, 8]} />
            <meshStandardMaterial color="#9d3a2e" roughness={0.85} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** The square's lighting columns, on the piazza's paving grid. */
function PiazzaLights() {
  const m = useMaterials();

  const posts = useMemo(() => {
    const out: [number, number][] = [];
    const nx = 3;
    const nz = 5;
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < nz; j++) {
        out.push([
          PIAZZA.minX + ((i + 0.5) / nx) * (PIAZZA.maxX - PIAZZA.minX),
          PIAZZA.minZ + ((j + 0.5) / nz) * (PIAZZA.maxZ - PIAZZA.minZ),
        ]);
      }
    }
    return out;
  }, []);

  return (
    <group>
      {posts.map((p, i) => (
        <group key={i} position={[p[0], 0, p[1]]}>
          <mesh position={[0, 3.4, 0]} material={m.steel} castShadow>
            <cylinderGeometry args={[0.09, 0.15, 6.8, 8]} />
          </mesh>
          <mesh position={[0, 6.9, 0]} material={m.steel}>
            <boxGeometry args={[1.5, 0.16, 0.5]} />
          </mesh>
          <mesh position={[0, 6.78, 0]}>
            <boxGeometry args={[1.3, 0.07, 0.36]} />
            <meshBasicMaterial color="#ffe8c4" toneMapped={false} />
          </mesh>
          <pointLight position={[0, 6.4, 0]} color="#ffdfb0" intensity={26} distance={26} decay={2} />
        </group>
      ))}
    </group>
  );
}

/* -------------------------------------------------------------------------- */

export function Precinct() {
  return (
    <group>
      <Decks />
      <ParkingDeck />
      <Arcade />
      <Steps />
      <PiazzaLights />
      <Planters />
      <Terraces />

      {UNITS.map((u) => (
        <Tenancy key={u.tenant} unit={u} />
      ))}

      {OFFICE_BLOCKS.map((b) => (
        <OfficeBar key={b.id} {...b} />
      ))}
    </group>
  );
}
