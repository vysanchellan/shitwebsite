/**
 * The precinct's levels.
 *
 * Park Square is not a flat site and never was. The whole precinct sits on a
 * podium above the pavement, so you come up steel stairs off Centenary
 * Boulevard and Park Avenue to reach it at all. Inside, the retail wing and its
 * arcade sit at the podium level, the public piazza is a full storey above them
 * on the parking deck, and the campus entrance is a short ramp above that.
 *
 * Walking it has to feel like that, so the walkable surface is a height field
 * rather than a plane.
 *
 * Two shapes make it up. A **terrace** is flat ground at one height. A **slope**
 * interpolates between two heights along one axis, and is what every stair and
 * ramp is made of — the treads you see are geometry laid on the slope, which
 * keeps the walk smooth instead of bumping tread by tread.
 */

/** The pavement, the streets, the surrounding city. */
export const STREET = 0;

/** The podium the whole precinct stands on: retail wing, arcade, Spar. */
export const RETAIL = 2.8;

/** The public piazza, a storey higher again on the parking deck. */
export const DECK = 7.2;

/** The campus entrance terrace, up a ramp off the piazza. */
export const CAMPUS = 9.6;

export type Terrace = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  y: number;
};

export type Slope = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  /** Height at the low-coordinate end of `axis`. */
  from: number;
  /** Height at the high-coordinate end. */
  to: number;
  axis: 'x' | 'z';
  /** Rendered as a stair with treads, or as a smooth ramp. */
  kind: 'stair' | 'ramp';
  /** Steel stairs get stringers and handrails; the grand flight is concrete. */
  steel?: boolean;
};

/**
 * The grand flight off the piazza's eastern edge, down to the arcade and the
 * Spar. On the drawings this is where the section steps down and the escalators
 * sit; here it is one broad amphitheatre flight.
 */
export const GRAND_STAIR: Slope = {
  minX: -14,
  maxX: 6,
  // The mouth lines up with the arcade: you come down the flight and the
  // arcade runs away east in front of you, between the same two frontages.
  minZ: -3,
  maxZ: 17,
  from: DECK,
  to: RETAIL,
  axis: 'x',
  kind: 'stair',
};

/** The southern flight, straight down off the deck to Park Avenue. */
export const SOUTH_STAIR: Slope = {
  minX: -56,
  maxX: -32,
  minZ: 56,
  maxZ: 74,
  from: DECK,
  to: STREET,
  axis: 'z',
  kind: 'stair',
  steel: true,
};

/**
 * The ramp up from the piazza to the campus entrance, and the flight running
 * parallel to it.
 *
 * The drawings pair them everywhere the section steps: a ramp for the gentle
 * way up and a flight alongside for the quick one. Having only the ramp read
 * as a service road rather than an entrance.
 */
export const CAMPUS_RAMP: Slope = {
  minX: -74,
  maxX: -56,
  minZ: -62,
  maxZ: -52,
  from: CAMPUS,
  to: DECK,
  axis: 'x',
  kind: 'ramp',
};

export const CAMPUS_STAIR: Slope = {
  minX: -74,
  maxX: -64,
  minZ: -50,
  maxZ: -42,
  from: CAMPUS,
  to: DECK,
  axis: 'x',
  kind: 'stair',
  steel: true,
};

/**
 * The perimeter stairs up off the pavement onto the podium. These are the
 * exposed steel flights with open risers and tubular handrails that the
 * precinct uses wherever it meets the street.
 */
export const EAST_STAIR: Slope = {
  minX: 88,
  maxX: 98,
  minZ: -22,
  maxZ: 14,
  from: RETAIL,
  to: STREET,
  axis: 'x',
  kind: 'stair',
  steel: true,
};

export const SOUTH_PODIUM_STAIR: Slope = {
  minX: 14,
  maxX: 50,
  minZ: 68,
  maxZ: 78,
  from: RETAIL,
  to: STREET,
  axis: 'z',
  kind: 'stair',
  steel: true,
};

export const NORTH_PODIUM_STAIR: Slope = {
  minX: 18,
  maxX: 54,
  minZ: -78,
  maxZ: -68,
  from: STREET,
  to: RETAIL,
  axis: 'z',
  kind: 'stair',
  steel: true,
};

export const SLOPES: Slope[] = [
  GRAND_STAIR,
  SOUTH_STAIR,
  CAMPUS_RAMP,
  CAMPUS_STAIR,
  EAST_STAIR,
  SOUTH_PODIUM_STAIR,
  NORTH_PODIUM_STAIR,
];

/** The podium under the retail wing, and the deck over the parking. */
export const RETAIL_TERRACE: Terrace = {
  minX: -14,
  maxX: 88,
  minZ: -68,
  maxZ: 68,
  y: RETAIL,
};

export const DECK_TERRACE: Terrace = {
  minX: -96,
  maxX: -14,
  minZ: -70,
  maxZ: 56,
  y: DECK,
};

export const CAMPUS_TERRACE: Terrace = {
  minX: -94,
  maxX: -74,
  minZ: -68,
  maxZ: -40,
  y: CAMPUS,
};

export const TERRACES: Terrace[] = [RETAIL_TERRACE, DECK_TERRACE, CAMPUS_TERRACE];

function inside(a: { minX: number; maxX: number; minZ: number; maxZ: number }, x: number, z: number) {
  return x >= a.minX && x <= a.maxX && z >= a.minZ && z <= a.maxZ;
}

/**
 * Walkable surface height at a point.
 *
 * Slopes win over terraces so the stair mouths read correctly where they
 * overlap a terrace, and the highest terrace wins where several apply.
 */
export function heightAt(x: number, z: number): number {
  for (let i = 0; i < SLOPES.length; i++) {
    const s = SLOPES[i];
    if (!inside(s, x, z)) continue;
    const t =
      s.axis === 'x'
        ? (x - s.minX) / (s.maxX - s.minX)
        : (z - s.minZ) / (s.maxZ - s.minZ);
    return s.from + (s.to - s.from) * Math.min(1, Math.max(0, t));
  }

  let y = STREET;
  for (let i = 0; i < TERRACES.length; i++) {
    const t = TERRACES[i];
    if (inside(t, x, z) && t.y > y) y = t.y;
  }
  return y;
}

type Edge = { minX: number; maxX: number; minZ: number; maxZ: number; baseY: number };

/**
 * Balustrades along every edge where the ground drops, broken wherever a stair
 * lands. Without them you can walk off a five-metre drop and be silently
 * teleported to the pavement, which reads as a bug rather than a fall — and a
 * balustrade is what is actually there.
 */
export const EDGES: Edge[] = (() => {
  const t = 1.0;
  const out: Edge[] = [];
  const d = DECK_TERRACE;
  const r = RETAIL_TERRACE;

  // Deck: eastern edge, broken by the grand flight.
  out.push({ minX: d.maxX - t, maxX: d.maxX, minZ: d.minZ, maxZ: GRAND_STAIR.minZ, baseY: DECK });
  out.push({ minX: d.maxX - t, maxX: d.maxX, minZ: GRAND_STAIR.maxZ, maxZ: d.maxZ, baseY: DECK });

  // Deck: southern edge, broken by the south flight.
  out.push({ minX: d.minX, maxX: SOUTH_STAIR.minX, minZ: d.maxZ - t, maxZ: d.maxZ, baseY: DECK });
  out.push({ minX: SOUTH_STAIR.maxX, maxX: d.maxX, minZ: d.maxZ - t, maxZ: d.maxZ, baseY: DECK });

  // Deck: north and west run unbroken.
  out.push({ minX: d.minX, maxX: d.maxX, minZ: d.minZ, maxZ: d.minZ + t, baseY: DECK });
  out.push({ minX: d.minX, maxX: d.minX + t, minZ: d.minZ, maxZ: d.maxZ, baseY: DECK });

  // Podium: eastern edge, broken by the east flight.
  out.push({ minX: r.maxX - t, maxX: r.maxX, minZ: r.minZ, maxZ: EAST_STAIR.minZ, baseY: RETAIL });
  out.push({ minX: r.maxX - t, maxX: r.maxX, minZ: EAST_STAIR.maxZ, maxZ: r.maxZ, baseY: RETAIL });

  // Podium: southern edge, broken by its flight.
  out.push({ minX: r.minX, maxX: SOUTH_PODIUM_STAIR.minX, minZ: r.maxZ - t, maxZ: r.maxZ, baseY: RETAIL });
  out.push({ minX: SOUTH_PODIUM_STAIR.maxX, maxX: r.maxX, minZ: r.maxZ - t, maxZ: r.maxZ, baseY: RETAIL });

  // Podium: northern edge, broken by its flight.
  out.push({ minX: r.minX, maxX: NORTH_PODIUM_STAIR.minX, minZ: r.minZ, maxZ: r.minZ + t, baseY: RETAIL });
  out.push({ minX: NORTH_PODIUM_STAIR.maxX, maxX: r.maxX, minZ: r.minZ, maxZ: r.minZ + t, baseY: RETAIL });

  // Campus terrace: its flat ground stops where the ramp begins, so the eastern
  // edge is balustraded either side of the ramp mouth and the other three run
  // unbroken.
  const c = CAMPUS_TERRACE;
  const mouthX = CAMPUS_RAMP.minX;
  out.push({ minX: mouthX - t, maxX: mouthX, minZ: c.minZ, maxZ: CAMPUS_RAMP.minZ, baseY: CAMPUS });
  out.push({ minX: mouthX - t, maxX: mouthX, minZ: CAMPUS_RAMP.maxZ, maxZ: CAMPUS_STAIR.minZ, baseY: CAMPUS });
  out.push({ minX: mouthX - t, maxX: mouthX, minZ: CAMPUS_STAIR.maxZ, maxZ: c.maxZ, baseY: CAMPUS });
  out.push({ minX: c.minX, maxX: mouthX, minZ: c.minZ, maxZ: c.minZ + t, baseY: CAMPUS });
  out.push({ minX: c.minX, maxX: mouthX, minZ: c.maxZ - t, maxZ: c.maxZ, baseY: CAMPUS });
  out.push({ minX: c.minX, maxX: c.minX + t, minZ: c.minZ, maxZ: c.maxZ, baseY: CAMPUS });

  return out;
})();

/**
 * The sides of every flight and ramp.
 *
 * A slope is a solid object standing proud of the ground beside it, and its
 * long sides are a cliff: walk at the grand flight from the side and the
 * height field hands you the tread height, which teleports you three metres
 * up onto it mid-stride. What is actually there is a cheek wall, so that is
 * what collision gets.
 *
 * Only the portion that genuinely stands above its neighbour is walled — near
 * the foot of a flight it is flush with the paving, and a wall there would be
 * a kerb rising out of nothing.
 */
export type SlopeSide = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  baseY: number;
  height: number;
};

export const SLOPE_SIDES: SlopeSide[] = (() => {
  const out: SlopeSide[] = [];
  const T = 0.6;
  /** Below this the flight is effectively flush and needs no cheek. */
  const PROUD = 0.4;

  for (const s of SLOPES) {
    const alongX = s.axis === 'x';
    const run = alongX ? s.maxX - s.minX : s.maxZ - s.minZ;
    const lo = alongX ? s.minX : s.minZ;

    for (const side of [-1, 1] as const) {
      // Just outside the flight, along this side.
      const off = side < 0
        ? (alongX ? s.minZ : s.minX) - T
        : (alongX ? s.maxZ : s.maxX) + T;

      // Walk the run and keep the stretch that stands above its neighbour.
      const STEPS = 40;
      let startT: number | null = null;
      let lowest = Infinity;
      let highest = -Infinity;

      const flush = (i: number) => {
        const t = i / STEPS;
        const along = lo + t * run;
        const y = s.from + (s.to - s.from) * t;
        const outside = alongX ? heightAt(along, off) : heightAt(off, along);
        return { proud: y - outside > PROUD, y, outside, along };
      };

      const emit = (a: number, b: number) => {
        if (b - a < 1.2) return;
        out.push(
          alongX
            ? {
                minX: a, maxX: b,
                minZ: side < 0 ? s.minZ - T : s.maxZ,
                maxZ: side < 0 ? s.minZ : s.maxZ + T,
                baseY: lowest - 0.2,
                height: highest - lowest + 1.4,
              }
            : {
                minX: side < 0 ? s.minX - T : s.maxX,
                maxX: side < 0 ? s.minX : s.maxX + T,
                minZ: a, maxZ: b,
                baseY: lowest - 0.2,
                height: highest - lowest + 1.4,
              },
        );
        lowest = Infinity;
        highest = -Infinity;
      };

      for (let i = 0; i <= STEPS; i++) {
        const f = flush(i);
        if (f.proud) {
          if (startT === null) startT = f.along;
          lowest = Math.min(lowest, f.outside);
          highest = Math.max(highest, f.y);
        } else if (startT !== null) {
          emit(Math.min(startT, f.along), Math.max(startT, f.along));
          startT = null;
        }
      }
      if (startT !== null) {
        const end = lo + run;
        emit(Math.min(startT, end), Math.max(startT, end));
      }
    }
  }

  return out;
})();
