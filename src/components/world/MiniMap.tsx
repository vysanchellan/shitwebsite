'use client';

import { NODES } from '@/data/content';
import { ACCENT_HEX, BOUNDS, CITY, STRUCTURES } from './layout';
import { useWorld } from './store';

const W = BOUNDS.maxX - BOUNDS.minX;
const H = BOUNDS.maxZ - BOUNDS.minZ;

/** World XZ to SVG space. */
const sx = (x: number) => x - BOUNDS.minX;
const sy = (z: number) => z - BOUNDS.minZ;

/** How much of the world the corner map shows around the player, in metres. */
const MINIMAP_SPAN = 150;

/**
 * District map. The same projection serves both views: the corner map windows
 * in on the player, the full map shows the whole city, and a position learned
 * from one reads the same way on the other.
 */
function MapSvg({ full }: { full: boolean }) {
  const [px, pz] = useWorld((s) => s.player);
  const heading = useWorld((s) => s.heading);
  const discovered = useWorld((s) => s.discovered);
  const nearby = useWorld((s) => s.nearby);

  // The corner map follows the player; the full map shows the whole city.
  const view = full
    ? `0 0 ${W} ${H}`
    : `${sx(px) - MINIMAP_SPAN / 2} ${sy(pz) - MINIMAP_SPAN / 2} ${MINIMAP_SPAN} ${MINIMAP_SPAN}`;

  return (
    <svg
      viewBox={view}
      className="h-full w-full"
      role={full ? 'img' : 'presentation'}
      aria-label={full ? 'Map of the RiskSense District' : undefined}
    >
      <rect x={-W} y={-H} width={W * 3} height={H * 3} fill="#060c18" />

      {/* The generated city, so the corner map is not an empty field */}
      <g>
        {CITY.map((b, i) => (
          <rect
            key={i}
            x={sx(b.pos[0] - b.size[0] / 2)}
            y={sy(b.pos[1] - b.size[2] / 2)}
            width={b.size[0]}
            height={b.size[2]}
            fill="#162236"
            fillOpacity={0.9}
          />
        ))}
      </g>

      {/* Avenues */}
      <g stroke="#45d7e8" strokeOpacity="0.14" strokeWidth="14" strokeLinecap="round">
        <line x1={sx(0)} y1={sy(78)} x2={sx(0)} y2={sy(-80)} />
        <line x1={sx(-56)} y1={sy(2)} x2={sx(56)} y2={sy(2)} />
        <line x1={sx(-52)} y1={sy(-44)} x2={sx(52)} y2={sy(-44)} />
      </g>

      {/* Structures */}
      <g>
        {STRUCTURES.map((s) => (
          <rect
            key={s.id}
            x={sx(s.pos[0] - s.size[0] / 2)}
            y={sy(s.pos[1] - s.size[2] / 2)}
            width={s.size[0]}
            height={s.size[2]}
            rx={1.5}
            fill={s.accent}
            fillOpacity={0.16}
            stroke={s.accent}
            strokeOpacity={0.4}
            strokeWidth={0.5}
          />
        ))}
      </g>

      {/* Nodes */}
      <g>
        {NODES.map((n) => {
          const read = discovered.includes(n.id);
          const near = nearby === n.id;
          const c = ACCENT_HEX[n.accent];
          return (
            <g key={n.id}>
              {near && (
                <circle cx={sx(n.position[0])} cy={sy(n.position[2])} r="6" fill={c} fillOpacity="0.22">
                  <animate attributeName="r" values="4;8;4" dur="1.6s" repeatCount="indefinite" />
                </circle>
              )}
              <circle
                cx={sx(n.position[0])}
                cy={sy(n.position[2])}
                r={near ? 3 : 2.3}
                fill={read ? '#0a1424' : c}
                stroke={c}
                strokeWidth={read ? 1 : 0.6}
              />
            </g>
          );
        })}
      </g>

      {/* Player */}
      <g transform={`translate(${sx(px)} ${sy(pz)}) rotate(${(heading * 180) / Math.PI})`}>
        <circle r="7" fill="#f5f4f0" fillOpacity="0.12" />
        <path d="M0 -5 L3.6 4 L0 2 L-3.6 4 Z" fill="#f5f4f0" />
      </g>

    </svg>
  );
}

export function MiniMap() {
  return (
    <div className="pointer-events-none hidden h-36 w-36 overflow-hidden border border-white/12 bg-ink/70 backdrop-blur-md sm:block lg:h-44 lg:w-44">
      <MapSvg full={false} />
    </div>
  );
}

export function FullMap() {
  const mapOpen = useWorld((s) => s.mapOpen);
  const toggleMap = useWorld((s) => s.toggleMap);
  const discovered = useWorld((s) => s.discovered);

  if (!mapOpen) return null;

  const districts = Array.from(new Set(NODES.map((n) => n.district)));

  return (
    <div className="pointer-events-auto fixed inset-0 z-40 flex flex-col bg-ink/92 p-4 backdrop-blur-lg sm:p-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="micro text-brass">District map</p>
          <h2 className="mt-2 display-m text-paper">RiskSense District</h2>
        </div>
        <button
          type="button"
          onClick={toggleMap}
          className="rounded-full border border-white/15 px-5 py-2.5 micro text-paper/70 transition-colors hover:border-brass hover:text-brass"
        >
          Close · M
        </button>
      </header>

      <div className="mt-6 grid min-h-0 flex-1 gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="min-h-0 overflow-hidden border border-white/10 bg-void">
          <MapSvg full />
        </div>

        <div className="min-h-0 overflow-y-auto border border-white/10 bg-void/60 p-5">
          <p className="micro-sm text-paper/35">Districts</p>
          <ul className="mt-4 space-y-4">
            {districts.map((d) => {
              const nodes = NODES.filter((n) => n.district === d);
              const found = nodes.filter((n) => discovered.includes(n.id)).length;
              return (
                <li key={d}>
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-display text-[0.95rem] font-normal tracking-[-0.02em] text-paper">
                      {d}
                    </h3>
                    <span className="shrink-0 font-sans text-[0.65rem] text-paper/40 tabular-nums">
                      {found}/{nodes.length}
                    </span>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {nodes.map((n) => (
                      <li
                        key={n.id}
                        className={`flex items-center gap-2.5 text-[0.78rem] ${
                          discovered.includes(n.id) ? 'text-paper/50' : 'text-paper/28'
                        }`}
                      >
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{
                            background: discovered.includes(n.id)
                              ? ACCENT_HEX[n.accent]
                              : 'transparent',
                            boxShadow: `inset 0 0 0 1px ${ACCENT_HEX[n.accent]}`,
                          }}
                        />
                        {n.label}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
