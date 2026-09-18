'use client';

import { NODES } from '@/data/content';
import { ACCENT_HEX, BOUNDS, CITY } from './layout';
import { ARCADE, PIAZZA, UNITS } from './parkSquare';
import { SLOPES, TERRACES } from './terrain';
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
      <rect x={-W} y={-H} width={W * 3} height={H * 3} fill="#0d0b10" />

      {/* The generated city, so the corner map is not an empty field */}
      <g>
        {CITY.map((b, i) => (
          <rect
            key={i}
            x={sx(b.pos[0] - b.size[0] / 2)}
            y={sy(b.pos[1] - b.size[2] / 2)}
            width={b.size[0]}
            height={b.size[2]}
            fill="#282029"
            fillOpacity={0.9}
          />
        ))}
      </g>

      {/* The levels, lightest at the top, so the section reads at a glance */}
      <g>
        {[...TERRACES].sort((a, b) => a.y - b.y).map((t, i) => (
          <rect
            key={i}
            x={sx(t.minX)}
            y={sy(t.minZ)}
            width={t.maxX - t.minX}
            height={t.maxZ - t.minZ}
            fill="#4a4550"
            fillOpacity={0.18 + (t.y / 12) * 0.22}
          />
        ))}
      </g>

      {/* Every stair and ramp, so you can see how to get between the levels */}
      <g>
        {SLOPES.map((sl, i) => {
          const alongX = sl.axis === 'x';
          const n = Math.max(3, Math.round((alongX ? sl.maxX - sl.minX : sl.maxZ - sl.minZ) / 2.6));
          return (
            <g key={i}>
              <rect
                x={sx(sl.minX)}
                y={sy(sl.minZ)}
                width={sl.maxX - sl.minX}
                height={sl.maxZ - sl.minZ}
                fill="#d9b876"
                fillOpacity={0.2}
                stroke="#d9b876"
                strokeOpacity={0.5}
                strokeWidth={0.6}
              />
              {sl.kind === 'stair' &&
                Array.from({ length: n }).map((_, k) => {
                  const t = (k + 0.5) / n;
                  return alongX ? (
                    <line
                      key={k}
                      x1={sx(sl.minX + t * (sl.maxX - sl.minX))}
                      y1={sy(sl.minZ)}
                      x2={sx(sl.minX + t * (sl.maxX - sl.minX))}
                      y2={sy(sl.maxZ)}
                      stroke="#d9b876"
                      strokeOpacity={0.55}
                      strokeWidth={0.5}
                    />
                  ) : (
                    <line
                      key={k}
                      x1={sx(sl.minX)}
                      y1={sy(sl.minZ + t * (sl.maxZ - sl.minZ))}
                      x2={sx(sl.maxX)}
                      y2={sy(sl.minZ + t * (sl.maxZ - sl.minZ))}
                      stroke="#d9b876"
                      strokeOpacity={0.55}
                      strokeWidth={0.5}
                    />
                  );
                })}
            </g>
          );
        })}
      </g>

      {/* The piazza and the arcade, the two spaces you navigate by */}
      <rect
        x={sx(PIAZZA.minX)}
        y={sy(PIAZZA.minZ)}
        width={PIAZZA.maxX - PIAZZA.minX}
        height={PIAZZA.maxZ - PIAZZA.minZ}
        fill="#6b6357"
        fillOpacity={0.55}
      />
      <rect
        x={sx(ARCADE.minX)}
        y={sy(ARCADE.z - ARCADE.width / 2 - 1.7)}
        width={ARCADE.maxX - ARCADE.minX}
        height={ARCADE.width + 3.4}
        fill="#6b6357"
        fillOpacity={0.55}
      />

      {/* Tenancies */}
      <g>
        {UNITS.map((u) => (
          <rect
            key={u.tenant}
            x={sx(u.x - u.w / 2)}
            y={sy(u.z - u.d / 2)}
            width={u.w}
            height={u.d}
            transform={u.rotY ? `rotate(${(-u.rotY * 180) / Math.PI} ${sx(u.x)} ${sy(u.z)})` : undefined}
            fill={u.accent}
            fillOpacity={0.24}
            stroke={u.accent}
            strokeOpacity={0.55}
            strokeWidth={0.6}
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
                fill={read ? '#141019' : c}
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
