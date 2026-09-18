'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { NODES } from '@/data/content';
import { ACCENT_HEX } from './layout';
import { glowTexture } from './textures';
import { heightAt } from './terrain';
import { useWorld } from './store';

/**
 * The readable things. Each is a floating core over a light column, with a
 * billboarded label so the district can be navigated by sight rather than by
 * wandering into everything.
 */
export function Markers() {
  const nearby = useWorld((s) => s.nearby);
  const discovered = useWorld((s) => s.discovered);

  const cores = useRef<(THREE.Mesh | null)[]>([]);
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const groups = useRef<(THREE.Group | null)[]>([]);

  const glow = useMemo(() => glowTexture(), []);
  useFrame(({ clock, camera }) => {
    const t = clock.elapsedTime;
    for (let i = 0; i < NODES.length; i++) {
      const core = cores.current[i];
      const ring = rings.current[i];
      const isNear = nearby === NODES[i].id;

      if (core) {
        core.rotation.y = t * 0.8 + i;
        core.rotation.x = Math.sin(t * 0.6 + i) * 0.35;
        core.position.y = 2.5 + Math.sin(t * 1.4 + i * 0.7) * 0.18;
        const s = isNear ? 1.28 + Math.sin(t * 6) * 0.06 : 1;
        core.scale.setScalar(s);
      }

      if (ring) {
        // Expanding halo, faster and brighter when the player is in range.
        const speed = isNear ? 1.5 : 0.55;
        const k = (t * speed + i * 0.3) % 1;
        ring.scale.setScalar(0.8 + k * (isNear ? 3.4 : 2.2));
        const mat = ring.material as THREE.MeshBasicMaterial;
        mat.opacity = (1 - k) * (isNear ? 0.5 : 0.22);
      }
    }
  });

  return (
    <group>
      {NODES.map((node, i) => {
        const color = ACCENT_HEX[node.accent];
        const read = discovered.includes(node.id);
        const isNear = nearby === node.id;

        return (
          <group
            key={node.id}
            ref={(el) => {
              groups.current[i] = el;
            }}
            position={[node.position[0], heightAt(node.position[0], node.position[2]), node.position[2]]}
          >
            {/* Light column */}
            <mesh position={[0, 5, 0]}>
              <cylinderGeometry args={[0.22, 0.42, 10, 10, 1, true]} />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={read ? 0.05 : isNear ? 0.2 : 0.11}
                side={THREE.DoubleSide}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                toneMapped={false}
              />
            </mesh>

            {/* Floating core */}
            <mesh
              ref={(el) => {
                cores.current[i] = el;
              }}
              position={[0, 2.5, 0]}
            >
              <octahedronGeometry args={[0.42, 0]} />
              <meshBasicMaterial
                color={read ? '#8ea3b8' : color}
                toneMapped={false}
                wireframe={read}
              />
            </mesh>

            {/* Base disc */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
              <ringGeometry args={[0.9, 1.15, 40]} />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={read ? 0.22 : 0.62}
                side={THREE.DoubleSide}
                toneMapped={false}
              />
            </mesh>

            {/* Pulse halo */}
            <mesh
              ref={(el) => {
                rings.current[i] = el;
              }}
              rotation={[-Math.PI / 2, 0, 0]}
              position={[0, 0.08, 0]}
            >
              <ringGeometry args={[1.0, 1.12, 40]} />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={0.3}
                side={THREE.DoubleSide}
                depthWrite={false}
                toneMapped={false}
              />
            </mesh>

            {/* Soft bloom seed */}
            <sprite position={[0, 2.5, 0]} scale={[3.6, 3.6, 1]}>
              <spriteMaterial
                map={glow}
                color={color}
                transparent
                opacity={read ? 0.1 : isNear ? 0.38 : 0.2}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                toneMapped={false}
              />
            </sprite>

            {/* Step numeral for the boulevard, so the order reads at a glance */}
            {node.step && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]}>
                <circleGeometry args={[0.86, 32]} />
                <meshBasicMaterial color={color} transparent opacity={0.1} toneMapped={false} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}
