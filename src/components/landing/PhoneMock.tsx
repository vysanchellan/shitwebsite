'use client';

import { useEffect, useRef, useState } from 'react';

const FACTORS = [
  { label: 'Systolic blood pressure', value: '142 mmHg', weight: 0.82, tone: 'risk' },
  { label: 'Total cholesterol', value: '5.9 mmol/L', weight: 0.61, tone: 'warn' },
  { label: 'Fasting glucose', value: 'Within range', weight: 0.24, tone: 'ok' },
  { label: 'Age', value: '54 years', weight: 0.48, tone: 'warn' },
];

const TONE: Record<string, string> = {
  risk: 'var(--color-risk)',
  warn: 'var(--color-warn)',
  ok: 'var(--color-ok)',
};

/**
 * Mobile dashboard preview (spec §5.1). Every value shown is illustrative —
 * the label under the device says so, and nothing here is a real patient record.
 */
export function PhoneMock() {
  const ref = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setLive(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && (setLive(true), io.disconnect()),
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // 0 → 1 sweep of the gauge. 0.58 of a 270° arc.
  const arc = 2 * Math.PI * 52 * 0.75;
  const filled = live ? arc * 0.58 : 0;

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[19rem]">
      {/* Halo */}

      <div className="relative border border-white/12 bg-gradient-to-b from-navy-3/80 to-ink p-2.5 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.9)]">
        <div className="relative aspect-[9/19.2] overflow-hidden bg-gradient-to-b from-navy-2 via-navy to-ink">
          {/* Status bar + island */}
          <div className="flex items-center justify-between px-5 pt-3.5">
            <span className="micro-sm text-paper/55">9:41</span>
            <span className="h-4 w-14 rounded-full bg-black/70" />
            <span className="flex items-center gap-1" aria-hidden="true">
              <span className="h-2 w-2 rounded-[1px] bg-paper/45" />
              <span className="h-2.5 w-4 rounded-[2px] border border-paper/45" />
            </span>
          </div>

          {/* Header */}
          <div className="mt-5 px-5">
            <p className="micro-sm text-cyan/70">Risk Analysis</p>
            <h3 className="mt-1.5 font-display text-lg leading-tight font-semibold text-paper">
              Heart Disease
            </h3>
          </div>

          {/* Gauge */}
          <div className="relative mt-4 flex justify-center">
            <svg viewBox="0 0 130 130" className="h-36 w-36 -rotate-[135deg]">
              <circle
                cx="65"
                cy="65"
                r="52"
                fill="none"
                stroke="rgba(255,255,255,0.09)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={`${arc} 999`}
              />
              <circle
                cx="65"
                cy="65"
                r="52"
                fill="none"
                stroke="url(#rs-gauge)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={`${filled} 999`}
                style={{ transition: 'stroke-dasharray 1.9s var(--ease-out-expo) 0.2s' }}
              />
              <defs>
                <linearGradient id="rs-gauge" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="var(--color-cyan)" />
                  <stop offset="55%" stopColor="var(--color-warn)" />
                  <stop offset="100%" stopColor="var(--color-risk)" />
                </linearGradient>
              </defs>
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
              <span className="font-display text-[2.4rem] leading-none font-semibold tracking-[-0.04em] text-paper">
                Mod
              </span>
              <span className="mt-1.5 micro-sm text-warn">Elevated band</span>
            </div>
          </div>

          {/* Factors */}
          <div className="mt-2 px-5">
            <p className="micro-sm text-paper/35">Contributing factors</p>
            <ul className="mt-2.5 space-y-2.5">
              {FACTORS.map((f, i) => (
                <li key={f.label}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[0.66rem] text-paper/72">{f.label}</span>
                    <span className="shrink-0 font-mono text-[0.6rem] text-paper/45">
                      {f.value}
                    </span>
                  </div>
                  <div className="mt-1 h-[3px] overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: live ? `${f.weight * 100}%` : '0%',
                        background: TONE[f.tone],
                        transition: `width 1.2s var(--ease-out-expo) ${0.5 + i * 0.12}s`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Clinician row */}
          <div className="mx-5 mt-4 flex items-center gap-2.5 border border-cyan/18 bg-cyan/8 px-3 py-2.5">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-cyan/20 font-mono text-[0.55rem] text-cyan">
              RS
            </span>
            <span className="text-[0.62rem] leading-tight text-paper/70">
              Discuss this estimate with your connected clinician.
            </span>
          </div>

          {/* Tab bar */}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-around border-t border-white/8 bg-ink/85 px-4 pt-2.5 pb-5 backdrop-blur">
            {['Home', 'Vitals', 'Risk', 'Profile'].map((t, i) => (
              <span
                key={t}
                className={`micro-sm ${i === 2 ? 'text-cyan' : 'text-paper/30'}`}
              >
                {t}
              </span>
            ))}
          </div>

          {/* Monitor sweep */}
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent,color-mix(in_oklab,var(--color-cyan)_7%,transparent),transparent)]"
            style={{ animation: 'rs-scan 7s var(--ease-in-out-quint) infinite' }}
            aria-hidden="true"
          />
        </div>
      </div>

      <p className="mt-4 text-center micro-sm text-paper/30">
        Illustrative interface preview · not a patient record
      </p>
    </div>
  );
}
