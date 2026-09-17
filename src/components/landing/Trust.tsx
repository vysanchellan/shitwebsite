import { NODES } from '@/data/content';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHead } from '@/components/ui/SectionHead';

export function Trust() {
  const clinician = NODES.find((n) => n.id === 'clinician')!;
  const security = NODES.find((n) => n.id === 'security')!;

  return (
    <section
      id="security"
      className="relative overflow-hidden bg-ink px-5 py-24 sm:px-8 sm:py-32 lg:px-12 lg:py-40"
    >

      <div className="relative mx-auto max-w-[1800px]">
        <SectionHead
          index="06"
          kicker="Clinician connection & security"
          title={
            <>
              Built to end in a <span className="editorial text-ok">conversation</span>.
            </>
          }
          lede="A risk estimate without a clinician is an anxiety generator. RiskSense makes the clinician link mandatory, and then protects everything around it."
        />

        <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr] lg:gap-6">
          {/* Clinician */}
          <Reveal className="relative overflow-hidden border border-white/10 bg-gradient-to-br from-navy/60 via-navy/25 to-ink p-7 sm:p-10">
            <p className="micro-sm text-ok/80">{clinician.kicker}</p>
            <h3 className="mt-4 display-m text-paper">{clinician.title}</h3>

            {clinician.body.map((p) => (
              <p
                key={p}
                className="mt-5 max-w-[58ch] text-[0.95rem] leading-[1.68] text-paper/58"
              >
                {p}
              </p>
            ))}

            {/* Clinician ID verification, shown as the UI it becomes. */}
            <div className="mt-9 border border-white/10 bg-ink/60 p-5 sm:p-6">
              <p className="micro-sm mb-3.5 text-paper/32">Clinician ID verification</p>

              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center gap-3 border border-white/12 bg-white/[0.03] px-4 py-3">
                  <span className="micro-sm text-cyan/60">RS</span>
                  <span className="font-mono text-[0.92rem] tracking-[0.18em] text-paper/85">
                    ••••-••••-4471
                  </span>
                </div>
                <span className="inline-flex items-center justify-center gap-2 bg-ok/14 px-5 py-3 micro-sm text-ok">
                  <svg viewBox="0 0 14 14" className="h-3 w-3" fill="none" aria-hidden="true">
                    <path
                      d="m3 7.4 2.6 2.6L11 4.6"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Verified
                </span>
              </div>

              <p className="mt-3.5 micro-sm leading-[1.8] text-paper/28">
                On success the patient sees only the minimum detail needed to confirm the match.
                An invalid or unapproved ID creates no relationship.
              </p>
            </div>
          </Reveal>

          {/* Security */}
          <Reveal delay={120} className="relative overflow-hidden border border-white/10 bg-ink p-7 sm:p-10">
            <div className="column-rules absolute inset-0" aria-hidden="true" />

            <div className="relative">
              <p className="micro-sm text-teal/80">{security.kicker}</p>
              <h3 className="mt-4 display-m text-paper">{security.title}</h3>
              <p className="mt-5 max-w-[46ch] text-[0.95rem] leading-[1.68] text-paper/58">
                {security.body[0]}
              </p>

              <ul className="mt-9 space-y-px overflow-hidden border border-white/10">
                {security.bullets?.map((b, i) => (
                  <li
                    key={b.label}
                    className="group flex items-start gap-4 bg-white/[0.02] px-5 py-4 transition-colors duration-500 hover:bg-teal/10"
                  >
                    <span className="micro-sm mt-1 w-5 shrink-0 text-teal/55">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <h4 className="font-display text-[0.98rem] font-semibold tracking-[-0.015em] text-paper">
                        {b.label}
                      </h4>
                      <p className="mt-1 text-[0.85rem] leading-[1.55] text-paper/48">{b.text}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <p className="mt-6 micro-sm leading-[1.85] text-paper/28">{security.footnote}</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
