'use client';

import { useEffect, useRef, useState } from 'react';
import { STATISTICS, STATISTICS_NOTE } from '@/data/content';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHead } from '@/components/ui/SectionHead';

/**
 * Counts the leading number of a statistic up to its published value. Values
 * with no leading number ("1 in 2", "3 in 4") are rendered as written — we
 * animate the presentation, never the figure itself.
 */
function Counter({ value }: { value: string }) {
  const parsed = /^(\d+(?:\.\d+)?)(.*)$/.exec(value);
  const prefix = parsed?.[1];
  const suffix = parsed?.[2] ?? '';

  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(prefix ? '0' : value);

  // `value` is the dependency, never the regex result — a fresh match array
  // every render would restart the animation on every frame it produced.
  useEffect(() => {
    if (!prefix) return;
    const el = ref.current;
    if (!el) return;

    const target = parseFloat(prefix);
    const decimals = (prefix.split('.')[1] ?? '').length;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = 0;

    const run = () => {
      if (reduced) {
        setShown(target.toFixed(decimals));
        return;
      }
      const duration = 1500;
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 4);
        setShown((target * eased).toFixed(decimals));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    if (typeof IntersectionObserver === 'undefined') {
      run();
      return () => cancelAnimationFrame(raf);
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          io.disconnect();
          run();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [prefix]);

  if (!prefix) {
    return <span ref={ref}>{value}</span>;
  }

  return (
    <span ref={ref}>
      {shown}
      {suffix}
    </span>
  );
}

export function Stats() {
  return (
    <section
      id="awareness"
      className="relative bg-paper px-5 py-24 text-graphite sm:px-8 sm:py-32 lg:px-12 lg:py-40"
    >
      <div className="mx-auto max-w-[1800px]">
        <SectionHead
          tone="paper"
          index="01"
          kicker="Health awareness"
          title={
            <>
              Risk is quiet <span className="editorial text-brass">long before</span> it is loud.
            </>
          }
          lede="Heart disease and diabetes both accumulate silently. Every figure below is quoted from a named health authority, with its source and year attached. Nothing here is modelled, rounded up or invented."
        />

        <ul className="border-t border-graphite/12">
          {STATISTICS.map((stat, i) => (
            <li key={stat.source + stat.value}>
              <Reveal
                delay={i * 90}
                className="group grid gap-5 border-b border-graphite/12 py-9 transition-colors duration-500 hover:bg-graphite/[0.03] sm:py-11 lg:grid-cols-[minmax(0,22rem)_1fr_minmax(0,20rem)] lg:items-center lg:gap-10"
              >
                <div className="flex items-baseline gap-4">
                  <span className="micro-sm w-6 shrink-0 text-brass">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="font-display text-[clamp(3rem,8vw,5.5rem)] leading-[0.82] font-normal tracking-[-0.05em] text-graphite tabular-nums">
                    <Counter value={stat.value} />
                  </span>
                </div>

                <div>
                  <p className="micro-sm mb-2.5 text-graphite/40">{stat.unit}</p>
                  <p className="max-w-[46ch] text-[1rem] leading-[1.55] text-graphite/78 sm:text-[1.15rem]">
                    {stat.claim}
                  </p>
                </div>

                <div className="lg:text-right">
                  <p className="micro-sm leading-[1.7] text-graphite/45">{stat.source}</p>
                  <p className="mt-1.5 inline-flex items-center gap-2 rounded-full border border-graphite/15 px-2.5 py-1 micro-sm text-graphite/55">
                    <span className="h-1 w-1 rounded-full bg-brass" />
                    {stat.year}
                  </p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>

        <Reveal className="mt-8 flex max-w-4xl gap-3.5">
          <svg viewBox="0 0 16 16" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-graphite/35" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2" />
            <path d="M8 7.2v4.2M8 4.8v.9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <p className="micro-sm leading-[1.9] text-graphite/40">{STATISTICS_NOTE}</p>
        </Reveal>
      </div>
    </section>
  );
}
