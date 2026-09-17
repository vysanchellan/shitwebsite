'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import {
  CITY,
  CITY_STREETS,
  CROSSINGS,
  SKYLINE,
  STREET_PROPS,
  VEHICLES,
  type CityBuilding,
} from './layout';
import { windowTexture } from './textures';

const O = new THREE.Object3D();
const C = new THREE.Color();

/**
 * The wider city, drawn entirely with instanced geometry.
 *
 * Roughly 150 buildings, 400 pieces of street furniture and 100 vehicles come
 * to about twenty draw calls. Facades are split into three window tints so the
 * skyline is not uniform despite sharing materials.
 */

/** Window tints, chosen so a block reads as mixed occupancy rather than one owner. */
const TINTS = ['#e8cf9c', '#ffd6a1', '#cdbb96'] as const;

function tintIndex(b: CityBuilding) {
  return Math.min(TINTS.length - 1, Math.floor(b.tint * TINTS.length));
}

/** Facade colouring: the body under the windows. */
const BODY: Record<CityBuilding['facade'], string> = {
  office: '#0b1526',
  hospital: '#0e1c24',
  residential: '#12161f',
  retail: '#0a1420',
  industrial: '#141519',
};

/** Shorthand for the instanced-mesh refs this module is made of. */
function useInstances() {
  return useRef<THREE.InstancedMesh>(null);
}

/* -------------------------------------------------------------------------- */
/* Buildings                                                                   */
/* -------------------------------------------------------------------------- */

function Masses({
  tint,
  part,
}: {
  tint: number;
  part: 'podium' | 'tower';
}) {
  const ref = useInstances();

  const list = useMemo(
    () => CITY.filter((b) => tintIndex(b) === tint && (part === 'podium' || b.tower[1] > 0)),
    [tint, part],
  );

  const tex = useMemo(
    () =>
      windowTexture(
        900 + tint * 37 + (part === 'tower' ? 11 : 0),
        part === 'tower' ? 12 : 18,
        part === 'tower' ? 30 : 8,
        TINTS[tint],
      ),
    [tint, part],
  );

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;

    list.forEach((b, i) => {
      if (part === 'podium') {
        O.position.set(b.pos[0], b.size[1] / 2, b.pos[1]);
        O.scale.set(b.size[0], b.size[1], b.size[2]);
      } else {
        O.position.set(
          b.pos[0] + b.towerOffset[0],
          b.size[1] + b.tower[1] / 2,
          b.pos[1] + b.towerOffset[1],
        );
        O.scale.set(b.tower[0], b.tower[1], b.tower[2]);
      }
      O.rotation.set(0, 0, 0);
      O.updateMatrix();
      mesh.setMatrixAt(i, O.matrix);
      mesh.setColorAt(i, C.set(BODY[b.facade]));
    });

    mesh.count = list.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [list, part]);

  if (!list.length) return null;

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, list.length]}
      castShadow
      receiveShadow
      frustumCulled={false}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        roughness={0.62}
        metalness={0.48}
        emissive="#ffffff"
        emissiveMap={tex}
        emissiveIntensity={1.15}
      />
    </instancedMesh>
  );
}

/** Lit bands around the crown of the taller towers. */
function Crowns() {
  const ref = useInstances();
  const list = useMemo(() => CITY.filter((b) => b.crown), []);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    list.forEach((b, i) => {
      O.position.set(
        b.pos[0] + b.towerOffset[0],
        b.size[1] + b.tower[1] - 1.6,
        b.pos[1] + b.towerOffset[1],
      );
      O.scale.set(b.tower[0] + 0.4, 0.5, b.tower[2] + 0.4);
      O.rotation.set(0, 0, 0);
      O.updateMatrix();
      mesh.setMatrixAt(i, O.matrix);
      C.setHSL(0.48 + b.tint * 0.14, 0.75, 0.6);
      mesh.setColorAt(i, C);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [list]);

  if (!list.length) return null;

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, list.length]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

/** Plant rooms, water tanks and masts — the clutter that makes a roof read. */
function Rooftops() {
  const boxes = useInstances();
  const tanks = useInstances();
  const masts = useInstances();
  const beacons = useInstances();

  const items = useMemo(() => {
    const out: { kind: string; x: number; y: number; z: number; s: number }[] = [];
    for (const b of CITY) {
      for (const item of b.roof) {
        const onTower = item.on === 'tower' && b.tower[1] > 0;
        const baseY = onTower ? b.size[1] + b.tower[1] : b.size[1];
        const ox = onTower ? b.towerOffset[0] : 0;
        const oz = onTower ? b.towerOffset[1] : 0;
        out.push({
          kind: item.kind,
          x: b.pos[0] + ox + item.pos[0],
          y: baseY,
          z: b.pos[1] + oz + item.pos[1],
          s: item.size,
        });
      }
    }
    return out;
  }, []);

  const byKind = useMemo(
    () => ({
      box: items.filter((i) => i.kind === 'box'),
      tank: items.filter((i) => i.kind === 'tank'),
      mast: items.filter((i) => i.kind === 'mast'),
    }),
    [items],
  );

  useLayoutEffect(() => {
    byKind.box.forEach((it, i) => {
      O.position.set(it.x, it.y + it.s * 0.5, it.z);
      O.scale.set(it.s * 2.1, it.s, it.s * 1.7);
      O.rotation.set(0, 0, 0);
      O.updateMatrix();
      boxes.current?.setMatrixAt(i, O.matrix);
    });

    byKind.tank.forEach((it, i) => {
      O.position.set(it.x, it.y + it.s * 0.8, it.z);
      O.scale.set(it.s, it.s * 1.6, it.s);
      O.rotation.set(0, 0, 0);
      O.updateMatrix();
      tanks.current?.setMatrixAt(i, O.matrix);
    });

    byKind.mast.forEach((it, i) => {
      O.position.set(it.x, it.y + it.s * 2.4, it.z);
      O.scale.set(1, it.s * 4.8, 1);
      O.rotation.set(0, 0, 0);
      O.updateMatrix();
      masts.current?.setMatrixAt(i, O.matrix);

      O.position.set(it.x, it.y + it.s * 4.9, it.z);
      O.scale.setScalar(1);
      O.updateMatrix();
      beacons.current?.setMatrixAt(i, O.matrix);
    });

    for (const m of [boxes, tanks, masts, beacons]) {
      if (m.current) m.current.instanceMatrix.needsUpdate = true;
    }
  }, [byKind]);

  return (
    <group>
      <instancedMesh
        ref={boxes}
        args={[undefined, undefined, Math.max(1, byKind.box.length)]}
        castShadow
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#141c2a" roughness={0.75} metalness={0.4} />
      </instancedMesh>

      <instancedMesh
        ref={tanks}
        args={[undefined, undefined, Math.max(1, byKind.tank.length)]}
        castShadow
        frustumCulled={false}
      >
        <cylinderGeometry args={[1, 1, 1, 10]} />
        <meshStandardMaterial color="#1a222e" roughness={0.7} metalness={0.5} />
      </instancedMesh>

      <instancedMesh
        ref={masts}
        args={[undefined, undefined, Math.max(1, byKind.mast.length)]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.12, 0.18, 1, 5]} />
        <meshStandardMaterial color="#222b38" roughness={0.6} metalness={0.7} />
      </instancedMesh>

      {/* Aircraft warning lights */}
      <instancedMesh
        ref={beacons}
        args={[undefined, undefined, Math.max(1, byKind.mast.length)]}
        frustumCulled={false}
      >
        <sphereGeometry args={[0.26, 8, 6]} />
        <meshBasicMaterial color="#ff5a4a" toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* Street furniture                                                            */
/* -------------------------------------------------------------------------- */

/** Round furniture: bollards, hydrants, bins, signal posts. */
const POST_SPEC: Record<string, { r: number; h: number; color: string }> = {
  bollard: { r: 0.16, h: 1.1, color: '#2a3446' },
  hydrant: { r: 0.22, h: 0.95, color: '#a63a30' },
  bin: { r: 0.4, h: 1.05, color: '#1d2634' },
  signal: { r: 0.14, h: 4.4, color: '#232c3a' },
};

/** Boxy furniture: benches, planters, vents, barriers. */
const BLOCK_SPEC: Record<string, { w: number; h: number; d: number; color: string }> = {
  bench: { w: 2.2, h: 0.45, d: 0.6, color: '#2b2118' },
  planter: { w: 2.4, h: 0.8, d: 1.1, color: '#1b2430' },
  vent: { w: 1.5, h: 1.0, d: 1.2, color: '#222a33' },
  barrier: { w: 2.6, h: 1.0, d: 0.25, color: '#3a3f2c' },
};

function StreetFurniture() {
  const posts = useInstances();
  const blocks = useInstances();
  const greens = useInstances();
  const heads = useInstances();

  const postList = useMemo(
    () => STREET_PROPS.filter((p) => p.kind in POST_SPEC),
    [],
  );
  const blockList = useMemo(
    () => STREET_PROPS.filter((p) => p.kind in BLOCK_SPEC),
    [],
  );
  const planters = useMemo(() => STREET_PROPS.filter((p) => p.kind === 'planter'), []);
  const signals = useMemo(() => STREET_PROPS.filter((p) => p.kind === 'signal'), []);

  useLayoutEffect(() => {
    postList.forEach((p, i) => {
      const spec = POST_SPEC[p.kind];
      O.position.set(p.pos[0], spec.h / 2, p.pos[1]);
      O.rotation.set(0, p.rotY, 0);
      O.scale.set(spec.r * 2, spec.h, spec.r * 2);
      O.updateMatrix();
      posts.current?.setMatrixAt(i, O.matrix);
      posts.current?.setColorAt(i, C.set(spec.color));
    });

    blockList.forEach((p, i) => {
      const spec = BLOCK_SPEC[p.kind];
      O.position.set(p.pos[0], spec.h / 2, p.pos[1]);
      O.rotation.set(0, p.rotY, 0);
      O.scale.set(spec.w, spec.h, spec.d);
      O.updateMatrix();
      blocks.current?.setMatrixAt(i, O.matrix);
      blocks.current?.setColorAt(i, C.set(spec.color));
    });

    // Shrubs sitting in the planters.
    planters.forEach((p, i) => {
      O.position.set(p.pos[0], 1.15, p.pos[1]);
      O.rotation.set(0, p.rotY + i, 0);
      O.scale.setScalar(0.85);
      O.updateMatrix();
      greens.current?.setMatrixAt(i, O.matrix);
    });

    // Signal heads on their posts.
    signals.forEach((p, i) => {
      O.position.set(p.pos[0], 4.1, p.pos[1]);
      O.rotation.set(0, p.rotY, 0);
      O.scale.set(0.4, 1.1, 0.35);
      O.updateMatrix();
      heads.current?.setMatrixAt(i, O.matrix);
    });

    for (const m of [posts, blocks, greens, heads]) {
      if (!m.current) continue;
      m.current.instanceMatrix.needsUpdate = true;
      if (m.current.instanceColor) m.current.instanceColor.needsUpdate = true;
    }
  }, [postList, blockList, planters, signals]);

  return (
    <group>
      <instancedMesh
        ref={posts}
        args={[undefined, undefined, Math.max(1, postList.length)]}
        castShadow
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.5, 0.5, 1, 7]} />
        <meshStandardMaterial roughness={0.7} metalness={0.4} />
      </instancedMesh>

      <instancedMesh
        ref={blocks}
        args={[undefined, undefined, Math.max(1, blockList.length)]}
        castShadow
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.8} metalness={0.2} />
      </instancedMesh>

      <instancedMesh
        ref={greens}
        args={[undefined, undefined, Math.max(1, planters.length)]}
        castShadow
        frustumCulled={false}
      >
        <icosahedronGeometry args={[0.85, 0]} />
        <meshStandardMaterial color="#17543c" roughness={0.9} flatShading />
      </instancedMesh>

      <instancedMesh
        ref={heads}
        args={[undefined, undefined, Math.max(1, signals.length)]}
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#2fc27a" toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* Vehicles                                                                    */
/* -------------------------------------------------------------------------- */

const VEHICLE_SIZE: Record<string, [number, number, number]> = {
  car: [2.0, 0.85, 4.4],
  van: [2.3, 1.5, 5.4],
  ambulance: [2.4, 1.9, 6.0],
};

function Vehicles() {
  const bodies = useInstances();
  const cabins = useInstances();
  const lights = useInstances();

  useLayoutEffect(() => {
    VEHICLES.forEach((v, i) => {
      const [w, h, d] = VEHICLE_SIZE[v.kind];

      O.position.set(v.pos[0], h / 2 + 0.3, v.pos[1]);
      O.rotation.set(0, v.rotY, 0);
      O.scale.set(w, h, d);
      O.updateMatrix();
      bodies.current?.setMatrixAt(i, O.matrix);
      if (v.kind === 'ambulance') C.set('#e8eaed');
      else C.setHSL(0.55 + v.tint * 0.2, 0.18, 0.12 + v.tint * 0.2);
      bodies.current?.setColorAt(i, C);

      // Greenhouse: shorter and set back on a car, full-height on a van.
      O.position.set(v.pos[0], h + 0.55, v.pos[1]);
      O.scale.set(w * 0.86, v.kind === 'car' ? 0.62 : 0.5, d * (v.kind === 'car' ? 0.5 : 0.72));
      O.updateMatrix();
      cabins.current?.setMatrixAt(i, O.matrix);

      // Rear light bar.
      O.position.set(
        v.pos[0] - Math.sin(v.rotY) * (d / 2),
        0.75,
        v.pos[1] - Math.cos(v.rotY) * (d / 2),
      );
      O.scale.set(w * 0.8, 0.14, 0.1);
      O.updateMatrix();
      lights.current?.setMatrixAt(i, O.matrix);
      lights.current?.setColorAt(i, C.set(v.kind === 'ambulance' ? '#ff4a4a' : '#ff6a55'));
    });

    for (const m of [bodies, cabins, lights]) {
      if (!m.current) continue;
      m.current.instanceMatrix.needsUpdate = true;
      if (m.current.instanceColor) m.current.instanceColor.needsUpdate = true;
    }
  }, []);

  return (
    <group>
      <instancedMesh
        ref={bodies}
        args={[undefined, undefined, Math.max(1, VEHICLES.length)]}
        castShadow
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.35} metalness={0.7} />
      </instancedMesh>

      <instancedMesh
        ref={cabins}
        args={[undefined, undefined, Math.max(1, VEHICLES.length)]}
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#0a1018" roughness={0.18} metalness={0.9} />
      </instancedMesh>

      <instancedMesh
        ref={lights}
        args={[undefined, undefined, Math.max(1, VEHICLES.length)]}
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* Ground: city streets, crossings, distant skyline                            */
/* -------------------------------------------------------------------------- */

function Streets() {
  const stripes = useInstances();

  const stripeList = useMemo(() => {
    const out: { x: number; z: number; rot: number }[] = [];
    for (const c of CROSSINGS) {
      const bars = 7;
      for (let i = 0; i < bars; i++) {
        const t = (i / (bars - 1) - 0.5) * (c.width - 2);
        out.push({
          x: c.pos[0] + Math.cos(c.rotY) * t,
          z: c.pos[1] + Math.sin(c.rotY) * t,
          rot: c.rotY,
        });
      }
    }
    return out;
  }, []);

  useLayoutEffect(() => {
    stripeList.forEach((s, i) => {
      O.position.set(s.x, 0.03, s.z);
      O.rotation.set(-Math.PI / 2, 0, s.rot);
      O.scale.set(0.8, 4.4, 1);
      O.updateMatrix();
      stripes.current?.setMatrixAt(i, O.matrix);
    });
    if (stripes.current) stripes.current.instanceMatrix.needsUpdate = true;
  }, [stripeList]);

  return (
    <group>
      {CITY_STREETS.map((s, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[s.pos[0], 0.012, s.pos[1]]}
          receiveShadow
        >
          <planeGeometry args={[s.size[0], s.size[1]]} />
          <meshStandardMaterial color="#11192b" roughness={0.5} metalness={0.45} />
        </mesh>
      ))}

      <instancedMesh
        ref={stripes}
        args={[undefined, undefined, Math.max(1, stripeList.length)]}
        frustumCulled={false}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#c8d6e8" transparent opacity={0.34} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

function Skyline() {
  const ref = useInstances();

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    SKYLINE.forEach((t, i) => {
      O.position.set(t.pos[0], t.size[1] / 2, t.pos[1]);
      O.rotation.set(0, 0, 0);
      O.scale.set(t.size[0], t.size[1], t.size[2]);
      O.updateMatrix();
      mesh.setMatrixAt(i, O.matrix);
      C.setHSL(0.57 + t.tint * 0.1, 0.45, 0.07 + t.tint * 0.05);
      mesh.setColorAt(i, C);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, []);

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, SKYLINE.length]}
      frustumCulled={false}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.65} metalness={0.45} emissive="#173a5e" emissiveIntensity={0.45} />
    </instancedMesh>
  );
}

/* -------------------------------------------------------------------------- */

export function CityBlocks() {
  return (
    <group>
      <Streets />
      <Skyline />

      {TINTS.map((_, i) => (
        <Masses key={`p${i}`} tint={i} part="podium" />
      ))}
      {TINTS.map((_, i) => (
        <Masses key={`t${i}`} tint={i} part="tower" />
      ))}

      <Crowns />
      <Rooftops />
      <StreetFurniture />
      <Vehicles />
    </group>
  );
}
