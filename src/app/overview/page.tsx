import type { Metadata } from 'next';
import Link from 'next/link';
import { DISTRICTS, NODES, STATISTICS, STATISTICS_NOTE } from '@/data/content';
import { INSURERS } from '@/data/insurers';
import { ACCENT_HEX } from '@/components/world/layout';
import { Nav } from '@/components/landing/Nav';
import { Footer } from '@/components/landing/Footer';
import { Reveal } from '@/components/ui/Reveal';

export const metadata: Metadata = {
  title: 'Overview',
  description:
    'Every panel from the RiskSense District, written out in full: the risk models, the six-step journey, supported insurers, the clinician link, security and the activation flow.',
};

/** Section anchors the site navigation points at. */
const ANCHORS: Record<string, string> = {
  'Journey Boulevard': 'journey',
  'Cardiac Institute': 'analysis',
  'Insurance Pavilion': 'insurance',
  'Security Vault': 'security',
  'Information Kiosk': 'faq',
};

export default function OverviewPage() {
  return (
    <>
      <Nav />

      <main id="main" className="bg-ink">
        {/* Header */}
        <header className="relative overflow-hidden px-5 pt-32 pb-16 sm:px-8 sm:pt-40 sm:pb-24 lg:px-12">
          <div className="grid-field absolute inset-0 opacity-50" aria-hidden="true" />

          <div className="relative mx-auto max-w-[1800px]">
            <p className="micro text-cyan">The district, written down</p>

            <h1 className="mt-7 display-xl text-paper text-balance">
              Everything the world <span className="editorial text-cyan">holds</span>.
            </h1>

            <div className="mt-10 grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:gap-20">
              <p className="max-w-[56ch] text-[1rem] leading-[1.68] text-paper/60 sm:text-[1.1rem]">
                The RiskSense District puts every part of the service into a place you can walk
                through. This page is the same content as a document — for small screens, for
                browsers without WebGL, for screen readers, and for anyone who would simply rather
                read it.
              </p>

              <div className="flex flex-wrap items-start gap-3 lg:justify-end">
                <Link
                  href="/world"
                  className="rounded-full bg-cyan px-6 py-3.5 micro text-ink transition-opacity hover:opacity-85"
                >
                  Walk it instead
                </Link>
                <Link
                  href="/register/complete"
                  className="rounded-full border border-white/16 px-6 py-3.5 micro text-paper/75 transition-colors hover:border-cyan/60 hover:text-cyan"
                >
                  Complete registration
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Statistics */}
        <section className="border-t border-white/8 px-5 py-16 sm:px-8 sm:py-24 lg:px-12">
          <div className="mx-auto max-w-[1800px]">
            <h2 className="micro text-cyan">Health awareness</h2>

            <ul className="mt-10 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-2 xl:grid-cols-4">
              {STATISTICS.map((s) => (
                <li key={s.source + s.value} className="flex flex-col justify-between gap-6 bg-ink p-6 sm:p-7">
                  <div>
                    <p className="font-display text-[2.6rem] leading-none font-semibold tracking-[-0.05em] text-paper">
                      {s.value}
                    </p>
                    <p className="mt-2 micro-sm text-cyan/70">{s.unit}</p>
                    <p className="mt-4 text-[0.9rem] leading-[1.6] text-paper/65">{s.claim}</p>
                  </div>
                  <p className="micro-sm leading-[1.8] text-paper/32">
                    {s.source} · {s.year}
                  </p>
                </li>
              ))}
            </ul>

            <p className="mt-6 max-w-4xl micro-sm leading-[1.9] text-paper/32">{STATISTICS_NOTE}</p>
          </div>
        </section>

        {/* Districts */}
        {DISTRICTS.map((district, di) => {
          const nodes = NODES.filter((n) => n.district === district);
          const anchor = ANCHORS[district];

          return (
            <section
              key={district}
              id={anchor}
              className={`border-t border-white/8 px-5 py-16 sm:px-8 sm:py-24 lg:px-12 ${
                di % 2 === 1 ? 'bg-void' : ''
              }`}
            >
              <div className="mx-auto max-w-[1800px]">
                <Reveal className="flex items-center gap-4">
                  <span className="micro text-cyan">{String(di + 1).padStart(2, '0')}</span>
                  <h2 className="micro text-paper/50">{district}</h2>
                  <span className="rule flex-1 text-paper" />
                </Reveal>

                <div className="mt-10 grid gap-5 lg:grid-cols-2 lg:gap-6">
                  {nodes.map((node, i) => {
                    const accent = ACCENT_HEX[node.accent];

                    return (
                      <Reveal
                        key={node.id}
                        as="article"
                        delay={i * 60}
                        id={node.id}
                        className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8"
                      >
                        <span
                          className="absolute inset-x-0 top-0 h-[2px]"
                          style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
                          aria-hidden="true"
                        />

                        <p className="micro-sm" style={{ color: accent }}>
                          {node.kicker}
                        </p>

                        <h3 className="mt-3 font-display text-[1.35rem] leading-[1.12] font-semibold tracking-[-0.03em] text-paper sm:text-[1.7rem]">
                          {node.step && (
                            <span className="mr-2.5 font-mono text-[0.8em] opacity-40">
                              {String(node.step).padStart(2, '0')}
                            </span>
                          )}
                          {node.title}
                        </h3>

                        {node.body.map((p) => (
                          <p
                            key={p}
                            className="mt-4 text-[0.93rem] leading-[1.68] text-paper/65 sm:text-[1rem]"
                          >
                            {p}
                          </p>
                        ))}

                        {node.bullets && (
                          <dl className="mt-6 border-t border-white/10">
                            {node.bullets.map((b) => (
                              <div
                                key={b.label}
                                className="flex flex-col gap-1 border-b border-white/10 py-3 sm:flex-row sm:gap-6"
                              >
                                <dt className="shrink-0 font-display text-[0.88rem] font-semibold text-paper sm:w-48">
                                  {b.label}
                                </dt>
                                <dd className="text-[0.86rem] leading-[1.58] text-paper/55">
                                  {b.text}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        )}

                        {node.footnote && (
                          <p className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 micro-sm leading-[1.85] text-paper/38">
                            {node.footnote}
                          </p>
                        )}

                        {node.cta && (
                          <p className="mt-6">
                            <a
                              href={node.cta.href}
                              className="inline-flex items-center gap-2.5 micro transition-opacity hover:opacity-70"
                              style={{ color: accent }}
                            >
                              {node.cta.label}
                              <span aria-hidden="true">&rarr;</span>
                            </a>
                          </p>
                        )}
                      </Reveal>
                    );
                  })}
                </div>

                {/* The insurer roster belongs with the pavilion */}
                {district === 'Insurance Pavilion' && (
                  <div className="mt-6">
                    <p className="micro-sm mb-4 text-paper/35">
                      Supported providers — demonstration data
                    </p>
                    <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-4">
                      {INSURERS.map((ins) => (
                        <li
                          key={ins.id}
                          className={`bg-ink p-5 ${ins.enabled ? '' : 'opacity-45'}`}
                        >
                          <span
                            className="grid h-10 w-10 place-items-center rounded-xl font-display text-[0.8rem] font-semibold"
                            style={{
                              background: `${ins.hue}22`,
                              color: ins.hue,
                              boxShadow: `inset 0 0 0 1px ${ins.hue}44`,
                            }}
                          >
                            {ins.mark}
                          </span>
                          <p className="mt-3 font-display text-[0.95rem] font-semibold tracking-[-0.02em] text-paper">
                            {ins.name}
                          </p>
                          <p className="mt-1 micro-sm text-paper/38">{ins.plan}</p>
                          <p className="mt-2 micro-sm text-warn/80">
                            {ins.enabled ? 'Demo provider' : 'Disabled'}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          );
        })}

        {/* Contact */}
        <section id="contact" className="border-t border-white/8 px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
          <div className="mx-auto flex max-w-[1800px] flex-col items-start gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="micro text-cyan">Still have a question?</p>
              <h2 className="mt-5 display-l text-paper">
                Walk it, or <span className="editorial text-cyan">ask us</span>.
              </h2>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/world" className="rounded-full bg-cyan px-6 py-3.5 micro text-ink">
                Enter the district
              </Link>
              <Link
                href="/#faq"
                className="rounded-full border border-white/16 px-6 py-3.5 micro text-paper/75 transition-colors hover:border-cyan/60 hover:text-cyan"
              >
                Contact the team
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
