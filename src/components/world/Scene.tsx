'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { City } from './City';
import { CityBlocks } from './CityBlocks';
import { Drones, HeartHologram, Helix, MoleculeHologram, Motes, Pedestrians, PulseArches } from './Life';
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
};

export function detectQuality(): Quality {
  if (typeof window === 'undefined') {
    return { shadows: false, dpr: [1, 1.5], pedestrians: 16, drones: 7, motes: 500, multisampling: 0 };
  }
  const touch = window.matchMedia('(pointer: coarse)').matches;
  const cores = navigator.hardwareConcurrency ?? 4;
  const small = window.innerWidth < 900;
  const low = touch || small || cores <= 4;

  return low
    ? { shadows: false, dpr: [1, 1.4], pedestrians: 8, drones: 4, motes: 220, multisampling: 0 }
    : { shadows: true, dpr: [1, 1.7], pedestrians: 16, drones: 7, motes: 500, multisampling: 2 };
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
    light.current.position.set(px - 34, 46, pz - 40);
    light.current.target = target.current;
  });

  return (
    <directionalLight
      ref={light}
      color="#89a9e0"
      intensity={0.55}
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
    scene.fog = new THREE.FogExp2('#0b1228', 0.0042);
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

      <ambientLight intensity={0.3} color="#5d84c4" />
      <hemisphereLight args={['#2e4d80', '#05080f', 0.35]} />
      <Sun shadows={quality.shadows} />

      <City />
      <CityBlocks />
      <PulseArches />
      <HeartHologram position={[-40, 40, -44]} />
      <MoleculeHologram position={[40, 34, -44]} />
      <Helix position={[-24, 1, -14]} />
      <Drones count={quality.drones} />
      <Pedestrians count={quality.pedestrians} />
      <Motes count={quality.motes} />

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
        gl.toneMappingExposure = 1.05;
      }}
    >
      <color attach="background" args={['#070c1a']} />
      <Contents quality={quality} />

      <EffectComposer multisampling={quality.multisampling}>
        <Bloom
          intensity={0.95}
          luminanceThreshold={0.28}
          luminanceSmoothing={0.35}
          mipmapBlur
          radius={0.72}
        />
        <Vignette offset={0.26} darkness={0.62} eskil={false} />
      </EffectComposer>
    </Canvas>
  );
}
