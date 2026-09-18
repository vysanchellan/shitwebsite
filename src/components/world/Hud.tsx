'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { NODES, NODE_COUNT } from '@/data/content';
import { Mark } from '@/components/ui/Wordmark';
import { ACCENT_HEX } from './layout';
import { MiniMap } from './MiniMap';
import { CAMPUS, DECK, RETAIL, heightAt } from './terrain';
import { useWorld } from './store';

/**
 * Which level you are standing on.
 *
 * The precinct is four levels now and they look alike from inside — off-white
 * concrete and the same paving — so without this it is genuinely easy to come
 * down the flight and not register that you have changed floor.
 */
function levelName(y: number) {
  if (y >= CAMPUS - 0.4) return 'Campus terrace';
  if (y >= DECK - 0.4) return 'The piazza';
  if (y >= RETAIL - 0.4) return 'Retail podium';
  if (y > 0.4) return 'On the steps';
  return 'Street level';
}

function LevelChip() {
  const [px, pz] = useWorld((s) => s.player);
  const y = heightAt(px, pz);
  const name = levelName(y);

  return (
    <span className="flex items-center gap-2 rounded-full border border-white/12 bg-ink/70 px-4 py-2 backdrop-blur-md">
      <span aria-hidden="true" className="flex h-3 w-3 flex-col justify-end gap-px">
        {[CAMPUS, DECK, RETAIL, 0].map((level) => (
          <span
            key={level}
            className={`block h-px w-full rounded-full transition-colors ${
              Math.abs(level - y) < 0.4 ? 'bg-brass' : 'bg-white/25'
            }`}
          />
        ))}
      </span>
      <span className="micro-sm text-paper/65">{name}</span>
    </span>
  );
}

/** A brief confirmation each time something new is read. */
function Toast() {
  const discovered = useWorld((s) => s.discovered);
  const [shown, setShown] = useState<string | null>(null);
  const last = useRef(0);

  useEffect(() => {
    if (discovered.length <= last.current) {
      last.current = discovered.length;
      return;
    }
    last.current = discovered.length;
    const id = discovered[discovered.length - 1];
    setShown(id);
    const t = window.setTimeout(() => setShown(null), 2600);
    return () => window.clearTimeout(t);
  }, [discovered]);

  if (!shown) return null;
  const node = NODES.find((n) => n.id === shown);
  if (!node) return null;

  return (
    <div className="animate-rise pointer-events-none absolute top-20 left-1/2 -translate-x-1/2 sm:top-24">
      <div className="flex items-center gap-3 rounded-full border border-white/12 bg-ink/85 py-2.5 pr-5 pl-3 backdrop-blur-md">
        <span
          className="grid h-6 w-6 place-items-center rounded-full"
          style={{ background: `${ACCENT_HEX[node.accent]}26` }}
        >
          <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" aria-hidden="true">
            <path
              d="m2.5 6.2 2.4 2.4L9.5 4"
              stroke={ACCENT_HEX[node.accent]}
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="micro-sm text-paper/75">
          Recorded · {node.label}
          <span className="ml-2 text-paper/35">
            {String(useWorld.getState().discovered.length).padStart(2, '0')}/{NODE_COUNT}
          </span>
        </span>
      </div>
    </div>
  );
}

export function Hud() {
  const nearby = useWorld((s) => s.nearby);
  const active = useWorld((s) => s.active);
  const mapOpen = useWorld((s) => s.mapOpen);
  const discovered = useWorld((s) => s.discovered);
  const toggleMap = useWorld((s) => s.toggleMap);
  const open = useWorld((s) => s.open);
  const mode = useWorld((s) => s.mode);

  const node = nearby ? NODES.find((n) => n.id === nearby) : null;
  const pct = (discovered.length / NODE_COUNT) * 100;
  const hidden = active !== null || mapOpen;

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-30 transition-opacity duration-300 ${
        hidden ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Top bar */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 sm:p-5">
        <div className="pointer-events-auto flex items-center gap-2.5">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-full border border-white/12 bg-ink/70 py-2.5 pr-4 pl-3 text-paper backdrop-blur-md transition-colors hover:border-brass/50 hover:text-brass"
          >
            <Mark className="h-4 w-4 text-brass" />
            <span className="micro-sm">Exit district</span>
          </Link>

          <span className="hidden md:inline">
            <LevelChip />
          </span>

          {node && (
            <span className="hidden rounded-full border border-white/10 bg-ink/60 px-4 py-2.5 micro-sm text-paper/55 backdrop-blur-md md:inline">
              {node.district}
            </span>
          )}
        </div>

        <div className="pointer-events-auto flex items-start gap-3">
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-3 rounded-full border border-white/12 bg-ink/70 px-4 py-2.5 backdrop-blur-md">
              <span className="micro-sm text-paper/45">Recorded</span>
              <span className="font-sans text-[0.8rem] text-paper tabular-nums">
                {String(discovered.length).padStart(2, '0')}
                <span className="text-paper/35">/{NODE_COUNT}</span>
              </span>
              <span className="h-1 w-14 overflow-hidden rounded-full bg-white/12">
                <span
                  className="block h-full rounded-full bg-brass transition-[width] duration-700 ease-[var(--ease-out-expo)]"
                  style={{ width: `${pct}%` }}
                />
              </span>
            </div>

            <button
              type="button"
              onClick={toggleMap}
              className="rounded-full border border-white/12 bg-ink/70 px-4 py-2 micro-sm text-paper/65 backdrop-blur-md transition-colors hover:border-brass/50 hover:text-brass"
            >
              Map · M
            </button>
          </div>

          <MiniMap />
        </div>
      </div>

      <Toast />

      {/* Reticle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" aria-hidden="true">
        <span
          className={`block rounded-full border transition-all duration-300 ${
            node
              ? 'h-3.5 w-3.5 border-brass bg-brass/25'
              : 'h-1.5 w-1.5 border-white/35 bg-white/25'
          }`}
        />
      </div>

      {/* Interaction prompt */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 p-4 sm:p-7">
        <div
          className={`pointer-events-auto transition-all duration-400 ease-[var(--ease-out-expo)] ${
            node ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          {node && (
            <button
              type="button"
              onClick={() => open(node.id)}
              className="flex items-center gap-3.5 rounded-full border bg-ink/85 py-3 pr-6 pl-3 backdrop-blur-md transition-colors"
              style={{ borderColor: `${ACCENT_HEX[node.accent]}66` }}
            >
              <span
                className="grid h-8 w-8 place-items-center rounded-full font-sans text-[0.75rem] font-semibold text-ink"
                style={{ background: ACCENT_HEX[node.accent] }}
              >
                E
              </span>
              <span className="text-left">
                <span className="block micro-sm text-paper/40">
                  {discovered.includes(node.id) ? 'Read again' : 'Read'}
                </span>
                <span className="mt-0.5 block font-display text-[0.95rem] font-normal tracking-[-0.02em] text-paper">
                  {node.label}
                </span>
              </span>
            </button>
          )}
        </div>

        {mode !== 'touch' && (
          <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 micro-sm text-paper/28">
            <span>
              <kbd className="rounded border border-white/15 px-1.5 py-0.5">W A S D</kbd> move
            </span>
            <span>
              <kbd className="rounded border border-white/15 px-1.5 py-0.5">Shift</kbd> sprint
            </span>
            <span>
              <kbd className="rounded border border-white/15 px-1.5 py-0.5">Mouse</kbd> look
            </span>
            <span>
              <kbd className="rounded border border-white/15 px-1.5 py-0.5">E</kbd> read
            </span>
            <span>
              <kbd className="rounded border border-white/15 px-1.5 py-0.5">M</kbd> map
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
