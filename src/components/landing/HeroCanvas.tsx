'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

/** One ECG period, sampled as (x, y) offsets. Baseline, P, QRS, T. */
const ECG_PERIOD: [number, number][] = [
  [0.0, 0.0],
  [0.06, 0.0],
  [0.1, 0.14],
  [0.14, 0.0],
  [0.24, 0.0],
  [0.28, -0.12],
  [0.31, 1.0],
  [0.34, -0.36],
  [0.38, 0.0],
  [0.5, 0.0],
  [0.58, 0.3],
  [0.66, 0.0],
  [0.85, 0.0],
  [1.0, 0.0],
];

function ecgPoints(periods: number, width: number, amp: number, depth: number) {
  const pts: THREE.Vector3[] = [];
  for (let p = 0; p < periods; p++) {
    for (const [t, v] of ECG_PERIOD) {
      const u = (p + t) / periods;
      pts.push(
        new THREE.Vector3(
          (u - 0.5) * width,
          v * amp,
          Math.sin(u * Math.PI * 2.2) * depth,
        ),
      );
    }
  }
  return pts;
}

/**
 * The hero's ECG ribbon: a tube swept along a cardiac trace, with a travelling
 * highlight that runs the length of it like a monitor sweep.
 */
function Ribbon({
  periods,
  width,
  amp,
  depth,
  radius,
  color,
  opacity,
  speed,
  offset,
}: {
  periods: number;
  width: number;
  amp: number;
  depth: number;
  radius: number;
  color: string;
  opacity: number;
  speed: number;
  offset: [number, number, number];
}) {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(ecgPoints(periods, width, amp, depth));
    return new THREE.TubeGeometry(curve, periods * 46, radius, 10, false);
  }, [periods, width, amp, depth, radius]);

  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const mesh = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * speed;
    if (mesh.current) {
      mesh.current.position.y = offset[1] + Math.sin(t * 0.6) * 0.12;
    }
    if (mat.current) {
      mat.current.opacity = opacity * (0.78 + Math.sin(t * 1.8) * 0.22);
    }
  });

  return (
    <mesh ref={mesh} geometry={geometry} position={offset}>
      <meshBasicMaterial
        ref={mat}
        color={color}
        transparent
        opacity={opacity}
        toneMapped={false}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

/** A slow drift of particles, denser near the trace. */
function Dust({ count = 900 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 34;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 16 - 3;
      scales[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    return g;
  }, [count]);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.elapsedTime * 0.014;
      ref.current.position.y = Math.sin(clock.elapsedTime * 0.2) * 0.4;
    }
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        size={0.035}
        color="#7fe4f0"
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/** Concentric rings — the “monitor” framing behind the trace. */
function Rings() {
  const group = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (group.current) {
      group.current.rotation.z = clock.elapsedTime * 0.035;
      group.current.rotation.x = Math.sin(clock.elapsedTime * 0.14) * 0.12;
    }
  });

  return (
    <group ref={group} position={[0, 0, -5]}>
      {[5.6, 7.4, 9.6].map((r, i) => (
        <mesh key={r} rotation={[0, 0, i * 0.5]}>
          <torusGeometry args={[r, 0.008, 6, 160]} />
          <meshBasicMaterial
            color={i === 1 ? '#2f6bff' : '#45d7e8'}
            transparent
            opacity={0.3 - i * 0.07}
            toneMapped={false}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Parallax: the whole rig leans a few degrees toward the pointer. */
function Rig({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const { viewport } = useThree();
  const target = useRef({ x: 0, y: 0 });

  useFrame(({ pointer }, delta) => {
    target.current.x += (pointer.x * 0.16 - target.current.x) * Math.min(1, delta * 2.4);
    target.current.y += (pointer.y * 0.1 - target.current.y) * Math.min(1, delta * 2.4);
    if (group.current) {
      group.current.rotation.y = target.current.x;
      group.current.rotation.x = -target.current.y;
    }
  });

  const scale = Math.min(1, Math.max(0.62, viewport.width / 16));

  return (
    <group ref={group} scale={scale}>
      {children}
    </group>
  );
}

export default function HeroCanvas() {
  return (
    <Canvas
      className="pointer-events-none"
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, 13], fov: 42 }}
    >
      <Rig>
        <Rings />
        <Dust />
        <Ribbon
          periods={4}
          width={22}
          amp={2.05}
          depth={0.9}
          radius={0.055}
          color="#45d7e8"
          opacity={0.95}
          speed={1}
          offset={[0, 0, 0]}
        />
        <Ribbon
          periods={4}
          width={22}
          amp={2.05}
          depth={0.9}
          radius={0.16}
          color="#45d7e8"
          opacity={0.16}
          speed={1}
          offset={[0, 0, -0.05]}
        />
        <Ribbon
          periods={3}
          width={26}
          amp={1.3}
          depth={1.6}
          radius={0.03}
          color="#2f6bff"
          opacity={0.5}
          speed={0.72}
          offset={[0, -2.6, -3]}
        />
        <Ribbon
          periods={5}
          width={30}
          amp={0.85}
          depth={2.2}
          radius={0.022}
          color="#1fb8a6"
          opacity={0.38}
          speed={0.5}
          offset={[0, 3.1, -4.5]}
        />
      </Rig>
    </Canvas>
  );
}
