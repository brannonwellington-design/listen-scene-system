// ListenRegistry — the canonical catalog of scenes, fragments, and hero
// stages. Register content once here; the hero, callouts, demo pages, and
// scrubber all read from this. Content is one unified list: full scenes
// (the five How-It-Works stages) and fragments (standalone cards authored
// at their own design size).
import {
  SceneDesignStudy, SceneReachPeople, SceneInterviewScale,
  SceneDeliverResults, SceneCompound, SceneEIReport, SceneAIModerator,
  FragmentTopAnswer, TOP_ANSWER_W, TOP_ANSWER_H,
  FragmentLiveInterview, LIVE_INTERVIEW_W, LIVE_INTERVIEW_H,
  FragmentEmotionQuote, EMOTION_QUOTE_W, EMOTION_QUOTE_H,
  FragmentEIVisual, EI_VISUAL_W, EI_VISUAL_H,
  FragmentEIResponse, EI_RESPONSE_W, EI_RESPONSE_H,
  FragmentEIComparison, EI_COMPARISON_W, EI_COMPARISON_H,
  SceneProps,
} from "./ListenScenes"
import { FRAME_W, FRAME_H } from "./ListenKit"

export type RegistryEntry = {
  key: string
  title: string
  Scene: (p: SceneProps) => JSX.Element
  w: number
  h: number
  kind: "scene" | "fragment"
  /** present when this scene is a How-It-Works stage */
  stage?: { order: number; title: string; body: string }
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
  },
  // EI page hero — the study Details view with the per-question emotion chart
  { key: "ei-report", title: "EI · Study report", Scene: SceneEIReport, w: FRAME_W, h: FRAME_H, kind: "scene" },
  // AI-moderator page hero — desktop + two phones running the same interview
  { key: "ai-moderator", title: "AI Moderator · multi-device", Scene: SceneAIModerator, w: FRAME_W, h: FRAME_H, kind: "scene" },
  { key: "top-answer-card", title: "Top Answer card", Scene: FragmentTopAnswer, w: TOP_ANSWER_W, h: TOP_ANSWER_H, kind: "fragment" },
  { key: "live-interview-card", title: "Live interview card", Scene: FragmentLiveInterview, w: LIVE_INTERVIEW_W, h: LIVE_INTERVIEW_H, kind: "fragment" },
  { key: "emotion-quote-card", title: "Emotion quote card", Scene: FragmentEmotionQuote, w: EMOTION_QUOTE_W, h: EMOTION_QUOTE_H, kind: "fragment" },
  // EI feature cards — live rebuilds of /features/emotional-intelligence images
  { key: "ei-visual-card", title: "EI · Visual analysis", Scene: FragmentEIVisual, w: EI_VISUAL_W, h: EI_VISUAL_H, kind: "fragment" },
  { key: "ei-response-card", title: "EI · Emotional Response", Scene: FragmentEIResponse, w: EI_RESPONSE_W, h: EI_RESPONSE_H, kind: "fragment" },
  { key: "ei-comparison-card", title: "EI · Concept Comparison", Scene: FragmentEIComparison, w: EI_COMPARISON_W, h: EI_COMPARISON_H, kind: "fragment" },
]

export const byKey = (key: string): RegistryEntry =>
  REGISTRY.find((e) => e.key === key) ?? REGISTRY[0]

export const STAGES = REGISTRY
  .filter((e) => e.stage)
  .sort((a, b) => a.stage!.order - b.stage!.order)
