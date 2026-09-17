'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DISTRICTS, NODE_COUNT } from '@/data/content';

const DoorCanvas = dynamic(() => import('./DoorCanvas'), { ssr: false, loading: () => null });

/**
 * The threshold.
 *
 * Everything above this is a page; everything past it is a place. Played as a
 * sequence rather than a component: letterbox bars, a held title, a gate that
 * wakes as you approach it, and a camera that goes through rather than a link
 * that navigates.
 */
export function Door() {
  const router = useRouter();
  const section = useRef<HTMLElement>(null);

  // Kept in refs so hovering never re-renders the scene's React tree.
  const open = useRef(0);
  const entering = useRef(false);

  const [inView, setInView] = useState(false);
  const [near, setNear] = useState(false);
  const [committed, setCommitted] = useState(false);

  useEffect(() => {
    const el = section.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      threshold: 0.12,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const approach = useCallback((on: boolean) => {
    open.current = on ? 1 : 0;
    setNear(on);
  }, []);

  const enter = useCallback(() => {
    if (entering.current) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      router.push('/world');
      return;
    }

    entering.current = true;
    open.current = 1;
    setCommitted(true);
    window.setTimeout(() => router.push('/world'), 1500);
  }, [router]);

  return (
    <section
      ref={section}
      id="enter"
      className="relative isolate overflow-hidden bg-void"
      aria-label="Enter the RiskSense District"
    >
      {/* Letterbox */}
      <span className="letterbox-bar top-0" aria-hidden="true" />
      <span className="letterbox-bar bottom-0" aria-hidden="true" />

      <div className="relative h-[100svh] min-h-[38rem] w-full">
        <div className="absolute inset-0">
          {inView && <DoorCanvas open={open} entering={entering} active={inView} />}
        </div>

        {/* Slate */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between px-5 py-[clamp(3.5rem,10vh,7rem)] sm:px-8 lg:px-14">
          <div className="flex items-start justify-between gap-6">
            <p className="micro text-brass/70">The threshold</p>
            <p className="hidden micro-sm text-paper/30 sm:block">
              {NODE_COUNT} markers · {DISTRICTS.length} districts
            </p>
          </div>

          <div className="relative mx-auto max-w-4xl text-center">
            {/* A scrim so the title holds against the moving light behind it */}
            <span
              className="pointer-events-none absolute -inset-x-24 -inset-y-16 -z-10 bg-[radial-gradient(60%_60%_at_50%_50%,rgba(3,2,4,0.82),transparent_75%)]"
              aria-hidden="true"
            />
            <h2 className="display-l text-paper text-balance">
              Beyond this point it is a{' '}
              <span className="editorial text-brass">place</span>, not a page.
            </h2>

            <p className="mx-auto mt-7 max-w-[46ch] text-[0.98rem] leading-[1.7] text-paper/55">
              The specification, built as a district you can walk through. Find a marker, read what
              it holds, move on.
            </p>
          </div>

          <div className="flex items-end justify-center">
            <button
              type="button"
              onClick={enter}
              onMouseEnter={() => approach(true)}
              onMouseLeave={() => approach(false)}
              onFocus={() => approach(true)}
              onBlur={() => approach(false)}
              disabled={committed}
              className="pointer-events-auto group relative overflow-hidden border border-brass/45 px-10 py-5 micro text-brass transition-colors duration-700 hover:text-ink disabled:opacity-60"
            >
              <span
                className={`absolute inset-0 bg-brass transition-transform duration-[900ms] ease-[var(--ease-cine)] ${
                  near ? 'translate-y-0' : 'translate-y-full'
                }`}
                aria-hidden="true"
              />
              <span className="relative">
                {committed ? 'Entering' : near ? 'Step through' : 'Enter the district'}
              </span>
            </button>
          </div>
        </div>

        {/* The gate's light taking the frame as the camera goes through */}
        <div
          className="pointer-events-none absolute inset-0 z-30 bg-[#eaf7fb]"
          style={{
            opacity: committed ? 1 : 0,
            transition: 'opacity 900ms cubic-bezier(0.83, 0, 0.17, 1) 520ms',
          }}
          aria-hidden="true"
        />
      </div>
    </section>
  );
}
