import { NODES } from '@/data/content';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHead } from '@/components/ui/SectionHead';
import { PhoneMock } from './PhoneMock';

const PROBLEM_IDS = ['problem-silent', 'problem-fragmented', 'problem-delayed'];

export function Problem() {
  const problems = PROBLEM_IDS.map((id) => NODES.find((n) => n.id === id)!);
  const response = NODES.find((n) => n.id === 'response')!;

  return (
    <section
      id="problem"
      className="relative overflow-hidden bg-ink px-5 py-24 sm:px-8 sm:py-32 lg:px-12 lg:py-40"
    >
      <div className="column-rules absolute inset-0" aria-hidden="true" />

      <div className="relative mx-auto max-w-[1800px]">
        <SectionHead
          index="02"
          kicker="The problem"
          title={
            <>
              Three failures, repeated <span className="editorial text-ember">everywhere</span>.
            </>
          }
          lede="None of them are exotic. They are the ordinary way a preventable condition gets found late."
        />

        <div className="grid gap-px overflow-hidden border border-white/10 bg-white/10 md:grid-cols-3">
          {problems.map((p, i) => (
            <Reveal
              key={p.id}
              delay={i * 110}
              className="group relative flex min-h-[19rem] flex-col justify-between bg-ink p-7 transition-colors duration-600 hover:bg-graphite/45 sm:p-9"
            >
              <div
                className="absolute inset-x-0 top-0 h-px scale-x-0 bg-ember transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-x-100"
                aria-hidden="true"
              />
              <span className="font-display text-[4.5rem] leading-none font-normal tracking-[-0.06em] text-white/8 transition-colors duration-600 group-hover:text-ember/28">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <h3 className="font-display text-[1.4rem] leading-[1.15] font-normal tracking-[-0.03em] text-paper sm:text-[1.6rem]">
                  {p.title}
                </h3>
                <p className="mt-3.5 text-[0.92rem] leading-[1.62] text-paper/52">{p.body[0]}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* The response */}
        <div className="mt-24 grid gap-14 lg:mt-32 lg:grid-cols-[1fr_minmax(0,22rem)] lg:items-center lg:gap-20">
          <div>
            <Reveal className="flex items-center gap-4">
              <span className="micro text-brass">The response</span>
              <span className="rule flex-1 text-paper" />
            </Reveal>

            <Reveal delay={80}>
              <h3 className="mt-7 display-l text-paper text-balance">
                Consolidate. Analyse. <span className="editorial text-brass">Explain.</span>
              </h3>
            </Reveal>

            <Reveal delay={140}>
              <p className="mt-6 max-w-2xl text-[1rem] leading-[1.65] text-paper/58 sm:text-[1.08rem]">
                {response.body[0]}
              </p>
            </Reveal>

            <ol className="mt-11 space-y-px overflow-hidden border border-white/10">
              {response.bullets?.map((b, i) => (
                <Reveal
                  key={b.label}
                  as="li"
                  delay={200 + i * 100}
                  className="group flex items-start gap-5 bg-white/[0.02] p-6 transition-colors duration-500 hover:bg-brass/8 sm:gap-7 sm:p-7"
                >
                  <span className="mt-1 micro-sm text-brass/60">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h4 className="font-display text-[1.1rem] font-normal tracking-[-0.02em] text-paper">
                      {b.label}
                    </h4>
                    <p className="mt-1.5 text-[0.9rem] leading-[1.6] text-paper/52">{b.text}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>

          <Reveal delay={160}>
            <PhoneMock />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
