'use client';

import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import {
  ARCADE,
  ARCADE_COLUMNS,
  BENCHES,
  CAFE_SETS,
  OFFICE_BLOCKS,
  OFFICE_LEVEL,
  PIAZZA,
  PIAZZA_LAMPS,
  PLANTERS,
  SERVICE_YARD,
  UNITS,
  shellHeight,
  type Unit,
} from './parkSquare';
import {
  CAMPUS,
  CAMPUS_TERRACE,
  DECK,
  DECK_TERRACE,
  EDGES,
  RETAIL,
  RETAIL_TERRACE,
  SLOPES,
  heightAt,
  type Slope,
} from './terrain';
import { glowTexture, signTexture } from './textures';

/**
 * Park Square, built.
 *
 * The palette is the building's own — off-white and board-marked concrete,
 * clear glass, galvanised steel and dark shopfront bands. Only the signage and
 * the marker light carry our world's brass, which is what keeps it recognisably
 * Park Square and recognisably ours at once.
 */

const O = new THREE.Object3D();

/**
 * One set of materials for the whole precinct.
 *
 * This was a `useMemo` inside the hook, which means per *component instance* —
 * twenty-three tenancies each building their own ten materials, so two hundred
 * odd programs where ten would do, and no chance of the renderer batching
 * anything. Nothing here is mutated per instance, so they are shared.
 */
let MATERIALS: ReturnType<typeof buildMaterials> | null = null;

function buildMaterials() {
  {
    const concrete = new THREE.MeshStandardMaterial({ color: '#b9b4ab', roughness: 0.92, metalness: 0.02 });
    const concreteDark = new THREE.MeshStandardMaterial({ color: '#8d887f', roughness: 0.95, metalness: 0.02 });
    const soffit = new THREE.MeshStandardMaterial({
      color: '#1c1d21', roughness: 0.85, metalness: 0.35, side: THREE.DoubleSide,
    });
    const glass = new THREE.MeshStandardMaterial({
      color: '#243036', roughness: 0.08, metalness: 0.9, transparent: true, opacity: 0.72,
    });
    const shopfront = new THREE.MeshStandardMaterial({ color: '#14151a', roughness: 0.55, metalness: 0.3 });
    /** Galvanised steel: the stairs, the handrails, the balustrade posts. */
    const metal = new THREE.MeshStandardMaterial({ color: '#8f949c', roughness: 0.34, metalness: 0.95 });
    const metalDark = new THREE.MeshStandardMaterial({ color: '#3a3e45', roughness: 0.45, metalness: 0.85 });
    const paving = new THREE.MeshStandardMaterial({ color: '#9c968c', roughness: 0.94, metalness: 0.02 });
    const paving2 = new THREE.MeshStandardMaterial({ color: '#7d766d', roughness: 0.94, metalness: 0.02 });
    const timber = new THREE.MeshStandardMaterial({ color: '#6b4c31', roughness: 0.88, metalness: 0.03 });
    return { concrete, concreteDark, soffit, glass, shopfront, metal, metalDark, paving, paving2, timber };
  }
}

function useMaterials() {
  if (!MATERIALS) MATERIALS = buildMaterials();
  return MATERIALS;
}

/** One glow sprite, shared by every light pool in the precinct. */
let GLOW: THREE.Texture | null = null;

function useGlow() {
  if (!GLOW) GLOW = glowTexture();
  return GLOW;
}

/* -------------------------------------------------------------------------- */
/* Levels                                                                      */
/* -------------------------------------------------------------------------- */

/** The podium and the campus terrace. The deck gets its own treatment below. */
function Terraces() {
  const m = useMaterials();

  const slabs = [
    { t: RETAIL_TERRACE, mat: m.paving2, thick: RETAIL },
    { t: CAMPUS_TERRACE, mat: m.paving, thick: CAMPUS - DECK },
  ];

  return (
    <group>
      {slabs.map(({ t, mat, thick }, i) => {
        const w = t.maxX - t.minX;
        const d = t.maxZ - t.minZ;
        const cx = (t.minX + t.maxX) / 2;
        const cz = (t.minZ + t.maxZ) / 2;
        return (
          <group key={i}>
            {/* The mass the level stands on */}
            <mesh position={[cx, t.y - thick / 2, cz]} material={m.concreteDark} receiveShadow>
              <boxGeometry args={[w, thick, d]} />
            </mesh>
            {/* Its paved top */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, t.y + 0.01, cz]} material={mat} receiveShadow>
              <planeGeometry args={[w, d]} />
            </mesh>
            {/* The projecting slab edge that reads the level change from below */}
            <mesh position={[cx, t.y - 0.34, cz]} material={m.concrete} castShadow>
              <boxGeometry args={[w + 1.4, 0.6, d + 1.4]} />
            </mesh>
          </group>
        );
      })}

      {/* The piazza's own paving, over the deck. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[
          (DECK_TERRACE.minX + DECK_TERRACE.maxX) / 2,
          DECK + 0.01,
          (DECK_TERRACE.minZ + DECK_TERRACE.maxZ) / 2,
        ]}
        material={m.paving}
        receiveShadow
      >
        <planeGeometry args={[DECK_TERRACE.maxX - DECK_TERRACE.minX, DECK_TERRACE.maxZ - DECK_TERRACE.minZ]} />
      </mesh>

      {/* Banded paving inlay down the piazza */}
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[
            (PIAZZA.minX + PIAZZA.maxX) / 2,
            DECK + 0.03,
            PIAZZA.minZ + ((i + 0.5) / 10) * (PIAZZA.maxZ - PIAZZA.minZ),
          ]}
          material={m.paving2}
        >
          <planeGeometry args={[PIAZZA.maxX - PIAZZA.minX, 0.8]} />
        </mesh>
      ))}

      {/* Service yard tarmac, at podium level */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[SERVICE_YARD.x, RETAIL + 0.02, SERVICE_YARD.z]}
        material={m.paving2}
        receiveShadow
      >
        <planeGeometry args={[SERVICE_YARD.w, SERVICE_YARD.d]} />
      </mesh>
    </group>
  );
}

/**
 * The parking the piazza stands on.
 *
 * Open at street level behind a colonnade, solid above it, with the deck slab
 * projecting over the whole thing — which is how the west side of the precinct
 * reads from Centenary Boulevard.
 */
const OPEN = 3.4;

function Undercroft() {
  const m = useMaterials();
  const columns = useRef<THREE.InstancedMesh>(null);

  const d = DECK_TERRACE;
  const w = d.maxX - d.minX;
  const depth = d.maxZ - d.minZ;
  const cx = (d.minX + d.maxX) / 2;
  const cz = (d.minZ + d.maxZ) / 2;

  /** The perimeter colonnade, plus a grid of them inside for the parking bays. */
  const posts = useMemo(() => {
    const out: [number, number][] = [];
    for (let x = d.minX + 4; x <= d.maxX - 4; x += 7.8) {
      out.push([x, d.minZ + 0.9], [x, d.maxZ - 0.9]);
    }
    for (let z = d.minZ + 8; z <= d.maxZ - 8; z += 7.8) {
      out.push([d.minX + 0.9, z], [d.maxX - 0.9, z]);
    }
    for (let x = d.minX + 12; x < d.maxX - 10; x += 15.6) {
      for (let z = d.minZ + 12; z < d.maxZ - 10; z += 17) out.push([x, z]);
    }
    return out;
  }, [d.maxX, d.maxZ, d.minX, d.minZ]);

  useLayoutEffect(() => {
    posts.forEach((p, i) => {
      O.position.set(p[0], OPEN / 2, p[1]);
      O.rotation.set(0, 0, 0);
      O.scale.set(1, 1, 1);
      O.updateMatrix();
      columns.current?.setMatrixAt(i, O.matrix);
    });
    if (columns.current) columns.current.instanceMatrix.needsUpdate = true;
  }, [posts]);

  return (
    <group>
      {/* The dark interior you see between the columns */}
      <mesh position={[cx, OPEN / 2, cz]}>
        <boxGeometry args={[w - 2, OPEN, depth - 2]} />
        <meshStandardMaterial color="#14161a" roughness={0.98} />
      </mesh>

      <instancedMesh
        ref={columns}
        args={[undefined, undefined, Math.max(1, posts.length)]}
        material={m.concreteDark}
        castShadow
      >
        <boxGeometry args={[0.8, OPEN, 0.8]} />
      </instancedMesh>

      {/* The solid upper storey of the parking, and the deck slab over it */}
      <mesh position={[cx, (OPEN + DECK - 0.9) / 2, cz]} material={m.concrete} receiveShadow castShadow>
        <boxGeometry args={[w, DECK - 0.9 - OPEN, depth]} />
      </mesh>
      <mesh position={[cx, DECK - 0.45, cz]} material={m.concreteDark} castShadow>
        <boxGeometry args={[w + 1.4, 0.9, depth + 1.4]} />
      </mesh>

      {/* Ventilation slots along the exposed south and west faces */}
      {Array.from({ length: 24 }).map((_, i) => (
        <mesh
          key={`s${i}`}
          position={[d.minX + ((i + 0.5) / 24) * w, DECK - 2.4, d.maxZ + 0.05]}
          material={m.metalDark}
        >
          <boxGeometry args={[w / 34, 1.9, 0.2]} />
        </mesh>
      ))}
      {Array.from({ length: 16 }).map((_, i) => (
        <mesh
          key={`w${i}`}
          position={[d.minX - 0.05, DECK - 2.4, d.minZ + ((i + 0.5) / 16) * depth]}
          rotation={[0, Math.PI / 2, 0]}
          material={m.metalDark}
        >
          <boxGeometry args={[depth / 24, 1.9, 0.2]} />
        </mesh>
      ))}

      {/* Sodium light spilling out from under the deck */}
      <pointLight position={[cx, OPEN - 0.8, cz]} color="#ffcf8a" intensity={30} distance={70} decay={2} />
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* Stairs and ramps                                                            */
/* -------------------------------------------------------------------------- */

/**
 * A flight built on a slope in the height field.
 *
 * Concrete flights are cast treads on a solid skirt. Steel flights are what
 * Park Square uses where it meets the street: open treads on a pair of inclined
 * stringers, with tubular handrails and posts.
 */
function Flight({ slope }: { slope: Slope }) {
  const m = useMaterials();

  const alongX = slope.axis === 'x';
  const run = alongX ? slope.maxX - slope.minX : slope.maxZ - slope.minZ;
  const width = alongX ? slope.maxZ - slope.minZ : slope.maxX - slope.minX;
  const rise = slope.to - slope.from;
  const cx = (slope.minX + slope.maxX) / 2;
  const cy = (slope.from + slope.to) / 2;
  const cz = (slope.minZ + slope.maxZ) / 2;
  const low = Math.min(slope.from, slope.to);

  /** The rake, and the two rotations that lay something along it. */
  const angle = Math.atan2(rise, run);
  const slant = run / Math.cos(angle);
  // A box's own axes follow the slope.
  const tilt: [number, number, number] = alongX ? [0, 0, angle] : [-angle, 0, 0];
  // A cylinder stands on +Y, so it is turned down onto the slope first.
  const rail: [number, number, number] = alongX
    ? [0, 0, Math.PI / 2 + angle]
    : [Math.PI / 2 - angle, 0, 0];

  /**
   * Down the slope's own normal.
   *
   * Everything structural under a flight has to hang off the raked surface,
   * not off the world axes. A plain axis-aligned box under a flight has its
   * top at the flight's *highest* point along its whole length, which is three
   * metres of solid concrete standing through the treads at the bottom — and
   * wading through that is exactly what it looks like from inside.
   */
  const under = (d: number): [number, number, number] =>
    alongX
      ? [cx + Math.sin(angle) * d, cy - Math.cos(angle) * d, cz]
      : [cx, cy - Math.cos(angle) * d, cz - Math.sin(angle) * d];

  /** A point `t` of the way up the flight, offset sideways by `s` half-widths. */
  const at = (t: number, s = 0, lift = 0): [number, number, number] =>
    alongX
      ? [slope.minX + t * run, slope.from + rise * t + lift, cz + s * (width / 2)]
      : [cx + s * (width / 2), slope.from + rise * t + lift, slope.minZ + t * run];

  const side = (s: number, lift = 0): [number, number, number] =>
    alongX ? [cx, cy + lift, cz + s * (width / 2)] : [cx + s * (width / 2), cy + lift, cz];

  /** Handrail on its posts, `s` half-widths across the flight. */
  const Handrail = ({ s, posts = 6 }: { s: number; posts?: number }) => (
    <group>
      <mesh position={side(s, 1.05)} rotation={rail} material={m.metal}>
        <cylinderGeometry args={[0.05, 0.05, slant, 8]} />
      </mesh>
      {Array.from({ length: posts }).map((_, i) => (
        <mesh key={i} position={at((i + 0.5) / posts, s, 0.55)} material={m.metal}>
          <cylinderGeometry args={[0.035, 0.035, 1.1, 6]} />
        </mesh>
      ))}
    </group>
  );

  if (slope.kind === 'ramp') {
    return (
      <group>
        <mesh position={[cx, cy, cz]} rotation={tilt} material={m.paving} receiveShadow>
          <boxGeometry args={alongX ? [slant, 0.4, width] : [width, 0.4, slant]} />
        </mesh>
        {/* A kerb and a handrail down each side */}
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh position={side(s * 0.96, 0.22)} rotation={tilt} material={m.concrete} castShadow>
              <boxGeometry args={alongX ? [slant, 0.32, 0.5] : [0.5, 0.32, slant]} />
            </mesh>
            <Handrail s={s * 0.9} />
          </group>
        ))}
      </group>
    );
  }

  const treads = Math.max(3, Math.round(Math.abs(rise) / 0.19));
  const TREAD = 0.16;

  /** A balustrade every so often across a wide flight, plus one down the middle. */
  const rails: number[] = width > 26 ? [-1, -0.5, 0, 0.5, 1] : width > 12 ? [-1, 0, 1] : [-1, 1];

  return (
    <group>
      {/* Treads. Their tops sit on the walking surface, not their centres. */}
      {Array.from({ length: treads }).map((_, i) => (
        <mesh
          key={i}
          position={at((i + 0.5) / treads, 0, -TREAD / 2)}
          material={slope.steel ? m.metal : m.paving}
          receiveShadow
          castShadow
        >
          <boxGeometry
            args={
              alongX
                ? [run / treads + 0.04, TREAD, width]
                : [width, TREAD, run / treads + 0.04]
            }
          />
        </mesh>
      ))}

      {slope.steel ? (
        <>
          {/* Inclined stringers carrying the open risers */}
          {[-1, 1].map((s) => (
            <mesh
              key={s}
              position={side(s * 1.02, -0.38)}
              rotation={tilt}
              material={m.metalDark}
              castShadow
            >
              <boxGeometry args={alongX ? [slant, 0.45, 0.16] : [0.16, 0.45, slant]} />
            </mesh>
          ))}

          {[-1, 1].map((s) => (
            <Handrail key={s} s={s} />
          ))}

          {/* Landings top and bottom, where the flight meets the paving */}
          {[0, 1].map((e) => (
            <mesh key={e} position={at(e, 0, -0.2)} material={m.metalDark}>
              <boxGeometry args={alongX ? [1.6, 0.24, width + 0.5] : [width + 0.5, 0.24, 1.6]} />
            </mesh>
          ))}
        </>
      ) : (
        <>
          {/* The raking soffit: a slab that follows the flight rather than
              boxing it, so nothing stands proud of the treads. */}
          <mesh position={under(0.55)} rotation={tilt} material={m.concreteDark} receiveShadow>
            <boxGeometry args={alongX ? [slant, 0.9, width] : [width, 0.9, slant]} />
          </mesh>
          {/* and the wall closing it off at the foot */}
          <mesh
            position={
              alongX
                ? [rise < 0 ? slope.maxX - 0.5 : slope.minX + 0.5, low / 2, cz]
                : [cx, low / 2, rise < 0 ? slope.maxZ - 0.5 : slope.minZ + 0.5]
            }
            material={m.concreteDark}
          >
            <boxGeometry args={alongX ? [1, low, width] : [width, low, 1]} />
          </mesh>

          {/* Cheek walls */}
          {[-1, 1].map((s) => (
            <mesh key={s} position={side(s * 1.02, -0.1)} rotation={tilt} material={m.concrete} castShadow>
              <boxGeometry args={alongX ? [slant, 0.9, 0.7] : [0.7, 0.9, slant]} />
            </mesh>
          ))}

          {/* Balustrades. A flight this wide reads as a cliff without them, and
              the one down the centre is what makes it a staircase rather than
              a ramp with lines on it. */}
          {rails.map((s) => (
            <group key={s}>
              {s !== 0 || (
                <mesh position={side(0, -0.25)} rotation={tilt} material={m.concrete} castShadow>
                  <boxGeometry args={alongX ? [slant, 0.5, 1.1] : [1.1, 0.5, slant]} />
                </mesh>
              )}
              <Handrail s={s} posts={Math.max(6, Math.round(run / 3))} />
            </group>
          ))}
        </>
      )}
    </group>
  );
}

/**
 * The glazed lift shaft in the circulation block's face.
 *
 * You cannot ride it — the precinct is one walkable surface — but a centre
 * without one reads as a model rather than a building, and a car moving behind
 * the glass is what tells you at a glance that these are two separate levels.
 */
function LiftShaft({ height }: { height: number }) {
  const m = useMaterials();
  const car = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!car.current) return;
    // A slow shuttle with a pause at each end.
    const t = (clock.elapsedTime % 22) / 22;
    const k = t < 0.5
      ? Math.min(1, Math.max(0, (t - 0.08) * 2.6))
      : Math.min(1, Math.max(0, (0.92 - t) * 2.6));
    car.current.position.y = 1.5 + k * (height - 4.2);
  });

  return (
    <group position={[5.6, 0, 0]}>
      <mesh position={[0, height / 2, 0.3]} material={m.glass}>
        <boxGeometry args={[3.2, height - 0.6, 0.5]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 1.7, height / 2, 0.36]} material={m.metalDark} castShadow>
          <boxGeometry args={[0.22, height, 0.62]} />
        </mesh>
      ))}
      <mesh ref={car} position={[0, 1.5, 0.34]} material={m.metalDark}>
        <boxGeometry args={[2.5, 2.4, 0.5]} />
      </mesh>
      <mesh position={[0, 1.5, 0.52]}>
        <boxGeometry args={[2.1, 1.9, 0.06]} />
        <meshBasicMaterial color="#ffe8c4" toneMapped={false} transparent opacity={0.85} />
      </mesh>
    </group>
  );
}

/** Balustrades along every edge where the ground drops. */
function Balustrades() {
  const m = useMaterials();
  const posts = useRef<THREE.InstancedMesh>(null);

  const postList = useMemo(() => {
    const out: [number, number, number][] = [];
    for (const e of EDGES) {
      const w = e.maxX - e.minX;
      const d = e.maxZ - e.minZ;
      const alongX = w > d;
      const n = Math.max(2, Math.round((alongX ? w : d) / 2.4));
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n;
        out.push([
          alongX ? e.minX + t * w : (e.minX + e.maxX) / 2,
          e.baseY,
          alongX ? (e.minZ + e.maxZ) / 2 : e.minZ + t * d,
        ]);
      }
    }
    return out;
  }, []);

  useLayoutEffect(() => {
    postList.forEach((p, i) => {
      O.position.set(p[0], p[1] + 0.55, p[2]);
      O.rotation.set(0, 0, 0);
      O.scale.set(1, 1, 1);
      O.updateMatrix();
      posts.current?.setMatrixAt(i, O.matrix);
    });
    if (posts.current) posts.current.instanceMatrix.needsUpdate = true;
  }, [postList]);

  return (
    <group>
      {/* Glass panels along each run */}
      {EDGES.map((e, i) => {
        const w = e.maxX - e.minX;
        const d = e.maxZ - e.minZ;
        const alongX = w > d;
        return (
          <group key={i}>
            <mesh
              position={[(e.minX + e.maxX) / 2, e.baseY + 0.55, (e.minZ + e.maxZ) / 2]}
              material={m.glass}
            >
              <boxGeometry args={alongX ? [w, 1.0, 0.06] : [0.06, 1.0, d]} />
            </mesh>
            {/* Capping rail */}
            <mesh
              position={[(e.minX + e.maxX) / 2, e.baseY + 1.1, (e.minZ + e.maxZ) / 2]}
              rotation={alongX ? [0, 0, Math.PI / 2] : [Math.PI / 2, 0, 0]}
              material={m.metal}
            >
              <cylinderGeometry args={[0.05, 0.05, alongX ? w : d, 8]} />
            </mesh>
          </group>
        );
      })}

      <instancedMesh ref={posts} args={[undefined, undefined, Math.max(1, postList.length)]} material={m.metal}>
        <cylinderGeometry args={[0.035, 0.035, 1.1, 6]} />
      </instancedMesh>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* The arcade                                                                  */
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
  const base = RETAIL;

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    lights.current.forEach((l, i) => {
      if (!l) return;
      const mat = l.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.75 + Math.sin(t * 0.6 + i * 0.4) * 0.1;
    });
  });

  return (
    <group position={[0, base, ARCADE.z]}>
      {/* Splayed columns: an A-frame pair per bay, leaning into the walkway */}
      {ARCADE_COLUMNS.map((cx, i) => {
        const x = cx - 0;
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

      <mesh position={[(ARCADE.minX + ARCADE.maxX) / 2, ARCADE.height, 0]} material={m.soffit}>
        <boxGeometry args={[span, 0.5, ARCADE.width + 3.4]} />
      </mesh>

      {Array.from({ length: bays * 2 }).map((_, i) => (
        <mesh
          key={i}
          position={[ARCADE.minX + ((i + 0.5) / (bays * 2)) * span, ARCADE.height - 0.5, 0]}
          material={m.metalDark}
        >
          <boxGeometry args={[0.16, 0.5, ARCADE.width + 3.0]} />
        </mesh>
      ))}

      {Array.from({ length: bays * 2 }).map((_, i) => {
        const x = ARCADE.minX + (i / (bays * 2 - 1)) * span;
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
        <mesh key={s} position={[(ARCADE.minX + ARCADE.maxX) / 2, ARCADE.height - 0.62, s * (half - 0.4)]}>
          <cylinderGeometry args={[0.055, 0.055, span, 6]} />
          <meshStandardMaterial color="#8e2b22" roughness={0.6} metalness={0.4} />
        </mesh>
      ))}

      {/* First-floor gallery each side, with a glass balustrade */}
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

      <pointLight position={[ARCADE.minX + span * 0.25, 5, 0]} color="#ffe6bd" intensity={40} distance={44} decay={2} />
      <pointLight position={[ARCADE.minX + span * 0.72, 5, 0]} color="#ffe6bd" intensity={40} distance={44} decay={2} />
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* Tenancies                                                                   */
/* -------------------------------------------------------------------------- */

function frontOf(u: Unit): { x: number; z: number; rot: number } {
  switch (u.facing) {
    case 'n': return { x: u.x, z: u.z - u.d / 2, rot: Math.PI };
    case 's': return { x: u.x, z: u.z + u.d / 2, rot: 0 };
    case 'e': return { x: u.x + u.w / 2, z: u.z, rot: Math.PI / 2 };
    default: return { x: u.x - u.w / 2, z: u.z, rot: -Math.PI / 2 };
  }
}

function Tenancy({ unit }: { unit: Unit }) {
  const m = useMaterials();
  const spill = useGlow();
  const front = frontOf(unit);
  const tall = shellHeight(unit.kind);
  const frontWidth = unit.facing === 'n' || unit.facing === 's' ? unit.w : unit.d;
  const base = heightAt(unit.x, unit.z);

  const sign = useMemo(
    () => signTexture(unit.label, unit.tenant, unit.accent, 1024),
    [unit.label, unit.tenant, unit.accent],
  );

  return (
    <group position={[unit.x, base, unit.z]} rotation={[0, unit.rotY ?? 0, 0]}>
      <mesh position={[0, tall / 2, 0]} material={m.concrete} castShadow receiveShadow>
        <boxGeometry args={[unit.w, tall, unit.d]} />
      </mesh>

      <mesh position={[0, tall + 0.3, 0]} material={m.concreteDark} castShadow>
        <boxGeometry args={[unit.w + 0.5, 0.6, unit.d + 0.5]} />
      </mesh>

      {unit.blank ? (
        // Back-of-house: a banded concrete face with a roller shutter, which is
        // what the service end of a centre actually presents.
        <group position={[front.x - unit.x, 0, front.z - unit.z]} rotation={[0, front.rot, 0]}>
          {[1.2, 2.6, 4.0].map((y) => (
            <mesh key={y} position={[0, y, 0.09]} material={m.concreteDark}>
              <boxGeometry args={[frontWidth * 0.99, 0.12, 0.18]} />
            </mesh>
          ))}
          <mesh position={[0, 2.1, 0.12]} material={m.metalDark}>
            <boxGeometry args={[Math.min(7, frontWidth * 0.4), 4.2, 0.2]} />
          </mesh>
          {unit.lift && <LiftShaft height={tall} />}
        </group>
      ) : (
      <group position={[front.x - unit.x, 0, front.z - unit.z]} rotation={[0, front.rot, 0]}>
        {/* Lit interior behind the glass. A dark shopfront reads as a boarded
            unit, and a whole run of them reads as a model of a centre rather
            than a centre. */}
        <mesh position={[0, 2.6, -1.6]}>
          <planeGeometry args={[frontWidth * 0.94, 4.0]} />
          <meshBasicMaterial color={unit.accent} toneMapped={false} transparent opacity={0.16} />
        </mesh>
        <mesh position={[0, 2.6, -1.55]}>
          <planeGeometry args={[frontWidth * 0.8, 3.2]} />
          <meshBasicMaterial color="#ffeccd" toneMapped={false} transparent opacity={0.1} />
        </mesh>
        {/* Ceiling wash inside the unit */}
        <mesh position={[0, 4.35, -1.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[frontWidth * 0.9, 3.0]} />
          <meshBasicMaterial color="#fff2da" toneMapped={false} transparent opacity={0.22} />
        </mesh>

        <mesh position={[0, 2.3, 0.06]} material={m.glass}>
          <planeGeometry args={[frontWidth * 0.94, 4.2]} />
        </mesh>

        {/* Stallriser: shopfront glass stops short of the paving */}
        <mesh position={[0, 0.3, 0.1]} material={m.shopfront}>
          <boxGeometry args={[frontWidth * 0.96, 0.6, 0.18]} />
        </mesh>

        {Array.from({ length: Math.max(3, Math.round(frontWidth / 2.1)) }).map((_, i, arr) => (
          <mesh
            key={i}
            position={[(i / (arr.length - 1) - 0.5) * frontWidth * 0.94, 2.3, 0.1]}
            material={m.shopfront}
          >
            <boxGeometry args={[0.1, 4.2, 0.12]} />
          </mesh>
        ))}

        {/* Dark fascia band carrying the name */}
        <mesh position={[0, 4.85, 0.12]} material={m.shopfront}>
          <boxGeometry args={[frontWidth * 0.98, 1.05, 0.22]} />
        </mesh>
        <mesh position={[0, 4.85, 0.25]}>
          <planeGeometry args={[frontWidth * 0.78, (frontWidth * 0.78) / 4]} />
          <meshBasicMaterial map={sign} transparent depthWrite={false} toneMapped={false} />
        </mesh>

        {/* Entrance canopy */}
        <mesh position={[0, 4.1, 1.5]} material={m.metalDark} castShadow>
          <boxGeometry args={[frontWidth * 0.5, 0.12, 3.0]} />
        </mesh>

        {/* The pool of light a lit shopfront throws onto the paving.
            This used to be two point lights per unit, which meant fifty of
            them in the precinct — and a forward renderer costs every one of
            those on every fragment of every standard material in range. The
            look is the same; the frame is not. */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 2.6]}>
          <planeGeometry args={[frontWidth * 0.98, 5.4]} />
          <meshBasicMaterial
            map={spill}
            color="#ffdcae"
            transparent
            opacity={0.5}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      </group>
      )}
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* Office bars                                                                 */
/* -------------------------------------------------------------------------- */

function OfficeBar({
  x, z, w, d, levels, base,
}: {
  x: number; z: number; w: number; d: number; levels: number; base: number;
}) {
  const m = useMaterials();
  const fins = useRef<THREE.InstancedMesh>(null);
  const ground = heightAt(x, z);

  const finList = useMemo(() => {
    const out: { x: number; y: number; z: number }[] = [];
    const step = 1.35;
    for (let l = 0; l < levels; l++) {
      const y = base + l * OFFICE_LEVEL + OFFICE_LEVEL / 2;
      for (let i = 0; i * step < w; i++) {
        const px = -w / 2 + i * step + step / 2;
        out.push({ x: px, y, z: d / 2 + 0.28 });
        out.push({ x: px, y, z: -d / 2 - 0.28 });
      }
    }
    return out;
  }, [w, d, levels, base]);

  useLayoutEffect(() => {
    finList.forEach((f, i) => {
      O.position.set(f.x, f.y, f.z);
      O.rotation.set(0, 0, 0);
      O.scale.set(1, 1, 1);
      O.updateMatrix();
      fins.current?.setMatrixAt(i, O.matrix);
    });
    if (fins.current) fins.current.instanceMatrix.needsUpdate = true;
  }, [finList]);

  return (
    <group position={[x, ground, z]}>
      {Array.from({ length: levels }).map((_, l) => (
        <group key={l} position={[0, base + l * OFFICE_LEVEL, 0]}>
          <mesh position={[0, OFFICE_LEVEL / 2, 0]} material={m.glass}>
            <boxGeometry args={[w - 0.4, OFFICE_LEVEL - 0.55, d - 0.4]} />
          </mesh>
          <mesh position={[0, OFFICE_LEVEL - 0.28, 0]} material={m.concrete} castShadow receiveShadow>
            <boxGeometry args={[w + 1.5, 0.55, d + 1.5]} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[0, OFFICE_LEVEL + 0.55, s * (d / 2 + 0.7)]} material={m.glass}>
              <boxGeometry args={[w + 1.4, 1.05, 0.06]} />
            </mesh>
          ))}
        </group>
      ))}

      <instancedMesh
        ref={fins}
        args={[undefined, undefined, Math.max(1, finList.length)]}
        material={m.concrete}
        castShadow
      >
        <boxGeometry args={[0.16, OFFICE_LEVEL - 0.6, 0.42]} />
      </instancedMesh>

      <mesh position={[w * 0.18, base + levels * OFFICE_LEVEL + 1.1, 0]} material={m.concreteDark} castShadow>
        <boxGeometry args={[w * 0.3, 2.2, d * 0.42]} />
      </mesh>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* Furniture                                                                   */
/* -------------------------------------------------------------------------- */

/** Timber-and-steel benches, set out along the piazza's paving bands. */
function Benches() {
  const m = useMaterials();

  return (
    <group>
      {BENCHES.map((s, i) => (
        <group key={i} position={[s.x, heightAt(s.x, s.z), s.z]} rotation={[0, s.rotY, 0]}>
          {/* Slatted seat */}
          {[-0.22, 0, 0.22].map((o) => (
            <mesh key={o} position={[0, 0.45, o]} material={m.timber} castShadow>
              <boxGeometry args={[2.2, 0.07, 0.17]} />
            </mesh>
          ))}
          {/* Back */}
          {[0.62, 0.8].map((h) => (
            <mesh key={h} position={[0, h, -0.3]} rotation={[-0.18, 0, 0]} material={m.timber} castShadow>
              <boxGeometry args={[2.2, 0.07, 0.17]} />
            </mesh>
          ))}
          {/* Steel legs */}
          {[-0.9, 0.9].map((o) => (
            <group key={o}>
              <mesh position={[o, 0.22, 0]} material={m.metalDark}>
                <boxGeometry args={[0.07, 0.45, 0.6]} />
              </mesh>
              <mesh position={[o, 0.66, -0.31]} rotation={[-0.18, 0, 0]} material={m.metalDark}>
                <boxGeometry args={[0.07, 0.44, 0.06]} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

function Planters() {
  const m = useMaterials();

  return (
    <group>
      {PLANTERS.map((p, i) => {
        const y = heightAt(p.x, p.z);
        return (
          <group key={i} position={[p.x, y, p.z]}>
            <mesh position={[0, 0.34, 0]} material={m.concrete} castShadow receiveShadow>
              <boxGeometry args={[p.w, 0.68, p.d]} />
            </mesh>
            {/* Timber capping, so the planters double as seating */}
            <mesh position={[0, 0.72, 0]} material={m.timber}>
              <boxGeometry args={[p.w + 0.12, 0.09, p.d + 0.12]} />
            </mesh>
            <mesh position={[0, 0.74, 0]}>
              <boxGeometry args={[p.w - 0.7, 0.1, p.d - 0.7]} />
              <meshStandardMaterial color="#2f4a2c" roughness={0.95} />
            </mesh>
            <mesh position={[0, 2.8, 0]} castShadow>
              <cylinderGeometry args={[0.13, 0.2, 4.2, 6]} />
              <meshStandardMaterial color="#3a2e26" roughness={0.94} />
            </mesh>
            <mesh position={[0, 5.4, 0]} castShadow>
              <icosahedronGeometry args={[2.0, 1]} />
              <meshStandardMaterial color="#3f6b40" roughness={0.9} flatShading />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function PiazzaLights() {
  const m = useMaterials();
  const pool = useGlow();

  return (
    <group>
      {PIAZZA_LAMPS.map((p, i) => (
        <group key={i} position={[p[0], heightAt(p[0], p[1]), p[1]]}>
          <mesh position={[0, 3.4, 0]} material={m.metalDark} castShadow>
            <cylinderGeometry args={[0.09, 0.15, 6.8, 8]} />
          </mesh>
          {[-1, 1].map((s) => (
            <group key={s}>
              <mesh position={[s * 0.75, 6.9, 0]} material={m.metalDark}>
                <boxGeometry args={[1.5, 0.16, 0.5]} />
              </mesh>
              <mesh position={[s * 0.75, 6.78, 0]}>
                <boxGeometry args={[1.3, 0.07, 0.36]} />
                <meshBasicMaterial color="#ffe8c4" toneMapped={false} />
              </mesh>
            </group>
          ))}
          {/* The lamp's own pool, drawn rather than lit. */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
            <planeGeometry args={[13, 13]} />
            <meshBasicMaterial
              map={pool}
              color="#ffdfb0"
              transparent
              opacity={0.42}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Café seating with the red umbrellas the renders put along the frontages. */
function CafeTerraces() {
  const m = useMaterials();

  return (
    <group>
      {CAFE_SETS.map((s, i) => (
        <group key={i} position={[s.x, heightAt(s.x, s.z), s.z]} rotation={[0, s.rotY, 0]}>
          <mesh position={[0, 0.74, 0]} material={m.metalDark} castShadow>
            <cylinderGeometry args={[0.55, 0.55, 0.07, 12]} />
          </mesh>
          <mesh position={[0, 0.37, 0]} material={m.metalDark}>
            <cylinderGeometry args={[0.07, 0.07, 0.74, 6]} />
          </mesh>
          {/* Two chairs */}
          {[-1, 1].map((c) => (
            <group key={c} position={[c * 1.0, 0, 0]}>
              <mesh position={[0, 0.44, 0]} material={m.metalDark}>
                <boxGeometry args={[0.44, 0.06, 0.44]} />
              </mesh>
              <mesh position={[c * 0.2, 0.7, 0]} material={m.metalDark}>
                <boxGeometry args={[0.06, 0.46, 0.44]} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, 1.55, 0]} material={m.metalDark}>
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

/** Bollards and bins along the podium frontage. */
function StreetFurniture() {
  const m = useMaterials();
  const bollards = useRef<THREE.InstancedMesh>(null);

  const spots = useMemo(() => {
    const out: [number, number][] = [];
    const r = RETAIL_TERRACE;
    for (let z = r.minZ + 6; z < r.maxZ - 4; z += 6) out.push([r.maxX - 2.2, z]);
    for (let x = r.minX + 6; x < r.maxX - 4; x += 6) out.push([x, r.maxZ - 2.2]);
    return out;
  }, []);

  useLayoutEffect(() => {
    spots.forEach((p, i) => {
      O.position.set(p[0], heightAt(p[0], p[1]) + 0.55, p[1]);
      O.rotation.set(0, 0, 0);
      O.scale.set(1, 1, 1);
      O.updateMatrix();
      bollards.current?.setMatrixAt(i, O.matrix);
    });
    if (bollards.current) bollards.current.instanceMatrix.needsUpdate = true;
  }, [spots]);

  return (
    <instancedMesh ref={bollards} args={[undefined, undefined, Math.max(1, spots.length)]} material={m.metal}>
      <cylinderGeometry args={[0.12, 0.15, 1.1, 8]} />
    </instancedMesh>
  );
}

/* -------------------------------------------------------------------------- */

export function Precinct() {
  return (
    <group>
      <Terraces />
      <Undercroft />
      {SLOPES.map((s, i) => (
        <Flight key={i} slope={s} />
      ))}
      <Balustrades />
      <Arcade />
      <PiazzaLights />
      <Planters />
      <Benches />
      <CafeTerraces />
      <StreetFurniture />

      {UNITS.map((u) => (
        <Tenancy key={u.tenant} unit={u} />
      ))}

      {OFFICE_BLOCKS.map((b) => (
        <OfficeBar key={b.id} {...b} />
      ))}
    </group>
  );
}
