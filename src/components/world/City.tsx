'use client';

import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import {
  GREENS,
  INSURER_SLOTS,
  LAMPS,
  PAVILION_COLUMNS,
  ROADS,
  STRUCTURES,
  TREES,
  type Structure,
} from './layout';
import { INSURERS } from '@/data/insurers';
import {
  glowTexture,
  groundTexture,
  insurerTexture,
  numeralTexture,
  roadTexture,
  signTexture,
  windowTexture,
} from './textures';

const UP = new THREE.Object3D();

/* -------------------------------------------------------------------------- */
/* Sky and ground                                                              */
/* -------------------------------------------------------------------------- */

const SKY_VERT = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * A late-evening sky over a floating city: indigo overhead, a long amber band
 * at the horizon where the sun is going down, and slow cloud sheets drawn with
 * value noise so the vault is never a flat gradient.
 */
const SKY_FRAG = /* glsl */ `
  varying vec3 vWorld;
  uniform float uTime;
  uniform vec3 uZenith;
  uniform vec3 uMid;
  uniform vec3 uHorizon;
  uniform vec3 uGround;
  uniform vec3 uSunDir;
  uniform vec3 uSun;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y);
  }

  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.05; a *= 0.5; }
    return v;
  }

  void main() {
    vec3 dir = normalize(vWorld);
    float h = dir.y;

    vec3 col = mix(uHorizon, uMid, smoothstep(0.0, 0.30, h));
    col = mix(col, uZenith, smoothstep(0.18, 0.78, h));
    col = mix(uGround, col, smoothstep(-0.12, 0.015, h));

    // The sun, low and large, with a wide falloff along the horizon band.
    float sd = max(dot(dir, normalize(uSunDir)), 0.0);
    col += uSun * pow(sd, 220.0) * 2.4;
    col += uSun * pow(sd, 7.0) * 0.5;
    col += uSun * pow(sd, 2.0) * 0.14;

    // Cloud sheets: flattened in y so they lie down like real stratus.
    vec2 cp = vec2(atan(dir.z, dir.x) * 1.6, h * 5.2);
    float cloud = fbm(cp * 1.5 + vec2(uTime * 0.006, 0.0));
    cloud = smoothstep(0.48, 0.92, cloud) * smoothstep(-0.02, 0.22, h) * smoothstep(0.85, 0.3, h);

    vec3 cloudLit = mix(vec3(0.16, 0.18, 0.28), uSun * 1.25, pow(sd, 1.6) * 0.8 + 0.18);
    col = mix(col, cloudLit, cloud * 0.72);

    gl_FragColor = vec4(col, 1.0);
  }
`;

function Sky() {
  const mat = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uZenith: { value: new THREE.Color('#121a38') },
      uMid: { value: new THREE.Color('#33507e') },
      uHorizon: { value: new THREE.Color('#c9764a') },
      uGround: { value: new THREE.Color('#0a0a12') },
      uSunDir: { value: new THREE.Vector3(-0.42, 0.055, -1).normalize() },
      uSun: { value: new THREE.Color('#ffb168') },
    }),
    [],
  );

  useFrame((_, dt) => {
    uniforms.uTime.value += dt;
  });

  return (
    <mesh scale={[-1, 1, 1]} frustumCulled={false}>
      <sphereGeometry args={[1200, 48, 32]} />
      <shaderMaterial
        ref={mat}
        vertexShader={SKY_VERT}
        fragmentShader={SKY_FRAG}
        uniforms={uniforms}
        side={THREE.BackSide}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

function Stars({ count = 900 }: { count?: number }) {
  const geometry = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const v = new THREE.Vector3()
        .setFromSphericalCoords(
          860,
          Math.acos(THREE.MathUtils.randFloat(0.05, 0.85)),
          Math.random() * Math.PI * 2,
        );
      pos.set([v.x, Math.abs(v.y) + 120, v.z], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, [count]);

  return (
    <points geometry={geometry} frustumCulled={false}>
      <pointsMaterial size={1.1} color="#cfe9ff" transparent opacity={0.6} depthWrite={false} />
    </points>
  );
}

function Ground() {
  const ground = useMemo(() => groundTexture(), []);
  const road = useMemo(() => roadTexture(), []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -24]} receiveShadow>
        <planeGeometry args={[1100, 1100]} />
        <meshStandardMaterial map={ground} roughness={0.78} metalness={0.22} color="#3a3038" />
      </mesh>

      {ROADS.map((r, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, r.size[0] > r.size[1] ? Math.PI / 2 : 0]}
          position={[r.pos[0], 0.015, r.pos[1]]}
          receiveShadow
        >
          <planeGeometry
            args={
              r.size[0] > r.size[1] ? [r.size[1], r.size[0]] : [r.size[0], r.size[1]]
            }
          />
          <meshStandardMaterial
            map={road}
            map-repeat={[1, (r.size[0] > r.size[1] ? r.size[0] : r.size[1]) / 14]}
            roughness={0.38}
            metalness={0.55}
            color="#5a4a52"
          />
        </mesh>
      ))}

      {GREENS.map((g, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[g.pos[0], 0.01, g.pos[1]]} receiveShadow>
          <planeGeometry args={[g.size[0], g.size[1]]} />
          <meshStandardMaterial color="#27502f" roughness={0.95} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* Shared building parts                                                       */
/* -------------------------------------------------------------------------- */

function Sign({
  title,
  sub,
  color,
  y,
  z,
  width = 12,
  rotY = 0,
}: {
  title: string;
  sub?: string;
  color: string;
  y: number;
  z: number;
  width?: number;
  rotY?: number;
}) {
  const tex = useMemo(() => signTexture(title, sub, color), [title, sub, color]);
  return (
    <mesh position={[0, y, z]} rotation={[0, rotY, 0]}>
      <planeGeometry args={[width, width / 4]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

function Glow({
  color,
  size,
  position,
  opacity = 0.7,
}: {
  color: string;
  size: number;
  position: [number, number, number];
  opacity?: number;
}) {
  const tex = useMemo(() => glowTexture(), []);
  return (
    <sprite position={position} scale={[size, size, 1]}>
      <spriteMaterial
        map={tex}
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </sprite>
  );
}

/* -------------------------------------------------------------------------- */
/* Structures                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * The two institutes. Massed properly — a glazed podium at street level, a
 * shaft with banded floor plates, a setback, a crown and roof plant — so they
 * read as architecture from the boulevard rather than as lit boxes.
 */
function Building({ s, seed }: { s: Structure; seed: number }) {
  const [w, h, d] = s.size;

  const podiumH = 6.5;
  const shaftH = h - podiumH - 5;
  const setbackW = w * 0.68;
  const setbackD = d * 0.68;

  const windows = useMemo(
    () => windowTexture(seed, Math.max(8, Math.round(w)), Math.max(14, Math.round(h)), s.accent),
    [seed, w, h, s.accent],
  );
  const podiumWindows = useMemo(
    () => windowTexture(seed + 5, Math.max(6, Math.round(w * 0.8)), 4, s.accent),
    [seed, w, s.accent],
  );

  // Floor plates every 3.4m up the shaft.
  const bands = Math.max(2, Math.floor(shaftH / 3.4));

  return (
    <group position={[s.pos[0], 0, s.pos[1]]} rotation={[0, s.rotY ?? 0, 0]}>
      {/* Podium */}
      <mesh position={[0, podiumH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w + 2.4, podiumH, d + 2.4]} />
        <meshStandardMaterial
          color="#0c1728"
          roughness={0.5}
          metalness={0.55}
          emissive="#ffffff"
          emissiveMap={podiumWindows}
          emissiveIntensity={1.5}
        />
      </mesh>

      {/* Entrance canopy */}
      <mesh position={[0, podiumH - 1.2, d / 2 + 2.8]} castShadow>
        <boxGeometry args={[w * 0.55, 0.5, 5.2]} />
        <meshStandardMaterial color="#0e1b2e" roughness={0.45} metalness={0.65} />
      </mesh>
      <mesh position={[0, podiumH - 1.5, d / 2 + 2.8]}>
        <boxGeometry args={[w * 0.55 + 0.25, 0.12, 5.4]} />
        <meshBasicMaterial color={s.accent} toneMapped={false} />
      </mesh>

      {/* Shaft */}
      <mesh position={[0, podiumH + shaftH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, shaftH, d]} />
        <meshStandardMaterial
          color="#0a1426"
          roughness={0.55}
          metalness={0.62}
          emissive="#ffffff"
          emissiveMap={windows}
          emissiveIntensity={1.3}
        />
      </mesh>

      {/* Floor plates */}
      {Array.from({ length: bands }).map((_, i) => (
        <mesh key={i} position={[0, podiumH + ((i + 1) * shaftH) / (bands + 1), 0]}>
          <boxGeometry args={[w + 0.3, 0.12, d + 0.3]} />
          <meshStandardMaterial color="#1a2942" roughness={0.6} metalness={0.5} />
        </mesh>
      ))}

      {/* Setback + crown */}
      <mesh position={[0, podiumH + shaftH + 2.5, 0]} castShadow>
        <boxGeometry args={[setbackW, 5, setbackD]} />
        <meshStandardMaterial color="#0b1526" roughness={0.5} metalness={0.7} />
      </mesh>
      <mesh position={[0, podiumH + shaftH + 5.2, 0]}>
        <boxGeometry args={[setbackW + 0.5, 0.4, setbackD + 0.5]} />
        <meshBasicMaterial color={s.accent} toneMapped={false} />
      </mesh>

      {/* Roof plant and mast */}
      <mesh position={[setbackW * 0.2, podiumH + shaftH + 6.3, 0]} castShadow>
        <boxGeometry args={[setbackW * 0.4, 1.8, setbackD * 0.45]} />
        <meshStandardMaterial color="#131d2c" roughness={0.75} metalness={0.4} />
      </mesh>
      <mesh position={[-setbackW * 0.28, podiumH + shaftH + 9, 0]}>
        <cylinderGeometry args={[0.1, 0.16, 6, 6]} />
        <meshStandardMaterial color="#222b38" roughness={0.6} metalness={0.7} />
      </mesh>
      <mesh position={[-setbackW * 0.28, podiumH + shaftH + 12.2, 0]}>
        <sphereGeometry args={[0.24, 8, 6]} />
        <meshBasicMaterial color="#ff5a4a" toneMapped={false} />
      </mesh>

      {/* Corner fins the full height of the shaft */}
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[(sx * w) / 2, podiumH + shaftH / 2, d / 2 + 0.06]}>
          <boxGeometry args={[0.26, shaftH, 0.24]} />
          <meshBasicMaterial color={s.accent} toneMapped={false} />
        </mesh>
      ))}

      {/* Base light wash */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[w + 3.2, 0.3, d + 3.2]} />
        <meshBasicMaterial color={s.accent} toneMapped={false} />
      </mesh>

      {s.sign && (
        <Sign
          title={s.sign}
          sub={s.subSign}
          color={s.accent}
          y={podiumH + shaftH * 0.72}
          z={d / 2 + 0.3}
          width={Math.min(w * 0.92, 18)}
        />
      )}

      <Glow color={s.accent} size={h * 1.2} position={[0, h * 0.5, d / 2 + 1.2]} opacity={0.16} />
      <pointLight position={[0, 5, d / 2 + 4]} color={s.accent} intensity={20} distance={36} decay={2} />
    </group>
  );
}

function Pillar({ s, numeral }: { s: Structure; numeral?: string }) {
  const [w, h, d] = s.size;
  const tex = useMemo(
    () => (numeral ? numeralTexture(numeral, s.accent) : null),
    [numeral, s.accent],
  );

  return (
    <group position={[s.pos[0], 0, s.pos[1]]}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color="#0b1830" roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh position={[0, h + 0.14, 0]}>
        <boxGeometry args={[w + 0.3, 0.26, d + 0.3]} />
        <meshBasicMaterial color={s.accent} toneMapped={false} />
      </mesh>

      {tex &&
        ([1, -1] as const).map((face) => (
          <mesh
            key={face}
            position={[0, h * 0.62, face * (d / 2 + 0.03)]}
            rotation={[0, face === 1 ? 0 : Math.PI, 0]}
          >
            <planeGeometry args={[w * 0.8, w * 0.8]} />
            <meshBasicMaterial map={tex} transparent depthWrite={false} toneMapped={false} />
          </mesh>
        ))}

      <Glow color={s.accent} size={7} position={[0, h * 0.8, 0]} opacity={0.26} />
      <pointLight position={[0, h + 1, 0]} color={s.accent} intensity={9} distance={18} decay={2} />
    </group>
  );
}

function Obelisk({ s }: { s: Structure }) {
  const [w, h] = s.size;
  return (
    <group position={[s.pos[0], 0, s.pos[1]]}>
      <mesh position={[0, h / 2, 0]} castShadow>
        <cylinderGeometry args={[w * 0.16, w * 0.5, h, 4]} />
        <meshStandardMaterial color="#0c1728" roughness={0.35} metalness={0.75} />
      </mesh>
      <mesh position={[0, h + 0.5, 0]}>
        <octahedronGeometry args={[0.6, 0]} />
        <meshBasicMaterial color={s.accent} toneMapped={false} />
      </mesh>
      {[0.3, 0.55, 0.8].map((f) => (
        <mesh key={f} position={[0, h * f, 0]}>
          <cylinderGeometry args={[w * 0.42 * (1 - f) + 0.12, w * 0.42 * (1 - f) + 0.12, 0.1, 4]} />
          <meshBasicMaterial color={s.accent} toneMapped={false} />
        </mesh>
      ))}
      <Glow color={s.accent} size={6} position={[0, h + 0.5, 0]} opacity={0.5} />
      <pointLight position={[0, h, 0]} color={s.accent} intensity={8} distance={20} decay={2} />
    </group>
  );
}

function Monolith({ s }: { s: Structure }) {
  const [w, h, d] = s.size;
  return (
    <group position={[s.pos[0], 0, s.pos[1]]} rotation={[0, s.rotY ?? 0, (s.rotY ?? 0) * 0.28]}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color="#0a1120" roughness={0.3} metalness={0.85} />
      </mesh>
      <mesh position={[0, h / 2, d / 2 + 0.03]}>
        <planeGeometry args={[w * 0.82, h * 0.86]} />
        <meshBasicMaterial color={s.accent} transparent opacity={0.09} toneMapped={false} />
      </mesh>
      {s.sign && (
        <Sign title={s.sign} color={s.accent} y={h * 0.72} z={d / 2 + 0.06} width={w * 0.9} />
      )}
      <mesh position={[0, 0.16, 0]}>
        <boxGeometry args={[w + 0.5, 0.28, d + 0.5]} />
        <meshBasicMaterial color={s.accent} toneMapped={false} />
      </mesh>
      <pointLight position={[0, h * 0.7, d]} color={s.accent} intensity={12} distance={26} decay={2} />
    </group>
  );
}

function Kiosk({ s }: { s: Structure }) {
  const [w, h, d] = s.size;
  return (
    <group position={[s.pos[0], 0, s.pos[1]]} rotation={[0, s.rotY ?? 0, 0]}>
      <mesh position={[0, h / 2, 0]} castShadow>
        <cylinderGeometry args={[w * 0.5, w * 0.56, h, 6]} />
        <meshStandardMaterial color="#0b1730" roughness={0.35} metalness={0.7} />
      </mesh>
      <mesh position={[0, h + 0.22, 0]}>
        <cylinderGeometry args={[w * 0.62, w * 0.5, 0.42, 6]} />
        <meshBasicMaterial color={s.accent} toneMapped={false} />
      </mesh>
      <mesh position={[0, h * 0.62, w * 0.5]} rotation={[-0.18, 0, 0]}>
        <planeGeometry args={[w * 0.78, h * 0.34]} />
        <meshBasicMaterial color={s.accent} transparent opacity={0.28} toneMapped={false} />
      </mesh>
      {s.sign && <Sign title={s.sign} color={s.accent} y={h * 0.34} z={w * 0.58} width={w * 1.3} />}
      <Glow color={s.accent} size={7} position={[0, h * 0.8, 0]} opacity={0.3} />
      <pointLight position={[0, h, 0]} color={s.accent} intensity={10} distance={18} decay={2} />
    </group>
  );
}

function Plinth({ s }: { s: Structure }) {
  const [w, h, d] = s.size;
  return (
    <group position={[s.pos[0], 0, s.pos[1]]}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color="#0c1626" roughness={0.5} metalness={0.5} />
      </mesh>
      <mesh position={[0, h + 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w * 0.86, d * 0.8]} />
        <meshBasicMaterial color={s.accent} transparent opacity={0.22} toneMapped={false} />
      </mesh>
      {s.sign && (
        <Sign title={s.sign} color={s.accent} y={h + 0.9} z={0} width={w} />
      )}
      <pointLight position={[0, h + 1.4, 0]} color={s.accent} intensity={7} distance={14} decay={2} />
    </group>
  );
}

function Gate({ s }: { s: Structure }) {
  const [w, h, d] = s.size;
  return (
    <group position={[s.pos[0], 0, s.pos[1]]}>
      {[-1, 1].map((sx) => (
        <group key={sx} position={[(sx * w) / 2, 0, 0]}>
          <mesh position={[0, h / 2, 0]} castShadow>
            <boxGeometry args={[3, h, d]} />
            <meshStandardMaterial color="#0a1426" roughness={0.4} metalness={0.7} />
          </mesh>
          <mesh position={[0, h / 2, d / 2 + 0.05]}>
            <planeGeometry args={[0.5, h * 0.8]} />
            <meshBasicMaterial color={s.accent} toneMapped={false} />
          </mesh>
          <pointLight position={[0, h * 0.8, 2]} color={s.accent} intensity={14} distance={26} decay={2} />
        </group>
      ))}

      {/* Lintel */}
      <mesh position={[0, h - 1.2, 0]} castShadow>
        <boxGeometry args={[w + 3, 2.4, d]} />
        <meshStandardMaterial color="#0a1426" roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh position={[0, h - 2.6, 0]}>
        <boxGeometry args={[w + 3.4, 0.28, d + 0.3]} />
        <meshBasicMaterial color={s.accent} toneMapped={false} />
      </mesh>

      {s.sign && <Sign title={s.sign} sub={s.subSign} color={s.accent} y={h - 1.2} z={d / 2 + 0.06} width={22} />}
    </group>
  );
}

function Vault({ s }: { s: Structure }) {
  const [w, h, d] = s.size;
  const ring = useRef<THREE.Group>(null);

  useFrame((_, dt) => {
    if (ring.current) ring.current.rotation.z += dt * 0.35;
  });

  return (
    <group position={[s.pos[0], 0, s.pos[1]]}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color="#081422" roughness={0.28} metalness={0.9} />
      </mesh>

      {/* Vault face */}
      <group position={[0, h * 0.5, d / 2 + 0.08]}>
        <mesh>
          <circleGeometry args={[w * 0.3, 40]} />
          <meshStandardMaterial color="#0d2130" roughness={0.25} metalness={0.95} />
        </mesh>
        <group ref={ring}>
          <mesh>
            <torusGeometry args={[w * 0.3, 0.12, 8, 48]} />
            <meshBasicMaterial color={s.accent} toneMapped={false} />
          </mesh>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} rotation={[0, 0, (i * Math.PI) / 2]} position={[0, 0, 0.02]}>
              <boxGeometry args={[w * 0.5, 0.1, 0.1]} />
              <meshBasicMaterial color={s.accent} toneMapped={false} />
            </mesh>
          ))}
        </group>
      </group>

      {[0.25, 0.75].map((f) => (
        <mesh key={f} position={[0, h * f, 0]}>
          <boxGeometry args={[w + 0.3, 0.22, d + 0.3]} />
          <meshBasicMaterial color={s.accent} toneMapped={false} />
        </mesh>
      ))}

      {s.sign && <Sign title={s.sign} sub={s.subSign} color={s.accent} y={h * 0.88} z={d / 2 + 0.2} width={14} />}
      <pointLight position={[0, h * 0.5, d / 2 + 3]} color={s.accent} intensity={20} distance={34} decay={2} />
    </group>
  );
}

function Clinic({ s }: { s: Structure }) {
  const [w, h, d] = s.size;
  const windows = useMemo(() => windowTexture(41, 10, 12, s.accent), [s.accent]);

  return (
    <group position={[s.pos[0], 0, s.pos[1]]}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          color="#0b1a1a"
          roughness={0.5}
          metalness={0.55}
          emissive="#ffffff"
          emissiveMap={windows}
          emissiveIntensity={1.1}
        />
      </mesh>

      {/* Cross */}
      <group position={[0, h * 0.62, d / 2 + 0.25]}>
        <mesh>
          <boxGeometry args={[4.4, 1.3, 0.3]} />
          <meshBasicMaterial color={s.accent} toneMapped={false} />
        </mesh>
        <mesh>
          <boxGeometry args={[1.3, 4.4, 0.3]} />
          <meshBasicMaterial color={s.accent} toneMapped={false} />
        </mesh>
        <Glow color={s.accent} size={12} position={[0, 0, 0.6]} opacity={0.5} />
      </group>

      {/* Canopy */}
      <mesh position={[0, 4.2, d / 2 + 2.4]} castShadow>
        <boxGeometry args={[w * 0.7, 0.4, 5]} />
        <meshStandardMaterial color="#0e2030" roughness={0.5} metalness={0.6} />
      </mesh>
      <mesh position={[0, 4, d / 2 + 2.4]}>
        <boxGeometry args={[w * 0.7 + 0.2, 0.12, 5.2]} />
        <meshBasicMaterial color={s.accent} toneMapped={false} />
      </mesh>

      {s.sign && <Sign title={s.sign} sub={s.subSign} color={s.accent} y={h * 0.9} z={d / 2 + 0.3} width={16} />}
      <pointLight position={[0, 5, d / 2 + 4]} color={s.accent} intensity={22} distance={32} decay={2} />
    </group>
  );
}

function Pavilion({ s }: { s: Structure }) {
  const [w, h, d] = s.size;

  return (
    <group position={[s.pos[0], 0, s.pos[1]]}>
      {/* Canopy */}
      <mesh position={[0, h, 0]} castShadow>
        <boxGeometry args={[w, 0.7, d]} />
        <meshStandardMaterial color="#0b1424" roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh position={[0, h - 0.45, 0]}>
        <boxGeometry args={[w + 0.4, 0.16, d + 0.4]} />
        <meshBasicMaterial color={s.accent} toneMapped={false} />
      </mesh>

      {/* Underside light panels */}
      {[-1, 0, 1].map((i) => (
        <mesh key={i} position={[i * (w / 3.2), h - 0.42, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[w / 4.6, d * 0.8]} />
          <meshBasicMaterial color={s.accent} transparent opacity={0.22} toneMapped={false} />
        </mesh>
      ))}

      {PAVILION_COLUMNS.map(([x, z], i) => (
        <group key={i} position={[x - s.pos[0], 0, z - s.pos[1]]}>
          <mesh position={[0, h / 2, 0]} castShadow>
            <cylinderGeometry args={[0.55, 0.65, h, 8]} />
            <meshStandardMaterial color="#0c1730" roughness={0.4} metalness={0.7} />
          </mesh>
          <mesh position={[0, h * 0.72, 0]}>
            <cylinderGeometry args={[0.7, 0.7, 0.14, 8]} />
            <meshBasicMaterial color={s.accent} toneMapped={false} />
          </mesh>
        </group>
      ))}

      {s.sign && <Sign title={s.sign} sub={s.subSign} color={s.accent} y={h + 2.4} z={d / 2 - 1} width={24} />}
      <pointLight position={[0, h - 1, 0]} color={s.accent} intensity={40} distance={44} decay={2} />
    </group>
  );
}

/** The eight insurer boards inside the pavilion — the §6 logo grid, in 3D. */
function InsurerBoards() {
  return (
    <group>
      {INSURER_SLOTS.map((slot, i) => {
        const ins = INSURERS[i];
        if (!ins) return null;
        const tex = insurerTexture(ins.mark, ins.name, ins.hue);
        const dim = !ins.enabled;

        return (
          <group key={ins.id} position={[slot.pos[0], 0, slot.pos[1]]} rotation={[0, slot.rotY, 0]}>
            <mesh position={[0, 1.4, 0]} castShadow>
              <boxGeometry args={[2.6, 2.8, 0.34]} />
              <meshStandardMaterial color="#0a1326" roughness={0.4} metalness={0.7} />
            </mesh>
            <mesh position={[0, 0.3, 0]}>
              <boxGeometry args={[2.9, 0.5, 0.7]} />
              <meshStandardMaterial color="#0d1a30" roughness={0.5} metalness={0.6} />
            </mesh>
            <mesh position={[0, 1.55, 0.19]}>
              <planeGeometry args={[2.3, 1.15]} />
              <meshBasicMaterial
                map={tex}
                transparent
                opacity={dim ? 0.3 : 1}
                toneMapped={false}
              />
            </mesh>
            <mesh position={[0, 2.95, 0]}>
              <boxGeometry args={[2.7, 0.1, 0.4]} />
              <meshBasicMaterial color={ins.hue} toneMapped={false} opacity={dim ? 0.25 : 1} transparent />
            </mesh>
            {!dim && (
              <pointLight position={[0, 2.2, 1.4]} color={ins.hue} intensity={5} distance={9} decay={2} />
            )}
          </group>
        );
      })}
    </group>
  );
}

function Terminal({ s }: { s: Structure }) {
  const [w, h, d] = s.size;
  const beam = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (beam.current) {
      const m = beam.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.16 + Math.sin(clock.elapsedTime * 1.4) * 0.08;
    }
  });

  return (
    <group position={[s.pos[0], 0, s.pos[1]]}>
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[(sx * w) / 2, h / 2, 0]} castShadow>
          <boxGeometry args={[3.6, h, d]} />
          <meshStandardMaterial color="#0a1426" roughness={0.35} metalness={0.8} />
        </mesh>
      ))}

      <mesh position={[0, h - 1.4, 0]} castShadow>
        <boxGeometry args={[w + 3.6, 2.8, d]} />
        <meshStandardMaterial color="#0a1426" roughness={0.35} metalness={0.8} />
      </mesh>

      {/* The doorway itself glows */}
      <mesh ref={beam} position={[0, (h - 2.8) / 2, 0]}>
        <boxGeometry args={[w - 3.6, h - 2.8, 1.2]} />
        <meshBasicMaterial color={s.accent} transparent opacity={0.18} toneMapped={false} depthWrite={false} />
      </mesh>

      <mesh position={[0, 0.16, 0]}>
        <boxGeometry args={[w + 4.4, 0.3, d + 1.2]} />
        <meshBasicMaterial color={s.accent} toneMapped={false} />
      </mesh>

      {s.sign && <Sign title={s.sign} sub={s.subSign} color={s.accent} y={h - 1.4} z={d / 2 + 0.06} width={22} />}
      <pointLight position={[0, h * 0.5, 4]} color={s.accent} intensity={45} distance={50} decay={2} />
      <Glow color={s.accent} size={30} position={[0, h * 0.45, 0.8]} opacity={0.3} />
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* Scatter: lamps, trees, skyline                                              */
/* -------------------------------------------------------------------------- */

function Lamps() {
  const posts = useRef<THREE.InstancedMesh>(null);
  const heads = useRef<THREE.InstancedMesh>(null);
  const pools = useRef<THREE.InstancedMesh>(null);
  const glow = useMemo(() => glowTexture(), []);

  useLayoutEffect(() => {
    LAMPS.forEach(([x, z], i) => {
      UP.position.set(x, 3, z);
      UP.rotation.set(0, 0, 0);
      UP.scale.set(1, 1, 1);
      UP.updateMatrix();
      posts.current?.setMatrixAt(i, UP.matrix);

      UP.position.set(x, 6.1, z);
      UP.updateMatrix();
      heads.current?.setMatrixAt(i, UP.matrix);

      // A pool of light on the tarmac, instead of 80 real point lights.
      UP.position.set(x, 0.05, z);
      UP.rotation.set(-Math.PI / 2, 0, 0);
      UP.scale.set(7, 7, 1);
      UP.updateMatrix();
      pools.current?.setMatrixAt(i, UP.matrix);
    });
    for (const m of [posts, heads, pools]) {
      if (m.current) m.current.instanceMatrix.needsUpdate = true;
    }
  }, []);

  return (
    <group>
      <instancedMesh ref={posts} args={[undefined, undefined, LAMPS.length]} castShadow>
        <cylinderGeometry args={[0.1, 0.16, 6, 6]} />
        <meshStandardMaterial color="#0d1828" roughness={0.4} metalness={0.8} />
      </instancedMesh>

      <instancedMesh ref={heads} args={[undefined, undefined, LAMPS.length]}>
        <boxGeometry args={[1.5, 0.22, 0.4]} />
        <meshBasicMaterial color="#9beaf5" toneMapped={false} />
      </instancedMesh>

      <instancedMesh
        ref={pools}
        args={[undefined, undefined, LAMPS.length]}
        frustumCulled={false}
        renderOrder={1}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={glow}
          color="#8fd8ea"
          transparent
          opacity={0.3}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </instancedMesh>
    </group>
  );
}

function Trees() {
  const trunks = useRef<THREE.InstancedMesh>(null);
  const crowns = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    TREES.forEach((t, i) => {
      UP.position.set(t.pos[0], 1.6 * t.scale, t.pos[1]);
      UP.rotation.set(0, t.rot, 0);
      UP.scale.set(t.scale, t.scale, t.scale);
      UP.updateMatrix();
      trunks.current?.setMatrixAt(i, UP.matrix);

      UP.position.set(t.pos[0], 4.2 * t.scale, t.pos[1]);
      UP.scale.set(t.scale * 1.15, t.scale * 1.35, t.scale * 1.15);
      UP.updateMatrix();
      crowns.current?.setMatrixAt(i, UP.matrix);
    });
    if (trunks.current) trunks.current.instanceMatrix.needsUpdate = true;
    if (crowns.current) crowns.current.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <group>
      <instancedMesh ref={trunks} args={[undefined, undefined, TREES.length]} castShadow>
        <cylinderGeometry args={[0.16, 0.26, 3.2, 6]} />
        <meshStandardMaterial color="#20161a" roughness={0.9} metalness={0.05} />
      </instancedMesh>

      <instancedMesh ref={crowns} args={[undefined, undefined, TREES.length]} castShadow>
        <icosahedronGeometry args={[1.9, 0]} />
        <meshStandardMaterial color="#12503a" roughness={0.85} metalness={0.05} flatShading />
      </instancedMesh>
    </group>
  );
}

/* -------------------------------------------------------------------------- */

const KIND_COMPONENT: Partial<Record<Structure['kind'], (p: { s: Structure }) => React.ReactNode>> = {
  obelisk: Obelisk,
  monolith: Monolith,
  kiosk: Kiosk,
  plinth: Plinth,
  gate: Gate,
  vault: Vault,
  clinic: Clinic,
  pavilion: Pavilion,
  terminal: Terminal,
};

export function City() {
  return (
    <group>
      <Sky />
      <Stars />
      <Ground />
      <Lamps />
      <Trees />
      <InsurerBoards />

      {STRUCTURES.map((s, i) => {
        if (s.kind === 'pillar') return <Pillar key={s.id} s={s} numeral={s.sign} />;
        if (s.kind === 'tower' || s.kind === 'lab') return <Building key={s.id} s={s} seed={i * 31 + 7} />;
        const C = KIND_COMPONENT[s.kind];
        return C ? <C key={s.id} s={s} /> : null;
      })}
    </group>
  );
}
