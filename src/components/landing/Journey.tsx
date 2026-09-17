import { NODES } from '@/data/content';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHead } from '@/components/ui/SectionHead';

const ICONS: Record<string, React.ReactNode> = {
  'journey-1': (
    <>
      <circle cx="12" cy="9" r="3.6" />
      <path d="M4.8 20c.9-3.6 3.8-5.4 7.2-5.4s6.3 1.8 7.2 5.4" />
    </>
  ),
  'journey-2': (
    <>
      <path d="M9 12.5 11 15l4.5-5" />
      <path d="M12 3.6 19.4 6v5.4c0 4.4-3 7.6-7.4 9-4.4-1.4-7.4-4.6-7.4-9V6L12 3.6Z" />
    </>
  ),
  'journey-3': (
    <>
      <rect x="4.5" y="10.4" width="15" height="9.6" rx="2" />
      <path d="M8.4 10.4V7.6a3.6 3.6 0 0 1 7.2 0v2.8" />
      <path d="M12 14.2v2" />
    </>
  ),
  'journey-4': (
    <>
      <rect x="5" y="3.6" width="14" height="16.8" rx="2.4" />
      <path d="M8.6 9.4h6.8M8.6 13h6.8M8.6 16.4h3.6" />
    </>
  ),
  'journey-5': (
    <>
      <path d="M3.6 13h3.8l1.6-4.6 2.8 9 2.2-6 1.3 3.2h5.1" />
    </>
  ),
  'journey-6': (
    <>
      <path d="M3.4 12s3.2-6 8.6-6 8.6 6 8.6 6-3.2 6-8.6 6-8.6-6-8.6-6Z" />
      <circle cx="12" cy="12" r="2.6" />
    </>
  ),
};

export function Journey() {
  const steps = NODES.filter((n) => n.step).sort((a, b) => a.step! - b.step!);

  return (
    <section
      id="journey"
      className="relative bg-paper px-5 py-24 text-navy sm:px-8 sm:py-32 lg:px-12 lg:py-40"
    >
      <div className="mx-auto max-w-[1800px]">
        <SectionHead
          tone="paper"
          index="03"
          kicker="How RiskSense works"
          title={
            <>
              Six steps, and two of them are <span className="editorial text-teal">gates</span>.
            </>
          }
          lede="Clinician connection and access activation are both completed before full patient access is granted. Nothing about that is optional."
        />

        <ol className="grid gap-px overflow-hidden rounded-3xl border border-navy/12 bg-navy/12 sm:grid-cols-2 xl:grid-cols-3">
          {steps.map((step, i) => {
            const gate = step.step === 2 || step.step === 3;
            return (
              <Reveal
                key={step.id}
                as="li"
                delay={i * 80}
                className="group relative flex min-h-[15.5rem] flex-col justify-between bg-paper p-7 transition-colors duration-500 hover:bg-white sm:p-9"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="font-mono text-[0.7rem] tracking-[0.2em] text-teal">
                    {String(step.step).padStart(2, '0')}
                  </span>

                  <svg
                    viewBox="0 0 24 24"
                    className="h-9 w-9 text-navy/28 transition-colors duration-500 group-hover:text-teal"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    {ICONS[step.id]}
                  </svg>
                </div>

                <div>
                  {gate && (
                    <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-navy/6 px-2.5 py-1 micro-sm text-navy/55">
                      <span className="h-1 w-1 rounded-full bg-warn" />
                      Required gate
                    </span>
                  )}
                  <h3 className="font-display text-[1.35rem] leading-[1.12] font-semibold tracking-[-0.03em] text-navy sm:text-[1.5rem]">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 micro-sm text-navy/40">{step.kicker}</p>
                  <p className="mt-3.5 text-[0.9rem] leading-[1.62] text-navy/62">
                    {step.body[0]}
                  </p>
                </div>

                <div
                  className="absolute bottom-0 left-0 h-[2px] w-0 bg-teal transition-[width] duration-700 ease-[var(--ease-out-expo)] group-hover:w-full"
                  aria-hidden="true"
                />
              </Reveal>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
