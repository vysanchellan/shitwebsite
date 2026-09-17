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
city — **the RiskSense District** — where every building holds one part of the
system. Twenty-four readable markers across twelve districts: the two risk
models, the six-step patient journey, the insurance pavilion, the clinician link,
the security vault, the activation terminal.

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
- **three.js** via **@react-three/fiber** and **@react-three/postprocessing**
- **zustand** for world state

No 3D model files, no texture downloads, no external asset CDN. Every building,
sign, insurer lockup and facade in the district is generated at runtime from
geometry primitives and canvas textures, which keeps the repository small and the
world fast to load.

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

### The district

`src/components/world/layout.ts` is the city plan. The scene renders from it and
the collision system builds its boxes from the same list, so a building cannot
look solid and be walk-through at the same time. Archways declare `parts` so the
opening you are meant to walk through stays open.

Controls are WASD (or arrows) with Shift to sprint, mouse to look, `E` to read a
marker and `M` for the map. On a touch device you get a thumbstick, a look pad
and a Read button. Without pointer lock, drag-to-look works instead.

Quality is detected once at startup: shadows, pedestrian count, drone count,
particle count and antialiasing all step down on touch devices, small viewports
and low-core machines.

---

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
