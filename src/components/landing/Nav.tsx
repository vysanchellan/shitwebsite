'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { NAV } from '@/data/content';
import { Mark } from '@/components/ui/Wordmark';

/**
 * Menu left, wordmark centred, one action right. Square, hairline-ruled, and
 * silent until you scroll — the chrome is not the point.
 */
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
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-cyan focus:px-5 focus:py-2.5 focus:text-ink focus:micro"
      >
        Skip to content
      </a>

      <header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
          scrolled || open ? 'border-b border-paper/12 bg-ink' : 'border-b border-transparent'
        }`}
      >
        <nav
          aria-label="Primary"
          className="mx-auto grid h-16 max-w-[1800px] grid-cols-[1fr_auto_1fr] items-center px-5 sm:h-[4.5rem] sm:px-8 lg:px-12"
        >
          {/* Menu */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="flex w-fit items-center gap-3 micro text-paper/70 transition-colors hover:text-paper"
          >
            <span className="relative block h-[9px] w-4" aria-hidden="true">
              <span
                className={`absolute left-0 h-px w-full bg-current transition-transform duration-400 ease-[var(--ease-out-expo)] ${
                  open ? 'top-1 rotate-45' : 'top-0'
                }`}
              />
              <span
                className={`absolute left-0 h-px w-full bg-current transition-transform duration-400 ease-[var(--ease-out-expo)] ${
                  open ? 'top-1 -rotate-45' : 'top-2'
                }`}
              />
            </span>
            <span className="hidden sm:inline">{open ? 'Close' : 'Menu'}</span>
          </button>

          {/* Wordmark */}
          <Link
            href="/"
            aria-label="RiskSense AI — home"
            className="flex items-center gap-2.5 justify-self-center text-paper transition-opacity hover:opacity-60"
          >
            <Mark className="h-4 w-4 text-cyan" />
            <span className="font-display text-[0.95rem] font-semibold tracking-[0.34em] uppercase">
              RiskSense
            </span>
          </Link>

          {/* Action */}
          <Link
            href="/world"
            className="justify-self-end border border-paper/25 px-4 py-2.5 micro text-paper transition-colors duration-400 hover:border-cyan hover:bg-cyan hover:text-ink sm:px-6"
          >
            <span className="hidden sm:inline">Enter the district</span>
            <span className="sm:hidden">Enter</span>
          </Link>
        </nav>
      </header>

      {/* Full-bleed menu */}
      <div
        className={`fixed inset-0 z-40 bg-ink transition-[opacity,visibility] duration-500 ${
          open ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      >
        <div className="column-rules absolute inset-0" aria-hidden="true" />

        <div className="relative flex h-full flex-col justify-between px-5 pt-24 pb-8 sm:px-8 lg:px-12">
          <ul className="border-t border-paper/12">
            {NAV.map((item, i) => (
              <li key={item.label} className="overflow-hidden border-b border-paper/12">
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="group flex items-baseline gap-5 py-3 transition-colors hover:text-cyan sm:py-4"
                  style={{
                    transform: open ? 'none' : 'translateY(105%)',
                    transition: `transform 0.75s var(--ease-out-expo) ${i * 40}ms, color 0.3s`,
                  }}
                >
                  <span className="micro-sm w-7 shrink-0 text-cyan/50">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="display-m">{item.label}</span>
                  <span className="rule ml-auto hidden max-w-40 flex-1 self-center text-paper transition-opacity group-hover:opacity-60 sm:block" />
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-10 grid gap-px bg-paper/12 sm:grid-cols-2">
            <Link
              href="/world"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between bg-cyan px-6 py-5 text-ink"
            >
              <span className="micro">Enter the district</span>
              <span className="micro-sm opacity-60">3D · Interactive</span>
            </Link>
            <Link
              href="/register/complete"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between bg-ink px-6 py-5 text-paper"
            >
              <span className="micro">Complete registration</span>
              <span className="micro-sm text-warn">Demo</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
