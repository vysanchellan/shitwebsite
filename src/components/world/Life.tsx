'use client';

import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { glowTexture } from './textures';

const TMP = new THREE.Object3D();

/* -------------------------------------------------------------------------- */
/* Holograms                                                                   */
/* -------------------------------------------------------------------------- */

/** A beating heart over the Cardiac Institute. */
export function HeartHologram({ position }: { position: [number, number, number] }) {
  const group = useRef<THREE.Group>(null);
  const beat = useRef(0);

  useFrame((_, dt) => {
    beat.current += dt;
    // Two-stage beat: a strong systole followed by a smaller second thump.
    const t = beat.current % 1.15;
    const pulse =
      Math.exp(-t * 9) * 0.22 + Math.exp(-Math.max(0, t - 0.26) * 11) * 0.12;
    if (group.current) {
      group.current.scale.setScalar(1 + pulse);
      group.current.rotation.y += dt * 0.32;
    }
  });

  return (
    <group position={position}>
      <group ref={group}>
        {/* Two lobes and an apex read as a heart at this scale. */}
        {[-1, 1].map((sx) => (
          <mesh key={sx} position={[sx * 1.05, 1.1, 0]}>
            <sphereGeometry args={[1.35, 18, 14]} />
            <meshBasicMaterial color="#ff6a55" wireframe transparent opacity={0.55} toneMapped={false} />
          </mesh>
        ))}
        <mesh position={[0, -0.6, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[2.05, 3.2, 20, 1, true]} />
          <meshBasicMaterial color="#ff6a55" wireframe transparent opacity={0.5} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[1.5, 16, 12]} />
          <meshBasicMaterial color="#ff8d7c" transparent opacity={0.1} toneMapped={false} />
        </mesh>
      </group>
      <pointLight color="#ff6a55" intensity={26} distance={30} decay={2} />
    </group>
  );
}

/** A slowly rotating glucose-ring schematic over the Metabolic Lab. */
export function MoleculeHologram({ position }: { position: [number, number, number] }) {
  const group = useRef<THREE.Group>(null);

  const ring = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return [Math.cos(a) * 1.9, 0, Math.sin(a) * 1.9] as [number, number, number];
      }),
    [],
  );

  useFrame((_, dt) => {
    if (group.current) {
      group.current.rotation.y += dt * 0.5;
      group.current.rotation.x = Math.sin(performance.now() * 0.0004) * 0.22;
    }
  });

  return (
    <group position={position}>
      <group ref={group}>
        {ring.map((p, i) => (
          <mesh key={i} position={p}>
            <icosahedronGeometry args={[0.42, 0]} />
            <meshBasicMaterial color={i % 3 === 0 ? '#d8b878' : '#1fb8a6'} toneMapped={false} />
          </mesh>
        ))}
        {ring.map((p, i) => {
          const next = ring[(i + 1) % ring.length];
          const mid = new THREE.Vector3(...p).add(new THREE.Vector3(...next)).multiplyScalar(0.5);
          const len = new THREE.Vector3(...p).distanceTo(new THREE.Vector3(...next));
          const angle = Math.atan2(next[2] - p[2], next[0] - p[0]);
          return (
            <mesh key={`b-${i}`} position={mid.toArray()} rotation={[0, -angle, Math.PI / 2]}>
              <cylinderGeometry args={[0.055, 0.055, len, 6]} />
              <meshBasicMaterial color="#1fb8a6" transparent opacity={0.75} toneMapped={false} />
            </mesh>
          );
        })}
        <mesh>
          <torusGeometry args={[2.9, 0.03, 6, 48]} />
          <meshBasicMaterial color="#d8b878" transparent opacity={0.5} toneMapped={false} />
        </mesh>
      </group>
      <pointLight color="#1fb8a6" intensity={22} distance={28} decay={2} />
    </group>
  );
}

/** A double helix — the district's landmark, visible from the boulevard. */
export function Helix({ position }: { position: [number, number, number] }) {
  const group = useRef<THREE.Group>(null);
  const RUNGS = 26;

  const data = useMemo(
    () =>
      Array.from({ length: RUNGS }, (_, i) => {
        const t = i / RUNGS;
        const a = t * Math.PI * 4;
        return { y: t * 16, a };
      }),
    [],
  );

  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.28;
  });

  return (
    <group position={position}>
      <group ref={group}>
        {data.map((d, i) => (
          <group key={i} position={[0, d.y, 0]} rotation={[0, d.a, 0]}>
            <mesh position={[1.5, 0, 0]}>
              <sphereGeometry args={[0.2, 10, 8]} />
              <meshBasicMaterial color="#d8b878" toneMapped={false} />
            </mesh>
            <mesh position={[-1.5, 0, 0]}>
              <sphereGeometry args={[0.2, 10, 8]} />
              <meshBasicMaterial color="#9a7cff" toneMapped={false} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.035, 0.035, 3, 5]} />
              <meshBasicMaterial
                color={i % 2 ? '#b08d4e' : '#1fb8a6'}
                transparent
                opacity={0.6}
                toneMapped={false}
              />
            </mesh>
          </group>
        ))}
      </group>
      <pointLight position={[0, 8, 0]} color="#d8b878" intensity={20} distance={26} decay={2} />
    </group>
  );
}

/** Arches over Journey Boulevard, each carrying a travelling pulse. */
export function PulseArches() {
  const zs = useMemo(() => [56, 44, 34, 24, 14, 4, -6], []);
  const dots = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    dots.current.forEach((d, i) => {
      if (!d) return;
      const k = ((t * 0.42 + i * 0.16) % 1) * Math.PI;
      d.position.x = Math.cos(k) * 9.4;
      d.position.y = 1 + Math.sin(k) * 9;
    });
  });

  return (
    <group>
      {zs.map((z, i) => (
        <group key={z} position={[0, 0, z]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 1, 0]}>
            <torusGeometry args={[9.4, 0.09, 6, 40, Math.PI]} />
            <meshBasicMaterial color="#b08d4e" transparent opacity={0.45} toneMapped={false} />
          </mesh>
          <mesh
            ref={(el) => {
              dots.current[i] = el;
            }}
          >
            <sphereGeometry args={[0.2, 10, 8]} />
            <meshBasicMaterial color="#f0dcb0" toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* Life: drones and pedestrians                                                */
/* -------------------------------------------------------------------------- */

/** Medical courier drones on lazy elliptical patrols. */
export function Drones({ count = 7 }: { count?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const glow = useMemo(() => glowTexture(), []);
  const sprites = useRef<THREE.Group>(null);

  const paths = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        cx: (i % 3) * 34 - 34,
        cz: -20 + ((i * 37) % 80),
        rx: 20 + (i % 4) * 8,
        rz: 14 + (i % 3) * 9,
        y: 17 + (i % 5) * 4,
        speed: 0.09 + (i % 4) * 0.025,
        phase: i * 1.3,
      })),
    [count],
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    paths.forEach((p, i) => {
      const a = t * p.speed + p.phase;
      const x = p.cx + Math.cos(a) * p.rx;
      const z = p.cz + Math.sin(a) * p.rz;
      const y = p.y + Math.sin(t * 0.6 + i) * 0.8;

      TMP.position.set(x, y, z);
      TMP.rotation.set(0, -a + Math.PI / 2, Math.sin(a * 2) * 0.12);
      TMP.scale.setScalar(1);
      TMP.updateMatrix();
      mesh.current?.setMatrixAt(i, TMP.matrix);

      const sprite = sprites.current?.children[i];
      if (sprite) sprite.position.set(x, y - 0.35, z);
    });
    if (mesh.current) mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
        <boxGeometry args={[1.5, 0.28, 0.7]} />
        <meshStandardMaterial
          color="#0e1c30"
          roughness={0.4}
          metalness={0.8}
          emissive="#d8b878"
          emissiveIntensity={0.5}
        />
      </instancedMesh>

      <group ref={sprites}>
        {Array.from({ length: count }, (_, i) => (
          <sprite key={i} scale={[3.4, 3.4, 1]}>
            <spriteMaterial
              map={glow}
              color={i % 2 ? '#d8b878' : '#ff9d6b'}
              transparent
              opacity={0.55}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </sprite>
        ))}
      </group>
    </group>
  );
}

/** Pedestrians walking fixed routes — the district should not feel abandoned. */
export function Pedestrians({ count = 16 }: { count?: number }) {
  const bodies = useRef<THREE.InstancedMesh>(null);
  const heads = useRef<THREE.InstancedMesh>(null);

  const routes = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const lane = i % 4;
        const side = i % 2 === 0 ? -1 : 1;
        if (lane === 0) return { ax: side * 6.5, az: 66, bx: side * 6.5, bz: -4, speed: 1.2 + (i % 3) * 0.35 };
        if (lane === 1) return { ax: side * 6.5, az: -30, bx: side * 6.5, bz: -72, speed: 1.1 + (i % 4) * 0.3 };
        if (lane === 2) return { ax: -30, az: side * 5 + 2, bx: 30, bz: side * 5 + 2, speed: 1.35 + (i % 2) * 0.4 };
        return { ax: -46, az: 40 + side * 6, bx: -32, bz: 54 + side * 6, speed: 0.95 + (i % 3) * 0.3 };
      }),
    [count],
  );

  const colors = useMemo(() => {
    const c = new THREE.Color();
    const list: THREE.Color[] = [];
    for (let i = 0; i < count; i++) {
      c.setHSL(0.55 + ((i * 0.13) % 0.3), 0.25, 0.42 + ((i * 0.07) % 0.25));
      list.push(c.clone());
    }
    return list;
  }, [count]);

  useLayoutEffect(() => {
    colors.forEach((c, i) => {
      bodies.current?.setColorAt(i, c);
      heads.current?.setColorAt(i, c);
    });
    if (bodies.current?.instanceColor) bodies.current.instanceColor.needsUpdate = true;
    if (heads.current?.instanceColor) heads.current.instanceColor.needsUpdate = true;
  }, [colors]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    routes.forEach((r, i) => {
      const len = Math.hypot(r.bx - r.ax, r.bz - r.az);
      // Ping-pong along the route.
      const k = ((t * r.speed + i * 11) % (len * 2)) / len;
      const u = k <= 1 ? k : 2 - k;
      const x = r.ax + (r.bx - r.ax) * u;
      const z = r.az + (r.bz - r.az) * u;
      const dir = Math.atan2(
        (r.bx - r.ax) * (k <= 1 ? 1 : -1),
        (r.bz - r.az) * (k <= 1 ? 1 : -1),
      );
      const bob = Math.abs(Math.sin(t * r.speed * 3.4 + i)) * 0.07;

      TMP.position.set(x, 0.92 + bob, z);
      TMP.rotation.set(0, dir, 0);
      TMP.scale.set(1, 1, 1);
      TMP.updateMatrix();
      bodies.current?.setMatrixAt(i, TMP.matrix);

      TMP.position.set(x, 1.62 + bob, z);
      TMP.updateMatrix();
      heads.current?.setMatrixAt(i, TMP.matrix);
    });
    if (bodies.current) bodies.current.instanceMatrix.needsUpdate = true;
    if (heads.current) heads.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={bodies} args={[undefined, undefined, count]} castShadow frustumCulled={false}>
        <capsuleGeometry args={[0.23, 0.72, 4, 8]} />
        <meshStandardMaterial roughness={0.7} metalness={0.12} />
      </instancedMesh>
      <instancedMesh ref={heads} args={[undefined, undefined, count]} castShadow frustumCulled={false}>
        <sphereGeometry args={[0.19, 12, 10]} />
        <meshStandardMaterial roughness={0.6} metalness={0.15} />
      </instancedMesh>
    </group>
  );
}

/** Slow motes of light, the way humid dusk air looks under street lighting. */
export function Motes({ count = 500 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 150;
      pos[i * 3 + 1] = Math.random() * 26 + 1;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 190 - 10;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, [count]);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = Math.sin(clock.elapsedTime * 0.1) * 1.2;
      ref.current.rotation.y = clock.elapsedTime * 0.006;
    }
  });

  return (
    <points ref={ref} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        size={0.14}
        color="#f0dcb0"
        transparent
        opacity={0.42}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
