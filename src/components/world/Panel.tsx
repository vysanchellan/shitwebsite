'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { NODES } from '@/data/content';
import { INSURERS } from '@/data/insurers';
import { ACCENT_HEX } from './layout';
import { useWorld } from './store';

/** The insurer roster is shown inside the Insurance Pavilion panel. */
function InsurerRoster() {
  return (
    <div className="mt-6">
      <p className="micro-sm mb-3 text-paper/32">Selectable during registration</p>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {INSURERS.map((ins) => (
          <li
            key={ins.id}
            className={`border border-white/10 bg-white/[0.03] p-3 ${
              ins.enabled ? '' : 'opacity-40'
            }`}
          >
            <span
              className="grid h-8 w-8 place-items-center rounded-lg font-display text-[0.7rem] font-semibold"
              style={{ background: `${ins.hue}22`, color: ins.hue, boxShadow: `inset 0 0 0 1px ${ins.hue}44` }}
            >
              {ins.mark}
            </span>
            <span className="mt-2.5 block text-[0.72rem] leading-tight text-paper/78">{ins.name}</span>
            <span className="mt-1 block micro-sm text-warn/80">
              {ins.enabled ? 'Demo' : 'Disabled'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Panel() {
  const active = useWorld((s) => s.active);
  const close = useWorld((s) => s.close);
  const closeBtn = useRef<HTMLButtonElement>(null);

  const node = active ? NODES.find((n) => n.id === active) : null;

  useEffect(() => {
    if (!node) return;
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.code === 'KeyE') {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [node, close]);

  if (!node) return null;

  const accent = ACCENT_HEX[node.accent];

  return (
    <div className="pointer-events-auto fixed inset-0 z-40 flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close"
        onClick={close}
        className="absolute inset-0 cursor-default bg-ink/76 backdrop-blur-[3px]"
      />

      <article
        role="dialog"
        aria-modal="true"
        aria-labelledby="rs-panel-title"
        className="animate-rise relative flex max-h-[86svh] w-full max-w-3xl flex-col overflow-hidden border border-white/12 bg-navy/92 shadow-[0_50px_140px_-40px_rgba(0,0,0,0.95)] backdrop-blur-xl"
      >
        {/* Accent rail */}
        <span
          className="absolute inset-x-0 top-0 h-[3px]"
          style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
          aria-hidden="true"
        />

        <header className="flex items-start gap-4 px-6 pt-7 pb-5 sm:px-9 sm:pt-9">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2.5 micro-sm" style={{ color: accent }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
              {node.district}
              <span className="text-paper/25">/</span>
              <span className="text-paper/40">{node.kicker}</span>
            </p>

            <h2
              id="rs-panel-title"
              className="mt-3.5 font-display text-[1.5rem] leading-[1.08] font-semibold tracking-[-0.03em] text-paper text-balance sm:text-[2.1rem]"
            >
              {node.step && (
                <span className="mr-3 font-mono text-[0.85em] opacity-40">
                  {String(node.step).padStart(2, '0')}
                </span>
              )}
              {node.title}
            </h2>
          </div>

          <button
            ref={closeBtn}
            type="button"
            onClick={close}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/15 text-paper/60 transition-colors hover:border-white/40 hover:text-paper"
            aria-label="Close and return to the district"
          >
            <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" aria-hidden="true">
              <path d="m2.5 2.5 7 7m0-7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-7 sm:px-9 sm:pb-9">
          {node.body.map((p) => (
            <p key={p} className="mb-4 text-[0.95rem] leading-[1.68] text-paper/72 last:mb-0 sm:text-[1.02rem]">
              {p}
            </p>
          ))}

          {node.bullets && (
            <dl className="mt-7 border-t border-white/10">
              {node.bullets.map((b) => (
                <div key={b.label} className="flex flex-col gap-1 border-b border-white/10 py-3.5 sm:flex-row sm:gap-6">
                  <dt className="shrink-0 font-display text-[0.9rem] font-semibold tracking-[-0.01em] text-paper sm:w-52">
                    {b.label}
                  </dt>
                  <dd className="text-[0.88rem] leading-[1.6] text-paper/58">{b.text}</dd>
                </div>
              ))}
            </dl>
          )}

          {node.id === 'insurance' && <InsurerRoster />}

          {node.footnote && (
            <p className="mt-6 border border-white/10 bg-white/[0.03] px-4 py-3.5 micro-sm leading-[1.85] text-paper/40">
              {node.footnote}
            </p>
          )}

          {node.cta && (
            <div className="mt-7">
              {node.cta.href.startsWith('mailto:') ? (
                <a
                  href={node.cta.href}
                  className="inline-flex items-center gap-3 rounded-full px-6 py-3.5 micro text-ink transition-opacity hover:opacity-85"
                  style={{ background: accent }}
                >
                  {node.cta.label}
                </a>
              ) : (
                <Link
                  href={node.cta.href}
                  className="inline-flex items-center gap-3 rounded-full px-6 py-3.5 micro text-ink transition-opacity hover:opacity-85"
                  style={{ background: accent }}
                >
                  {node.cta.label}
                  <svg viewBox="0 0 14 14" className="h-3 w-3" fill="none" aria-hidden="true">
                    <path
                      d="M2 7h10M8 3l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              )}
            </div>
          )}
        </div>

        <footer className="flex items-center justify-between gap-4 border-t border-white/10 px-6 py-3.5 sm:px-9">
          <p className="micro-sm text-paper/30">
            <kbd className="rounded border border-white/15 px-1.5 py-0.5">Esc</kbd> to keep walking
          </p>
          <p className="micro-sm text-paper/22">RiskSense District</p>
        </footer>
      </article>
    </div>
  );
}
