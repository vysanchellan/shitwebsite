'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { NODES } from '@/data/content';
import { Avatar } from './Avatar';
import { occupied, resolve } from './collision';
import { input } from './input';
import { useWorld } from './store';

const WALK = 7.4;
const SPRINT = 13.2;
const ACCEL = 14;
const DAMP = 11;
const RADIUS = 0.55;
const READ_RANGE = 5.2;

const CAM_DIST = 7.2;
const CAM_HEIGHT = 2.6;
const PITCH_MIN = -0.42;
const PITCH_MAX = 0.78;

export function Player() {
  const group = useRef<THREE.Group>(null);
  const yaw = useRef(Math.PI);
  const pitch = useRef(0.12);
  const vel = useRef(new THREE.Vector3());
  const pos = useRef(new THREE.Vector3(0, 0, 72));
  const facing = useRef(Math.PI);
  const phase = useRef(0);
  const speed = useRef(0);
  const camDist = useRef(CAM_DIST);
  const report = useRef(0);

  const { camera } = useThree();
  const setNearby = useWorld((s) => s.setNearby);
  const setPlayer = useWorld((s) => s.setPlayer);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const paused = useWorld.getState().paused;

    /* --- look ------------------------------------------------------------ */
    yaw.current += input.yaw;
    pitch.current = THREE.MathUtils.clamp(pitch.current + input.pitch, PITCH_MIN, PITCH_MAX);
    input.yaw = 0;
    input.pitch = 0;

    /* --- movement -------------------------------------------------------- */
    const target = new THREE.Vector3();

    if (!paused && (input.forward !== 0 || input.right !== 0)) {
      // Camera-relative. Forward is where the camera looks, flattened to the
      // ground: (sin yaw, cos yaw). Screen-right is that turned a quarter turn
      // clockwise about +Y, which is (-cos yaw, sin yaw) — not (cos, -sin),
      // which strafes the wrong way.
      const sin = Math.sin(yaw.current);
      const cos = Math.cos(yaw.current);
      target.set(
        input.forward * sin - input.right * cos,
        0,
        input.forward * cos + input.right * sin,
      );
      if (target.lengthSq() > 1) target.normalize();
      target.multiplyScalar(input.sprint ? SPRINT : WALK);
    }

    vel.current.x = THREE.MathUtils.damp(vel.current.x, target.x, target.lengthSq() > 0 ? ACCEL : DAMP, dt);
    vel.current.z = THREE.MathUtils.damp(vel.current.z, target.z, target.lengthSq() > 0 ? ACCEL : DAMP, dt);

    pos.current.x += vel.current.x * dt;
    pos.current.z += vel.current.z * dt;

    const [cx, cz] = resolve(pos.current.x, pos.current.z, RADIUS);
    // If we were pushed out, kill the velocity component that drove us in.
    if (cx !== pos.current.x) vel.current.x = 0;
    if (cz !== pos.current.z) vel.current.z = 0;
    pos.current.x = cx;
    pos.current.z = cz;

    speed.current = Math.hypot(vel.current.x, vel.current.z);
    phase.current += speed.current * dt * 1.55;

    if (speed.current > 0.4) {
      const want = Math.atan2(vel.current.x, vel.current.z);
      // Shortest-arc turn so the avatar never spins the long way round.
      let diff = want - facing.current;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      facing.current += diff * Math.min(1, dt * 12);
    }

    if (group.current) {
      group.current.position.set(pos.current.x, 0, pos.current.z);
      group.current.rotation.y = facing.current;
    }

    /* --- camera ---------------------------------------------------------- */
    const wantDist = CAM_DIST;
    const dirX = Math.sin(yaw.current);
    const dirZ = Math.cos(yaw.current);
    const lift = Math.sin(pitch.current);
    const flat = Math.cos(pitch.current);

    // Walk the boom outward until it hits something.
    let allowed = wantDist;
    for (let step = 1; step <= 6; step++) {
      const t = (step / 6) * wantDist;
      const sx = pos.current.x - dirX * flat * t;
      const sz = pos.current.z - dirZ * flat * t;
      if (occupied(sx, sz, 0.5)) {
        allowed = Math.max(2.2, t - wantDist / 6);
        break;
      }
    }
    camDist.current = THREE.MathUtils.damp(camDist.current, allowed, 9, dt);

    camera.position.set(
      pos.current.x - dirX * flat * camDist.current,
      1.55 + CAM_HEIGHT + lift * camDist.current,
      pos.current.z - dirZ * flat * camDist.current,
    );
    camera.lookAt(pos.current.x, 1.62 + lift * 1.4, pos.current.z);

    /* --- proximity ------------------------------------------------------- */
    let best: string | null = null;
    let bestDist = READ_RANGE;
    for (const node of NODES) {
      const dx = node.position[0] - pos.current.x;
      const dz = node.position[2] - pos.current.z;
      const dist = Math.hypot(dx, dz);
      if (dist < bestDist) {
        bestDist = dist;
        best = node.id;
      }
    }
    setNearby(best);

    /* --- minimap feed (4 Hz is plenty) ----------------------------------- */
    report.current += dt;
    if (report.current > 0.25) {
      report.current = 0;
      setPlayer(pos.current.x, pos.current.z, yaw.current);
    }
  });

  return (
    <group ref={group} position={[0, 0, 72]}>
      <Avatar phase={phase} speed={speed} walk={WALK} sprint={SPRINT} />
    </group>
  );
}
