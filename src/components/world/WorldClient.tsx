'use client';

import dynamic from 'next/dynamic';

/**
 * Client boundary for the district. `ssr: false` keeps three.js out of the
 * server render entirely — the world is a browser-only experience and there is
 * nothing meaningful to prerender.
 */
const WorldShell = dynamic(() => import('./WorldShell').then((m) => m.WorldShell), {
  ssr: false,
  loading: () => (
    <div className="flex h-[100svh] w-full flex-col items-center justify-center gap-5 bg-ink">
      <span className="h-px w-40 overflow-hidden bg-white/10">
        <span className="block h-full w-1/3 animate-marquee bg-brass" />
      </span>
      <p className="micro text-brass/70">Building the district…</p>
    </div>
  ),
});

export function WorldClient() {
  return <WorldShell />;
}
