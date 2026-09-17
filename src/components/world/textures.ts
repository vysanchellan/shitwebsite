'use client';

import * as THREE from 'three';

/** Canvas-backed textures, built once per process and cached by key. */
const cache = new Map<string, THREE.CanvasTexture>();

function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return { c, ctx: c.getContext('2d')! };
}

function finish(key: string, c: HTMLCanvasElement, srgb = true) {
  const tex = new THREE.CanvasTexture(c);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  cache.set(key, tex);
  return tex;
}

function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A facade of lit and dark windows. Used as an emissive map so towers read as
 * occupied at dusk without a single external asset.
 */
export function windowTexture(seed: number, cols = 14, rows = 26, tint = '#e8cf9c') {
  const key = `win-${seed}-${cols}-${rows}-${tint}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const W = 256;
  const H = 512;
  const { c, ctx } = canvas(W, H);
  const rng = seeded(seed);

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, W, H);

  const cw = W / cols;
  const ch = H / rows;
  const pad = Math.min(cw, ch) * 0.26;

  for (let y = 0; y < rows; y++) {
    // Whole floors go dark now and then — it reads as a real building.
    const floorLit = rng() > 0.18;
    for (let x = 0; x < cols; x++) {
      const lit = floorLit && rng() > 0.4;
      if (!lit) continue;
      const warm = rng();
      ctx.fillStyle =
        warm > 0.82 ? '#ffd9a8' : warm > 0.55 ? tint : `${tint}bb`;
      ctx.globalAlpha = 0.45 + rng() * 0.55;
      ctx.fillRect(x * cw + pad, y * ch + pad, cw - pad * 2, ch - pad * 2);
    }
  }
  ctx.globalAlpha = 1;

  const tex = finish(key, c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/** Ground: worn flagstone, warm and mottled, with a faint joint pattern. */
export function groundTexture() {
  const key = 'ground';
  const hit = cache.get(key);
  if (hit) return hit;

  const S = 512;
  const { c, ctx } = canvas(S, S);
  const rng = seeded(7);

  ctx.fillStyle = '#241d22';
  ctx.fillRect(0, 0, S, S);

  // Mottling
  for (let i = 0; i < 2600; i++) {
    const r = 1 + rng() * 14;
    ctx.fillStyle = rng() > 0.5 ? 'rgba(255,226,190,0.02)' : 'rgba(0,0,0,0.055)';
    ctx.beginPath();
    ctx.arc(rng() * S, rng() * S, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Paving joints
  ctx.strokeStyle = 'rgba(0,0,0,0.22)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 8; i++) {
    const p = (i / 8) * S;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, S);
    ctx.moveTo(0, p);
    ctx.lineTo(S, p);
    ctx.stroke();
  }

  const tex = finish(key, c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(26, 26);
  return tex;
}

/** Road surface with a dashed centre line. */
export function roadTexture() {
  const key = 'road';
  const hit = cache.get(key);
  if (hit) return hit;

  const W = 128;
  const H = 256;
  const { c, ctx } = canvas(W, H);

  ctx.fillStyle = '#1d1a24';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = 'rgba(194,163,107,0.30)';
  const dash = 34;
  for (let y = 0; y < H; y += dash * 2) {
    ctx.fillRect(W / 2 - 2, y, 4, dash);
  }

  ctx.fillStyle = 'rgba(232,214,184,0.10)';
  ctx.fillRect(6, 0, 2, H);
  ctx.fillRect(W - 8, 0, 2, H);

  const tex = finish(key, c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * Signage. Drawn with the page's own type stack so the district's lettering
 * matches the website's — tracked-out uppercase on a transparent field.
 */
export function signTexture(
  title: string,
  sub?: string,
  color = '#d8b878',
  width = 1024,
) {
  const key = `sign-${title}-${sub ?? ''}-${color}-${width}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const H = 256;
  const { c, ctx } = canvas(width, H);

  ctx.clearRect(0, 0, width, H);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // The district's signage speaks the site's language: a Didone for the name,
  // wide-tracked geometric caps for the qualifier.
  const stack = '"Bodoni Moda", Didot, Georgia, serif';
  const subStack = 'Jost, "Helvetica Neue", Arial, sans-serif';

  // Tracking: use native letterSpacing where available, else space the string.
  const supportsSpacing = 'letterSpacing' in ctx;
  const space = (s: string, n = 1) =>
    supportsSpacing ? s : s.split('').join(' '.repeat(n));

  /** Shrinks the type until the line fits — long district names must not clip. */
  const fit = (text: string, start: number, weight: number, family: string, max: number) => {
    let size = start;
    ctx.font = `${weight} ${size}px ${family}`;
    while (ctx.measureText(text).width > max && size > 14) {
      size -= 2;
      ctx.font = `${weight} ${size}px ${family}`;
    }
    return size;
  };

  const inset = width * 0.06;
  const maxWidth = width - inset * 2;
  const titleY = sub ? H * 0.42 : H * 0.5;
  const titleText = space(title.toUpperCase());

  ctx.save();
  if (supportsSpacing) ctx.letterSpacing = '14px';
  fit(titleText, sub ? 76 : 88, 600, stack, maxWidth);
  ctx.shadowColor = color;
  ctx.shadowBlur = 34;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(titleText, width / 2, titleY);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.55;
  ctx.fillText(titleText, width / 2, titleY);
  ctx.restore();

  if (sub) {
    const subText = space(sub.toUpperCase(), 1);
    ctx.save();
    if (supportsSpacing) ctx.letterSpacing = '9px';
    fit(subText, 32, 400, subStack, maxWidth);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.85;
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.fillText(subText, width / 2, H * 0.72);
    ctx.restore();
  }

  return finish(key, c);
}

/** Numerals for the six boulevard plinths. */
export function numeralTexture(n: string, color = '#b08d4e') {
  const key = `num-${n}-${color}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const S = 256;
  const { c, ctx } = canvas(S, S);
  ctx.clearRect(0, 0, S, S);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '400 168px "Bodoni Moda", Didot, Georgia, serif';
  ctx.shadowColor = color;
  ctx.shadowBlur = 40;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(n, S / 2, S / 2 + 6);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.5;
  ctx.fillText(n, S / 2, S / 2 + 6);

  return finish(key, c);
}

/** An insurer's generated lockup, rendered onto its pavilion kiosk. */
export function insurerTexture(mark: string, name: string, hue: string) {
  const key = `ins-${mark}-${name}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const W = 512;
  const H = 256;
  const { c, ctx } = canvas(W, H);

  ctx.fillStyle = 'rgba(14,11,16,0.93)';
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = `${hue}66`;
  ctx.lineWidth = 3;
  ctx.strokeRect(10, 10, W - 20, H - 20);

  // Mark tile
  ctx.fillStyle = `${hue}26`;
  ctx.fillRect(38, 62, 110, 110);
  ctx.strokeStyle = `${hue}aa`;
  ctx.lineWidth = 2;
  ctx.strokeRect(38, 62, 110, 110);

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillStyle = hue;
  ctx.font = '400 54px "Bodoni Moda", Didot, Georgia, serif';
  ctx.shadowColor = hue;
  ctx.shadowBlur = 22;
  ctx.fillText(mark, 93, 119);
  ctx.shadowBlur = 0;

  ctx.textAlign = 'left';
  ctx.fillStyle = '#efebe3';
  ctx.font = '400 38px Jost, "Helvetica Neue", Arial, sans-serif';
  const words = name.split(' ');
  const line1 = words.slice(0, 2).join(' ');
  const line2 = words.slice(2).join(' ');
  ctx.fillText(line1, 176, line2 ? 100 : 118);
  if (line2) ctx.fillText(line2, 176, 146);

  ctx.fillStyle = '#c08a3e';
  ctx.font = '400 21px Jost, "Helvetica Neue", Arial, sans-serif';
  ctx.fillText('DEMO PROVIDER', 176, 196);

  return finish(key, c);
}

/** A soft radial sprite — used for lamp glow, marker halos and neon bloom. */
export function glowTexture() {
  const key = 'glow';
  const hit = cache.get(key);
  if (hit) return hit;

  const S = 128;
  const { c, ctx } = canvas(S, S);
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.28, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);

  return finish(key, c);
}

export function disposeTextures() {
  for (const tex of cache.values()) tex.dispose();
  cache.clear();
}
