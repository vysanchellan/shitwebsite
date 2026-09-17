# RiskSense AI — Web Application

The public information and service-activation layer of RiskSense AI, built to the
*RiskSense AI Web Application Design Specification*.

It does two things. It explains the service — what it analyses, who reviews the
results, how access is granted, how data is protected. And it completes the
service-access portion of patient registration after the mobile application
redirects the user here.

It is deliberately **not** a second patient dashboard. Health profile, vitals,
laboratory information and risk-analysis history stay in the mobile application.

---

## The idea

Most product sites ask you to scroll a specification. This one lets you walk
through it.

The landing page is a conventional (if cinematic) marketing page. At the end of
it there is a door. Step through it and the rest of the specification is a 3D
city: **the RiskSense District**, where every building holds one part of the
system. Twenty-four readable markers across twelve districts cover the two risk
models, the six-step patient journey, the insurance pavilion, the clinician link,
the security vault and the activation terminal.

The district **is Park Square, uMhlanga Ridge** — the real precinct on the
corner of Centenary Boulevard and Park Avenue, rebuilt from its architects'
floor plans, with every tenancy replaced by the part of RiskSense it now holds.
Cappello is Arrival. Milk & Honey is Create Profile. The Spar, as the anchor,
is the Insurance Pavilion. Richfield — the campus — is The Response.

It sits inside a generated uMhlanga Ridge: 242 buildings on a street grid,
680-odd pieces of street furniture, vehicles, crossings and a 380-tower
horizon, under a sunset sky with falling blossom and strung lanterns.

Everything in the world is also published as a plain document at `/overview`, so
nothing is locked behind WebGL, a large screen or a mouse.

---

## Routes

| Route | What it is |
| --- | --- |
| `/` | Landing page — hero, health-awareness statistics, the problem, how it works, supported risk analysis, insurance partners, security and clinician connection, the door, FAQ and contact |
| `/world` | The RiskSense District — the interactive 3D experience |
| `/overview` | Every panel in the district, written out as a document |
| `/register/complete` | Registration completion: access method, subscription or insurance, clinician verification, review, activate |
| `/privacy` | Privacy Notice |
| `/terms` | Terms of Service |
| `/medical-disclaimer` | Medical Disclaimer |

---

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** — CSS-first tokens in `src/app/globals.css`
- **Bodoni Moda** for the marque voice, **Jost** for everything with a job
- **three.js** via **@react-three/fiber** and **@react-three/postprocessing**
- **zustand** for world state

No 3D model files, no texture downloads, no external asset CDN. Every building,
sign, insurer lockup and facade is generated at runtime from geometry primitives
and canvas textures. The wider city is drawn entirely with instanced meshes, so
252 buildings and 800-odd props cost about twenty draw calls.

---

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

```bash
npm run build   # production build
npm run start   # serve the production build
```

### Deploying

Zero configuration on Vercel — import the repository and deploy. There are no
environment variables and no server-side runtime: every route is statically
prerendered.

---

## How it is organised

```
src/
  app/                     routes and the global stylesheet
  components/
    landing/               the marketing page, section by section
    world/                 the 3D district
    register/              the activation flow
    legal/                 shared chrome for the three legal pages
    ui/                    Reveal, SectionHead, Wordmark
  data/
    content.ts             every piece of specification copy, once
    insurers.ts            the supported-provider list
```

### One source of content

`src/data/content.ts` holds the specification's copy in a single array of nodes.
Each node is rendered twice — as an interactable in the 3D district and as a
section of `/overview` — so the two can never drift apart. A node carries its
world position, so moving a marker is a data change, not a scene change.

### Park Square

`src/components/world/parkSquare.ts` is the precinct, taken off Nedport
Developments' own leasing brochure (architect MAP Group, engineer Arup,
completed November 2018). What the drawings establish and the model rebuilds:

- A rounded-corner site on a 8.4 m structural grid, 21 column lines by 16 row
  lines, with the south-east corner chamfered.
- Parking at ground level under the western half, with the public piazza over
  it; retail on the eastern half anchored by a double-volume Spar in its
  north-west corner.
- A pedestrian arcade on grid row H tying the two together — double-height,
  splayed concrete columns, dark steel soffit, radiating linear lights, a
  first-floor gallery down both sides.
- Restaurants ringing the piazza north, east and west, with an angled unit on
  the south-west corner.
- Office bars above with projecting floor slabs, glass balustrade balconies and
  close-spaced vertical fins.

Two departures, both deliberate:

1. **The walkable plane is flat.** The real piazza is a level above the
   parking; two walkable levels would need a height-aware controller. The deck
   is modelled as an undercroft below the plane and the level change is read at
   the retaining edge and amphitheatre steps, which is how it presents on
   approach anyway.
2. **Tenant positions are inferred, not copied.** The brochure's plans are
   generic leasing drawings that label units "RETAIL TENANCY". Positions here
   come from unit size, servicing and frontage.

### The wider city

`src/components/world/layout.ts` is the city plan around it. The scene renders from it and
the collision system builds its boxes from the same list, so a building cannot
look solid and be walk-through at the same time. Archways declare `parts` so the
opening you are meant to walk through stays open.

Controls are WASD (or arrows) with Shift to sprint, mouse to look, `E` to read a
marker and `M` for the map. On a touch device you get a thumbstick, a look pad
and a Read button. Without pointer lock, drag-to-look works instead.

The player is a rigged figure rather than a billboard: hips and shoulders carry
the limbs, knees and elbows are children of the segment above them, and a single
walk phase drives the whole cycle.

Quality is detected once at startup: shadows, pedestrian count, drone count,
particle count and antialiasing all step down on touch devices, small viewports
and low-core machines.

---

## Collision

Bodies are circles, obstacles are height-aware boxes, and the test is
closest-point-on-box so corners behave. Three things it gets right that a naive
push-out does not: each axis is resolved separately, so a blocked X leaves Z free
and you slide along a facade instead of stopping; movement is substepped below a
body radius, so a sprint cannot jump a railing between frames; and colliders are
bucketed into a uniform grid, so 1,114 boxes cost about a microsecond a call.

Anything at or below `STEP_HEIGHT` — kerbs, benches, low rails — is walked over
rather than collided with. A body that somehow ends up inside geometry is pushed
out, and failing that swept outward to the nearest free point, so nobody gets
welded into a building.

## Verifying the world

Movement and collision are pure functions of the layout data, so they are checked
without a browser. `src/components/world/layout.ts` and `collision.ts` compile on
their own, and `npm run verify:world` asserts the spawn is clear, that each of
W/A/S/D moves the player the way the camera implies, that a body slides along a
wall rather than sticking, that a sprint cannot tunnel a thin obstacle, that a
trapped body is ejected, that steppable props never block, and that `move()`
stays cheap. Run it after moving a marker or adding a structure — a building
dropped on a marker is otherwise invisible until someone walks there.

## Prototype boundaries

This is an academic prototype, and the interface says so wherever it matters.

- **Insurers are demonstration data.** The names in `src/data/insurers.ts` are
  invented and labelled as demo providers throughout. No commercial partnership is
  implied. Only providers genuinely approved in the backend should ever be shown
  with `demo: false`.
- **The payment gateway is a demonstration.** No real payment is processed. The
  form accepts only the published test card `4242 4242 4242 4242` and rejects
  anything else, so a real card cannot be submitted. The card number and CVV are
  discarded as soon as the demo completes; only the last four digits reach the
  review step.
- **Insurance verification is simulated** until a real insurer integration exists.
- **Clinician verification** uses two demo IDs, `RS-2026-4471` and `RS-2026-1188`.
  Anything else produces a correction message and creates no relationship.
- **No backend.** Every call in `RegisterFlow.tsx` is a local stand-in with the
  same shape of success and failure as the real FastAPI endpoints.

### Statistics

Every figure in the health-awareness section is quoted from a named authority and
carries its source and year (WHO, IDF, CDC). Nothing is modelled, extrapolated or
generated by RiskSense. Confirm each against the current edition of its source
before publication — the page says as much, in public.

---

## Medical disclaimer

RiskSense AI provides risk estimates for decision support and awareness. It does
not provide a medical diagnosis and does not replace professional medical advice.
