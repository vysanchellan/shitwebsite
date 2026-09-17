'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { NAV } from '@/data/content';
import { Wordmark } from '@/components/ui/Wordmark';

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-full focus:bg-cyan focus:px-5 focus:py-2.5 focus:text-ink focus:micro"
      >
        Skip to content
      </a>

      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-500 ${
          scrolled || open
            ? 'border-b border-white/8 bg-ink/78 backdrop-blur-xl'
            : 'border-b border-transparent'
        }`}
      >
        <nav
          aria-label="Primary"
          className="mx-auto flex h-16 max-w-[1800px] items-center justify-between gap-6 px-5 sm:h-18 sm:px-8 lg:px-12"
        >
          <Link
            href="/"
            className="shrink-0 text-[1.05rem] text-paper transition-opacity hover:opacity-70"
            aria-label="RiskSense AI — home"
          >
            <Wordmark />
          </Link>

          <ul className="hidden items-center gap-7 xl:flex">
            {NAV.slice(1).map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="group relative micro text-paper/60 transition-colors hover:text-paper"
                >
                  {item.label}
                  <span className="absolute -bottom-2 left-0 h-px w-0 bg-cyan transition-[width] duration-500 ease-[var(--ease-out-expo)] group-hover:w-full" />
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2.5">
            <Link
              href="/world"
              className="group hidden items-center gap-2.5 rounded-full border border-cyan/35 bg-cyan/8 py-2.5 pr-3.5 pl-5 micro text-cyan transition-colors duration-400 hover:bg-cyan hover:text-ink sm:inline-flex"
            >
              Enter District
              <span className="grid h-5 w-5 place-items-center rounded-full bg-cyan/20 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-0.5 group-hover:bg-ink/15">
                <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" aria-hidden="true">
                  <path
                    d="M2 6h8M6.5 2.5 10 6l-3.5 3.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={open ? 'Close menu' : 'Open menu'}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/12 text-paper transition-colors hover:border-cyan/50 hover:text-cyan xl:hidden"
            >
              <span className="relative block h-3 w-4">
                <span
                  className={`absolute left-0 h-px w-full bg-current transition-transform duration-400 ease-[var(--ease-out-expo)] ${
                    open ? 'top-1.5 rotate-45' : 'top-0'
                  }`}
                />
                <span
                  className={`absolute left-0 h-px w-full bg-current transition-transform duration-400 ease-[var(--ease-out-expo)] ${
                    open ? 'top-1.5 -rotate-45' : 'top-3'
                  }`}
                />
              </span>
            </button>
          </div>
        </nav>
      </header>

      {/* Full-bleed menu — the links get the same scale as the headlines. */}
      <div
        className={`fixed inset-0 z-40 bg-ink transition-[opacity,visibility] duration-500 xl:hidden ${
          open ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      >
        <div className="grid-field absolute inset-0 opacity-50" aria-hidden="true" />
        <div className="relative flex h-full flex-col justify-center px-5 pt-20 pb-10 sm:px-8">
          <ul className="space-y-1">
            {NAV.map((item, i) => (
              <li key={item.label} className="overflow-hidden">
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-baseline gap-4 py-1.5 transition-colors hover:text-cyan"
                  style={{
                    transitionDelay: `${i * 30}ms`,
                    transform: open ? 'none' : 'translateY(110%)',
                    transition: 'transform 0.7s var(--ease-out-expo)',
                    transitionProperty: 'transform, color',
                  }}
                >
                  <span className="micro-sm w-7 shrink-0 text-cyan/50">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="display-m">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-col gap-3">
            <Link
              href="/world"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between rounded-2xl bg-cyan px-6 py-5 text-ink transition-transform duration-500 ease-[var(--ease-out-expo)] active:scale-[0.98]"
            >
              <span className="micro">Enter the District</span>
              <span className="micro-sm opacity-60">3D · Interactive</span>
            </Link>
            <Link
              href="/register/complete"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between rounded-2xl border border-white/12 px-6 py-5 text-paper"
            >
              <span className="micro">Complete Registration</span>
              <span className="micro-sm text-warn">Demo</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
