// ListenRegistry — the canonical catalog of scenes, fragments, hero stages,
// and named framings (crop-windows). Register content once here; the hero,
// callouts, demo pages, and scrubber all read from this.
import {
  SceneDesignStudy, SceneReachPeople, SceneInterviewScale,
  SceneDeliverResults, SceneCompound,
  FragmentTopAnswer, TOP_ANSWER_W, TOP_ANSWER_H,
  FragmentLiveInterview, LIVE_INTERVIEW_W, LIVE_INTERVIEW_H,
  FragmentEmotionQuote, EMOTION_QUOTE_W, EMOTION_QUOTE_H,
  SceneProps,
} from "./ListenScenes"
import { FRAME_W, FRAME_H } from "./ListenKit"

/** a named crop-window into a scene, in that scene's design space */
export type Framing = { name: string; x: number; y: number; w: number; h: number }

export type RegistryEntry = {
  key: string
  title: string
  Scene: (p: SceneProps) => JSX.Element
  w: number
  h: number
  kind: "scene" | "fragment"
  /** present when this scene is a How-It-Works stage */
  stage?: { order: number; title: string; body: string }
  /** curated crop-windows; rects are tunable in the framing helper (?frame=1) */
  framings?: Framing[]
}

export const REGISTRY: RegistryEntry[] = [
  {
    key: "design-study",
    title: "Design the study",
    Scene: SceneDesignStudy, w: FRAME_W, h: FRAME_H, kind: "scene",
    stage: {
      order: 1,
      title: "Design the study",
      body: "Listen Labs drafts objectives, questions, and probing context in seconds based on your goal. Or upload your own interview guide.",
    },
    framings: [
      { name: "Chat rail", x: 8, y: 48, w: 352, h: 584 },
      { name: "Chip question", x: 12, y: 296, w: 346, h: 296 },
      { name: "Study goals doc", x: 420, y: 90, w: 600, h: 330 },
    ],
  },
  {
    key: "reach-people",
    title: "Reach the right people",
    Scene: SceneReachPeople, w: FRAME_W, h: FRAME_H, kind: "scene",
    stage: {
      order: 2,
      title: "Reach the right people",
      body: "Qualified from a global network of 50M+ participants, including hard to reach audiences. Or use your list of contacts.",
    },
    framings: [
      { name: "Audience criteria", x: 420, y: 80, w: 620, h: 250 },
      { name: "Source buttons", x: 12, y: 130, w: 346, h: 240 },
      { name: "Screener block", x: 420, y: 330, w: 620, h: 260 },
    ],
  },
  {
    key: "interview-scale",
    title: "Interview at scale",
    Scene: SceneInterviewScale, w: FRAME_W, h: FRAME_H, kind: "scene",
    stage: {
      order: 3,
      title: "Interview at scale",
      body: "The AI moderator holds a real conversation with smart follow-ups to drive deeper answers. Runs globally, 24/7, across 120+ languages.",
    },
    framings: [
      { name: "Question + answer", x: 280, y: 40, w: 560, h: 330 },
      { name: "Recording bar", x: 330, y: 530, w: 460, h: 90 },
    ],
  },
  {
    key: "deliver-results",
    title: "Deliver meaningful results",
    Scene: SceneDeliverResults, w: FRAME_W, h: FRAME_H, kind: "scene",
    stage: {
      order: 4,
      title: "Deliver meaningful results",
      body: "Listen builds your deliverables, from highlight reels to boardroom-ready slides. Every claim traces back to a real interview.",
    },
    framings: [
      { name: "Report title", x: 300, y: 100, w: 700, h: 230 },
      { name: "Executive bullets", x: 300, y: 250, w: 700, h: 300 },
      { name: "Reports sidebar", x: 9, y: 88, w: 260, h: 420 },
    ],
  },
  {
    key: "compound",
    title: "Compound your learnings",
    Scene: SceneCompound, w: FRAME_W, h: FRAME_H, kind: "scene",
    stage: {
      order: 5,
      title: "Compound your learnings",
      body: "The more you run, the richer your workspace gets. Search and build on past studies, themes, and reports, so your team keeps getting sharper.",
    },
    framings: [
      { name: "Agent heading", x: 260, y: 92, w: 600, h: 190 },
      { name: "Suggestions grid", x: 220, y: 320, w: 580, h: 230 },
      { name: "Answer card", x: 220, y: 150, w: 600, h: 220 },
    ],
  },
  { key: "top-answer-card", title: "Top Answer card", Scene: FragmentTopAnswer, w: TOP_ANSWER_W, h: TOP_ANSWER_H, kind: "fragment" },
  { key: "live-interview-card", title: "Live interview card", Scene: FragmentLiveInterview, w: LIVE_INTERVIEW_W, h: LIVE_INTERVIEW_H, kind: "fragment" },
  { key: "emotion-quote-card", title: "Emotion quote card", Scene: FragmentEmotionQuote, w: EMOTION_QUOTE_W, h: EMOTION_QUOTE_H, kind: "fragment" },
]

export const byKey = (key: string): RegistryEntry =>
  REGISTRY.find((e) => e.key === key) ?? REGISTRY[0]

export const STAGES = REGISTRY
  .filter((e) => e.stage)
  .sort((a, b) => a.stage!.order - b.stage!.order)

/** "scene:framing" ids for flat Framer dropdowns, e.g. "design-study@Chat rail" */
export const framingOptions = (): string[] => {
  const out: string[] = []
  for (const e of REGISTRY) {
    out.push(e.key)
    for (const f of e.framings ?? []) out.push(`${e.key}@${f.name}`)
  }
  return out
}

export const resolveContent = (id: string): { entry: RegistryEntry; framing?: Framing } => {
  const [key, framingName] = id.split("@")
  const entry = byKey(key)
  const framing = framingName ? (entry.framings ?? []).find((f) => f.name === framingName) : undefined
  return { entry, framing }
}
