'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';
import { NODE_COUNT, DISTRICTS } from '@/data/content';

const RINGS = 11;

/**
 * The threshold. Everything above this section is a page; everything past it is
 * a place. Hover opens the doors and pulls the corridor forward; the click runs
 * an iris wipe and hands over to /world.
 */
export function Door() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [entering, setEntering] = useState(false);
  const frame = useRef<HTMLDivElement>(null);
  const tilt = useRef<HTMLDivElement>(null);

  const onMove = useCallback((e: React.MouseEvent) => {
    const el = frame.current;
    const inner = tilt.current;
    if (!el || !inner) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    inner.style.transform = `rotateY(${x * 9}deg) rotateX(${-y * 7}deg)`;
  }, []);

  const onLeave = useCallback(() => {
    setOpen(false);
    if (tilt.current) tilt.current.style.transform = 'rotateY(0deg) rotateX(0deg)';
  }, []);

  const enter = useCallback(() => {
    if (entering) return;
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      router.push('/world');
      return;
    }
    setEntering(true);
    window.setTimeout(() => router.push('/world'), 760);
  }, [entering, router]);

  return (
    <section
      id="enter"
      className="relative overflow-hidden bg-void px-5 py-24 sm:px-8 sm:py-32 lg:px-12 lg:py-40"
    >
      <div className="column-rules absolute inset-0" aria-hidden="true" />

      <div className="relative mx-auto max-w-[1800px]">
        <div className="flex items-center gap-4">
          <span className="micro text-cyan">07</span>
          <span className="micro text-paper/45">The threshold</span>
          <span className="rule flex-1 text-paper" />
        </div>

        <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_minmax(0,30rem)] lg:items-center lg:gap-20">
          {/* The door */}
          <div
            ref={frame}
            onMouseMove={onMove}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={onLeave}
            className="relative mx-auto w-full max-w-[34rem] [perspective:1100px]"
          >
            <button
              type="button"
              onClick={enter}
              onFocus={() => setOpen(true)}
              onBlur={() => setOpen(false)}
              aria-label="Enter the RiskSense District — an interactive 3D world"
              className="block w-full cursor-pointer"
            >
              <div
                ref={tilt}
                className="relative aspect-[3/4.1] w-full transition-transform duration-500 ease-out [transform-style:preserve-3d]"
              >
                {/* Lit frame */}
                <span
                  className="pointer-events-none absolute -inset-3 rounded-t-[15rem] rounded-b-3xl border border-cyan/30 transition-colors duration-700"
                  style={{ boxShadow: open ? '0 0 70px rgba(69,215,232,0.3)' : '0 0 34px rgba(69,215,232,0.12)' }}
                  aria-hidden="true"
                />
                {/* Receding corridor */}
                <div className="absolute inset-0 overflow-hidden rounded-t-[14rem] rounded-b-2xl bg-[radial-gradient(ellipse_at_50%_62%,#0a1f3a_0%,#02040a_72%)] [transform-style:preserve-3d]">
                  {Array.from({ length: RINGS }).map((_, i) => {
                    const t = i / (RINGS - 1);
                    return (
                      <span
                        key={i}
                        className="absolute inset-0 rounded-t-[14rem] rounded-b-2xl border transition-all duration-[900ms] ease-[var(--ease-out-expo)]"
                        style={{
                          borderColor: `color-mix(in oklab, var(--color-cyan) ${Math.round(
                            (1 - t) * 34 + 4,
                          )}%, transparent)`,
                          transform: `scale(${1 - t * 0.085}) translateZ(${
                            (open ? 150 : 0) - i * 78
                          }px)`,
                          opacity: 0.18 + (1 - t) * 0.65,
                        }}
                        aria-hidden="true"
                      />
                    );
                  })}

                  {/* Light at the end */}
                  <span
                    className="absolute top-[56%] left-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-[900ms] ease-[var(--ease-out-expo)]"
                    style={{
                      background:
                        'radial-gradient(circle, var(--color-cyan), color-mix(in oklab, var(--color-medical) 60%, transparent) 55%, transparent 72%)',
                      transform: `translate(-50%,-50%) scale(${open ? 2.5 : 1})`,
                      opacity: open ? 0.95 : 0.5,
                    }}
                    aria-hidden="true"
                  />

                  {/* Floor */}
                  <span
                    className="absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(to_top,color-mix(in_oklab,var(--color-cyan)_11%,transparent),transparent)]"
                    aria-hidden="true"
                  />
                </div>

                {/* Door leaves */}
                {(['left', 'right'] as const).map((side) => (
                  <span
                    key={side}
                    className="absolute inset-y-0 w-1/2 origin-[var(--o)] overflow-hidden border-cyan/40 bg-[linear-gradient(155deg,#16304f,#091426_72%)] shadow-[inset_0_0_60px_rgba(69,215,232,0.07)] transition-transform duration-[1100ms] ease-[var(--ease-out-expo)]"
                    style={
                      {
                        '--o': side === 'left' ? 'left center' : 'right center',
                        left: side === 'left' ? 0 : '50%',
                        borderTopLeftRadius: side === 'left' ? '14rem' : 0,
                        borderTopRightRadius: side === 'right' ? '14rem' : 0,
                        borderBottomLeftRadius: side === 'left' ? '1rem' : 0,
                        borderBottomRightRadius: side === 'right' ? '1rem' : 0,
                        borderWidth: '1px',
                        transform: open
                          ? `perspective(900px) rotateY(${side === 'left' ? -78 : 78}deg)`
                          : 'perspective(900px) rotateY(0deg)',
                      } as React.CSSProperties
                    }
                    aria-hidden="true"
                  >
                    {/* Etched pulse detail on each leaf */}
                    <span
                      className="absolute top-1/2 h-px w-[160%] -translate-y-1/2 bg-[linear-gradient(90deg,transparent,color-mix(in_oklab,var(--color-cyan)_55%,transparent),transparent)]"
                      style={{ left: side === 'left' ? '-30%' : '-30%' }}
                    />
                    <span className="absolute inset-x-6 top-[18%] bottom-[18%] rounded-[8rem] border border-cyan/18" />
                  </span>
                ))}

                {/* Handle line */}
                <span
                  className={`absolute top-1/2 left-1/2 h-24 w-[2px] -translate-x-1/2 -translate-y-1/2 bg-cyan shadow-[0_0_18px_var(--color-cyan)] transition-opacity duration-500 ${
                    open ? 'opacity-0' : 'opacity-100'
                  }`}
                  aria-hidden="true"
                />
              </div>

              {/* Plinth glow */}

              <span
                className={`mx-auto mt-2 block w-fit rounded-full border px-5 py-2.5 micro transition-colors duration-500 ${
                  open
                    ? 'border-cyan bg-cyan text-ink'
                    : 'border-cyan/40 bg-cyan/8 text-cyan'
                }`}
              >
                {open ? 'Step through' : 'Enter the District'}
              </span>
            </button>
          </div>

          {/* Copy */}
          <div>
            <h2 className="display-l text-paper text-balance">
              The rest of this is a{' '}
              <span className="editorial text-cyan">place</span>, not a page.
            </h2>

            <p className="mt-7 max-w-[52ch] text-[1rem] leading-[1.68] text-paper/58 sm:text-[1.08rem]">
              Everything in the specification is built as a district you can walk through: the two
              models, the six-step journey, the insurer pavilion, the clinician link, the security
              vault. Find a marker, press E, read what it holds, move on.
            </p>

            <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-3">
              {[
                { k: 'Interactables', v: String(NODE_COUNT) },
                { k: 'Districts', v: String(DISTRICTS.length) },
                { k: 'Controls', v: 'WASD · E' },
              ].map((s) => (
                <div key={s.k} className="bg-void p-5">
                  <dt className="micro-sm text-paper/35">{s.k}</dt>
                  <dd className="mt-2.5 font-display text-[1.6rem] leading-none font-semibold tracking-[-0.03em] text-paper">
                    {s.v}
                  </dd>
                </div>
              ))}
            </dl>

            <p className="mt-6 micro-sm leading-[1.9] text-paper/28">
              Runs in the browser — no download. A text version of every panel lives at{' '}
              <a href="/overview" className="text-cyan/70 underline underline-offset-4 hover:text-cyan">
                /overview
              </a>{' '}
              for small screens and assistive technology.
            </p>
          </div>
        </div>
      </div>

      {/* Iris wipe */}
      <div
        className="pointer-events-none fixed inset-0 z-[90] bg-[radial-gradient(circle,var(--color-cyan),#eafcff_45%,#ffffff_100%)]"
        style={{
          clipPath: entering ? 'circle(150% at 50% 50%)' : 'circle(0% at 50% 50%)',
          transition: 'clip-path 780ms var(--ease-in-out-quint)',
        }}
        aria-hidden="true"
      />
    </section>
  );
}
