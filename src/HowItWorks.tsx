// HowItWorks — the centered product frame with five stages beneath it.
// Auto-cycles through the scenes; clicking a stage jumps to it, and the
// cycle resumes after a short idle. Paste into Framer as a code component.
import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { T, ScaleBox, FRAME_W, FRAME_H, ensureCss } from "./ListenKit"
import {
  SceneDesignStudy, SceneReachPeople, SceneInterviewScale,
  SceneDeliverResults, SceneCompound, SceneProps,
} from "./ListenScenes"

type Stage = {
  title: string
  body: string
  Scene: (p: SceneProps) => JSX.Element
}

const STAGES: Stage[] = [
  {
    title: "Design the study",
    body: "Listen Labs drafts objectives, questions, and probing context in seconds based on your goal. Or upload your own interview guide.",
    Scene: SceneDesignStudy,
  },
  {
    title: "Reach the right people",
    body: "Qualified from a global network of 50M+ participants, including hard to reach audiences. Or use your list of contacts.",
    Scene: SceneReachPeople,
  },
  {
    title: "Interview at scale",
    body: "The AI moderator holds a real conversation with smart follow-ups to drive deeper answers. Runs globally, 24/7, across 120+ languages.",
    Scene: SceneInterviewScale,
  },
  {
    title: "Deliver meaningful results",
    body: "Listen builds your deliverables, from highlight reels to boardroom-ready slides. Every claim traces back to a real interview.",
    Scene: SceneDeliverResults,
  },
  {
    title: "Compound your learnings",
    body: "The more you run, the richer your workspace gets. Search and build on past studies, themes, and reports, so your team keeps getting sharper.",
    Scene: SceneCompound,
  },
]

export default function HowItWorks(props: {
  autoCycle?: boolean
  resumeDelay?: number
  maxWidth?: number
  /** dev tool: show a timeline scrubber above the frame */
  scrubber?: boolean
}): JSX.Element {
  const { autoCycle = true, resumeDelay = 14, maxWidth = 1200, scrubber = false } = props
  ensureCss()
  const [index, setIndex] = React.useState(0)
  const [runKey, setRunKey] = React.useState(0)
  const [inView, setInView] = React.useState(false)
  const [scrubOn, setScrubOn] = React.useState(false)
  const [scrubT, setScrubT] = React.useState(0)
  // playing: the scene runs ONCE, fast-forwarded to playStart then real time;
  // it reports elapsed time back so the slider tracks and pause lands exactly
  const [playStart, setPlayStart] = React.useState<number | null>(null)
  const scrubPlay = playStart != null
  React.useEffect(() => {
    if (scrubT >= 25000 && scrubPlay) setPlayStart(null)
  }, [scrubT, scrubPlay])
  const lastClick = React.useRef(0)
  const resumeTimer = React.useRef<ReturnType<typeof setTimeout>>()
  const rootRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const el = rootRef.current
    if (!el || typeof IntersectionObserver === "undefined") { setInView(true); return }
    const io = new IntersectionObserver((e) => setInView(e[0].isIntersecting), { threshold: 0.25 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  React.useEffect(() => () => clearTimeout(resumeTimer.current), [])

  const advance = React.useCallback(() => {
    setIndex((i) => (i + 1) % STAGES.length)
    setRunKey((k) => k + 1)
  }, [])

  const onSceneDone = React.useCallback(() => {
    if (scrubOn) return
    if (!autoCycle) return
    const idleMs = resumeDelay * 1000
    const sinceClick = Date.now() - lastClick.current
    clearTimeout(resumeTimer.current)
    if (sinceClick >= idleMs) advance()
    else resumeTimer.current = setTimeout(advance, idleMs - sinceClick)
  }, [autoCycle, resumeDelay, advance])

  const onStageClick = (i: number) => {
    lastClick.current = Date.now()
    clearTimeout(resumeTimer.current)
    setIndex(i)
    setRunKey((k) => k + 1)
  }

  const seek = (v: number) => { setPlayStart(null); setScrubT(v) }
  const toggleScrub = () => {
    clearTimeout(resumeTimer.current)
    lastClick.current = Date.now()
    setPlayStart(null)
    setScrubOn(!scrubOn)
    setRunKey((k) => k + 1)
  }

  const { Scene } = STAGES[index]
  const btn: React.CSSProperties = { border: `1px solid ${T.brandFaint}`, borderRadius: 6, padding: "3px 10px", background: "transparent", cursor: "pointer", font: "inherit", fontSize: 12 }

  return (
    <div ref={rootRef} className="ll" style={{ width: "100%", maxWidth, margin: "0 auto" }}>
      {scrubber && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, fontSize: 12, color: T.inkSoft }}>
          {!scrubOn ? (
            <button onClick={toggleScrub} style={btn}>🎚 scrub</button>
          ) : (
            <>
              <button onClick={() => setPlayStart(scrubPlay ? null : scrubT)}
                style={{ ...btn, width: 64, background: T.ink, color: "#F9F4EB", borderColor: T.ink }}>
                {scrubPlay ? "⏸ pause" : "▶ play"}
              </button>
              <input type="range" min={0} max={25000} step={100} value={scrubT}
                onChange={(e) => seek(+e.target.value)} style={{ flex: 1, maxWidth: 440 }} />
              <span style={{ fontVariantNumeric: "tabular-nums", width: 44 }}>{(scrubT / 1000).toFixed(1)}s</span>
              {[-1000, -100, 100, 1000].map((d) => (
                <button key={d} onClick={() => seek(Math.max(0, Math.min(25000, scrubT + d)))} style={btn}>
                  {d > 0 ? `+${d / 1000}s` : `${d / 1000}s`}
                </button>
              ))}
              <button onClick={toggleScrub} style={btn}>✕ live</button>
            </>
          )}
        </div>
      )}
      {/* surface-secondary container housing the product frame */}
      <div style={{ background: T.pageContainer, padding: "44px 56px" }}>
        <div key={index + "-" + runKey} className={scrubOn && !scrubPlay ? "ll-noanim" : scrubOn ? undefined : "ll-scene-fade"}>
          <ScaleBox designWidth={FRAME_W} designHeight={FRAME_H}>
            <Scene
              active={inView}
              onDone={onSceneDone}
              runKey={runKey}
              hold={scrubOn && !scrubPlay ? scrubT : undefined}
              playFrom={scrubOn && scrubPlay ? playStart! : undefined}
              onTime={scrubOn ? setScrubT : undefined}
            />
          </ScaleBox>
        </div>
      </div>
      <div style={{ display: "flex", gap: 32, marginTop: 48, alignItems: "flex-start" }}>
        {STAGES.map((s, i) => {
          const on = i === index
          return (
            <button
              key={s.title}
              onClick={() => onStageClick(i)}
              style={{ flex: 1, textAlign: "left", display: "block", minWidth: 0 }}
              aria-pressed={on}
            >
              <span style={{ display: "block", height: 2, background: on ? T.brand : "transparent", marginBottom: 14, transition: "background .3s" }} />
              <span style={{ display: "block", fontSize: 18, color: on ? T.brand : T.brandFaint, transition: "color .3s" }}>
                {s.title}
              </span>
              <span style={{ display: "block", fontSize: 13.5, lineHeight: 1.55, marginTop: 10, color: on ? T.inkSoft : T.brandFaint, transition: "color .3s" }}>
                {s.body}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

addPropertyControls(HowItWorks, {
  autoCycle: { type: ControlType.Boolean, title: "Auto-cycle", defaultValue: true },
  scrubber: { type: ControlType.Boolean, title: "Scrubber (dev)", defaultValue: false },
  resumeDelay: { type: ControlType.Number, title: "Resume after (s)", defaultValue: 14, min: 4, max: 60, step: 1 },
  maxWidth: { type: ControlType.Number, title: "Max width", defaultValue: 1200, min: 640, max: 1600, step: 10 },
})
