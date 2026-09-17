'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DISTRICTS, NODE_COUNT } from '@/data/content';
import { Mark } from '@/components/ui/Wordmark';
import { Hud } from './Hud';
import { FullMap } from './MiniMap';
import { Panel } from './Panel';
import { Scene, detectQuality, type Quality } from './Scene';
import { TouchControls } from './TouchControls';
import { addLook, keyDown, keyUp, releaseAll } from './input';
import { useWorld } from './store';

const LOOK_SENSITIVITY = 0.0022;

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (c.getContext('webgl2') || c.getContext('webgl')),
    );
  } catch {
    return false;
  }
}

/** Shown when the browser cannot render the district at all. */
function NoWebGL() {
  return (
    <div className="flex min-h-[100svh] flex-col items-center justify-center gap-6 bg-ink px-6 text-center">
      <Mark className="h-10 w-10 text-brass" />
      <h1 className="display-m max-w-xl text-paper text-balance">
        This browser can&rsquo;t render the district.
      </h1>
      <p className="max-w-md text-[0.95rem] leading-[1.7] text-paper/55">
        The 3D world needs WebGL. Every panel in it is also published as plain text — nothing is
        lost by reading it that way.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/overview" className="rounded-full bg-brass px-6 py-3.5 micro text-ink">
          Read the text version
        </Link>
        <Link
          href="/"
          className="rounded-full border border-white/16 px-6 py-3.5 micro text-paper/75 transition-colors hover:border-brass/60 hover:text-brass"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}

/** The brief. Sets expectations before the player is dropped into the world. */
function StartCard({ onStart, touch }: { onStart: () => void; touch: boolean }) {
  return (
    <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-ink/78 p-4 backdrop-blur-md">
      <div className="animate-rise relative w-full max-w-2xl overflow-hidden border border-white/12 bg-graphite/90 p-7 sm:p-10">
        <span className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-brass to-transparent" aria-hidden="true" />

        <div className="flex items-center gap-3">
          <Mark className="h-6 w-6 text-brass" />
          <p className="micro text-brass">RiskSense District</p>
        </div>

        <h1 className="mt-6 display-l text-paper text-balance">
          Walk it, don&rsquo;t <span className="editorial text-brass">scroll</span> it.
        </h1>

        <p className="mt-5 max-w-[56ch] text-[0.98rem] leading-[1.68] text-paper/62">
          Every part of RiskSense AI is a building here: the two risk models, the six-step journey,
          the insurer pavilion, the clinician link, the security vault. Find the glowing
          markers and read what they hold. There are {NODE_COUNT} across {DISTRICTS.length}{' '}
          districts.
        </p>

        <dl className="mt-8 grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2">
          {(touch
            ? [
                { k: 'Move', v: 'Left thumbstick' },
                { k: 'Look', v: 'Drag the right side' },
                { k: 'Read', v: 'Tap the Read button' },
                { k: 'Map', v: 'Map button, top right' },
              ]
            : [
                { k: 'Move', v: 'W A S D · Shift to sprint' },
                { k: 'Look', v: 'Mouse' },
                { k: 'Read', v: 'E when a marker lights up' },
                { k: 'Map', v: 'M · Esc releases the cursor' },
              ]
          ).map((row) => (
            <div key={row.k} className="flex items-baseline gap-4 bg-graphite p-4">
              <dt className="micro-sm w-12 shrink-0 text-brass/60">{row.k}</dt>
              <dd className="text-[0.88rem] text-paper/72">{row.v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onStart}
            className="group inline-flex items-center gap-3 rounded-full bg-brass px-7 py-4 micro text-ink transition-transform duration-500 ease-[var(--ease-out-expo)] hover:scale-[1.02]"
          >
            Enter the district
            <svg viewBox="0 0 14 14" className="h-3 w-3 transition-transform duration-500 group-hover:translate-x-1" fill="none" aria-hidden="true">
              <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <Link
            href="/overview"
            className="rounded-full border border-white/16 px-7 py-4 micro text-paper/70 transition-colors hover:border-brass/60 hover:text-brass"
          >
            Read it as a document
          </Link>
        </div>

        <p className="mt-6 micro-sm leading-[1.9] text-paper/28">
          Decision support only. RiskSense AI does not diagnose disease or replace professional
          medical advice.
        </p>
      </div>
    </div>
  );
}

/** Shown when the pointer lock is released mid-session. */
function PausedCard({ onResume }: { onResume: () => void }) {
  return (
    <div className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm border border-white/12 bg-graphite/90 p-7 text-center">
        <p className="micro text-brass">Paused</p>
        <h2 className="mt-4 display-m text-paper">Take your time.</h2>
        <p className="mt-4 text-[0.9rem] leading-[1.65] text-paper/55">
          The district is still there. Click to pick the cursor back up and keep walking.
        </p>
        <button
          type="button"
          onClick={onResume}
          className="mt-7 w-full rounded-full bg-brass px-6 py-3.5 micro text-ink"
        >
          Resume
        </button>
        <Link
          href="/"
          className="mt-3 block w-full rounded-full border border-white/14 px-6 py-3.5 micro text-paper/65 transition-colors hover:border-brass/50 hover:text-brass"
        >
          Exit to the website
        </Link>
      </div>
    </div>
  );
}

export function WorldShell() {
  const container = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const dragLast = useRef({ x: 0, y: 0 });
  /** True once a pointer lock has actually been held this session. */
  const wasLocked = useRef(false);

  const [support, setSupport] = useState<'unknown' | 'ok' | 'none'>('unknown');
  const [quality, setQuality] = useState<Quality | null>(null);
  const [touch, setTouch] = useState(false);
  const [locked, setLocked] = useState(false);

  const started = useWorld((s) => s.started);
  const paused = useWorld((s) => s.paused);
  const active = useWorld((s) => s.active);
  const mapOpen = useWorld((s) => s.mapOpen);
  const start = useWorld((s) => s.start);
  const open = useWorld((s) => s.open);
  const toggleMap = useWorld((s) => s.toggleMap);
  const setMode = useWorld((s) => s.setMode);

  /* --- capability detection --------------------------------------------- */
  useEffect(() => {
    if (!hasWebGL()) {
      setSupport('none');
      return;
    }
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    setTouch(coarse);
    setQuality(detectQuality());
    setMode(coarse ? 'touch' : 'idle');
    setSupport('ok');
  }, [setMode]);

  /* --- pointer lock ------------------------------------------------------ */
  const requestLock = useCallback(() => {
    if (touch) return;
    const el = container.current;
    if (!el || document.pointerLockElement === el) return;
    try {
      const res = el.requestPointerLock() as unknown as Promise<void> | undefined;
      // Chrome returns a promise; a rejection here is normal (e.g. the Escape
      // cooldown) and simply leaves the player in the click-to-resume state.
      if (res && typeof res.catch === 'function') res.catch(() => {});
    } catch {
      /* ignore — the paused card offers a manual retry */
    }
  }, [touch]);

  useEffect(() => {
    const onChange = () => {
      const isLocked = document.pointerLockElement === container.current;
      setLocked(isLocked);
      setMode(touch ? 'touch' : isLocked ? 'locked' : 'idle');

      if (isLocked) {
        wasLocked.current = true;
        return;
      }

      releaseAll();

      // Only a lock we actually held and then lost is a pause. A request that
      // never engaged just leaves the player in drag-to-look, which still works.
      const held = wasLocked.current;
      wasLocked.current = false;
      if (!held) return;

      const s = useWorld.getState();
      if (s.started && !s.active && !s.mapOpen) useWorld.setState({ paused: true });
    };
    document.addEventListener('pointerlockchange', onChange);
    return () => document.removeEventListener('pointerlockchange', onChange);
  }, [setMode, touch]);

  /* --- mouse look -------------------------------------------------------- */
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== container.current) return;
      addLook(e.movementX * LOOK_SENSITIVITY, e.movementY * LOOK_SENSITIVITY);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  /* --- drag-to-look fallback when the lock is unavailable ---------------- */
  useEffect(() => {
    if (touch) return;

    const down = (e: MouseEvent) => {
      if (locked || useWorld.getState().paused) return;
      if ((e.target as HTMLElement).closest('button, a, [role="dialog"]')) return;
      dragging.current = true;
      dragLast.current = { x: e.clientX, y: e.clientY };
    };
    const move = (e: MouseEvent) => {
      if (!dragging.current) return;
      addLook(
        (e.clientX - dragLast.current.x) * LOOK_SENSITIVITY,
        (e.clientY - dragLast.current.y) * LOOK_SENSITIVITY,
      );
      dragLast.current = { x: e.clientX, y: e.clientY };
    };
    const up = () => {
      dragging.current = false;
    };

    window.addEventListener('mousedown', down);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousedown', down);
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, [locked, touch]);

  /* --- keyboard ---------------------------------------------------------- */
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const s = useWorld.getState();

      if (e.code === 'KeyM' && !s.active) {
        e.preventDefault();
        toggleMap();
        if (!s.mapOpen) document.exitPointerLock?.();
        return;
      }

      if (s.paused) return;

      if (e.code === 'KeyE' && s.nearby) {
        e.preventDefault();
        open(s.nearby);
        return;
      }

      keyDown(e.code);
    };

    const up = (e: KeyboardEvent) => keyUp(e.code);
    const blur = () => releaseAll();

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, [open, toggleMap]);

  /* --- release the cursor whenever something needs reading --------------- */
  useEffect(() => {
    if (active || mapOpen) {
      releaseAll();
      document.exitPointerLock?.();
    }
  }, [active, mapOpen]);

  /* --- keep the page itself from scrolling ------------------------------- */
  useEffect(() => {
    document.documentElement.classList.add('world-lock');
    document.body.classList.add('world-lock');
    return () => {
      document.documentElement.classList.remove('world-lock');
      document.body.classList.remove('world-lock');
      releaseAll();
    };
  }, []);

  const onStart = useCallback(() => {
    start();
    requestLock();
  }, [start, requestLock]);

  const showPaused = useMemo(
    () => started && paused && !active && !mapOpen,
    [started, paused, active, mapOpen],
  );

  if (support === 'none') return <NoWebGL />;

  return (
    <div
      ref={container}
      onClick={() => {
        const s = useWorld.getState();
        if (s.started && !s.paused && !locked) requestLock();
      }}
      className="relative h-[100svh] w-full overflow-hidden bg-ink"
    >
      {quality && <Scene quality={quality} />}

      {started && <Hud />}
      {started && touch && !paused && <TouchControls />}

      <Panel />
      <FullMap />

      {!started && support === 'ok' && <StartCard onStart={onStart} touch={touch} />}
      {showPaused && (
        <PausedCard
          onResume={() => {
            useWorld.setState({ paused: false });
            requestLock();
          }}
        />
      )}

      {/* Click-to-look hint when the lock could not be taken */}
      {started && !paused && !locked && !touch && (
        <p className="pointer-events-none absolute bottom-28 left-1/2 hidden -translate-x-1/2 border border-paper/12 bg-ink/75 px-4 py-2 micro-sm text-paper/45 backdrop-blur-md sm:block">
          Click to capture the cursor · or drag to look
        </p>
      )}
    </div>
  );
}
