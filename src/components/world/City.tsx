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
  SKYLINE,
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

const SKY_FRAG = /* glsl */ `
  varying vec3 vWorld;
  uniform vec3 uTop;
  uniform vec3 uMid;
  uniform vec3 uHorizon;
  uniform vec3 uGround;
  uniform vec3 uSunDir;
  uniform vec3 uSun;

  void main() {
    vec3 dir = normalize(vWorld);
    float h = dir.y;

    vec3 col = mix(uHorizon, uMid, smoothstep(0.0, 0.34, h));
    col = mix(col, uTop, smoothstep(0.24, 0.85, h));
    col = mix(uGround, col, smoothstep(-0.14, 0.02, h));

    // A low dusk sun behind the institutes.
    float sun = pow(max(dot(dir, normalize(uSunDir)), 0.0), 34.0);
    float bloom = pow(max(dot(dir, normalize(uSunDir)), 0.0), 3.5) * 0.3;
    col += uSun * (sun + bloom) * smoothstep(-0.08, 0.16, h);

    gl_FragColor = vec4(col, 1.0);
  }
`;

function Sky() {
  const uniforms = useMemo(
    () => ({
      uTop: { value: new THREE.Color('#050a1a') },
      uMid: { value: new THREE.Color('#102144') },
      uHorizon: { value: new THREE.Color('#5d3c6e') },
      uGround: { value: new THREE.Color('#050810') },
      uSunDir: { value: new THREE.Vector3(-0.35, 0.09, -1).normalize() },
      uSun: { value: new THREE.Color('#ff9d6b') },
    }),
    [],
  );

  return (
    <mesh scale={[-1, 1, 1]} frustumCulled={false}>
      <sphereGeometry args={[420, 32, 24]} />
      <shaderMaterial
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

function Stars({ count = 700 }: { count?: number }) {
  const geometry = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const v = new THREE.Vector3()
        .setFromSphericalCoords(
          300,
          Math.acos(THREE.MathUtils.randFloat(0.05, 0.85)),
          Math.random() * Math.PI * 2,
        );
      pos.set([v.x, Math.abs(v.y) + 40, v.z], i * 3);
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -10]} receiveShadow>
        <planeGeometry args={[440, 440]} />
        <meshStandardMaterial map={ground} roughness={0.78} metalness={0.28} color="#131c31" />
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
            color="#33486e"
          />
        </mesh>
      ))}

      {GREENS.map((g, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[g.pos[0], 0.01, g.pos[1]]} receiveShadow>
          <planeGeometry args={[g.size[0], g.size[1]]} />
          <meshStandardMaterial color="#0e3326" roughness={0.95} metalness={0} />
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

function Building({ s, seed }: { s: Structure; seed: number }) {
  const [w, h, d] = s.size;
  const windows = useMemo(
    () => windowTexture(seed, Math.max(6, Math.round(w)), Math.max(10, Math.round(h * 0.9)), s.accent),
    [seed, w, h, s.accent],
  );

  return (
    <group position={[s.pos[0], 0, s.pos[1]]} rotation={[0, s.rotY ?? 0, 0]}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          color="#0a1426"
          roughness={0.55}
          metalness={0.6}
          emissive="#ffffff"
          emissiveMap={windows}
          emissiveIntensity={1.35}
        />
      </mesh>

      {/* Crown + base light bars */}
      <mesh position={[0, h + 0.18, 0]}>
        <boxGeometry args={[w + 0.5, 0.34, d + 0.5]} />
        <meshBasicMaterial color={s.accent} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[w + 0.7, 0.3, d + 0.7]} />
        <meshBasicMaterial color={s.accent} toneMapped={false} />
      </mesh>

      {/* Vertical fins */}
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[(sx * w) / 2, h / 2, d / 2 + 0.06]}>
          <boxGeometry args={[0.3, h, 0.24]} />
          <meshBasicMaterial color={s.accent} toneMapped={false} />
        </mesh>
      ))}

      {s.sign && (
        <Sign
          title={s.sign}
          sub={s.subSign}
          color={s.accent}
          y={h * 0.62}
          z={d / 2 + 0.3}
          width={Math.min(w * 0.92, 18)}
        />
      )}

      <Glow color={s.accent} size={h * 1.5} position={[0, h * 0.5, d / 2 + 1.2]} opacity={0.2} />
      <pointLight position={[0, h * 0.5, d / 2 + 2]} color={s.accent} intensity={16} distance={34} decay={2} />
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

function Skyline() {
  const ref = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const color = new THREE.Color();
    SKYLINE.forEach((t, i) => {
      UP.position.set(t.pos[0], t.size[1] / 2, t.pos[1]);
      UP.rotation.set(0, 0, 0);
      UP.scale.set(t.size[0], t.size[1], t.size[2]);
      UP.updateMatrix();
      ref.current?.setMatrixAt(i, UP.matrix);
      color.setHSL(0.56 + t.tint * 0.12, 0.5, 0.08 + t.tint * 0.06);
      ref.current?.setColorAt(i, color);
    });
    if (ref.current) {
      ref.current.instanceMatrix.needsUpdate = true;
      if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    }
  }, []);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, SKYLINE.length]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        roughness={0.6}
        metalness={0.5}
        emissive="#173a5e"
        emissiveIntensity={0.55}
      />
    </instancedMesh>
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
      <Skyline />
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
