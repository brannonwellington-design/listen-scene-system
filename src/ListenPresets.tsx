// ListenPresets — named, complete compositions for SceneCanvas.
// A preset captures everything that makes a snippet feel deliberate: content
// + crop, fit/anchor/insets/zoom, canvas treatment, and the time-slice beat.
// Pick one on any SceneCanvas (Framer dropdown or `preset` prop); individual
// controls you touch afterwards override the preset for that instance.
// Compose new ones in the workbench (/?compose=1) and paste the block here.
import type { SceneCanvasProps } from "./SceneCanvas"

export type Preset = {
  name: string
  props: Partial<SceneCanvasProps>
}

export const PRESETS: Preset[] = [
  // --- design the study -----------------------------------------------------
  {
    name: "Chat rail · pinned circles",
    props: { content: "design-study@Chat rail", fit: "pinned", anchor: "top-left", insetX: 40, insetY: 40, zoom: 0.75, canvasHeight: 320, pattern: "circles", patternSpacing: 36, radius: 16, segStart: 8500, segEnd: 16000, loopPause: 4 },
  },
  {
    name: "Chip question · dots",
    props: { content: "design-study@Chip question", canvasHeight: 320, pattern: "dots", radius: 16, segStart: 8000, segEnd: 13000, loopPause: 3 },
  },
  {
    name: "Study goals doc · clean",
    props: { content: "design-study@Study goals doc", canvasHeight: 340, radius: 16, segStart: 12000, segEnd: 20000, loopPause: 4 },
  },
  // --- reach the right people ----------------------------------------------
  {
    name: "Audience criteria · dots",
    props: { content: "reach-people@Audience criteria", canvasHeight: 300, pattern: "dots", padX: 40, padY: 32, radius: 16, segStart: 9000, segEnd: 16000, loopPause: 2 },
  },
  {
    name: "Source buttons · circles",
    props: { content: "reach-people@Source buttons", canvasHeight: 300, pattern: "circles", patternSpacing: 32, radius: 16, segStart: 1000, segEnd: 6500, loopPause: 3 },
  },
  {
    name: "Screener · crosshairs",
    props: { content: "reach-people@Screener block", canvasHeight: 240, pattern: "crosshairs", patternSpacing: 48, radius: 16, segStart: 11000, segEnd: 16000, loopPause: 3 },
  },
  // --- interview at scale ----------------------------------------------------
  {
    name: "Interview question · dots",
    props: { content: "interview-scale@Question + answer", canvasHeight: 320, pattern: "dots", radius: 16, segStart: 2000, segEnd: 11000, loopPause: 3 },
  },
  {
    name: "Recording bar · clean",
    props: { content: "interview-scale@Recording bar", canvasHeight: 200, radius: 16, segStart: 2000, segEnd: 10000, loopPause: 2 },
  },
  // --- deliver meaningful results --------------------------------------------
  {
    name: "Report title · grid",
    props: { content: "deliver-results@Report title", canvasHeight: 260, pattern: "grid", patternSpacing: 28, radius: 16, segStart: 0, segEnd: 6000, loopPause: 3 },
  },
  {
    name: "Executive bullets · clean",
    props: { content: "deliver-results@Executive bullets", canvasHeight: 320, radius: 16, segStart: 4000, segEnd: 12000, loopPause: 4 },
  },
  {
    name: "Reports sidebar · pinned",
    props: { content: "deliver-results@Reports sidebar", fit: "pinned", anchor: "top-right", insetX: 40, insetY: 40, zoom: 0.9, canvasHeight: 300, pattern: "dots", radius: 16, loopPause: 5 },
  },
  // --- compound your learnings -----------------------------------------------
  {
    name: "Agent heading · circles",
    props: { content: "compound@Agent heading", canvasHeight: 240, pattern: "circles", patternSpacing: 40, radius: 16, segStart: 1200, segEnd: 6000, loopPause: 4 },
  },
  {
    name: "Suggestions grid · crosshairs",
    props: { content: "compound@Suggestions grid", canvasHeight: 300, pattern: "crosshairs", patternSpacing: 48, padX: 40, padY: 32, radius: 16, segStart: 2000, segEnd: 9000, loopPause: 3 },
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
]

export const presetNames = (): string[] => PRESETS.map((p) => p.name)

export const getPreset = (name: string): Preset | undefined =>
  PRESETS.find((p) => p.name === name)
