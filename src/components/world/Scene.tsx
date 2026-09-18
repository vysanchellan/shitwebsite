'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Aincrad } from './Aincrad';
import { CityBlocks } from './CityBlocks';
import { Environment, InsurerBoards } from './Environment';
import { Precinct } from './Precinct';
import { Drones, Motes, Pedestrians } from './Life';
import { Markers } from './Markers';
import { Player } from './Player';
import { useWorld } from './store';

export type Quality = {
  shadows: boolean;
  dpr: [number, number];
  pedestrians: number;
  drones: number;
  motes: number;
  multisampling: number;
  /** Falling blossom, the heaviest per-frame cost in the decorative layer. */
  petals: number;
  /** Floating islands, which also sets the size of the bird flock. */
  islands: number;
};

export function detectQuality(): Quality {
  if (typeof window === 'undefined') {
    return { shadows: false, dpr: [1, 1.5], pedestrians: 16, drones: 7, motes: 500, multisampling: 0, petals: 420, islands: 9 };
  }
  const touch = window.matchMedia('(pointer: coarse)').matches;
  const cores = navigator.hardwareConcurrency ?? 4;
  const small = window.innerWidth < 900;
  const low = touch || small || cores <= 4;

  return low
    ? { shadows: false, dpr: [1, 1.4], pedestrians: 8, drones: 4, motes: 220, multisampling: 0, petals: 150, islands: 5 }
    : { shadows: true, dpr: [1, 1.7], pedestrians: 16, drones: 7, motes: 500, multisampling: 2, petals: 420, islands: 9 };
}

/**
 * The dusk key light. Its shadow camera is small and follows the player, which
 * keeps shadow resolution usable across a district this size.
 */
function Sun({ shadows }: { shadows: boolean }) {
  const light = useRef<THREE.DirectionalLight>(null);
  const target = useRef<THREE.Object3D>(new THREE.Object3D());
  const { scene } = useThree();

  useEffect(() => {
    const t = target.current;
    scene.add(t);
    return () => {
      scene.remove(t);
    };
  }, [scene]);

  useFrame(() => {
    if (!light.current) return;
    const [px, pz] = useWorld.getState().player;
    target.current.position.set(px, 0, pz);
    light.current.position.set(px - 52, 40, pz - 64);
    light.current.target = target.current;
  });

  return (
    <directionalLight
      ref={light}
      color="#ffb884"
      intensity={0.8}
      castShadow={shadows}
      shadow-mapSize={[1024, 1024]}
      shadow-camera-near={1}
      shadow-camera-far={140}
      shadow-camera-left={-38}
      shadow-camera-right={38}
      shadow-camera-top={38}
      shadow-camera-bottom={-38}
      shadow-bias={-0.0012}
      shadow-normalBias={0.04}
    />
  );
}

function Atmosphere() {
  const { scene } = useThree();

  useEffect(() => {
    const prev = scene.fog;
    scene.fog = new THREE.FogExp2('#2a2740', 0.0029);
    return () => {
      scene.fog = prev;
    };
  }, [scene]);

  return null;
}

function Contents({ quality }: { quality: Quality }) {
  return (
    <>
      <Atmosphere />

      <ambientLight intensity={0.62} color="#959cbe" />
      <hemisphereLight args={['#6f85b8', '#241c1e', 0.85]} />
      <Sun shadows={quality.shadows} />

      <Environment />
      <CityBlocks />

      {/* The precinct itself, built from Park Square's floor plans. */}
      <Precinct />
      <InsurerBoards />

      <Drones count={quality.drones} />
      <Pedestrians count={quality.pedestrians} />
      <Motes count={quality.motes} />

      <Aincrad quality={quality} />

      <Markers />
      <Player />
    </>
  );
}

export function Scene({ quality }: { quality: Quality }) {
  return (
    <Canvas
      shadows={quality.shadows}
      dpr={quality.dpr}
      camera={{ fov: 62, near: 0.1, far: 1400, position: [0, 5, 82] }}
      gl={{ antialias: quality.multisampling === 0, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.22;
      }}
    >
      <color attach="background" args={['#121a30']} />
      <Contents quality={quality} />

      <EffectComposer multisampling={quality.multisampling}>
        <Bloom
          intensity={0.95}
          luminanceThreshold={0.28}
          luminanceSmoothing={0.35}
          mipmapBlur
          radius={0.72}
          resolutionScale={0.5}
        />
        <Vignette offset={0.26} darkness={0.62} eskil={false} />
      </EffectComposer>
    </Canvas>
  );
}
