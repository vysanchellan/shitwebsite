'use client';

import { useEffect, useState } from 'react';
import { Mark } from '@/components/ui/Wordmark';

/**
 * A short curtain on first arrival — once per tab, skippable by any input, and
 * skipped entirely under reduced motion. Luxury houses earn the pause; we borrow
 * about a second and a half of it.
 */
export function Intro() {
  const [phase, setPhase] = useState<'idle' | 'run' | 'lift' | 'gone'>('idle');
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let seen = false;
    try {
      seen = sessionStorage.getItem('rs-intro') === '1';
    } catch {
      seen = false;
    }

    if (reduced || seen) {
      setPhase('gone');
      return;
    }

    try {
      sessionStorage.setItem('rs-intro', '1');
    } catch {
      /* private mode — show the intro, just do not remember it */
    }

    setPhase('run');
    document.body.style.overflow = 'hidden';

    const start = performance.now();
    const DURATION = 1400;
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      setPct(Math.round((1 - Math.pow(1 - t, 3)) * 100));
      if (t < 1) raf = requestAnimationFrame(tick);
      else {
        setPhase('lift');
        window.setTimeout(() => {
          setPhase('gone');
          document.body.style.overflow = '';
        }, 900);
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = '';
    };
  }, []);

  if (phase === 'gone') return null;

  return (
    <div
      className="fixed inset-0 z-[95] flex flex-col justify-between bg-ink px-5 py-8 transition-transform duration-[900ms] ease-[var(--ease-in-out-quint)] sm:px-8 lg:px-12"
      style={{ transform: phase === 'lift' ? 'translateY(-101%)' : 'none' }}
      aria-hidden="true"
    >
      <div className="column-rules absolute inset-0" />

      <div className="relative flex items-center gap-3 text-paper">
        <Mark className="h-7 w-7 text-brass" />
        <span className="micro text-paper/50">RiskSense AI</span>
      </div>

      <div className="relative flex items-end justify-between gap-6">
        <p className="max-w-md micro-sm leading-[1.9] text-paper/35">
          Loading the district — decision-support risk intelligence for heart disease and diabetes.
        </p>
        <span className="font-display text-[clamp(4rem,16vw,12rem)] leading-[0.8] font-normal tracking-[-0.06em] text-paper tabular-nums">
          {String(pct).padStart(3, '0')}
        </span>
      </div>

      <div className="relative mt-6 h-px w-full bg-white/10">
        <span
          className="absolute inset-y-0 left-0 bg-brass"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
