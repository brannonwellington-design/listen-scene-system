# Listen Labs — Live Product Shot System

A reusable system for turning any section of the Listen Labs product into a
**live, interactive asset** on listenlabs.ai — the same technique Linear uses
for its homepage hero (real DOM, not screenshots). Built as React/TSX files
ready to paste into **Framer**.

## What's here

| File | Role |
|---|---|
| `src/ListenKit.tsx` | Shared foundation: product tokens (harvested from the live app's computed styles, 2026-08-28), product chrome (builder / analysis / bare variants), primitives (chips, donut, chat, cursor), `PatternLayer` (dot grid / line grid / concentric circles / crosshairs), the `useScene` script engine (freeze-frame + fast-forward playback), and `ScaleBox` (fixed 1120×640 design space scaled to any container — keeps scripted cursor coordinates exact at every width). |
| `src/ListenIcons.tsx` | The product's exact icon set (Lucide, 16px from 24-viewBox, stroke 2) with path data harvested from the live app's DOM. `<I name="sparkles" />`. |
| `src/ListenScenes.tsx` | The scene library. Five full scenes (one per How-It-Works stage) plus small **fragments** for minor page sections. Each scene is a scripted "session": it plays a simulated moment (typing, streaming, a cursor clicking a control), then reports done. Scenes 1–2 mirror the real study-creation flow frame-by-frame from a product screen recording (`video/`), with pacing constants (`USER_CPS`, `AI_CPS`, `MARKER_MS`) measured from it. |
| `src/ListenRegistry.tsx` | **The canonical catalog**: one unified list of full scenes and fragments, plus hero-stage copy. Register content once here; the hero, callouts, and demo tooling all read from it. |
| `src/SceneCanvas.tsx` | **The universal Framer component.** `variant="hero"` = the multi-stage How-It-Works (auto-cycle, stage rail, dev scrubber). `variant="callout"` = a single scene, fragment, or a **custom crop** of a scene. Every instance gets the canvas system: surface-secondary container, optional background pattern, and the fit engine — `responsive` (scales with container) or `pinned` (native pixels anchored to a corner with X/Y insets while the container flexes and masks; optional fall-back-to-fit below a breakpoint). Callouts can also **loop a time-slice** of a session (`segStart`/`segEnd`). |
| `src/HowItWorks.tsx`, `src/ProductShot.tsx` | Thin back-compat presets over SceneCanvas. |
| `demo.html` + `src/demo.tsx` | Local demo page rendering everything outside Framer, including a SceneCanvas showcase (at ?demo=1; the root URL is the workbench). |

## Install in Framer

1. In Framer: **Assets → Code → Create Code File**, named exactly:
   - `ListenKit.tsx`, `ListenIcons.tsx`, `ListenScenes.tsx`, `ListenRegistry.tsx` — paste from `src/`
2. **Create Code Component**: `SceneCanvas.tsx` — paste from `src/`
   (optionally also `HowItWorks.tsx` / `ProductShot.tsx` presets).
3. Drag **SceneCanvas** anywhere. The properties panel drives everything:
   - **Variant**: Hero (5 stages) ⇄ Callout (single) — one dropdown
   - **Content** (callout): one unified list of every scene and fragment,
     or `Custom crop…` with your own rect into any scene
   - **Fit**: responsive, or pinned to a corner with insets (e.g. 40/40
     top-left) while the container masks; per-instance small-screen behavior
   - **Canvas**: fill color, pattern (dots / grid / circles / crosshairs),
     spacing, opacity, padding, radius

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
4. Register it in `ListenRegistry.tsx`'s `REGISTRY` (add a `stage` block if
   it's a How-It-Works stage). It's now a website asset.

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
- `/?scene=design-study&hold=9700&frame=1` adds the **crop helper**:
  drag a box over the frozen scene to read off a crop rect in design
  coordinates, ready for SceneCanvas's custom crop controls.
- `/` (the landing page) is the **composition workbench**: tune every SceneCanvas
  setting live (content, crop, fit, pattern, fill, padding, segment beat)
  with direct manipulation — drag the canvas to reposition a pinned shot,
  scroll to zoom, drag-resize the crop over a ghosted scene, punch segment
  in/out from the scrub playhead — preview at any width/breakpoint, then
  save as a named preset (localStorage draft + copy-paste TS block for
  `ListenPresets.tsx`). Presets appear in SceneCanvas's Framer dropdown.

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
