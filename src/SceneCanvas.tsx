// SceneCanvas — the universal live product-shot component.
// One Framer component, two personalities:
//   variant="hero"    → multi-stage How-It-Works (auto-cycle, stage rail, scrubber)
//   variant="callout" → a single scene, fragment, or crop-window snippet
// Every instance gets the canvas system: surface-secondary container, optional
// background pattern, and a fit engine (responsive scaling vs corner-pinned
// native pixels with masking + optional small-screen fallback).
import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import {
  T, ScaleBox, PatternLayer, PatternType, ensureCss, FRAME_W, FRAME_H,
} from "./ListenKit"
import {
  REGISTRY, STAGES, framingOptions, resolveContent, Framing, RegistryEntry,
} from "./ListenRegistry"
import { SceneProps } from "./ListenScenes"

// ----------------------------------------------------------------- types ----
export type SceneCanvasProps = {
  variant?: "hero" | "callout"
  // hero
  autoCycle?: boolean
  resumeDelay?: number
  scrubber?: boolean
  // callout content: registry id, optionally "key@Framing name", or "custom"
  content?: string
  customScene?: string
  cropX?: number
  cropY?: number
  cropW?: number
  cropH?: number
  // callout playback
  loop?: boolean
  loopPause?: number
  /** loop only a time-slice of the session (virtual ms); 0/0 = whole session */
  segStart?: number
  segEnd?: number
  // fit engine
  fit?: "responsive" | "pinned"
  anchor?: "top-left" | "top-right" | "bottom-left" | "bottom-right"
  insetX?: number
  insetY?: number
  zoom?: number
  smallBehavior?: "mask" | "fit"
  fitBelow?: number
  canvasHeight?: number
  // canvas
  pattern?: PatternType
  patternSpacing?: number
  patternOpacity?: number
  bgColor?: string
  padX?: number
  padY?: number
  radius?: number
  maxWidth?: number
}

// ------------------------------------------------------------- shot unit ----
/** Renders a scene (optionally cropped to a framing rect) at a given scale. */
function ShotUnit(props: {
  entry: RegistryEntry
  framing?: Framing
  scale: number
  sceneProps: SceneProps
}): JSX.Element {
  const { entry, framing, scale, sceneProps } = props
  const r = framing ?? { name: "full", x: 0, y: 0, w: entry.w, h: entry.h }
  const Scene = entry.Scene
  return (
    <div className="ll" style={{ width: r.w * scale, height: r.h * scale, overflow: "hidden", position: "relative", flexShrink: 0 }}>
      <div style={{ width: entry.w, height: entry.h, transform: `scale(${scale}) translate(${-r.x}px, ${-r.y}px)`, transformOrigin: "top left" }}>
        <Scene {...sceneProps} />
      </div>
    </div>
  )
}

// -------------------------------------------------------------- callout -----
function Callout(props: Required<Pick<SceneCanvasProps,
  "content" | "customScene" | "cropX" | "cropY" | "cropW" | "cropH" |
  "loop" | "loopPause" | "segStart" | "segEnd" |
  "fit" | "anchor" | "insetX" | "insetY" | "zoom" | "smallBehavior" | "fitBelow" | "canvasHeight" |
  "pattern" | "patternSpacing" | "patternOpacity" | "bgColor" | "padX" | "padY" | "radius">>): JSX.Element {
  const {
    content, customScene, cropX, cropY, cropW, cropH,
    loop, loopPause, segStart, segEnd,
    fit, anchor, insetX, insetY, zoom, smallBehavior, fitBelow, canvasHeight,
    pattern, patternSpacing, patternOpacity, bgColor, padX, padY, radius,
  } = props

  const { entry, framing } = content === "custom"
    ? { entry: resolveContent(customScene).entry, framing: cropW > 0 ? { name: "custom", x: cropX, y: cropY, w: cropW, h: cropH } : undefined }
    : resolveContent(content)
  const rect = framing ?? { name: "full", x: 0, y: 0, w: entry.w, h: entry.h }

  // visibility + loop/segment playback
  const rootRef = React.useRef<HTMLDivElement>(null)
  const [inView, setInView] = React.useState(false)
  const [runKey, setRunKey] = React.useState(0)
  React.useEffect(() => {
    const el = rootRef.current
    if (!el || typeof IntersectionObserver === "undefined") { setInView(true); return }
    const io = new IntersectionObserver((e) => setInView(e[0].isIntersecting), { threshold: 0.25 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const restartTimer = React.useRef<ReturnType<typeof setTimeout>>()
  React.useEffect(() => () => clearTimeout(restartTimer.current), [])
  const scheduleRestart = React.useCallback(() => {
    if (!loop) return
    clearTimeout(restartTimer.current)
    restartTimer.current = setTimeout(() => setRunKey((k) => k + 1), loopPause * 1000)
  }, [loop, loopPause])

  const segment = segEnd > 0
  const onTime = React.useCallback((t: number) => {
    if (segment && t >= segEnd) scheduleRestart()
  }, [segment, segEnd, scheduleRestart])

  const sceneProps: SceneProps = {
    active: inView,
    runKey,
    onDone: segment ? undefined : scheduleRestart,
    playFrom: segment ? segStart : undefined,
    onTime: segment ? onTime : undefined,
  }

  // measure available width for responsive scale + pinned fallback
  const [availW, setAvailW] = React.useState(0)
  React.useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setAvailW(el.clientWidth - padX * 2))
    ro.observe(el)
    setAvailW(el.clientWidth - padX * 2)
    return () => ro.disconnect()
  }, [padX])

  const usePinned = fit === "pinned" && !(smallBehavior === "fit" && availW > 0 && availW + padX * 2 < fitBelow)

  const containerStyle: React.CSSProperties = {
    position: "relative", overflow: "hidden", background: bgColor, borderRadius: radius,
    width: "100%",
  }

  if (usePinned) {
    const pos: React.CSSProperties = { position: "absolute" }
    if (anchor.includes("top")) pos.top = insetY; else pos.bottom = insetY
    if (anchor.includes("left")) pos.left = insetX; else pos.right = insetX
    return (
      <div ref={rootRef} style={{ ...containerStyle, height: canvasHeight }}>
        <PatternLayer type={pattern} spacing={patternSpacing} opacity={patternOpacity} />
        <div style={pos}>
          <ShotUnit entry={entry} framing={rect} scale={zoom} sceneProps={sceneProps} />
        </div>
      </div>
    )
  }

  const scale = availW > 0 ? availW / rect.w : 1
  return (
    <div ref={rootRef} style={{ ...containerStyle, padding: `${padY}px ${padX}px` }}>
      <PatternLayer type={pattern} spacing={patternSpacing} opacity={patternOpacity} />
      <div style={{ position: "relative" }}>
        <ShotUnit entry={entry} framing={rect} scale={scale} sceneProps={sceneProps} />
      </div>
    </div>
  )
}

// ----------------------------------------------------------------- hero -----
function Hero(props: Required<Pick<SceneCanvasProps,
  "autoCycle" | "resumeDelay" | "scrubber" | "maxWidth" |
  "pattern" | "patternSpacing" | "patternOpacity" | "bgColor" | "padX" | "padY" | "radius">>): JSX.Element {
  const { autoCycle, resumeDelay, scrubber, maxWidth, pattern, patternSpacing, patternOpacity, bgColor, padX, padY, radius } = props
  const [index, setIndex] = React.useState(0)
  const [runKey, setRunKey] = React.useState(0)
  const [inView, setInView] = React.useState(false)
  const [scrubOn, setScrubOn] = React.useState(false)
  const [scrubT, setScrubT] = React.useState(0)
  const [playStart, setPlayStart] = React.useState<number | null>(null)
  const scrubPlay = playStart != null
  const lastClick = React.useRef(0)
  const resumeTimer = React.useRef<ReturnType<typeof setTimeout>>()
  const rootRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (scrubT >= 25000 && scrubPlay) setPlayStart(null)
  }, [scrubT, scrubPlay])

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
  }, [scrubOn, autoCycle, resumeDelay, advance])

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

  const entry = STAGES[index]
  const Scene = entry.Scene
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
      <div style={{ position: "relative", overflow: "hidden", background: bgColor, borderRadius: radius, padding: `${padY}px ${padX}px` }}>
        <PatternLayer type={pattern} spacing={patternSpacing} opacity={patternOpacity} />
        <div key={index + "-" + runKey} className={scrubOn && !scrubPlay ? "ll-noanim" : scrubOn ? undefined : "ll-scene-fade"} style={{ position: "relative" }}>
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
            <button key={s.key} onClick={() => onStageClick(i)}
              style={{ flex: 1, textAlign: "left", display: "block", minWidth: 0, background: "none", border: "none", cursor: "pointer", font: "inherit", padding: 0 }}
              aria-pressed={on}>
              <span style={{ display: "block", height: 2, background: on ? T.brand : "transparent", marginBottom: 14, transition: "background .3s" }} />
              <span style={{ display: "block", fontSize: 18, color: on ? T.brand : T.brandFaint, transition: "color .3s" }}>
                {s.stage!.title}
              </span>
              <span style={{ display: "block", fontSize: 13.5, lineHeight: 1.55, marginTop: 10, color: on ? T.inkSoft : T.brandFaint, transition: "color .3s" }}>
                {s.stage!.body}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ------------------------------------------------------------- component ----
/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function SceneCanvas(props: SceneCanvasProps): JSX.Element {
  ensureCss()
  const {
    variant = "callout",
    autoCycle = true, resumeDelay = 14, scrubber = false, maxWidth = 1200,
    content = "reach-people@Audience criteria", customScene = "design-study",
    cropX = 0, cropY = 0, cropW = 0, cropH = 0,
    loop = true, loopPause = 3, segStart = 0, segEnd = 0,
    fit = "responsive", anchor = "top-left", insetX = 40, insetY = 40,
    zoom = 1, smallBehavior = "fit", fitBelow = 480, canvasHeight = 420,
    pattern = "none", patternSpacing = 24, patternOpacity = 0.5,
    bgColor = T.pageContainer, padX = 56, padY = 44, radius = 0,
  } = props

  if (variant === "hero") {
    return <Hero {...{ autoCycle, resumeDelay, scrubber, maxWidth, pattern, patternSpacing, patternOpacity, bgColor, padX, padY, radius }} />
  }
  return (
    <Callout {...{
      content, customScene, cropX, cropY, cropW, cropH,
      loop, loopPause, segStart, segEnd,
      fit, anchor, insetX, insetY, zoom, smallBehavior, fitBelow, canvasHeight,
      pattern, patternSpacing, patternOpacity, bgColor, padX, padY, radius,
    }} />
  )
}

const isCallout = (p: SceneCanvasProps) => (p.variant ?? "callout") !== "hero"
const isHero = (p: SceneCanvasProps) => (p.variant ?? "callout") === "hero"

addPropertyControls(SceneCanvas, {
  variant: { type: ControlType.Enum, title: "Variant", options: ["hero", "callout"], optionTitles: ["Hero (stages)", "Callout (snippet)"], defaultValue: "callout" },
  // hero
  autoCycle: { type: ControlType.Boolean, title: "Auto-cycle", defaultValue: true, hidden: isCallout },
  resumeDelay: { type: ControlType.Number, title: "Resume after (s)", defaultValue: 14, min: 4, max: 60, step: 1, hidden: isCallout },
  scrubber: { type: ControlType.Boolean, title: "Scrubber (dev)", defaultValue: false, hidden: isCallout },
  maxWidth: { type: ControlType.Number, title: "Max width", defaultValue: 1200, min: 640, max: 1600, step: 10, hidden: isCallout },
  // callout content
  content: { type: ControlType.Enum, title: "Content", options: [...framingOptions(), "custom"], defaultValue: "reach-people@Audience criteria", hidden: isHero },
  customScene: { type: ControlType.Enum, title: "Custom scene", options: REGISTRY.map((e) => e.key), hidden: (p) => isHero(p) || p.content !== "custom" },
  cropX: { type: ControlType.Number, title: "Crop X", defaultValue: 0, min: 0, max: 1120, hidden: (p) => isHero(p) || p.content !== "custom" },
  cropY: { type: ControlType.Number, title: "Crop Y", defaultValue: 0, min: 0, max: 640, hidden: (p) => isHero(p) || p.content !== "custom" },
  cropW: { type: ControlType.Number, title: "Crop W (0=full)", defaultValue: 0, min: 0, max: 1120, hidden: (p) => isHero(p) || p.content !== "custom" },
  cropH: { type: ControlType.Number, title: "Crop H", defaultValue: 0, min: 0, max: 640, hidden: (p) => isHero(p) || p.content !== "custom" },
  // callout playback
  loop: { type: ControlType.Boolean, title: "Loop", defaultValue: true, hidden: isHero },
  loopPause: { type: ControlType.Number, title: "Loop pause (s)", defaultValue: 3, min: 0, max: 20, step: 0.5, hidden: isHero },
  segStart: { type: ControlType.Number, title: "Segment start (ms)", defaultValue: 0, min: 0, max: 25000, step: 100, hidden: isHero },
  segEnd: { type: ControlType.Number, title: "Segment end (ms)", defaultValue: 0, min: 0, max: 25000, step: 100, hidden: isHero },
  // fit
  fit: { type: ControlType.Enum, title: "Fit", options: ["responsive", "pinned"], optionTitles: ["Responsive scale", "Pinned (mask)"], defaultValue: "responsive", hidden: isHero },
  anchor: { type: ControlType.Enum, title: "Anchor", options: ["top-left", "top-right", "bottom-left", "bottom-right"], defaultValue: "top-left", hidden: (p) => isHero(p) || p.fit !== "pinned" },
  insetX: { type: ControlType.Number, title: "Inset X", defaultValue: 40, min: 0, max: 200, hidden: (p) => isHero(p) || p.fit !== "pinned" },
  insetY: { type: ControlType.Number, title: "Inset Y", defaultValue: 40, min: 0, max: 200, hidden: (p) => isHero(p) || p.fit !== "pinned" },
  zoom: { type: ControlType.Number, title: "Shot zoom", defaultValue: 1, min: 0.5, max: 2, step: 0.05, hidden: (p) => isHero(p) || p.fit !== "pinned" },
  canvasHeight: { type: ControlType.Number, title: "Canvas height", defaultValue: 420, min: 120, max: 1200, hidden: (p) => isHero(p) || p.fit !== "pinned" },
  smallBehavior: { type: ControlType.Enum, title: "When small", options: ["fit", "mask"], optionTitles: ["Fall back to fit", "Keep masking"], defaultValue: "fit", hidden: (p) => isHero(p) || p.fit !== "pinned" },
  fitBelow: { type: ControlType.Number, title: "Fall back below (px)", defaultValue: 480, min: 240, max: 900, hidden: (p) => isHero(p) || p.fit !== "pinned" || p.smallBehavior !== "fit" },
  // canvas
  pattern: { type: ControlType.Enum, title: "Pattern", options: ["none", "dots", "grid", "circles", "crosshairs"], defaultValue: "none" },
  patternSpacing: { type: ControlType.Number, title: "Pattern spacing", defaultValue: 24, min: 8, max: 120, step: 4, hidden: (p) => p.pattern === "none" },
  patternOpacity: { type: ControlType.Number, title: "Pattern opacity", defaultValue: 0.5, min: 0.05, max: 1, step: 0.05, hidden: (p) => p.pattern === "none" },
  bgColor: { type: ControlType.Color, title: "Canvas fill", defaultValue: "#EEE8DD" },
  padX: { type: ControlType.Number, title: "Padding X", defaultValue: 56, min: 0, max: 160 },
  padY: { type: ControlType.Number, title: "Padding Y", defaultValue: 44, min: 0, max: 160 },
  radius: { type: ControlType.Number, title: "Radius", defaultValue: 0, min: 0, max: 16 },
})
