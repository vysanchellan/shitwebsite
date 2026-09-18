'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { INSURERS } from '@/data/insurers';
import { INSURER_SLOTS } from './parkSquare';
import { heightAt } from './terrain';
import { groundTexture, insurerTexture } from './textures';

/**
 * Everything outside the precinct: the sky, the stars and the ground the wider
 * city sits on. Park Square provides its own paving; this is what surrounds it.
 */

const SKY_VERT = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * A late-evening Durban sky: indigo overhead, a long amber band at the horizon
 * where the sun is going down over the ridge, and slow cloud sheets drawn with
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

    float sd = max(dot(dir, normalize(uSunDir)), 0.0);
    col += uSun * pow(sd, 220.0) * 2.4;
    col += uSun * pow(sd, 7.0) * 0.5;
    col += uSun * pow(sd, 2.0) * 0.14;

    vec2 cp = vec2(atan(dir.z, dir.x) * 1.6, h * 5.2);
    float cloud = fbm(cp * 1.5 + vec2(uTime * 0.006, 0.0));
    cloud = smoothstep(0.48, 0.92, cloud) * smoothstep(-0.02, 0.22, h) * smoothstep(0.85, 0.3, h);

    vec3 cloudLit = mix(vec3(0.16, 0.16, 0.24), uSun * 1.25, pow(sd, 1.6) * 0.8 + 0.18);
    col = mix(col, cloudLit, cloud * 0.72);

    gl_FragColor = vec4(col, 1.0);
  }
`;

function Sky() {
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uZenith: { value: new THREE.Color('#131a33') },
      uMid: { value: new THREE.Color('#37507a') },
      uHorizon: { value: new THREE.Color('#c9764a') },
      uGround: { value: new THREE.Color('#0d0b10') },
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
      const v = new THREE.Vector3().setFromSphericalCoords(
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
      <pointsMaterial size={1.1} color="#efe0c2" transparent opacity={0.55} depthWrite={false} />
    </points>
  );
}

function Ground() {
  const ground = useMemo(() => groundTexture(), []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]} receiveShadow>
      <planeGeometry args={[1100, 1100]} />
      <meshStandardMaterial map={ground} roughness={0.82} metalness={0.18} color="#3a3038" />
    </mesh>
  );
}

/**
 * The supported-provider boards, set out on the Spar forecourt where the real
 * anchor's trolley bays and promotional stands sit.
 */
export function InsurerBoards() {
  return (
    <group>
      {INSURER_SLOTS.map((slot, i) => {
        const ins = INSURERS[i];
        if (!ins) return null;
        const tex = insurerTexture(ins.mark, ins.name, ins.hue);
        const dim = !ins.enabled;

        return (
          <group
            key={ins.id}
            position={[slot.pos[0], heightAt(slot.pos[0], slot.pos[1]), slot.pos[1]]}
            rotation={[0, slot.rotY, 0]}
          >
            <mesh position={[0, 1.4, 0]} castShadow>
              <boxGeometry args={[2.6, 2.8, 0.34]} />
              <meshStandardMaterial color="#1a181d" roughness={0.5} metalness={0.5} />
            </mesh>
            <mesh position={[0, 0.3, 0]}>
              <boxGeometry args={[2.9, 0.5, 0.7]} />
              <meshStandardMaterial color="#26232a" roughness={0.6} metalness={0.4} />
            </mesh>
            <mesh position={[0, 1.55, 0.19]}>
              <planeGeometry args={[2.3, 1.15]} />
              <meshBasicMaterial map={tex} transparent opacity={dim ? 0.3 : 1} toneMapped={false} />
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

export function Environment() {
  return (
    <group>
      <Sky />
      <Stars />
      <Ground />
    </group>
  );
}
