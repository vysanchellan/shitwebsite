'use client';

import { createElement, useEffect, useRef, type ElementType, type ReactNode } from 'react';

/**
 * Scroll reveal.
 *
 * Two rules learned the hard way:
 *
 *  1. **Content is visible by default.** The hidden state is applied by script
 *     after mount, never by the stylesheet. If the script fails, if the observer
 *     never delivers, or if the page is too busy to run a rendering step, the
 *     reader still gets the page. The previous version hid everything in CSS and
 *     waited for a callback that, on a loaded page, never came — leaving whole
 *     sections blank.
 *  2. **One observer, not one per element.** A long page has dozens of these.
 *
 * A watchdog gives up on the whole mechanism if nothing has been delivered
 * shortly after the first element registers, and shows everything instead.
 */

type Registered = { el: HTMLElement; reveal: () => void };

const registry = new Map<Element, Registered>();
let observer: IntersectionObserver | null = null;
let delivered = false;
let abandoned = false;
let watchdog: number | null = null;

function revealAll() {
  abandoned = true;
  for (const { reveal } of registry.values()) reveal();
  registry.clear();
  observer?.disconnect();
  observer = null;
  window.removeEventListener('scroll', sweepVisible);
  window.removeEventListener('resize', sweepVisible);
  if (watchdog !== null) {
    window.clearTimeout(watchdog);
    watchdog = null;
  }
}

function ensureObserver() {
  if (observer || abandoned) return observer;
  if (typeof IntersectionObserver === 'undefined') {
    revealAll();
    return null;
  }

  observer = new IntersectionObserver(
    (entries) => {
      delivered = true;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const hit = registry.get(entry.target);
        if (!hit) continue;
        hit.reveal();
        registry.delete(entry.target);
        observer?.unobserve(entry.target);
      }
    },
    // A single generous threshold: a tall section can never show 18% of itself
    // on a short viewport, and waiting for that is how rows stay hidden.
    { rootMargin: '0px 0px -6% 0px', threshold: 0.01 },
  );

  // If the page is too busy to deliver even one observation, stop pretending.
  watchdog = window.setTimeout(() => {
    if (!delivered) revealAll();
  }, 1200);

  // Belt and braces. Observer delivery is tied to the rendering lifecycle, so a
  // page that is busy enough can starve it *after* the first callback, which
  // would strand every section further down. Scroll events are not tied to
  // rendering, so this sweep still runs when nothing else does.
  window.addEventListener('scroll', sweepVisible, { passive: true });
  window.addEventListener('resize', sweepVisible, { passive: true });

  return observer;
}

let sweeping = 0;

/** Reveals anything currently on screen, regardless of the observer. */
function sweepVisible() {
  const now = Date.now();
  if (now - sweeping < 120 || abandoned) return;
  sweeping = now;

  for (const [target, entry] of registry) {
    const rect = entry.el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      entry.reveal();
      registry.delete(target);
      observer?.unobserve(target);
    }
  }
}

type Props = {
  children: ReactNode;
  /** Stagger in milliseconds. */
  delay?: number;
  className?: string;
  as?: ElementType;
  /** Anchor target, when the revealed block is also a link destination. */
  id?: string;
};

export function Reveal({ children, delay = 0, className = '', as = 'div', id }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || abandoned) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    // Hide only now that we know we can bring it back.
    el.setAttribute('data-reveal', 'out');
    const reveal = () => el.setAttribute('data-reveal', 'in');

    // Already on screen at mount: no need to wait for a callback.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      window.requestAnimationFrame(reveal);
      return;
    }

    const io = ensureObserver();
    if (!io) {
      reveal();
      return;
    }

    registry.set(el, { el, reveal });
    io.observe(el);

    return () => {
      registry.delete(el);
      io.unobserve(el);
    };
  }, []);

  return createElement(
    as,
    {
      ref,
      id,
      style: { '--reveal-delay': `${delay}ms` } as React.CSSProperties,
      className,
    },
    children,
  );
}

/**
 * Splits a line into words that unmask independently. Used on the hero only,
 * and like everything else here it starts from the visible state so a stalled
 * animation cannot swallow the headline.
 */
export function RevealWords({
  text,
  delay = 0,
  className = '',
}: {
  text: string;
  delay?: number;
  className?: string;
}) {
  const words = text.split(' ');

  return (
    <span className={className}>
      {words.map((word, i) => (
        // The mask needs slack below the baseline or a Didone's descenders get
        // sheared off; the negative margin gives it back to the line box.
        <span
          key={`${word}-${i}`}
          className="inline-block overflow-hidden pb-[0.22em] align-bottom"
          style={{ marginBottom: '-0.22em' }}
        >
          <span
            className="inline-block animate-unmask"
            style={{ animationDelay: `${delay + i * 80}ms` }}
          >
            {word}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        </span>
      ))}
    </span>
  );
}
