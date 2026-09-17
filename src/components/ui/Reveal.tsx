'use client';

import { createElement, useEffect, useRef, type ElementType, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  /** Stagger in milliseconds. */
  delay?: number;
  className?: string;
  as?: ElementType;
  /** Fraction of the element that must be visible before it reveals. */
  amount?: number;
  /** Anchor target, when the revealed block is also a link destination. */
  id?: string;
};

/**
 * Scroll reveal. Deliberately restrained: one rise, one fade, once. The CSS
 * lives in globals.css so a reduced-motion user simply sees the finished state.
 */
export function Reveal({
  children,
  delay = 0,
  className = '',
  as = 'div',
  amount = 0.18,
  id,
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      el.setAttribute('data-reveal', 'in');
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).setAttribute('data-reveal', 'in');
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: amount, rootMargin: '0px 0px -8% 0px' },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [amount]);

  // The tag is chosen by the caller (li, section, header…), so the prop bag is
  // built imperatively rather than fighting the polymorphic JSX union.
  return createElement(
    as,
    {
      ref,
      id,
      'data-reveal': '',
      style: { '--reveal-delay': `${delay}ms` } as React.CSSProperties,
      className,
    },
    children,
  );
}

/** Splits a line into words that rise independently — used on the hero only. */
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
        <span key={`${word}-${i}`} className="inline-block overflow-hidden align-bottom">
          <span
            className="inline-block animate-rise"
            style={{ animationDelay: `${delay + i * 70}ms` }}
          >
            {word}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        </span>
      ))}
    </span>
  );
}
