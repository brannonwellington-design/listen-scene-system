// ProductShot — drop any single scene or fragment anywhere on the site.
// This is the "grab a section of the product" component: pick a scene from
// the dropdown in Framer, and it plays its session when scrolled into view.
import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { ScaleBox, FRAME_W, FRAME_H, ensureCss } from "./ListenKit"
import {
  SceneDesignStudy, SceneReachPeople, SceneInterviewScale,
  SceneDeliverResults, SceneCompound,
  FragmentTopAnswer, TOP_ANSWER_W, TOP_ANSWER_H,
  FragmentLiveInterview, LIVE_INTERVIEW_W, LIVE_INTERVIEW_H,
  FragmentEmotionQuote, EMOTION_QUOTE_W, EMOTION_QUOTE_H,
  SceneProps,
} from "./ListenScenes"

export const REGISTRY: Record<string, { Scene: (p: SceneProps) => JSX.Element; w: number; h: number }> = {
  "design-study": { Scene: SceneDesignStudy, w: FRAME_W, h: FRAME_H },
  "reach-people": { Scene: SceneReachPeople, w: FRAME_W, h: FRAME_H },
  "interview-scale": { Scene: SceneInterviewScale, w: FRAME_W, h: FRAME_H },
  "deliver-results": { Scene: SceneDeliverResults, w: FRAME_W, h: FRAME_H },
  "compound": { Scene: SceneCompound, w: FRAME_W, h: FRAME_H },
  "top-answer-card": { Scene: FragmentTopAnswer, w: TOP_ANSWER_W, h: TOP_ANSWER_H },
  "live-interview-card": { Scene: FragmentLiveInterview, w: LIVE_INTERVIEW_W, h: LIVE_INTERVIEW_H },
  "emotion-quote-card": { Scene: FragmentEmotionQuote, w: EMOTION_QUOTE_W, h: EMOTION_QUOTE_H },
}

export default function ProductShot(props: { scene?: string; loop?: boolean; loopPause?: number }): JSX.Element {
  const { scene = "deliver-results", loop = true, loopPause = 3 } = props
  ensureCss()
  const entry = REGISTRY[scene] ?? REGISTRY["deliver-results"]
  const [inView, setInView] = React.useState(false)
  const [runKey, setRunKey] = React.useState(0)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === "undefined") { setInView(true); return }
    const io = new IntersectionObserver((e) => setInView(e[0].isIntersecting), { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const onDone = React.useCallback(() => {
    if (!loop) return
    const id = setTimeout(() => setRunKey((k) => k + 1), loopPause * 1000)
    return () => clearTimeout(id)
  }, [loop, loopPause])

  const { Scene, w, h } = entry
  return (
    <div ref={ref} style={{ width: "100%" }}>
      <ScaleBox designWidth={w} designHeight={h}>
        <Scene active={inView} onDone={onDone} runKey={runKey} />
      </ScaleBox>
    </div>
  )
}

addPropertyControls(ProductShot, {
  scene: {
    type: ControlType.Enum,
    title: "Scene",
    options: Object.keys(REGISTRY),
    optionTitles: [
      "Design the study", "Reach the right people", "Interview at scale",
      "Deliver results", "Compound learnings", "Top Answer card", "Live interview card",
      "Emotion quote card",
    ],
    defaultValue: "deliver-results",
  },
  loop: { type: ControlType.Boolean, title: "Loop", defaultValue: true },
  loopPause: { type: ControlType.Number, title: "Loop pause (s)", defaultValue: 3, min: 0, max: 20, step: 0.5 },
})
