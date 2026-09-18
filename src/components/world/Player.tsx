'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { NODES } from '@/data/content';
import { Avatar } from './Avatar';
import { move, occupied } from './collision';
import { input } from './input';
import { SPAWN } from './parkSquare';
import { heightAt } from './terrain';
import { useWorld } from './store';

const WALK = 7.4;
const SPRINT = 13.2;
const ACCEL = 14;
const DAMP = 11;
const RADIUS = 0.55;
const READ_RANGE = 5.2;
/** Boom samples between the player and full extension. */
const SAMPLES = 14;

const CAM_DIST = 7.2;
const CAM_HEIGHT = 2.6;
const PITCH_MIN = -0.42;
const PITCH_MAX = 0.78;

export function Player() {
  const group = useRef<THREE.Group>(null);
  const yaw = useRef(Math.PI);
  const pitch = useRef(0.04);
  const vel = useRef(new THREE.Vector3());
  const pos = useRef(new THREE.Vector3(SPAWN[0], heightAt(SPAWN[0], SPAWN[1]), SPAWN[1]));
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

    // Collision slides rather than stops, and reports which axis it refused so
    // the velocity that drove into a wall can be shed instead of accumulating.
    // Note the height is NOT passed: collision reads the terrain itself, per
    // substep. Handing it pos.current.y — which is damped for the avatar's
    // benefit and lags the ground on every stair — is what let the body walk
    // through walls during a level change.
    const step = move(
      pos.current.x,
      pos.current.z,
      vel.current.x * dt,
      vel.current.z * dt,
      RADIUS,
    );
    if (step.hitX) vel.current.x = 0;
    if (step.hitZ) vel.current.z = 0;
    pos.current.x = step.x;
    pos.current.z = step.z;

    // Follow the ground. Damped rather than snapped, so a flight of stairs
    // reads as a climb instead of a stutter, but tight enough that you never
    // look like you are hovering.
    const ground = heightAt(pos.current.x, pos.current.z);
    pos.current.y = THREE.MathUtils.damp(pos.current.y, ground, 16, dt);

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
      group.current.position.set(pos.current.x, pos.current.y, pos.current.z);
      group.current.rotation.y = facing.current;
      // Once the boom is pulled right in, the avatar is between the lens and
      // everything else, so it steps out of the way.
      group.current.visible = camDist.current > 1.9;
    }

    /* --- camera ---------------------------------------------------------- */
    const wantDist = CAM_DIST;
    const dirX = Math.sin(yaw.current);
    const dirZ = Math.cos(yaw.current);
    const lift = Math.sin(pitch.current);
    const flat = Math.cos(pitch.current);

    // Find the longest boom that is actually clear, working inward from full
    // extension. The old version walked outward and clamped at 2.2m, so in the
    // arcade — where the columns are closer together than that — the camera
    // ended up inside a shopfront and the screen filled with wall.
    let allowed = 0.5;
    for (let step = SAMPLES; step >= 1; step--) {
      const t = (step / SAMPLES) * wantDist;
      const sx = pos.current.x - dirX * flat * t;
      const sz = pos.current.z - dirZ * flat * t;
      if (!occupied(sx, sz, 0.45, pos.current.y)) {
        allowed = t;
        break;
      }
    }
    // Pull in fast so a wall never gets in front of the lens; ease back out.
    camDist.current = THREE.MathUtils.damp(
      camDist.current,
      allowed,
      allowed < camDist.current ? 26 : 8,
      dt,
    );

    camera.position.set(
      pos.current.x - dirX * flat * camDist.current,
      pos.current.y + 1.55 + CAM_HEIGHT + lift * camDist.current,
      pos.current.z - dirZ * flat * camDist.current,
    );
    camera.lookAt(pos.current.x, pos.current.y + 1.62 + lift * 1.4, pos.current.z);

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
    <group ref={group} position={[SPAWN[0], heightAt(SPAWN[0], SPAWN[1]), SPAWN[1]]}>
      <Avatar phase={phase} speed={speed} walk={WALK} sprint={SPRINT} />
    </group>
  );
}
