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
  // --- full scenes ------------------------------------------------------------
  {
    name: "Design study · dots",
    props: { content: "design-study", canvasHeight: 380, pattern: "dots", radius: 16, segStart: 8000, segEnd: 16000, loopPause: 3 },
  },
  {
    name: "Design study · pinned circles",
    props: { content: "design-study", fit: "pinned", anchor: "top-left", insetX: 40, insetY: 40, zoom: 0.6, canvasHeight: 340, pattern: "circles", patternSpacing: 36, radius: 16, segStart: 8500, segEnd: 16000, loopPause: 4 },
  },
  {
    name: "Interview · clean",
    props: { content: "interview-scale", canvasHeight: 360, radius: 16, segStart: 2000, segEnd: 11000, loopPause: 3 },
  },
  {
    name: "Report · grid",
    props: { content: "deliver-results", canvasHeight: 360, pattern: "grid", patternSpacing: 28, radius: 16, segStart: 0, segEnd: 8000, loopPause: 3 },
  },
  {
    name: "Research agent · crosshairs",
    props: { content: "compound", canvasHeight: 360, pattern: "crosshairs", patternSpacing: 48, radius: 16, segStart: 1200, segEnd: 9000, loopPause: 4 },
  },
  {
    name: "EI report · dots",
    props: { content: "ei-report", canvasHeight: 400, pattern: "dots", radius: 16, loopPause: 4 },
  },
  // --- fragments --------------------------------------------------------------
  {
    name: "Top answer · grid",
    props: { content: "top-answer-card", canvasHeight: 300, pattern: "grid", patternSpacing: 28, padX: 44, padY: 36, radius: 16, loopPause: 5 },
  },
  {
    name: "Emotion quote · dots",
    props: { content: "emotion-quote-card", canvasHeight: 300, pattern: "dots", padX: 44, padY: 36, radius: 16, loopPause: 4 },
  },
  {
    name: "Live interview · circles",
    props: { content: "live-interview-card", canvasHeight: 320, pattern: "circles", patternSpacing: 32, padX: 44, padY: 36, radius: 16, loopPause: 4 },
  },
  {
    name: "EI visual · dots",
    props: { content: "ei-visual-card", canvasHeight: 360, pattern: "dots", padX: 44, padY: 36, radius: 16, loopPause: 4 },
  },
  {
    name: "EI response · circles",
    props: { content: "ei-response-card", canvasHeight: 360, pattern: "circles", patternSpacing: 36, padX: 44, padY: 36, radius: 16, loopPause: 4 },
  },
  {
    name: "EI comparison · clean",
    props: { content: "ei-comparison-card", canvasHeight: 360, radius: 16, padX: 44, padY: 36, loopPause: 4 },
  },
]

export const presetNames = (): string[] => PRESETS.map((p) => p.name)

export const getPreset = (name: string): Preset | undefined =>
  PRESETS.find((p) => p.name === name)
