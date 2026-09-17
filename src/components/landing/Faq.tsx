'use client';

import { useState } from 'react';
import { FAQ, NODES, SUPPORT_EMAIL } from '@/data/content';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHead } from '@/components/ui/SectionHead';

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const contact = NODES.find((n) => n.id === 'contact')!;

  return (
    <section
      id="faq"
      className="relative bg-paper px-5 py-24 text-graphite sm:px-8 sm:py-32 lg:px-12 lg:py-40"
    >
      <div className="mx-auto max-w-[1800px]">
        <SectionHead
          tone="paper"
          index="08"
          kicker="FAQ & contact"
          title={
            <>
              The questions patients <span className="editorial text-brass">actually</span> ask.
            </>
          }
          lede="Short answers, no hedging. Anything clinical belongs with your clinician. That is the whole design."
        />

        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-20">
          <ul className="border-t border-graphite/12">
            {FAQ.map((item, i) => {
              const isOpen = open === i;
              return (
                <Reveal key={item.q} as="li" delay={i * 50} className="border-b border-graphite/12">
                  <h3>
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      className="group flex w-full items-start gap-5 py-6 text-left"
                    >
                      <span className="micro-sm mt-2 w-6 shrink-0 text-brass">
                        {String(i + 1).padStart(2, '0')}
                      </span>

                      <span className="flex-1 font-display text-[1.15rem] leading-[1.3] font-normal tracking-[-0.025em] text-graphite transition-colors duration-400 group-hover:text-brass sm:text-[1.45rem]">
                        {item.q}
                      </span>

                      <span
                        className="relative mt-2 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-graphite/20 transition-colors duration-400 group-hover:border-brass"
                        aria-hidden="true"
                      >
                        <span className="absolute h-px w-2.5 bg-graphite/70" />
                        <span
                          className={`absolute h-2.5 w-px bg-graphite/70 transition-transform duration-500 ease-[var(--ease-out-expo)] ${
                            isOpen ? 'scale-y-0' : 'scale-y-100'
                          }`}
                        />
                      </span>
                    </button>
                  </h3>

                  <div
                    className="grid transition-[grid-template-rows] duration-500 ease-[var(--ease-out-expo)]"
                    style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                  >
                    <div className="overflow-hidden">
                      <p className="pb-7 pl-11 text-[0.95rem] leading-[1.7] text-graphite/65 sm:max-w-[60ch] sm:text-[1.02rem]">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </ul>

          {/* Contact */}
          <Reveal delay={120} id="contact" className="lg:pt-2">
            <div className="sticky top-28 border border-graphite/12 bg-white p-7 sm:p-9">
              <p className="micro-sm text-brass">Contact us</p>
              <h3 className="mt-4 display-m text-graphite">{contact.title}</h3>

              {contact.body.map((p) => (
                <p key={p} className="mt-4 text-[0.92rem] leading-[1.65] text-graphite/62">
                  {p}
                </p>
              ))}

              <a
                href={contact.cta!.href}
                className="group mt-8 flex items-center justify-between gap-4 bg-graphite px-6 py-5 text-paper transition-colors duration-500 hover:bg-brass hover:text-ink"
              >
                <span>
                  <span className="block micro-sm opacity-55">Email support</span>
                  <span className="mt-1.5 block font-display text-[1.02rem] font-normal tracking-[-0.02em]">
                    {SUPPORT_EMAIL}
                  </span>
                </span>
                <svg
                  viewBox="0 0 14 14"
                  className="h-4 w-4 shrink-0 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1 group-hover:-translate-y-1"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M3.5 10.5 10.5 3.5M4.6 3.5h5.9v5.9"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>

              <p className="mt-5 micro-sm leading-[1.85] text-graphite/38">
                Opens your own email application with the subject pre-filled. Never include medical
                details or identifiers.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
