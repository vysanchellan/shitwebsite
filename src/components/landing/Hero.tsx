'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { HERO } from '@/data/content';
import { RevealWords } from '@/components/ui/Reveal';

const HeroCanvas = dynamic(() => import('./HeroCanvas'), {
  ssr: false,
  loading: () => null,
});

/** The four badges, set as a specification table rather than a row of chips. */
const SPEC = [
  { k: 'Analysis', v: 'AI-assisted' },
  { k: 'Security', v: 'Zero-trust' },
  { k: 'Review', v: 'Clinician connected' },
  { k: 'Scope', v: 'Heart · Diabetes v1' },
];

export function Hero() {
  const section = useRef<HTMLElement>(null);
  const [live, setLive] = useState(true);

  // The vista stops rendering the moment it scrolls away. On a page this long
  // that is most of the visit, and a paused canvas costs nothing.
  useEffect(() => {
    const el = section.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setLive(e.isIntersecting), {
      threshold: 0,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={section}
      className="relative isolate flex min-h-[100svh] flex-col justify-between overflow-hidden bg-ink pt-24 pb-0 sm:pt-28"
    >
      <div className="absolute inset-0 -z-20" aria-hidden="true">
        <HeroCanvas active={live} />
      </div>

      {/*
        Two scrims, both load-bearing. A vertical one so the headline sits on
        something solid, and a foot so the specification table reads against the
        lit horizon. Nothing decorative is layered over the vista.
      */}
      <div
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,rgba(8,7,10,0.86)_0%,rgba(8,7,10,0.42)_38%,rgba(8,7,10,0.28)_58%,rgba(8,7,10,0.94)_100%)]"
        aria-hidden="true"
      />

      <div className="mx-auto w-full max-w-[1800px] px-5 sm:px-8 lg:px-12">
        <p className="micro text-brass">{HERO.eyebrow}</p>

        <h1 className="mt-8 display-xl text-paper sm:mt-12">
          {HERO.headline.map((line, i) => (
            <span key={line} className="block">
              <RevealWords
                text={line}
                delay={180 + i * 130}
                className={i === 2 ? 'editorial font-normal text-brass' : ''}
              />
            </span>
          ))}
        </h1>

        <div className="mt-10 grid gap-10 sm:mt-14 lg:grid-cols-[minmax(0,36rem)_1fr] lg:items-end lg:gap-20">
          <p
            className="animate-rise max-w-[46ch] text-[0.98rem] leading-[1.62] text-paper/72 sm:text-[1.08rem]"
            style={{ animationDelay: '620ms' }}
          >
            {HERO.standfirst}
          </p>

          <div
            className="animate-rise flex w-full flex-col gap-px bg-paper/15 lg:max-w-[26rem] lg:justify-self-end"
            style={{ animationDelay: '740ms' }}
          >
            <Link
              href="/world"
              className="group flex items-center justify-between gap-8 bg-brass px-6 py-4 micro whitespace-nowrap text-ink transition-colors duration-400 hover:bg-paper"
            >
              How RiskSense works
              <svg
                viewBox="0 0 14 14"
                className="h-3 w-3 shrink-0 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1"
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
              className="flex items-center justify-between gap-8 bg-ink px-6 py-4 micro whitespace-nowrap text-paper/80 transition-colors duration-400 hover:text-brass"
            >
              Risk analysis
              <span aria-hidden="true" className="text-paper/30">
                ↗
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Specification strip — hairline-ruled, the way a spec sheet reads. */}
      <div className="mx-auto mt-14 w-full max-w-[1800px] px-5 sm:px-8 lg:px-12">
        <dl className="grid grid-cols-2 border-t border-paper/12 sm:grid-cols-4">
          {SPEC.map((row, i) => (
            <div
              key={row.k}
              className="animate-rise border-b border-paper/12 py-4 sm:border-b-0 sm:py-5 sm:pr-6 [&:not(:first-child)]:sm:border-l [&:not(:first-child)]:sm:border-paper/12 [&:not(:first-child)]:sm:pl-6"
              style={{ animationDelay: `${860 + i * 80}ms` }}
            >
              <dt className="micro-sm text-paper/35">{row.k}</dt>
              <dd className="mt-2 font-display text-[0.95rem] font-medium tracking-[-0.01em] text-paper">
                {row.v}
              </dd>
            </div>
          ))}
        </dl>

        <p className="border-t border-paper/12 py-4 micro-sm leading-[1.9] text-paper/28">
          {HERO.disclaimer}
        </p>
      </div>
    </section>
  );
}
