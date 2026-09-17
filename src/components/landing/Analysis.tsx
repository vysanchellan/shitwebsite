import { NODES } from '@/data/content';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHead } from '@/components/ui/SectionHead';

export function Analysis() {
  const models = [
    { node: NODES.find((n) => n.id === 'heart-model')!, tint: 'var(--color-ember)' },
    { node: NODES.find((n) => n.id === 'diabetes-model')!, tint: 'var(--color-brass)' },
  ];
  const disclaimer = NODES.find((n) => n.id === 'disclaimer')!;

  return (
    <section
      id="analysis"
      className="relative overflow-hidden bg-ink px-5 py-24 sm:px-8 sm:py-32 lg:px-12 lg:py-40"
    >
      <div className="column-rules absolute inset-0" aria-hidden="true" />

      <div className="relative mx-auto max-w-[1800px]">
        <SectionHead
          index="04"
          kicker="Supported risk analysis"
          title={
            <>
              Two models. Inputs a clinician already{' '}
              <span className="editorial text-brass">recognises</span>.
            </>
          }
          lede="Every input below is a value that appears in ordinary clinical practice. That is deliberate: an estimate built from familiar numbers is an estimate a clinician can interrogate."
        />

        <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
          {models.map((m, i) => (
            <Reveal
              key={m.node.id}
              delay={i * 130}
              className="group relative overflow-hidden border border-white/10 bg-gradient-to-b from-graphite/55 to-ink p-7 transition-colors duration-600 hover:border-white/20 sm:p-10"
            >
              <div
                className="pointer-events-none absolute -top-28 -right-28 h-64 w-64 rounded-full opacity-20 transition-opacity duration-700 group-hover:opacity-40"
                style={{ background: m.tint }}
                aria-hidden="true"
              />

              <div className="relative flex items-start justify-between gap-6">
                <div>
                  <p className="micro-sm text-paper/38">{m.node.kicker}</p>
                  <h3 className="mt-3 font-display text-[1.8rem] leading-[1.05] font-normal tracking-[-0.035em] text-paper sm:text-[2.3rem]">
                    {m.node.title}
                  </h3>
                </div>
                <span
                  className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: m.tint, boxShadow: `0 0 20px ${m.tint}` }}
                  aria-hidden="true"
                />
              </div>

              <p className="relative mt-5 max-w-[52ch] text-[0.95rem] leading-[1.65] text-paper/58">
                {m.node.body[0]}
              </p>

              <p className="relative mt-9 micro-sm text-paper/32">Example inputs</p>
              <dl className="relative mt-4 border-t border-white/10">
                {m.node.bullets?.map((b) => (
                  <div
                    key={b.label}
                    className="flex items-baseline justify-between gap-5 border-b border-white/10 py-3.5"
                  >
                    <dt className="text-[0.92rem] text-paper/82">{b.label}</dt>
                    <dd className="shrink-0 font-sans text-[0.68rem] tracking-[0.1em] text-paper/42 uppercase">
                      {b.text}
                    </dd>
                  </div>
                ))}
              </dl>

              {m.node.footnote && (
                <p className="relative mt-5 micro-sm leading-[1.85] text-paper/28">
                  {m.node.footnote}
                </p>
              )}
            </Reveal>
          ))}
        </div>

        {/* Medical disclaimer — given the weight of a statement, not a footnote. */}
        <Reveal
          delay={120}
          className="mt-6 flex flex-col gap-6 border border-warn/22 bg-warn/[0.06] p-7 sm:p-10 lg:flex-row lg:items-center lg:gap-14"
        >
          <div className="flex items-center gap-4 lg:w-64 lg:shrink-0">
            <svg
              viewBox="0 0 24 24"
              className="h-7 w-7 shrink-0 text-warn"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M12 3.8 21 19.5H3L12 3.8Z" strokeLinejoin="round" />
              <path d="M12 10v4.2M12 16.6v.1" />
            </svg>
            <p className="micro text-warn">Medical disclaimer</p>
          </div>

          <div className="lg:flex-1">
            {disclaimer.body.map((p) => (
              <p
                key={p}
                className="mb-3 text-[0.95rem] leading-[1.65] text-paper/72 last:mb-0 sm:text-[1.02rem]"
              >
                {p}
              </p>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
