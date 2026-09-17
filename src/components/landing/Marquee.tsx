import { HERO } from '@/data/content';
import { Mark } from '@/components/ui/Wordmark';

/**
 * The badge strip, set as a slow kinetic rule between the hero and the paper
 * sections. The track is duplicated so the translate loop is seamless.
 */
export function Marquee() {
  const items = [...HERO.badges, 'Heart Disease', 'Diabetes v1', 'Backend Verified'];

  return (
    <div className="relative overflow-hidden border-y border-white/8 bg-ink py-4">
      <div className="flex w-max animate-marquee">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1}>
            {items.map((item, i) => (
              <span key={`${copy}-${item}-${i}`} className="flex items-center">
                <span className="micro px-7 text-paper/38">{item}</span>
                <Mark className="h-3 w-3 shrink-0 text-brass/45" />
              </span>
            ))}
          </div>
        ))}
      </div>

      {/* Feathered ends so the strip reads as a material, not a component. */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-ink to-transparent"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-ink to-transparent"
        aria-hidden="true"
      />
    </div>
  );
}
