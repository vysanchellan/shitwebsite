'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

/**
 * The hero: the district itself, at the hour it is always set in.
 *
 * Drawn as a single full-screen fragment shader rather than a scene — one draw
 * call, no geometry, no postprocessing, no particle buffers to march on the
 * CPU. That matters twice over: the old ribbon-and-motes hero was both generic
 * and the heaviest thing on the page, and a busy main thread on this page stops
 * the whole site from revealing itself.
 *
 * What it draws, back to front: sky, sun, cloud sheets, two floating islands,
 * three parallaxed ranks of skyline with lit windows on the nearest, and haze.
 */

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    // The quad is already in clip space; skip the matrices entirely.
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  uniform float uTime;
  uniform float uAspect;
  uniform vec2  uPointer;
  uniform float uReveal;

  uniform vec3 uZenith;
  uniform vec3 uMid;
  uniform vec3 uHorizon;
  uniform vec3 uSun;
  uniform vec3 uHaze;

  float hash11(float p) {
    p = fract(p * 0.1031);
    p *= p + 33.33;
    return fract((p + p) * p);
  }

  float hash21(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
      mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x),
      f.y);
  }

  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
    return v;
  }

  /* A rank of buildings. Returns 1 below the roofline, 0 above it. */
  float skyline(vec2 uv, float scale, float seed, float base, out float lit) {
    float x = uv.x * scale + seed * 17.0;
    float col = floor(x);
    float w = fract(x);

    float h = base + hash11(col + seed) * 0.10;
    // A few of them are towers rather than blocks.
    h += step(0.87, hash11(col * 1.7 + seed * 3.0)) * 0.16;
    // A narrow gap between neighbours reads as separate buildings.
    float gap = smoothstep(0.0, 0.03, w) * smoothstep(1.0, 0.97, w);
    h *= mix(0.92, 1.0, gap);

    // Lit windows on a coarse grid, biased so whole floors go dark.
    vec2 cell = vec2(col, floor(uv.y * scale * 2.4));
    float on = step(0.62, hash21(cell + seed)) * step(0.35, hash21(cell.yx * 1.3 + seed));
    float inside = step(uv.y, h) * step(0.14, uv.y / max(h, 0.001));
    vec2 f = fract(vec2(x, uv.y * scale * 2.4));
    float pane = smoothstep(0.30, 0.38, f.x) * smoothstep(0.78, 0.70, f.x)
               * smoothstep(0.30, 0.38, f.y) * smoothstep(0.78, 0.70, f.y);
    lit = on * inside * pane;

    return step(uv.y, h);
  }

  /* A floating island: a shallow dome over a tapering keel. */
  float island(vec2 uv, vec2 c, float r) {
    vec2 d = uv - c;
    d.x /= r;
    d.y /= r * 0.32;
    float cap = 1.0 - smoothstep(0.85, 1.0, length(d));

    vec2 k = uv - c;
    k.x /= r * (0.72 + k.y * 2.2);
    float keel = step(k.y, 0.0) * step(-r * 1.9, k.y) * (1.0 - smoothstep(0.75, 1.0, abs(k.x)));

    return clamp(max(cap, keel), 0.0, 1.0);
  }

  void main() {
    vec2 uv = vUv;
    // Correct for aspect on the horizontal only; the horizon stays put.
    vec2 p = vec2((uv.x - 0.5) * uAspect + 0.5, uv.y);

    float drift = uTime * 0.006;
    vec2 par = uPointer * 0.012;

    /* Sky ------------------------------------------------------------- */
    float h = uv.y;
    vec3 col = mix(uHorizon, uMid, smoothstep(0.30, 0.56, h));
    col = mix(col, uZenith, smoothstep(0.52, 1.0, h));

    /* Sun -------------------------------------------------------------- */
    vec2 sunPos = vec2(0.815 + par.x * 0.4, 0.455 + par.y * 0.4);
    vec2 sd = vec2((p.x - (0.5 + (sunPos.x - 0.5) * uAspect)), uv.y - sunPos.y);
    float sr = length(sd * vec2(1.0, 1.35));
    col += uSun * smoothstep(0.038, 0.028, sr) * 1.15;
    col += uSun * pow(max(0.0, 1.0 - sr * 2.6), 3.0) * 0.40;
    col += uSun * pow(max(0.0, 1.0 - abs(uv.y - sunPos.y) * 5.5), 4.0) * 0.16;

    /* Cloud sheets ------------------------------------------------------ */
    vec2 cp = vec2(p.x * 2.1 + drift, (uv.y - 0.36) * 6.5);
    float cloud = fbm(cp * 1.6);
    cloud = smoothstep(0.50, 0.86, cloud);
    cloud *= smoothstep(0.30, 0.44, uv.y) * smoothstep(0.92, 0.55, uv.y);
    vec3 cloudCol = mix(uHaze * 0.55, uSun * 1.1, 0.42);
    col = mix(col, cloudCol, cloud * 0.55);

    /* Floating islands -------------------------------------------------- */
    float isl = island(vec2(p.x + par.x * 1.6, uv.y + par.y * 0.6), vec2(0.60, 0.635), 0.105);
    isl = max(isl, island(vec2(p.x + par.x * 1.1, uv.y + par.y * 0.4), vec2(0.89, 0.70), 0.068));
    col = mix(col, mix(uHaze * 0.42, vec3(0.10, 0.09, 0.13), 0.55), isl * 0.92);

    /* Skyline: three ranks, far to near --------------------------------- */
    float lit;
    float far = skyline(vec2(p.x * 0.55 + drift * 0.5 + par.x * 0.5, uv.y), 26.0, 1.0, 0.300, lit);
    col = mix(col, mix(uHaze, vec3(0.13, 0.12, 0.17), 0.45), far * 0.80);
    col += uSun * lit * far * 0.12;

    float mid = skyline(vec2(p.x * 0.80 + drift * 1.1 + par.x * 1.0, uv.y), 17.0, 5.0, 0.250, lit);
    col = mix(col, mix(uHaze * 0.5, vec3(0.085, 0.078, 0.11), 0.72), mid * 0.90);
    col += uSun * lit * mid * 0.30;

    float near = skyline(vec2(p.x * 1.10 + drift * 2.0 + par.x * 1.8, uv.y), 10.0, 11.0, 0.185, lit);
    col = mix(col, vec3(0.040, 0.036, 0.055), near * 0.96);
    col += mix(uSun, vec3(1.0, 0.88, 0.68), 0.4) * lit * near * 0.55;

    /* Ground haze and vignette ------------------------------------------ */
    col = mix(col, uHaze * 0.30, smoothstep(0.26, 0.0, uv.y) * 0.55);

    float vig = smoothstep(1.45, 0.45, length((uv - 0.5) * vec2(uAspect * 0.8, 1.05)));
    col *= 0.58 + vig * 0.42;

    // A little grain keeps the gradients from banding on cheap panels.
    col += (hash21(uv * 900.0 + uTime) - 0.5) * 0.016;

    gl_FragColor = vec4(col * uReveal, 1.0);
  }
`;

function Vista() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAspect: { value: 1 },
      uPointer: { value: new THREE.Vector2() },
      uReveal: { value: 0 },
      uZenith: { value: new THREE.Color('#141a35') },
      uMid: { value: new THREE.Color('#3b4574') },
      uHorizon: { value: new THREE.Color('#c87a48') },
      uSun: { value: new THREE.Color('#ffb877') },
      uHaze: { value: new THREE.Color('#5d5570') },
    }),
    [],
  );

  useEffect(() => {
    uniforms.uAspect.value = size.width / Math.max(1, size.height);
  }, [size, uniforms]);

  useFrame(({ pointer }, dt) => {
    const d = Math.min(dt, 0.05);
    uniforms.uTime.value += d;
    // Fade the whole vista up once, so it arrives rather than pops.
    uniforms.uReveal.value = Math.min(1, uniforms.uReveal.value + d * 0.9);
    uniforms.uPointer.value.x += (pointer.x - uniforms.uPointer.value.x) * Math.min(1, d * 1.8);
    uniforms.uPointer.value.y += (pointer.y - uniforms.uPointer.value.y) * Math.min(1, d * 1.8);
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={mat}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

export default function HeroCanvas({ active = true }: { active?: boolean }) {
  return (
    <Canvas
      className="pointer-events-none"
      frameloop={active ? 'always' : 'never'}
      // One full-screen pass: there is nothing to alias, so a lower ceiling
      // costs nothing visually and saves a lot of fill on dense displays.
      dpr={[1, 1.35]}
      gl={{ antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'low-power' }}
      camera={{ position: [0, 0, 1] }}
    >
      <Vista />
    </Canvas>
  );
}
