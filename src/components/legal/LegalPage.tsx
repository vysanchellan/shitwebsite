import Link from 'next/link';
import { Nav } from '@/components/landing/Nav';
import { Footer } from '@/components/landing/Footer';
import { Reveal } from '@/components/ui/Reveal';

export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  list?: string[];
};

type Props = {
  kicker: string;
  title: string;
  standfirst: string;
  updated: string;
  sections: LegalSection[];
};

/**
 * Shared chrome for the three legal pages. They are plain documents on purpose —
 * the one place on this site where nothing should be clever.
 */
export function LegalPage({ kicker, title, standfirst, updated, sections }: Props) {
  return (
    <>
      <Nav />

      <main id="main" className="bg-ink">
        <header className="relative overflow-hidden px-5 pt-32 pb-14 sm:px-8 sm:pt-40 lg:px-12">
          <div className="grid-field absolute inset-0 opacity-40" aria-hidden="true" />

          <div className="relative mx-auto max-w-4xl">
            <p className="micro text-cyan">{kicker}</p>
            <h1 className="mt-7 display-l text-paper text-balance">{title}</h1>
            <p className="mt-7 text-[1rem] leading-[1.7] text-paper/60 sm:text-[1.08rem]">
              {standfirst}
            </p>
            <p className="mt-7 inline-flex items-center gap-2.5 rounded-full border border-white/12 px-4 py-2 micro-sm text-paper/40">
              <span className="h-1 w-1 rounded-full bg-cyan" />
              Last updated {updated}
            </p>
          </div>
        </header>

        <div className="mx-auto max-w-4xl px-5 pb-24 sm:px-8 sm:pb-32 lg:px-12">
          <div className="rule mb-14 text-paper" />

          {sections.map((section, i) => (
            <Reveal
              key={section.heading}
              as="section"
              delay={i * 40}
              className="mb-12 last:mb-0"
            >
              <h2 className="flex items-baseline gap-4 font-display text-[1.3rem] leading-tight font-semibold tracking-[-0.03em] text-paper sm:text-[1.55rem]">
                <span className="micro-sm shrink-0 text-cyan/60">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {section.heading}
              </h2>

              <div className="mt-5 sm:pl-11">
                {section.paragraphs?.map((p) => (
                  <p
                    key={p}
                    className="mb-4 text-[0.95rem] leading-[1.75] text-paper/65 last:mb-0 sm:text-[1.02rem]"
                  >
                    {p}
                  </p>
                ))}

                {section.list && (
                  <ul className="mt-4 space-y-2.5 border-t border-white/10 pt-4">
                    {section.list.map((item) => (
                      <li
                        key={item}
                        className="flex gap-3.5 text-[0.92rem] leading-[1.65] text-paper/62"
                      >
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-cyan/50" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Reveal>
          ))}

          <div className="mt-16 flex flex-wrap gap-3 border-t border-white/10 pt-10">
            {[
              { label: 'Privacy Notice', href: '/privacy' },
              { label: 'Terms of Service', href: '/terms' },
              { label: 'Medical Disclaimer', href: '/medical-disclaimer' },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-full border border-white/14 px-5 py-2.5 micro-sm text-paper/55 transition-colors hover:border-cyan/50 hover:text-cyan"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
