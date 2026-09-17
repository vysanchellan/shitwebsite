import type { ReactNode } from 'react';
import { Reveal } from './Reveal';

type Props = {
  index: string;
  kicker: string;
  title: ReactNode;
  lede?: ReactNode;
  /** 'dark' sits on ink, 'paper' sits on the off-white. */
  tone?: 'dark' | 'paper';
  align?: 'left' | 'between';
  aside?: ReactNode;
};

/**
 * Every section opens the same way: an index, a kicker, a rule, a large title.
 * The repetition is the point — it is what makes the page feel like one object.
 */
export function SectionHead({
  index,
  kicker,
  title,
  lede,
  tone = 'dark',
  aside,
}: Props) {
  const muted = tone === 'dark' ? 'text-paper/45' : 'text-navy/50';
  const strong = tone === 'dark' ? 'text-paper' : 'text-navy';
  const accent = tone === 'dark' ? 'text-cyan' : 'text-teal';

  return (
    <header className="mb-12 sm:mb-16 lg:mb-20">
      <Reveal className="flex items-center gap-4">
        <span className={`micro ${accent}`}>{index}</span>
        <span className={`micro ${muted}`}>{kicker}</span>
        <span className={`rule flex-1 ${strong}`} />
      </Reveal>

      <div className="mt-7 grid gap-7 lg:grid-cols-[1.35fr_1fr] lg:items-end lg:gap-16">
        <Reveal delay={80}>
          <h2 className={`display-l ${strong} text-balance`}>{title}</h2>
        </Reveal>

        {(lede || aside) && (
          <Reveal delay={160} className="lg:pb-2">
            {lede && (
              <p className={`text-[0.98rem] leading-[1.65] ${muted} sm:text-[1.05rem]`}>{lede}</p>
            )}
            {aside}
          </Reveal>
        )}
      </div>
    </header>
  );
}
