# Listen Labs — Live Product Shot System

A reusable system for turning any section of the Listen Labs product into a
**live, interactive asset** on listenlabs.ai — the same technique Linear uses
for its homepage hero (real DOM, not screenshots). Built as React/TSX files
ready to paste into **Framer**.

## What's here

| File | Role |
|---|---|
| `src/ListenKit.tsx` | Shared foundation: product tokens (harvested from the live app's computed styles, 2026-08-28), product chrome (builder / analysis / bare variants), primitives (chips, donut, chat, cursor), the `useScene` script engine, and `ScaleBox` (fixed 1120×640 design space scaled to any container — keeps scripted cursor coordinates exact at every width). |
| `src/ListenIcons.tsx` | The product's exact icon set (Lucide, 16px from 24-viewBox, stroke 2) with path data harvested from the live app's DOM. `<I name="sparkles" />`. |
| `src/ListenScenes.tsx` | The scene library. Five full scenes (one per How-It-Works stage) plus small **fragments** (`FragmentTopAnswer`, `FragmentLiveInterview`, `FragmentEmotionQuote`) for minor page sections. Each scene is a scripted "session": it plays a simulated moment (typing, streaming, a cursor clicking a control), then reports done. Scenes 1–2 mirror the real study-creation flow frame-by-frame from a product screen recording (`video/`): the Create Study entry, chip questions in chat, "Thinking…" beats, and status-marker streams, with pacing constants (`USER_CPS`, `AI_CPS`, `MARKER_MS`) measured from the recording. |
| `src/HowItWorks.tsx` | Framer code component: centered product frame + five stage headings beneath. Auto-cycles scene → scene; clicking a stage jumps to it and the cycle resumes after an idle delay. Property controls: auto-cycle on/off, resume delay, max width. |
| `src/ProductShot.tsx` | Framer code component: drop **any single scene or fragment** anywhere on the site. Property controls: scene picker, loop, loop pause. Plays when scrolled into view. |
| `demo.html` + `src/demo.tsx` | Local demo page rendering everything outside Framer. |

## Install in Framer

1. In Framer: **Assets → Code → Create Code File**, named exactly:
   - `ListenKit.tsx` — paste `src/ListenKit.tsx`
   - `ListenIcons.tsx` — paste `src/ListenIcons.tsx`
   - `ListenScenes.tsx` — paste `src/ListenScenes.tsx`
2. **Create Code Component** twice:
   - `HowItWorks.tsx` — paste `src/HowItWorks.tsx`
   - `ProductShot.tsx` — paste `src/ProductShot.tsx`
3. Drag **HowItWorks** onto the page for the How-It-Works section, or
   **ProductShot** for any smaller placement, and configure via the
   properties panel. (The relative `./ListenKit` imports resolve as long as
   the file names match.)

The `import { addPropertyControls, ControlType } from "framer"` lines resolve
natively inside Framer. Locally they're aliased to `src/framer-stub.ts`.

## Adding a new scene ("grab a section of the product")

1. In `ListenScenes.tsx`, copy an existing scene as a starting point.
2. Rebuild the UI from a product screenshot using the kit primitives
   (`ProductFrame`, `Chip`, `Donut`, `ll-card`, `ll-avatar`…) inside the
   1120×640 design space — hardcode believable demo data.
3. Write the session in the `useScene` script: `p.type()` for typing,
   `p.sleep()` for pacing, `cur.show/move/click()` for the cursor
   (coordinates are design-space pixels), end with a ~2s dwell.
4. Register it in `ProductShot.tsx`'s `REGISTRY` (and `STAGES` in
   `HowItWorks.tsx` if it's a stage). It's now a website asset.

Fragments are the same, just authored at their own design size — export the
component plus `_W`/`_H` constants and register them.

## Local development

```bash
npm install
sh build.sh       # bundles src/demo.tsx → dist/demo.js
node scripts/dev-server.mjs   # → http://localhost:4173
```

- `/?scene=deliver-results` renders one scene solo (any key from
  `ProductShot`'s registry).
- `/?scene=design-study&ref=01.png` is **compare mode**: overlays a
  reference screenshot from `image examples/` on the live scene with
  opacity + offset sliders and a `diff` blend button. Build every new
  scene against its screenshot this way — drift is measured, not judged.
- `/?scene=design-study&hold=9700` is **freeze-frame mode**: the scene's
  script runs on a virtual clock and freezes at that exact virtual
  millisecond — deterministic, immune to background-tab throttling.
  Use it to pin a scene to a beat and compare against a video frame.

## Motion & state vocabulary (harvested from the live app)

- `ll-highlight-fade` — the app's yellow new-content flash (#FEF9C3 → transparent, 3s)
- `ll-shimmer` — streaming-text gradient shimmer (1.5s linear), for "thinking" states
- `ll-dim-pulse` — skeleton/loading pulse (opacity .5↔.3, 2s)
- `ll-ring` — the app's focus ring (2px inset, brand blue at 40%)
- `<DotSpinner />` — the circular dots loader (participant app + research agent)
- `<EmotionTag emotion="anger" />` — EI tags from the shared emotion tokens
- Scenes apply real hover states (border `rgba(26,26,26,.3)`) as the scripted
  cursor arrives, before the click.
- Type renders with the app's settings: antialiased smoothing,
  `font-feature-settings: "calt" 0, "case", "rlig", "kern"`.

Fragments: `top-answer-card`, `live-interview-card`, `emotion-quote-card`.

## Design rules baked in

- Inter 400 only, no letter-spacing; 4px spacing grid; radius scale 8/12px
  (concentric); borders instead of drop shadows; brand blue `#0021CC` as the
  only accent — per the Listen Labs brand guidelines.
- All animation respects `prefers-reduced-motion` (scenes jump to end states).
- Scenes only play when scrolled into view (IntersectionObserver).
