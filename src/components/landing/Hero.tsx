'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { HERO } from '@/data/content';
import { RevealWords } from '@/components/ui/Reveal';

const HeroCanvas = dynamic(() => import('./HeroCanvas'), {
  ssr: false,
  loading: () => null,
});

export function Hero() {
  return (
    <section className="relative isolate flex min-h-[100svh] flex-col justify-between overflow-hidden bg-ink pt-24 pb-6 sm:pt-28">
      {/* Layer 1 — hairline grid */}
      <div className="grid-field absolute inset-0 -z-30 opacity-60" aria-hidden="true" />

      {/* Layer 2 — the ECG rig */}
      <div className="absolute inset-0 -z-20" aria-hidden="true">
        <HeroCanvas />
      </div>

      {/* Layer 3 — vignette so type always wins */}
      <div
        className="absolute inset-0 -z-10 bg-[radial-gradient(120%_85%_at_50%_45%,transparent_0%,var(--color-ink)_78%)]"
        aria-hidden="true"
      />

      <div className="mx-auto w-full max-w-[1800px] px-5 sm:px-8 lg:px-12">
        <p className="flex items-center gap-2.5 micro text-cyan">
          <span className="inline-block h-1.5 w-1.5 animate-blink rounded-full bg-cyan" />
          {HERO.eyebrow}
        </p>

        <h1 className="mt-7 display-xl text-paper sm:mt-10">
          {HERO.headline.map((line, i) => (
            <span key={line} className="block">
              <RevealWords
                text={line}
                delay={180 + i * 130}
                className={i === 2 ? 'editorial font-normal text-cyan' : ''}
              />
            </span>
          ))}
        </h1>

        <div className="mt-8 grid gap-8 sm:mt-12 lg:grid-cols-[minmax(0,34rem)_1fr] lg:items-end lg:gap-16">
          <p
            className="animate-rise text-[0.98rem] leading-[1.62] text-paper/62 sm:text-[1.08rem]"
            style={{ animationDelay: '620ms' }}
          >
            {HERO.standfirst}
          </p>

          <div
            className="animate-rise flex flex-wrap items-center gap-3"
            style={{ animationDelay: '740ms' }}
          >
            <Link
              href="/world"
              className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-cyan px-7 py-4 micro text-ink"
            >
              <span className="absolute inset-0 -translate-x-full bg-paper transition-transform duration-600 ease-[var(--ease-out-expo)] group-hover:translate-x-0" />
              <span className="relative">How RiskSense Works</span>
              <svg
                viewBox="0 0 14 14"
                className="relative h-3 w-3 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M2 7h10M8 3l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>

            <Link
              href="/overview#analysis"
              className="inline-flex items-center gap-3 rounded-full border border-white/16 px-7 py-4 micro text-paper/80 transition-colors duration-400 hover:border-cyan/60 hover:text-cyan"
            >
              Learn About Risk Analysis
            </Link>
          </div>
        </div>
      </div>

      {/* Badges — §5.1 supporting badges, set as a technical strip */}
      <div className="mx-auto mt-12 w-full max-w-[1800px] px-5 sm:px-8 lg:px-12">
        <div className="rule mb-5 text-paper" />
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-3 sm:gap-x-10">
            {HERO.badges.map((badge, i) => (
              <li
                key={badge}
                className="animate-rise flex items-center gap-2.5 micro-sm text-paper/45"
                style={{ animationDelay: `${860 + i * 80}ms` }}
              >
                <span className="text-cyan/70">{String(i + 1).padStart(2, '0')}</span>
                {badge}
              </li>
            ))}
          </ul>

          <p className="max-w-lg micro-sm leading-[1.8] text-paper/28 lg:text-right">
            {HERO.disclaimer}
          </p>
        </div>
      </div>
    </section>
  );
}
