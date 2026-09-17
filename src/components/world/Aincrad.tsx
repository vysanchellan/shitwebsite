'use client';

import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { NODES } from '@/data/content';
import { ACCENT_HEX } from './accents';
import { ARCADE as ARC } from './parkSquare';
import { glowTexture } from './textures';

/**
 * The layer that makes the district a floating world rather than a city block.
 *
 * Islands hanging over the skyline, blossom drifting down through the streets,
 * rune circles turning under the landmarks and banners moving on the towers.
 * Everything here is decorative: nothing in this file collides, and nothing in
 * it carries information the player needs.
 */

const O = new THREE.Object3D();

function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* -------------------------------------------------------------------------- */
/* Floating islands                                                            */
/* -------------------------------------------------------------------------- */

type Island = {
  pos: [number, number, number];
  radius: number;
  depth: number;
  rot: number;
  bob: number;
  spin: number;
};

/**
 * Each island is a wide disc of rock with a tapered underside and a lawn on
 * top. They drift and turn on their own slow cycles so the sky is never still.
 */
export function FloatingIslands({ count = 9 }: { count?: number }) {
  const group = useRef<THREE.Group>(null);
  const refs = useRef<(THREE.Group | null)[]>([]);

  const islands = useMemo<Island[]>(() => {
    const r = seeded(771123);
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + r() * 0.6;
      const dist = 150 + r() * 190;
      return {
        pos: [Math.cos(angle) * dist, 78 + r() * 92, Math.sin(angle) * dist - 30],
        radius: 26 + r() * 48,
        depth: 18 + r() * 34,
        rot: r() * Math.PI * 2,
        bob: 0.25 + r() * 0.4,
        spin: (r() - 0.5) * 0.012,
      };
    });
  }, [count]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    islands.forEach((isl, i) => {
      const g = refs.current[i];
      if (!g) return;
      g.position.y = isl.pos[1] + Math.sin(t * 0.09 + i * 1.7) * isl.bob * 4;
      g.rotation.y = isl.rot + t * isl.spin;
    });
  });

  return (
    <group ref={group}>
      {islands.map((isl, i) => (
        <group
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          position={isl.pos}
        >
          {/* Rock mass, widest at the rim and tapering to a point below */}
          <mesh>
            <cylinderGeometry args={[isl.radius, isl.radius * 0.72, 5, 9, 1]} />
            <meshStandardMaterial color="#6b5a6e" roughness={0.95} metalness={0.04} flatShading />
          </mesh>
          <mesh position={[0, -isl.depth / 2 - 2.5, 0]}>
            <coneGeometry args={[isl.radius * 0.72, isl.depth, 9]} />
            <meshStandardMaterial color="#4d4056" roughness={0.98} metalness={0.03} flatShading />
          </mesh>

          {/* Lawn */}
          <mesh position={[0, 2.6, 0]}>
            <cylinderGeometry args={[isl.radius * 0.98, isl.radius * 0.98, 0.9, 9]} />
            <meshStandardMaterial color="#4e8757" roughness={0.95} metalness={0} flatShading />
          </mesh>

          {/* A spire or two, so the silhouette has something vertical in it */}
          {[0.35, -0.5].map((o, k) => (
            <mesh key={k} position={[isl.radius * o * 0.6, 9 + k * 3, isl.radius * o * 0.35]}>
              <coneGeometry args={[2.4 - k * 0.6, 13 + k * 5, 6]} />
              <meshStandardMaterial color="#7d6d84" roughness={0.9} metalness={0.1} flatShading />
            </mesh>
          ))}

          {/* Light spilling from the underside, the way Aincrad's tiers do */}
          <pointLight
            position={[0, -isl.depth * 0.4, 0]}
            color="#c9a468"
            intensity={46}
            distance={isl.radius * 2.6}
            decay={2}
          />
        </group>
      ))}
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* Blossom                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Petals falling through the walked area.
 *
 * One instanced mesh, each petal on its own slow spiral, recycled to the top
 * when it lands. Confined to the district core so the effect is dense where the
 * player actually is rather than spread thinly over the whole map.
 */
export function Blossom({ count = 420 }: { count?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);

  const petals = useMemo(() => {
    const r = seeded(5150);
    return Array.from({ length: count }, () => ({
      x: (r() - 0.5) * 190,
      z: (r() - 0.5) * 150,
      y: r() * 34,
      fall: 0.55 + r() * 0.85,
      sway: 0.5 + r() * 1.6,
      phase: r() * Math.PI * 2,
      spin: (r() - 0.5) * 2.4,
      size: 0.1 + r() * 0.1,
    }));
  }, [count]);

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const c = new THREE.Color();
    petals.forEach((_, i) => {
      // Two pinks and the occasional white, as a real tree would drop.
      const tone = (i % 7) / 7;
      c.setHSL(0.94 + tone * 0.03, 0.42 - tone * 0.2, 0.78 + tone * 0.14);
      m.setColorAt(i, c);
    });
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [petals]);

  useFrame(({ clock }) => {
    const m = mesh.current;
    if (!m) return;
    const t = clock.elapsedTime;

    for (let i = 0; i < petals.length; i++) {
      const p = petals[i];
      p.y -= p.fall * 0.06;
      if (p.y < 0) p.y = 34;

      const sway = Math.sin(t * 0.7 + p.phase) * p.sway;
      O.position.set(p.x + sway, p.y, p.z + Math.cos(t * 0.5 + p.phase) * p.sway * 0.6);
      O.rotation.set(t * p.spin * 0.6 + p.phase, t * p.spin + p.phase, p.phase);
      O.scale.setScalar(p.size);
      O.updateMatrix();
      m.setMatrixAt(i, O.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      {/* A flat, slightly irregular quad reads as a petal once it is tumbling */}
      <circleGeometry args={[1, 5]} />
      <meshBasicMaterial side={THREE.DoubleSide} transparent opacity={0.92} toneMapped={false} />
    </instancedMesh>
  );
}

/** Blossom trees for the park: dark trunks under clouds of pale canopy. */
export function BlossomTrees({
  spots,
}: {
  spots: { pos: [number, number]; scale: number; rot: number }[];
}) {
  const trunks = useRef<THREE.InstancedMesh>(null);
  const canopy = useRef<THREE.InstancedMesh>(null);
  const canopy2 = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const c = new THREE.Color();
    spots.forEach((s, i) => {
      O.position.set(s.pos[0], 1.9 * s.scale, s.pos[1]);
      O.rotation.set(0, s.rot, 0);
      O.scale.setScalar(s.scale);
      O.updateMatrix();
      trunks.current?.setMatrixAt(i, O.matrix);

      O.position.set(s.pos[0], 4.6 * s.scale, s.pos[1]);
      O.scale.set(s.scale * 1.5, s.scale * 1.1, s.scale * 1.5);
      O.updateMatrix();
      canopy.current?.setMatrixAt(i, O.matrix);
      c.setHSL(0.95, 0.34, 0.76 + ((i * 0.13) % 0.12));
      canopy.current?.setColorAt(i, c);

      O.position.set(s.pos[0] + s.scale * 0.9, 6.0 * s.scale, s.pos[1] - s.scale * 0.6);
      O.scale.set(s.scale * 1.0, s.scale * 0.8, s.scale * 1.0);
      O.updateMatrix();
      canopy2.current?.setMatrixAt(i, O.matrix);
      c.setHSL(0.955, 0.3, 0.8);
      canopy2.current?.setColorAt(i, c);
    });
    for (const m of [trunks, canopy, canopy2]) {
      if (!m.current) continue;
      m.current.instanceMatrix.needsUpdate = true;
      if (m.current.instanceColor) m.current.instanceColor.needsUpdate = true;
    }
  }, [spots]);

  return (
    <group>
      <instancedMesh ref={trunks} args={[undefined, undefined, spots.length]} castShadow>
        <cylinderGeometry args={[0.18, 0.3, 3.8, 6]} />
        <meshStandardMaterial color="#2a1e1f" roughness={0.94} metalness={0.02} />
      </instancedMesh>

      <instancedMesh ref={canopy} args={[undefined, undefined, spots.length]} castShadow>
        <icosahedronGeometry args={[2.1, 1]} />
        <meshStandardMaterial roughness={0.9} metalness={0} flatShading />
      </instancedMesh>

      <instancedMesh ref={canopy2} args={[undefined, undefined, spots.length]} castShadow>
        <icosahedronGeometry args={[1.5, 1]} />
        <meshStandardMaterial roughness={0.9} metalness={0} flatShading />
      </instancedMesh>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* Rune circles                                                                */
/* -------------------------------------------------------------------------- */

/**
 * A slowly turning sigil laid into the ground. Two counter-rotating rings of
 * tick marks with a fixed outline, which is enough to read as a ward without
 * any glyph artwork.
 */
export function RuneCircle({
  position,
  radius = 8,
  color = '#d8b878',
  speed = 0.08,
  ticks = 24,
}: {
  position: [number, number, number];
  radius?: number;
  color?: string;
  speed?: number;
  ticks?: number;
}) {
  const outer = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const pulse = useRef<THREE.Mesh>(null);

  const angles = useMemo(
    () => Array.from({ length: ticks }, (_, i) => (i / ticks) * Math.PI * 2),
    [ticks],
  );

  useFrame(({ clock }, dt) => {
    if (outer.current) outer.current.rotation.z += dt * speed;
    if (inner.current) inner.current.rotation.z -= dt * speed * 1.7;
    if (pulse.current) {
      const m = pulse.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.018 + (Math.sin(clock.elapsedTime * 0.8) * 0.5 + 0.5) * 0.03;
    }
  });

  return (
    <group position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh ref={pulse}>
        <circleGeometry args={[radius, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.03} depthWrite={false} toneMapped={false} />
      </mesh>

      <mesh>
        <ringGeometry args={[radius * 0.985, radius, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.38} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh>
        <ringGeometry args={[radius * 0.62, radius * 0.628, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.28} depthWrite={false} toneMapped={false} />
      </mesh>

      <group ref={outer}>
        {angles.map((a, i) => (
          <mesh
            key={i}
            position={[Math.cos(a) * radius * 0.8, Math.sin(a) * radius * 0.8, 0]}
            rotation={[0, 0, a]}
          >
            <planeGeometry args={[radius * 0.1, i % 3 === 0 ? 0.3 : 0.14]} />
            <meshBasicMaterial color={color} transparent opacity={0.42} depthWrite={false} toneMapped={false} />
          </mesh>
        ))}
      </group>

      <group ref={inner}>
        {angles.slice(0, 8).map((a, i) => (
          <mesh
            key={i}
            position={[Math.cos(a) * radius * 0.45, Math.sin(a) * radius * 0.45, 0]}
            rotation={[0, 0, a]}
          >
            <planeGeometry args={[radius * 0.16, 0.2]} />
            <meshBasicMaterial color={color} transparent opacity={0.32} depthWrite={false} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* Banners                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Hanging cloth with a travelling wave. The geometry is subdivided once on each
 * axis and the vertices are displaced per frame, which is cheaper than any
 * cloth solver and completely convincing at this distance.
 */
export function Banner({
  position,
  color,
  width = 2.2,
  height = 6,
  seed = 0,
}: {
  position: [number, number, number];
  color: string;
  width?: number;
  height?: number;
  seed?: number;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const base = useRef<Float32Array | null>(null);

  useFrame(({ clock }) => {
    const m = mesh.current;
    if (!m) return;
    const geo = m.geometry as THREE.PlaneGeometry;
    const pos = geo.getAttribute('position') as THREE.BufferAttribute;

    if (!base.current) base.current = Float32Array.from(pos.array as Float32Array);
    const src = base.current;
    const t = clock.elapsedTime;

    for (let i = 0; i < pos.count; i++) {
      const x = src[i * 3];
      const y = src[i * 3 + 1];
      // Amplitude grows toward the free bottom edge and away from the pole.
      const hang = (height / 2 - y) / height;
      const edge = (x + width / 2) / width;
      const amp = hang * 0.9 * (0.3 + edge);
      pos.setZ(i, Math.sin(t * 1.8 + x * 2.2 + y * 0.8 + seed) * amp * 0.34);
      pos.setX(i, x + Math.sin(t * 1.4 + y * 0.9 + seed) * amp * 0.06);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  });

  return (
    <group position={position}>
      {/* Pole */}
      <mesh position={[-width / 2 - 0.1, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.07, height + 0.8, 6]} />
        <meshStandardMaterial color="#5a4a35" roughness={0.6} metalness={0.5} />
      </mesh>

      <mesh ref={mesh} castShadow>
        <planeGeometry args={[width, height, 10, 14]} />
        <meshStandardMaterial
          color={color}
          roughness={0.85}
          metalness={0.05}
          side={THREE.DoubleSide}
          emissive={color}
          emissiveIntensity={0.18}
        />
      </mesh>

      {/* Trim */}
      <mesh position={[0, -height / 2 - 0.06, 0]}>
        <boxGeometry args={[width, 0.12, 0.04]} />
        <meshStandardMaterial color="#c2a36b" roughness={0.35} metalness={0.9} />
      </mesh>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* Lanterns and wildlife                                                       */
/* -------------------------------------------------------------------------- */

/** Paper lanterns strung above the boulevard, swinging out of phase. */
export function Lanterns() {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const glow = useMemo(() => glowTexture(), []);

  const lanterns = useMemo(() => {
    const out: { pos: [number, number, number]; phase: number; tint: string }[] = [];
    const r = seeded(30303);
    // Strung the length of the arcade, either side of the walkway.
    for (let x = ARC.minX + 4; x <= ARC.maxX - 4; x += 7) {
      for (const z of [ARC.z - 6.2, ARC.z + 6.2]) {
        out.push({
          pos: [x + (r() - 0.5) * 0.8, 9.2 + r() * 0.4, z],
          phase: r() * Math.PI * 2,
          tint: r() > 0.72 ? '#ffd9a0' : r() > 0.4 ? '#ffb27a' : '#f7e0b8',
        });
      }
    }
    return out;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    lanterns.forEach((l, i) => {
      const g = refs.current[i];
      if (!g) return;
      g.rotation.z = Math.sin(t * 0.8 + l.phase) * 0.12;
      g.rotation.x = Math.cos(t * 0.6 + l.phase) * 0.07;
    });
  });

  return (
    <group>
      {lanterns.map((l, i) => (
        <group
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          position={l.pos}
        >
          <mesh position={[0, -0.55, 0]}>
            <cylinderGeometry args={[0.26, 0.26, 0.5, 10]} />
            <meshStandardMaterial
              color={l.tint}
              emissive={l.tint}
              emissiveIntensity={2.4}
              roughness={0.8}
            />
          </mesh>
          <mesh position={[0, -0.25, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.4, 4]} />
            <meshStandardMaterial color="#2a2118" roughness={0.9} />
          </mesh>
          <sprite position={[0, -0.55, 0]} scale={[2.6, 2.6, 1]}>
            <spriteMaterial
              map={glow}
              color={l.tint}
              transparent
              opacity={0.34}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </sprite>
        </group>
      ))}
    </group>
  );
}

/** Birds wheeling over the district in loose flocks. */
export function Birds({ count = 26 }: { count?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);

  const flock = useMemo(() => {
    const r = seeded(8822);
    return Array.from({ length: count }, (_, i) => ({
      cx: (r() - 0.5) * 160,
      cz: (r() - 0.5) * 180 - 20,
      radius: 22 + r() * 46,
      y: 34 + r() * 40,
      speed: 0.12 + r() * 0.16,
      phase: (i / count) * Math.PI * 2 + r(),
      flap: 5 + r() * 4,
    }));
  }, [count]);

  useFrame(({ clock }) => {
    const m = mesh.current;
    if (!m) return;
    const t = clock.elapsedTime;

    flock.forEach((b, i) => {
      const a = t * b.speed + b.phase;
      O.position.set(
        b.cx + Math.cos(a) * b.radius,
        b.y + Math.sin(a * 2.1) * 2.4,
        b.cz + Math.sin(a) * b.radius,
      );
      O.rotation.set(Math.sin(t * b.flap + i) * 0.5, -a + Math.PI / 2, Math.sin(a) * 0.3);
      O.scale.setScalar(1);
      O.updateMatrix();
      m.setMatrixAt(i, O.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      <coneGeometry args={[0.45, 1.8, 3]} />
      <meshStandardMaterial color="#20222e" roughness={0.9} flatShading />
    </instancedMesh>
  );
}

/* -------------------------------------------------------------------------- */

/** Rune circles under the landmarks that anchor each district. */
const WARDS: { id: string; radius: number }[] = [
  { id: 'arrival', radius: 5 },
  { id: 'response', radius: 7.5 },
  { id: 'insurance', radius: 9 },
  { id: 'activation', radius: 7 },
  { id: 'clinician', radius: 5 },
  { id: 'security', radius: 5 },
  { id: 'heart-model', radius: 5 },
  { id: 'diabetes-model', radius: 5 },
];

export function Aincrad({ quality }: { quality: { petals: number; islands: number } }) {
  const wards = useMemo(
    () =>
      WARDS.map((w) => {
        const node = NODES.find((n) => n.id === w.id);
        return node ? { ...w, node } : null;
      }).filter(Boolean) as { id: string; radius: number; node: (typeof NODES)[number] }[],
    [],
  );

  return (
    <group>
      <FloatingIslands count={quality.islands} />
      <Blossom count={quality.petals} />
      <Lanterns />
      <Birds count={Math.round(quality.islands * 3)} />

      {wards.map((w) => (
        <RuneCircle
          key={w.id}
          position={[w.node.position[0], 0.05, w.node.position[2]]}
          radius={w.radius}
          color={ACCENT_HEX[w.node.accent]}
          speed={0.05 + (w.radius % 3) * 0.02}
        />
      ))}

      {/* Banners on the piazza's west colonnade */}
      {[-34, -12, 10, 32].map((z, i) => (
        <Banner
          key={z}
          position={[-70, 8.5, z]}
          color={i % 2 ? '#7a3b3b' : '#2f3b4a'}
          seed={i * 2}
        />
      ))}
    </group>
  );
}
