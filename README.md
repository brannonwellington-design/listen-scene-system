# Listen Labs — Live Product Shot System

A reusable system for turning any section of the Listen Labs product into a
**live, interactive asset** on listenlabs.ai — the same technique Linear uses
for its homepage hero (real DOM, not screenshots). Built as React/TSX files
ready to paste into **Framer**.

## What's here

| File | Role |
|---|---|
| `src/ListenKit.tsx` | Shared foundation: product tokens (harvested from the live app's computed styles, 2026-08-28), the product chrome — `AppShell` (sidebar + top bar that visitors can collapse and switch to dark mode, visuals from the Figma "Sidebar Navigation" mock, per-surface content from the live app, 2026-09-29) with nav presets `workspaceNav` / `studyEditNav` / `studyNav` / `chatNav`, plus `BareFrame` for chrome-less surfaces — product colors as CSS-variable tokens (`T.*`, light by default, dark under `.ll-app.dark`; use tokens, not hex, inside app scenes so dark mode holds), primitives (chips, donut, chat, a target-tracking cursor), `PatternLayer` (dot grid / line grid / concentric circles / crosshairs), the `useScene` script engine (freeze-frame + fast-forward playback), and `ScaleBox` (a fixed design space scaled to any container: 1344×768 for app-shell scenes, 1120×640 for the rest — same aspect ratio). |
| `src/ListenIcons.tsx` | The product's exact icon set (Lucide, 16px from 24-viewBox, stroke 2) with path data harvested from the live app's DOM. `<I name="sparkles" />`. |
| `src/ListenScenes.tsx` | The scene library. Full scenes (the five How-It-Works steps plus page heroes) and small **fragments** (standalone cards). Each scene is a scripted "session": it plays a simulated moment (typing, streaming, a cursor clicking a control), then reports done. Scenes 1–2 mirror the real study-creation flow frame-by-frame from a product screen recording (`video/`), with pacing constants (`USER_CPS`, `AI_CPS`, `MARKER_MS`) measured from it. |
| `src/ListenRegistry.tsx` | **The canonical catalog.** `REGISTRY` is one unified list of every product shot (full scenes and fragments), grouped by the page they appear on. `SEQUENCES` are ordered lists of shots with a title + body caption per step (e.g. `how-it-works`). Register content once here; SceneCanvas and the demo tooling all read from it. |
| `src/SceneCanvas.tsx` | **The universal Framer component**, with two layouts. `layout="single"` = one product shot: a scene, fragment, or **custom crop** of a scene, optionally **looping a time-slice** of its session (`segStart`/`segEnd`). `layout="multi-step"` = several shots cycling in one frame (auto-cycle, click to jump, dev scrubber); pick a named `sequence` or build `steps` by hand. Multi-step has two styles, set per sequence (or forced with `stepStyle`): `captions` puts a caption rail under the shot (How it works); `list` puts numbered rows beside a cropped card, the active row open with its body and its hairline filling as the shot plays, and stacks the card above the list under ~820px (Use Cases). Side by side, `list` sits on a 12-column grid with 24px gutters: the list spans `listStart`–`listEnd` (default 2–5) and the card spans `cardStart`–12 (default 7–12), matching the mock at 1392. The Use Cases shots (`uc-*` keys) are authored as a taller app window, `UC_W`×`UC_H` (1120×1160), because the list's card is near-square; a registry entry's `bleedShow` sets how much of the shot the card shows across. Both layouts share the canvas system: surface-secondary container, optional background pattern, and the fit engine — `responsive` (scales with container), `pinned` (native pixels anchored to a corner with X/Y insets while the container flexes and masks; optional fall-back-to-fit below a breakpoint), or `bleed` (a card with the shot inset from its top-left and running off the right and bottom; `bleedShow` sets how many design px show across, so the crop holds at every width). |
| `demo.html` + `src/demo.tsx` | Local demo page rendering everything outside Framer, including a SceneCanvas showcase (at ?demo=1; the root URL is the workbench). |

## Install in Framer

1. In Framer: **Assets → Code → Create Code File**, named exactly:
   - `ListenKit.tsx`, `ListenIcons.tsx`, `ListenScenes.tsx`, `ListenRegistry.tsx` — paste from `src/`
2. **Create Code Component**: `SceneCanvas.tsx` — paste from `src/`
3. Drag **SceneCanvas** anywhere. The properties panel follows the order you
   build a shot in (the workbench rail uses the same five groups):
   1. **Content** — Layout: Single ⇄ Multi-step (the only difference is
      whether more than one shot plays in the frame; multi-step adds the
      caption rail). Single picks a **Shot** from one unified list of scenes
      and fragments, or `Custom crop…` into any scene; multi-step picks a
      **Sequence** such as How it works, or `Custom steps…` (shot + title +
      body each).
   2. **Playback** — single: loop, pause, and an optional time-slice
      (segment start/end); multi-step: auto-advance and the pause after a
      visitor clicks a step.
   3. **Scene state** — how app-shell scenes start: sidebar open or
      collapsed, light or dark theme. Visitors can still change both.
   4. **Framing** — scale to fit, or pin to a corner with insets and zoom
      while the container masks; small-screen fallback; auto or fixed height.
   5. **Canvas** — fill color, pattern (dots / grid / circles / crosshairs),
      spacing, opacity, padding, radius.

The `import { addPropertyControls, ControlType } from "framer"` lines resolve
natively inside Framer. Locally they're aliased to `src/framer-stub.ts`.

## Adding a new scene ("grab a section of the product")

1. In `ListenScenes.tsx`, copy an existing scene as a starting point.
2. Rebuild the UI from a product screenshot using the kit primitives
   (`Chip`, `Donut`, `ll-card`, `ll-avatar`…). In-app surfaces go inside
   `<AppShell nav={studyNav("Report")} title=… crumb=… actions=…>` in the
   1344×768 design space (register with `APP_W`/`APP_H`); the sidebar and top
   bar come for free, including the visitor-collapsible sidebar. Hardcode
   believable demo data.
3. Write the session in the `useScene` script: `p.type()` for typing,
   `p.sleep()` for pacing, `cur.show/move/click()` for the cursor, end with a
   ~2s dwell. Aim the cursor at elements, not pixels: tag the target with
   `data-cursor="gen-btn"` and call `cur.move("gen-btn")` (optional dx/dy
   nudge). The cursor tracks the element as the layout reflows — sidebar
   collapsed or not, and in freeze-frame mode.
4. Register it in `ListenRegistry.tsx`'s `REGISTRY` under the page it
   belongs to (and add it as a step in a `SEQUENCES` entry if it plays in a
   multi-step). It's now a website asset.

### Naming

Keys follow `page-section-subject`, matching the live site's headings, so a
key says where the shot goes. The Emotional Intelligence page
(`/features/emotional-intelligence`) has 8 shots, in page order:

| Key | Section · heading |
|---|---|
| `ei-hero-report` | Hero · Study report |
| `ei-feature-signals` | Features · Multi-signal emotion detection |
| `ei-feature-traceable` | Features · Research-grounded and fully traceable |
| `ei-feature-comparison` | Features · Structured for comparison |
| `ei-usecase-ad-testing` | Use cases · Creative/Ad Testing |
| `ei-usecase-concepts` | Use cases · Concept Comparison |
| `ei-usecase-brand` | Use cases · Brand Research |
| `ei-usecase-ux` | Use cases · UX Research |

Fragments are the same, just authored at their own design size — export the
component plus `_W`/`_H` constants and register them.

## Interview webcam clip

Step 3's webcam tile plays a real clip, and the recording visualizer is
driven by that clip's own loudness, so mouth and dots stay in sync (live,
while scrubbing, and in freeze-frames: the video follows the recording clock).

```bash
python3 scripts/prep-interview-clip.py video/answer.mov --start 1.2 --end 7.8
```

Record 6–8s of someone answering the on-screen question, face centered, in a
quiet room. The script (needs ffmpeg) writes `media/interview-clip.mp4` (240px
square, muted) and `src/ListenClip.tsx` (loudness per 30ms). The recording
beat lasts exactly as long as the trimmed clip. `--placeholder` generates a
synthetic stand-in; `INTERVIEW_CLIP.placeholder` says which one is live. In
Framer, upload the MP4 as an asset and set `INTERVIEW_CLIP.src` to its URL.

The same goes for `media/ad-its-fine.jpg` (the Creative/Ad Testing card's
ad): upload it to Framer and set `UC_AD_IMG` in `ListenScenes.tsx` to its URL.

## Local development

```bash
npm install
sh build.sh       # bundles src/demo.tsx → dist/demo.js
node scripts/dev-server.mjs   # → http://localhost:4173
```

- `/?scene=deliver-results` renders one scene solo (any registry key).
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
- `/?demo=1` is the showcase page; **Show grid** (or `G`, or `&grid=1`) overlays its 12-column grid.
- `/` (the landing page) is the **composition workbench**. Its right rail
  has the same five groups as Framer: Content, Playback, Scene state,
  Framing, Canvas. Direct manipulation on the stage: drag the canvas to
  reposition a pinned shot, scroll to zoom, drag-resize the crop over a
  ghosted scene, punch segment in/out from the scrub playhead, and preview
  at any width/breakpoint. Presets are authored in `ListenPresets.tsx` and
  appear in SceneCanvas's Framer dropdown.

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
