'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

/**
 * The threshold, as a gate rather than a pair of doors.
 *
 * A stone arch, a brass ring turning inside it and a surface of moving light
 * across the opening. Hovering eases the camera forward and wakes the light;
 * committing drives the camera through and hands over to the world.
 */

const PORTAL_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Light on water, in polar coordinates: a few rotating bands of value noise
 * pulled toward the centre, brightened at the rim so the opening has an edge.
 */
const PORTAL_FRAG = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uOpen;
  uniform vec3 uCore;
  uniform vec3 uEdge;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.02;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 p = vUv - 0.5;
    float r = length(p) * 2.0;
    float a = atan(p.y, p.x);

    // Swirl: angle shifts with radius so the field turns as it falls inward.
    vec2 q = vec2(a / 3.14159 + uTime * 0.02, r * 1.6 - uTime * 0.12);
    float n = fbm(q * 3.0);
    n += fbm(q * 7.0 + 4.0) * 0.4;

    // A soft oval mask so the light does not reach the arch's stonework.
    float mask = smoothstep(1.0, 0.55, r);

    vec3 col = mix(uEdge, uCore, pow(n, 2.1));
    col += uCore * pow(max(1.0 - r, 0.0), 4.0) * (0.22 + uOpen * 0.85);

    float alpha = mask * (0.30 + uOpen * 0.55) * (0.30 + n * 0.7);
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  }
`;

function Portal({ open }: { open: React.RefObject<number> }) {
  const mat = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpen: { value: 0 },
      uCore: { value: new THREE.Color('#f0dcb4') },
      uEdge: { value: new THREE.Color('#33261a') },
    }),
    [],
  );

  useFrame((_, dt) => {
    if (!mat.current) return;
    uniforms.uTime.value += dt;
    uniforms.uOpen.value = THREE.MathUtils.damp(
      uniforms.uOpen.value,
      open.current ?? 0,
      3,
      Math.min(dt, 0.05),
    );
  });

  return (
    <mesh position={[0, 3.1, -0.15]}>
      <planeGeometry args={[5.6, 7.6, 1, 1]} />
      <shaderMaterial
        ref={mat}
        vertexShader={PORTAL_VERT}
        fragmentShader={PORTAL_FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}

/** The brass ring, and a counter-turning inner ring of markers. */
function Ring({ open }: { open: React.RefObject<number> }) {
  const outer = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);

  const marks = useMemo(() => Array.from({ length: 16 }, (_, i) => (i / 16) * Math.PI * 2), []);

  useFrame((_, dt) => {
    const o = open.current ?? 0;
    if (outer.current) outer.current.rotation.z += dt * (0.06 + o * 0.5);
    if (inner.current) inner.current.rotation.z -= dt * (0.09 + o * 0.7);
  });

  return (
    <group position={[0, 3.1, 0.05]}>
      <group ref={outer}>
        <mesh>
          <torusGeometry args={[2.62, 0.055, 10, 120]} />
          <meshStandardMaterial color="#c2a36b" roughness={0.28} metalness={1} emissive="#3a2f1c" />
        </mesh>
        {marks.map((a, i) => (
          <mesh key={i} position={[Math.cos(a) * 2.62, Math.sin(a) * 2.62, 0]} rotation={[0, 0, a]}>
            <boxGeometry args={[0.16, 0.03, 0.06]} />
            <meshStandardMaterial color="#e3cd9a" roughness={0.3} metalness={1} />
          </mesh>
        ))}
      </group>

      <group ref={inner}>
        <mesh>
          <torusGeometry args={[2.3, 0.02, 8, 100]} />
          <meshBasicMaterial color="#e8d3a4" transparent opacity={0.5} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

/** Stone arch: two jambs, a voussoir ring and a plinth. */
function Arch() {
  const stone = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#232128',
        roughness: 0.92,
        metalness: 0.05,
      }),
    [],
  );

  const voussoirs = useMemo(
    () => Array.from({ length: 19 }, (_, i) => Math.PI * (i / 18)),
    [],
  );

  return (
    <group>
      {/* Jambs */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 3.05, 2.4, 0]} material={stone} castShadow>
          <boxGeometry args={[0.9, 4.8, 1.1]} />
        </mesh>
      ))}

      {/* Arch ring, laid as individual stones */}
      {voussoirs.map((a, i) => (
        <mesh
          key={i}
          position={[Math.cos(a) * 3.05, 4.8 + Math.sin(a) * 3.05, 0]}
          rotation={[0, 0, a - Math.PI / 2]}
          material={stone}
          castShadow
        >
          <boxGeometry args={[0.56, 0.9, 1.1]} />
        </mesh>
      ))}

      {/* Plinth */}
      <mesh position={[0, 0.16, 0]} material={stone} receiveShadow>
        <boxGeometry args={[8.4, 0.32, 2.4]} />
      </mesh>
      <mesh position={[0, 0.33, 1.22]}>
        <boxGeometry args={[8.6, 0.02, 0.02]} />
        <meshBasicMaterial color="#c2a36b" transparent opacity={0.8} toneMapped={false} />
      </mesh>

      {/* Brass inlay up the jambs */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 3.05, 2.4, 0.57]}>
          <boxGeometry args={[0.07, 4.2, 0.02]} />
          <meshBasicMaterial color="#c2a36b" toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/** Motes rising through the opening. */
function Motes({ open }: { open: React.RefObject<number> }) {
  const ref = useRef<THREE.Points>(null);
  const COUNT = 110;

  const geometry = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const seed = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 1] = Math.random() * 7;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 1.6;
      seed[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    return g;
  }, []);

  useFrame((_, dt) => {
    const g = ref.current?.geometry as THREE.BufferGeometry | undefined;
    if (!g) return;
    const pos = g.getAttribute('position') as THREE.BufferAttribute;
    const rise = dt * (0.22 + (open.current ?? 0) * 0.9);
    for (let i = 0; i < COUNT; i++) {
      let y = pos.getY(i) + rise;
      if (y > 7) y = 0;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        size={0.05}
        color="#f2e2bd"
        transparent
        opacity={0.75}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/** Slow dolly toward the arch; commit drives the camera through it. */
function Rig({
  open,
  entering,
}: {
  open: React.RefObject<number>;
  entering: React.RefObject<boolean>;
}) {
  const z = useRef(13);
  const drift = useRef(0);

  useFrame(({ camera, pointer }, dt) => {
    const d = Math.min(dt, 0.05);
    const target = entering.current ? -2.5 : (open.current ?? 0) > 0.5 ? 9.6 : 13;
    z.current = THREE.MathUtils.damp(z.current, target, entering.current ? 2.4 : 1.6, d);

    drift.current += d * 0.22;
    camera.position.set(
      pointer.x * 0.5,
      3.1 + Math.sin(drift.current) * 0.06 + pointer.y * 0.25,
      z.current,
    );
    camera.lookAt(0, 3.1, 0);
  });

  return null;
}

export default function DoorCanvas({
  open,
  entering,
  active,
}: {
  open: React.RefObject<number>;
  entering: React.RefObject<boolean>;
  /** Paused while the section is off screen. */
  active: boolean;
}) {
  return (
    <Canvas
      className="pointer-events-none"
      frameloop={active ? 'always' : 'never'}
      dpr={[1, 1.6]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 3.1, 13], fov: 38, near: 0.1, far: 80 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.95;
      }}
    >
      <ambientLight intensity={0.22} color="#6d7590" />
      <directionalLight position={[5, 9, 7]} intensity={0.38} color="#e8c79c" />
      <pointLight position={[0, 3.1, 1.4]} intensity={16} distance={14} decay={2} color="#7fc6dc" />

      <Arch />
      <Portal open={open} />
      <Ring open={open} />
      <Motes open={open} />
      <Rig open={open} entering={entering} />

      <EffectComposer multisampling={2}>
        <Bloom
          intensity={1.1}
          luminanceThreshold={0.22}
          luminanceSmoothing={0.4}
          mipmapBlur
          radius={0.8}
          resolutionScale={0.5}
        />
        <Vignette offset={0.2} darkness={0.75} eskil={false} />
      </EffectComposer>
    </Canvas>
  );
}
