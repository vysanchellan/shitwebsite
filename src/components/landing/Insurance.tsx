'use client';

import { useEffect, useState } from 'react';
import { INSURERS, INSURER_NOTE, type Insurer } from '@/data/insurers';
import { NODES } from '@/data/content';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHead } from '@/components/ui/SectionHead';

/** A generated lockup standing in for an insurer's official logo. */
export function InsurerLogo({ insurer, size = 44 }: { insurer: Insurer; size?: number }) {
  return (
    <span
      className="relative grid shrink-0 place-items-center overflow-hidden"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(140deg, ${insurer.hue}26, ${insurer.hue}0a)`,
        boxShadow: `inset 0 0 0 1px ${insurer.hue}3d`,
      }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 44 44" className="absolute inset-0 h-full w-full opacity-45">
        <circle cx="34" cy="10" r="13" fill="none" stroke={insurer.hue} strokeWidth="1" />
        <path d="M-2 30 L22 6" stroke={insurer.hue} strokeWidth="1" opacity="0.7" />
      </svg>
      <span
        className="relative font-display font-normal tracking-[-0.03em]"
        style={{ color: insurer.hue, fontSize: size * 0.34 }}
      >
        {insurer.mark}
      </span>
    </span>
  );
}

export function Insurance() {
  const node = NODES.find((n) => n.id === 'insurance')!;
  const [active, setActive] = useState<Insurer | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setActive(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <section
      id="insurance"
      className="relative bg-paper px-5 py-24 text-graphite sm:px-8 sm:py-32 lg:px-12 lg:py-40"
    >
      <div className="mx-auto max-w-[1800px]">
        <SectionHead
          tone="paper"
          index="05"
          kicker="Insurance partners"
          title={
            <>
              Use your supported insurance cover with{' '}
              <span className="editorial text-brass">RiskSense</span>.
            </>
          }
          lede="These are the providers selectable during registration and access verification. The list is data-driven: providers can be added, disabled or reordered without redesigning this page."
        />

        {/* Prototype honesty banner — §6 */}
        <Reveal className="mb-8 flex flex-col gap-3 border border-warn/35 bg-warn/[0.09] px-5 py-4 sm:flex-row sm:items-center sm:gap-5 sm:px-7">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-warn/20 px-3 py-1.5 micro-sm text-[color-mix(in_oklab,var(--color-warn)_70%,var(--color-graphite))]">
            <span className="h-1.5 w-1.5 rounded-full bg-warn" />
            Demonstration data
          </span>
          <p className="text-[0.88rem] leading-[1.6] text-graphite/68">
            Every provider below is placeholder data for the academic prototype. None represents a
            commercial partnership, and insurance verification is simulated until a real insurer
            integration exists.
          </p>
        </Reveal>

        <ul className="grid grid-cols-2 gap-px overflow-hidden border border-graphite/12 bg-graphite/12 sm:grid-cols-3 lg:grid-cols-4">
          {INSURERS.map((insurer, i) => (
            <Reveal key={insurer.id} as="li" delay={i * 55}>
              <button
                type="button"
                disabled={!insurer.enabled}
                onClick={() => setActive(insurer)}
                aria-haspopup="dialog"
                className={`group flex h-full w-full flex-col items-start gap-4 bg-paper p-5 text-left transition-colors duration-500 sm:p-7 ${
                  insurer.enabled
                    ? 'cursor-pointer hover:bg-white'
                    : 'cursor-not-allowed opacity-45'
                }`}
              >
                <span className="flex w-full items-start justify-between gap-3">
                  <InsurerLogo insurer={insurer} />
                  {!insurer.enabled && (
                    <span className="micro-sm text-graphite/35">Disabled</span>
                  )}
                </span>

                <span className="flex-1">
                  <span className="block font-display text-[1.02rem] leading-tight font-normal tracking-[-0.02em] text-graphite">
                    {insurer.name}
                  </span>
                  <span className="mt-1.5 block micro-sm text-graphite/40">{insurer.plan}</span>
                </span>

                {insurer.demo && (
                  <span className="micro-sm text-warn/90">Demo provider</span>
                )}

                <span
                  className="h-px w-0 bg-brass transition-[width] duration-600 ease-[var(--ease-out-expo)] group-hover:w-full"
                  aria-hidden="true"
                />
              </button>
            </Reveal>
          ))}
        </ul>

        <Reveal className="mt-8 max-w-4xl">
          <p className="micro-sm leading-[1.9] text-graphite/40">{node.footnote}</p>
        </Reveal>
      </div>

      {/* Eligibility panel — explains, never exposes member information. */}
      {active && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label={`${active.name} — eligibility`}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setActive(null)}
            className="absolute inset-0 cursor-default bg-ink/72"
          />

          <div className="animate-rise relative w-full max-w-lg overflow-hidden border border-white/12 bg-graphite p-7 text-paper shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)] sm:p-9">
            <div className="flex items-start gap-4">
              <InsurerLogo insurer={active} size={52} />
              <div className="flex-1">
                <h3 className="font-display text-[1.35rem] leading-tight font-normal tracking-[-0.025em]">
                  {active.name}
                </h3>
                <p className="mt-1 micro-sm text-paper/45">{active.plan}</p>
              </div>
              <button
                type="button"
                onClick={() => setActive(null)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/15 text-paper/60 transition-colors hover:border-brass/50 hover:text-brass"
                aria-label="Close"
              >
                <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" aria-hidden="true">
                  <path d="m2.5 2.5 7 7m0-7-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="mt-6 bg-white/[0.04] p-5">
              <p className="text-[0.92rem] leading-[1.65] text-paper/75">{INSURER_NOTE}</p>
            </div>

            <ul className="mt-5 space-y-2.5">
              {[
                'Select this provider during registration.',
                'Enter your policy or membership details on the secure activation step.',
                'RiskSense verifies eligibility with the backend before access is activated.',
              ].map((line, i) => (
                <li key={line} className="flex gap-3.5 text-[0.88rem] leading-[1.55] text-paper/62">
                  <span className="micro-sm mt-0.5 shrink-0 text-brass/60">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {line}
                </li>
              ))}
            </ul>

            {active.demo && (
              <p className="mt-6 border border-warn/25 bg-warn/[0.08] px-4 py-3 micro-sm leading-[1.8] text-warn">
                Demonstration provider — verification is simulated in this prototype.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
