// ListenPresets — named, complete compositions for SceneCanvas.
// A preset captures everything that makes a composition feel deliberate:
// content (or a custom crop), fit/anchor/insets/zoom, canvas treatment, and
// the time-slice beat. Pick one on any SceneCanvas (Framer dropdown or
// `preset` prop); individual controls you touch afterwards override the
// preset for that instance. Compose new ones in the workbench (the landing
// page) and paste the block here.
import type { SceneCanvasProps } from "./SceneCanvas"

export type Preset = {
  name: string
  props: Partial<SceneCanvasProps>
}

export const PRESETS: Preset[] = [
  // --- multi-step ---------------------------------------------------------------
  {
    name: "Use Cases · list",
    props: { layout: "multi-step", sequence: "use-cases" },
  },
  // --- full scenes ------------------------------------------------------------
  {
    name: "Design study · dots",
    props: { shot: "design-study", canvasHeight: 380, pattern: "dots", radius: 16, loopFrom: 8000, loopTo: 16000, loopPause: 3 },
  },
  {
    name: "Design study · pinned circles",
    props: { shot: "design-study", fit: "pin", anchor: "top-left", insetX: 40, insetY: 40, zoom: 0.5, canvasHeight: 340, pattern: "circles", patternSpacing: 36, radius: 16, loopFrom: 8500, loopTo: 16000, loopPause: 4 },
  },
  {
    name: "Interview · clean",
    props: { shot: "interview-scale", canvasHeight: 360, radius: 16, loopFrom: 2000, loopTo: 14000, loopPause: 3 },
  },
  {
    name: "Report · grid",
    props: { shot: "deliver-results", canvasHeight: 360, pattern: "grid", patternSpacing: 28, radius: 16, loopFrom: 0, loopTo: 8000, loopPause: 3 },
  },
  {
    name: "Research agent · crosshairs",
    props: { shot: "compound", canvasHeight: 360, pattern: "crosshairs", patternSpacing: 48, radius: 16, loopFrom: 1200, loopTo: 11000, loopPause: 4 },
  },
  {
    name: "EI hero report · dots",
    props: { shot: "ei-hero-report", canvasHeight: 400, pattern: "dots", radius: 16, loopPause: 4 },
  },
  // --- fragments --------------------------------------------------------------
  {
    name: "Top answer · grid",
    props: { shot: "top-answer-card", canvasHeight: 300, pattern: "grid", patternSpacing: 28, padX: 44, padY: 36, radius: 16, loopPause: 5 },
  },
  {
    name: "Emotion quote · dots",
    props: { shot: "emotion-quote-card", canvasHeight: 300, pattern: "dots", padX: 44, padY: 36, radius: 16, loopPause: 4 },
  },
  {
    name: "Live interview · circles",
    props: { shot: "live-interview-card", canvasHeight: 320, pattern: "circles", patternSpacing: 32, padX: 44, padY: 36, radius: 16, loopPause: 4 },
  },
  {
    name: "EI signals · dots",
    props: { shot: "ei-feature-signals", canvasHeight: 360, pattern: "dots", padX: 44, padY: 36, radius: 16, loopPause: 4 },
  },
  {
    name: "EI traceable · circles",
    props: { shot: "ei-feature-traceable", canvasHeight: 360, pattern: "circles", patternSpacing: 36, padX: 44, padY: 36, radius: 16, loopPause: 4 },
  },
  {
    name: "EI comparison · clean",
    props: { shot: "ei-feature-comparison", canvasHeight: 360, radius: 16, padX: 44, padY: 36, loopPause: 4 },
  },
]

export const presetNames = (): string[] => PRESETS.map((p) => p.name)

export const getPreset = (name: string): Preset | undefined =>
  PRESETS.find((p) => p.name === name)
