'use client';

import { useFrame } from '@react-three/fiber';
import { useRef, type RefObject } from 'react';
import * as THREE from 'three';

/**
 * The player: a field clinician in a long coat.
 *
 * Built as a proper skeleton rather than a bundle of floating capsules — hips
 * and shoulders carry the limbs, knees and elbows are children of the segment
 * above them, so a single walk phase drives an articulated cycle instead of
 * four independent sine waves.
 */

const SKIN = '#c98f6d';
const COAT = '#f3f1ea';
const COAT_DARK = '#dcd8ce';
const TROUSER = '#16233b';
const BOOT = '#0d1520';
const ACCENT = '#d8b878';

/** Radians of knee bend at the top of the swing. */
const KNEE = 1.15;
const ELBOW = 0.75;

type Props = {
  phase: RefObject<number>;
  speed: RefObject<number>;
  /** Walk speed that counts as a full-amplitude stride. */
  walk: number;
  /** How fast the player must be going before the coat flares. */
  sprint: number;
};

export function Avatar({ phase, speed, walk, sprint }: Props) {
  const root = useRef<THREE.Group>(null);
  const hips = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);

  const hipL = useRef<THREE.Group>(null);
  const hipR = useRef<THREE.Group>(null);
  const kneeL = useRef<THREE.Group>(null);
  const kneeR = useRef<THREE.Group>(null);

  const shoulderL = useRef<THREE.Group>(null);
  const shoulderR = useRef<THREE.Group>(null);
  const elbowL = useRef<THREE.Group>(null);
  const elbowR = useRef<THREE.Group>(null);

  const coat = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const p = phase.current ?? 0;
    const v = speed.current ?? 0;
    const amt = Math.min(1, v / walk);
    const running = Math.max(0, Math.min(1, (v - walk) / (sprint - walk)));
    const t = state.clock.elapsedTime;

    // Idle: a slow breath so the figure is never completely still.
    const breath = Math.sin(t * 1.6) * 0.012 * (1 - amt);

    const swing = Math.sin(p);
    const counter = Math.sin(p + Math.PI);

    // Hips drive the stride; knees only ever bend backwards.
    if (hipL.current) hipL.current.rotation.x = swing * 0.62 * amt;
    if (hipR.current) hipR.current.rotation.x = counter * 0.62 * amt;
    if (kneeL.current) kneeL.current.rotation.x = -Math.max(0, -swing) * KNEE * amt;
    if (kneeR.current) kneeR.current.rotation.x = -Math.max(0, -counter) * KNEE * amt;

    // Arms counter-swing, elbows tuck as they come forward.
    if (shoulderL.current) shoulderL.current.rotation.x = counter * 0.52 * amt;
    if (shoulderR.current) shoulderR.current.rotation.x = swing * 0.52 * amt;
    if (elbowL.current) elbowL.current.rotation.x = -(0.18 + Math.max(0, counter) * ELBOW) * amt;
    if (elbowR.current) elbowR.current.rotation.x = -(0.18 + Math.max(0, swing) * ELBOW) * amt;

    if (hips.current) {
      // Two bobs per stride, plus a little lateral weight shift.
      hips.current.position.y = 0.92 + Math.abs(Math.sin(p)) * 0.05 * amt + breath;
      hips.current.rotation.z = Math.sin(p) * 0.05 * amt;
      hips.current.rotation.y = Math.sin(p) * 0.12 * amt;
    }

    if (torso.current) {
      // Lean into the run; counter-rotate the shoulders against the hips.
      torso.current.rotation.x = running * 0.2 + amt * 0.06;
      torso.current.rotation.y = Math.sin(p + Math.PI) * 0.1 * amt;
    }

    if (head.current) {
      // The head stays level while the body works underneath it.
      head.current.rotation.x = -(running * 0.16) + Math.sin(p * 2) * 0.02 * amt;
      head.current.rotation.y = Math.sin(p) * 0.05 * amt;
    }

    if (coat.current) {
      // Coat tails lag the body and lift with speed.
      const target = running * 0.5 + amt * 0.16;
      coat.current.rotation.x = THREE.MathUtils.damp(
        coat.current.rotation.x,
        -target,
        6,
        Math.min(delta, 0.05),
      );
      coat.current.rotation.z = Math.sin(p) * 0.07 * amt;
    }
  });

  return (
    <group ref={root}>
      {/* Contact shadow and rim light */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.55, 28]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.34} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[0.52, 0.72, 28]} />
        <meshBasicMaterial color={ACCENT} transparent opacity={0.12} depthWrite={false} />
      </mesh>

      <group ref={hips} position={[0, 0.92, 0]}>
        {/* Pelvis */}
        <mesh castShadow>
          <boxGeometry args={[0.36, 0.22, 0.24]} />
          <meshStandardMaterial color={TROUSER} roughness={0.7} metalness={0.1} />
        </mesh>

        {/* Legs */}
        {(
          [
            { hip: hipL, knee: kneeL, x: -0.115 },
            { hip: hipR, knee: kneeR, x: 0.115 },
          ] as const
        ).map((leg, i) => (
          <group key={i} ref={leg.hip} position={[leg.x, -0.08, 0]}>
            <mesh position={[0, -0.22, 0]} castShadow>
              <capsuleGeometry args={[0.093, 0.3, 4, 10]} />
              <meshStandardMaterial color={TROUSER} roughness={0.72} metalness={0.08} />
            </mesh>

            <group ref={leg.knee} position={[0, -0.45, 0]}>
              <mesh position={[0, -0.2, 0]} castShadow>
                <capsuleGeometry args={[0.078, 0.28, 4, 10]} />
                <meshStandardMaterial color={TROUSER} roughness={0.72} metalness={0.08} />
              </mesh>
              {/* Boot */}
              <mesh position={[0, -0.41, 0.04]} castShadow>
                <boxGeometry args={[0.15, 0.1, 0.27]} />
                <meshStandardMaterial color={BOOT} roughness={0.5} metalness={0.25} />
              </mesh>
              <mesh position={[0, -0.44, 0.06]}>
                <boxGeometry args={[0.155, 0.02, 0.28]} />
                <meshBasicMaterial color={ACCENT} toneMapped={false} />
              </mesh>
            </group>
          </group>
        ))}

        {/* Upper body */}
        <group ref={torso} position={[0, 0.1, 0]}>
          {/* Ribcage, tapered so the silhouette is not a tube */}
          <mesh position={[0, 0.2, 0]} castShadow>
            <cylinderGeometry args={[0.185, 0.155, 0.42, 12]} />
            <meshStandardMaterial color={COAT} roughness={0.62} metalness={0.06} />
          </mesh>

          {/* Coat front panel + placket */}
          <mesh position={[0, 0.2, 0.15]}>
            <boxGeometry args={[0.3, 0.42, 0.06]} />
            <meshStandardMaterial color={COAT_DARK} roughness={0.66} metalness={0.05} />
          </mesh>
          <mesh position={[0, 0.2, 0.185]}>
            <boxGeometry args={[0.02, 0.4, 0.02]} />
            <meshBasicMaterial color={ACCENT} toneMapped={false} />
          </mesh>

          {/* Shoulder yoke */}
          <mesh position={[0, 0.4, 0]} castShadow>
            <boxGeometry args={[0.46, 0.09, 0.22]} />
            <meshStandardMaterial color={COAT} roughness={0.6} metalness={0.08} />
          </mesh>

          {/* Field pack */}
          <mesh position={[0, 0.2, -0.19]} castShadow>
            <boxGeometry args={[0.28, 0.34, 0.14]} />
            <meshStandardMaterial color="#1b2a3f" roughness={0.75} metalness={0.15} />
          </mesh>
          <mesh position={[0, 0.3, -0.265]}>
            <boxGeometry args={[0.2, 0.03, 0.02]} />
            <meshBasicMaterial color={ACCENT} toneMapped={false} />
          </mesh>

          {/* Coat skirt, hinged at the waist so it can trail */}
          <group ref={coat} position={[0, 0.02, 0]}>
            <mesh position={[0, -0.22, 0]} castShadow>
              <cylinderGeometry args={[0.2, 0.31, 0.52, 14, 1, true]} />
              <meshStandardMaterial
                color={COAT}
                roughness={0.64}
                metalness={0.05}
                side={THREE.DoubleSide}
              />
            </mesh>
            <mesh position={[0, -0.47, 0]}>
              <torusGeometry args={[0.305, 0.008, 6, 20]} />
              <meshBasicMaterial color={ACCENT} transparent opacity={0.6} toneMapped={false} />
            </mesh>
          </group>

          {/* Arms */}
          {(
            [
              { shoulder: shoulderL, elbow: elbowL, x: -0.235 },
              { shoulder: shoulderR, elbow: elbowR, x: 0.235 },
            ] as const
          ).map((arm, i) => (
            <group key={i} ref={arm.shoulder} position={[arm.x, 0.37, 0]}>
              <mesh position={[0, -0.14, 0]} castShadow>
                <capsuleGeometry args={[0.062, 0.18, 4, 8]} />
                <meshStandardMaterial color={COAT} roughness={0.62} metalness={0.06} />
              </mesh>

              <group ref={arm.elbow} position={[0, -0.28, 0]}>
                <mesh position={[0, -0.12, 0]} castShadow>
                  <capsuleGeometry args={[0.052, 0.16, 4, 8]} />
                  <meshStandardMaterial color={COAT_DARK} roughness={0.66} metalness={0.06} />
                </mesh>
                {/* Hand */}
                <mesh position={[0, -0.25, 0]} castShadow>
                  <sphereGeometry args={[0.055, 10, 8]} />
                  <meshStandardMaterial color={SKIN} roughness={0.8} metalness={0.02} />
                </mesh>
              </group>
            </group>
          ))}

          {/* Neck and head */}
          <group ref={head} position={[0, 0.47, 0]}>
            <mesh position={[0, 0.03, 0]}>
              <cylinderGeometry args={[0.055, 0.065, 0.08, 8]} />
              <meshStandardMaterial color={SKIN} roughness={0.8} metalness={0.02} />
            </mesh>

            <mesh position={[0, 0.16, 0]} castShadow>
              <sphereGeometry args={[0.115, 18, 16]} />
              <meshStandardMaterial color={SKIN} roughness={0.78} metalness={0.02} />
            </mesh>

            {/* Hair / cap */}
            <mesh position={[0, 0.19, -0.012]} castShadow>
              <sphereGeometry args={[0.119, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
              <meshStandardMaterial color="#1c2536" roughness={0.85} metalness={0.05} />
            </mesh>

            {/* Visor band — the one glowing thing on the figure */}
            <mesh position={[0, 0.16, 0.055]} rotation={[0.12, 0, 0]}>
              <boxGeometry args={[0.17, 0.035, 0.09]} />
              <meshBasicMaterial color={ACCENT} toneMapped={false} />
            </mesh>
          </group>
        </group>
      </group>

      {/*
        Two small lights that travel with the player. The key sits behind the
        figure, on the camera's side, because the avatar walks away from the
        camera and would otherwise be a silhouette all night.
      */}
      <pointLight position={[0, 1.9, -1.8]} color="#dbeaf5" intensity={4.5} distance={7} decay={2} />
      <pointLight position={[0.9, 1.1, 0.8]} color="#6fb6d8" intensity={2.4} distance={4.5} decay={2} />
    </group>
  );
}
