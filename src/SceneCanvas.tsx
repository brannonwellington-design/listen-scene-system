// SceneCanvas — the universal live product-shot component.
// One Framer component, two layouts:
//   layout="single"     → one product shot: a scene, fragment, or custom crop
//   layout="multi-step" → a sequence of shots in one frame, cycling, in one
//                         of two styles: captions under the shot (How it
//                         works) or a numbered list beside a cropped shot
//                         (Use Cases)
// Both layouts share the same canvas system: surface-secondary container,
// optional background pattern, and a fit engine (responsive scaling vs
// corner-pinned native pixels with masking + optional small-screen fallback).
// Multi-step is literally the single layout per step, plus the rail.
import * as React from "react"
import { createPortal } from "react-dom"
import { addPropertyControls, ControlType } from "framer"
import {
  T, PatternLayer, PatternType, ensureCss, ShellPrefs, useShellPrefs, APP_W, APP_H,
} from "./ListenKit"
import { REGISTRY, SEQUENCES, byKey, label, sequenceByKey, RegistryEntry, Step, StepStyle } from "./ListenRegistry"
import { SceneProps } from "./ListenScenes"
import { PRESETS, getPreset, presetNames } from "./ListenPresets"
import { I } from "./ListenIcons"

// ----------------------------------------------------------------- types ----
/** 9-position pin grid: corners, edge midpoints, and dead center */
export type Anchor =
  | "top-left" | "top-center" | "top-right"
  | "left-center" | "center" | "right-center"
  | "bottom-left" | "bottom-center" | "bottom-right"

export const ANCHORS: Anchor[] = [
  "top-left", "top-center", "top-right",
  "left-center", "center", "right-center",
  "bottom-left", "bottom-center", "bottom-right",
]

/** split an anchor token into its vertical / horizontal axes */
export const anchorAxes = (a: Anchor): { v: "top" | "center" | "bottom"; h: "left" | "center" | "right" } => {
  if (a === "center") return { v: "center", h: "center" }
  if (a === "left-center") return { v: "center", h: "left" }
  if (a === "right-center") return { v: "center", h: "right" }
  const [v, h] = a.split("-") as ["top" | "bottom", "left" | "center" | "right"]
  return { v, h }
}

export type SceneCanvasProps = {
  layout?: "single" | "multi-step"
  /** apply a named composition from ListenPresets; touched controls override */
  preset?: string
  // multi-step: a named sequence from the registry, or "custom" to use `steps`
  sequence?: string
  steps?: Step[]
  /** "auto" follows the sequence's own style */
  stepStyle?: "auto" | StepStyle
  autoCycle?: boolean
  resumeDelay?: number
  /** list style, side by side: 12-column grid spans (24px gutters). The list
   *  runs listStart–listEnd; the card runs cardStart–12. */
  listStart?: number
  listEnd?: number
  cardStart?: number
  scrubber?: boolean
  // single content: any registry key (scene or fragment), or "custom" to
  // crop a rect out of a scene
  content?: string
  customScene?: string
  cropX?: number
  cropY?: number
  cropW?: number
  cropH?: number
  // app-shell scenes: how the product chrome starts (visitors can change it)
  startCollapsed?: boolean
  startTheme?: "light" | "dark"
  // single playback
  loop?: boolean
  loopPause?: number
  /** loop only a time-slice of the session (virtual ms); 0/0 = whole session */
  segStart?: number
  segEnd?: number
  // fit engine
  fit?: "responsive" | "pinned" | "bleed"
  /** bleed: how many design px of the shot show across the card */
  bleedShow?: number
  /** bleed: card height as a fraction of its width (canvasHeight overrides) */
  bleedRatio?: number
  anchor?: Anchor
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
  // workbench-only passthroughs (not exposed as Framer controls)
  debugHold?: number
  debugPlayFrom?: number
  debugOnTime?: (t: number) => void
  debugCanvasRef?: React.Ref<HTMLDivElement>
  /** multi-step: render the scrubber into this element (the workbench toolbar) */
  scrubberSlot?: HTMLElement | null
}

/** control defaults — single source for destructuring and preset merging */
export const CANVAS_DEFAULTS = {
  layout: "single" as "single" | "multi-step", sequence: "how-it-works",
  stepStyle: "auto" as "auto" | StepStyle,
  autoCycle: true, resumeDelay: 14, scrubber: false, maxWidth: 1200,
  listStart: 2, listEnd: 5, cardStart: 7,
  content: "design-study", customScene: "design-study",
  cropX: 0, cropY: 0, cropW: 0, cropH: 0,
  loop: true, loopPause: 3, segStart: 0, segEnd: 0,
  startCollapsed: false, startTheme: "light" as "light" | "dark",
  fit: "responsive" as "responsive" | "pinned" | "bleed", bleedShow: 880, bleedRatio: 0.76, anchor: "top-left" as Anchor, insetX: 40, insetY: 40,
  zoom: 0.5, smallBehavior: "fit" as const, fitBelow: 480, canvasHeight: 0,
  pattern: "none" as PatternType, patternSpacing: 16, patternOpacity: 1,
  bgColor: T.pageContainer, padX: 56, padY: 44, radius: 0,
}

/** preset values fill in wherever the instance still has the stock default */
function mergePreset(props: SceneCanvasProps): typeof CANVAS_DEFAULTS {
  const presetProps = props.preset && props.preset !== "custom" ? getPreset(props.preset)?.props ?? {} : {}
  const out: any = { ...CANVAS_DEFAULTS, ...presetProps }
  for (const k of Object.keys(CANVAS_DEFAULTS) as Array<keyof typeof CANVAS_DEFAULTS>) {
    const v = (props as any)[k]
    if (v !== undefined && v !== CANVAS_DEFAULTS[k]) out[k] = v
  }
  return out
}

// ------------------------------------------------------------- shot unit ----
/** a crop-window into a scene, in that scene's design space */
export type CropRect = { x: number; y: number; w: number; h: number }

/** Renders a registry entry (optionally cropped to a rect) at a given scale. */
function ShotUnit(props: {
  entry: RegistryEntry
  crop?: CropRect
  scale: number
  sceneProps: SceneProps
}): JSX.Element {
  const { entry, crop, scale, sceneProps } = props
  const r = crop ?? { x: 0, y: 0, w: entry.w, h: entry.h }
  const Scene = entry.Scene
  return (
    <div className="ll" style={{ width: r.w * scale, height: r.h * scale, overflow: "hidden", position: "relative", flexShrink: 0 }}>
      <div style={{ width: entry.w, height: entry.h, transform: `scale(${scale}) translate(${-r.x}px, ${-r.y}px)`, transformOrigin: "top left" }}>
        <Scene {...sceneProps} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- single -----
function Single(props: typeof CANVAS_DEFAULTS & {
  debugHold?: number
  debugPlayFrom?: number
  debugOnTime?: (t: number) => void
  debugCanvasRef?: React.Ref<HTMLDivElement>
  /** multi-step hands control here: called when the shot finishes instead of looping */
  onFinish?: () => void
}): JSX.Element {
  const {
    content, customScene, cropX, cropY, cropW, cropH,
    loop, loopPause, segStart, segEnd,
    fit, anchor, insetX, insetY, zoom, smallBehavior, fitBelow, canvasHeight,
    bleedShow, bleedRatio,
    pattern, patternSpacing, patternOpacity, bgColor, padX, padY, radius,
    debugHold, debugPlayFrom, debugOnTime, debugCanvasRef, onFinish,
  } = props

  const entry = byKey(content === "custom" ? customScene : content)
  const crop: CropRect | undefined =
    content === "custom" && cropW > 0 ? { x: cropX, y: cropY, w: cropW, h: cropH } : undefined
  const rect = crop ?? { x: 0, y: 0, w: entry.w, h: entry.h }

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
    if (onFinish) { onFinish(); return }
    if (!loop) return
    clearTimeout(restartTimer.current)
    restartTimer.current = setTimeout(() => setRunKey((k) => k + 1), loopPause * 1000)
  }, [loop, loopPause, onFinish])

  const segment = segEnd > 0
  const onTime = React.useCallback((t: number) => {
    if (segment && t >= segEnd) scheduleRestart()
  }, [segment, segEnd, scheduleRestart])

  const debugging = debugHold != null || debugPlayFrom != null
  const sceneProps: SceneProps = debugging
    ? {
        active: true,
        runKey,
        hold: debugHold,
        playFrom: debugHold == null ? debugPlayFrom : undefined,
        onTime: debugOnTime,
      }
    : {
        active: inView,
        runKey,
        onDone: segment ? undefined : scheduleRestart,
        playFrom: segment ? segStart : undefined,
        onTime: segment ? onTime : undefined,
      }

  // measure available width for responsive scale + pinned fallback (bleed
  // ignores padding: the shot hangs off the card's edges instead)
  const pad = fit === "bleed" ? 0 : padX
  const [availW, setAvailW] = React.useState(0)
  React.useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setAvailW(el.clientWidth - pad * 2))
    ro.observe(el)
    setAvailW(el.clientWidth - pad * 2)
    return () => ro.disconnect()
  }, [pad])

  const setRefs = (el: HTMLDivElement | null) => {
    ;(rootRef as React.MutableRefObject<HTMLDivElement | null>).current = el
    if (typeof debugCanvasRef === "function") debugCanvasRef(el)
    else if (debugCanvasRef) (debugCanvasRef as React.MutableRefObject<HTMLDivElement | null>).current = el
  }

  const usePinned = fit === "pinned" && !(smallBehavior === "fit" && availW > 0 && availW + padX * 2 < fitBelow)

  const containerStyle: React.CSSProperties = {
    position: "relative", overflow: "hidden", background: bgColor, borderRadius: radius,
    width: "100%", boxSizing: "border-box",
  }

  if (fit === "bleed") {
    // a card with the shot inset from its top-left corner and running off the
    // right and bottom edges; scale follows the card width, so the crop reads
    // the same at every size
    // the larger of: `bleedShow` px across, or enough to still run off the
    // bottom when the card is tall (most of the shot's height, never all of it)
    const h = canvasHeight || availW * bleedRatio
    const s = availW > 0 ? Math.max(0.1, (availW - insetX) / bleedShow, (h - insetY) / (rect.h * 0.95)) : 0
    return (
      <div ref={setRefs} style={{
        ...containerStyle, height: h,
        border: `1px solid ${T.pageLine}`,
      }}>
        <PatternLayer type={pattern} spacing={patternSpacing} opacity={patternOpacity} />
        {s > 0 && (
          // one stroke, drawn here at 1 screen px in the card's own color
          // (the mock gives card and shot the same surface-tertiary); the
          // app's scaled border (a blurry ~0.6px at this size) is hidden, and
          // the radius is the app's 12, scaled with it
          <div key={runKey} className="ll-scene-fade ll-bleed" style={{
            position: "absolute", left: insetX - 1, top: insetY - 1,
            border: `1px solid ${T.pageLine}`, borderRadius: 12 * s, overflow: "hidden",
          }}>
            <ShotUnit entry={entry} crop={crop} scale={s} sceneProps={sceneProps} />
          </div>
        )}
      </div>
    )
  }

  if (usePinned) {
    // centered axes self-center (insets apply only to edge-pinned axes)
    const ax = anchorAxes(anchor)
    const pos: React.CSSProperties = { position: "absolute" }
    if (ax.v === "top") pos.top = insetY
    else if (ax.v === "bottom") pos.bottom = insetY
    else pos.top = "50%"
    if (ax.h === "left") pos.left = insetX
    else if (ax.h === "right") pos.right = insetX
    else pos.left = "50%"
    if (ax.v === "center" || ax.h === "center") {
      pos.transform = `translate(${ax.h === "center" ? "-50%" : "0"}, ${ax.v === "center" ? "-50%" : "0"})`
    }
    return (
      <div ref={setRefs} style={{ ...containerStyle, height: canvasHeight || 420 }}>
        <PatternLayer type={pattern} spacing={patternSpacing} opacity={patternOpacity} />
        {/* keyed fade so loop restarts read as intentional, not a flicker */}
        <div key={runKey} className="ll-scene-fade" style={pos}>
          <ShotUnit entry={entry} crop={crop} scale={zoom} sceneProps={sceneProps} />
        </div>
      </div>
    )
  }

  // responsive: scale to width; when canvasHeight is set (>0) the container is
  // fixed-height and the shot is contained + centered, so rows of shots align
  const fixedH = canvasHeight > 0
  const availH = fixedH ? canvasHeight - padY * 2 : Infinity
  const scale = availW > 0 ? Math.min(availW / rect.w, availH / rect.h) : 1
  return (
    <div ref={setRefs} style={{
      ...containerStyle, padding: `${padY}px ${padX}px`,
      ...(fixedH ? { height: canvasHeight, display: "flex", alignItems: "center", justifyContent: "center" } : {}),
    }}>
      <PatternLayer type={pattern} spacing={patternSpacing} opacity={patternOpacity} />
      <div key={runKey} className="ll-scene-fade" style={{ position: "relative" }}>
        <ShotUnit entry={entry} crop={crop} scale={scale} sceneProps={sceneProps} />
      </div>
    </div>
  )
}

// ------------------------------------------------------------ multi-step -----
function MultiStep(props: typeof CANVAS_DEFAULTS & { steps?: Step[]; scrubberSlot?: HTMLElement | null }): JSX.Element {
  const { sequence, stepStyle, autoCycle, resumeDelay, scrubber, maxWidth, listStart, listEnd, cardStart, steps: customSteps, scrubberSlot, ...canvas } = props
  const seq = sequenceByKey(sequence)
  const steps = sequence === "custom" && customSteps?.length ? customSteps : seq.steps
  const style: StepStyle = stepStyle !== "auto" ? stepStyle : sequence === "custom" ? "captions" : seq.style
  const [index, setIndex] = React.useState(0)
  const [hovered, setHovered] = React.useState(-1)
  const [runKey, setRunKey] = React.useState(0)
  const [scrubOn, setScrubOn] = React.useState(false)
  const [scrubT, setScrubT] = React.useState(0)
  const [playStart, setPlayStart] = React.useState<number | null>(null)
  const scrubPlay = playStart != null
  const lastClick = React.useRef(0)
  const resumeTimer = React.useRef<ReturnType<typeof setTimeout>>()

  React.useEffect(() => {
    if (scrubT >= 25000 && scrubPlay) setPlayStart(null)
  }, [scrubT, scrubPlay])

  React.useEffect(() => () => clearTimeout(resumeTimer.current), [])

  // a shorter custom list can leave the index past the end
  const at = index % steps.length

  const advance = React.useCallback(() => {
    setIndex((i) => (i + 1) % steps.length)
    setRunKey((k) => k + 1)
  }, [steps.length])

  const onStepDone = React.useCallback(() => {
    if (scrubOn) return
    if (!autoCycle) return
    const idleMs = resumeDelay * 1000
    const sinceClick = Date.now() - lastClick.current
    clearTimeout(resumeTimer.current)
    if (sinceClick >= idleMs) advance()
    else resumeTimer.current = setTimeout(advance, idleMs - sinceClick)
  }, [scrubOn, autoCycle, resumeDelay, advance])

  const onStepClick = (i: number) => {
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

  // list style: the active row's hairline fills over the shot's length. The
  // first play uses the step's `ms` guess; after that, the measured length.
  const rootRef = React.useRef<HTMLDivElement>(null)
  const [inView, setInView] = React.useState(false)
  React.useEffect(() => {
    const el = rootRef.current
    if (!el || typeof IntersectionObserver === "undefined") { setInView(true); return }
    const io = new IntersectionObserver((e) => setInView(e[0].isIntersecting), { threshold: 0.25 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const measured = React.useRef<Record<string, number>>({})
  const started = React.useRef({ key: "", at: 0 })
  const [filled, setFilled] = React.useState(false)
  const stepKey = at + "-" + runKey
  React.useEffect(() => { setFilled(false) }, [stepKey])
  // scrolling out of view stops the shot and scrolling back replays it from
  // the top, so the clock and the fill restart with it
  const [viewRun, setViewRun] = React.useState(0)
  React.useEffect(() => {
    if (!inView) return
    started.current = { key: stepKey, at: Date.now() }
    setViewRun((n) => n + 1)
  }, [stepKey, inView])
  const onShotDone = React.useCallback(() => {
    const st = started.current
    if (st.key === stepKey && st.at) measured.current[steps[at].content] = Date.now() - st.at
    setFilled(true)
    onStepDone()
  }, [stepKey, steps, at, onStepDone])
  const stepMs = measured.current[steps[at].content] ?? steps[at].ms ?? 12000

  const listRef = React.useRef<HTMLDivElement>(null)
  const [listH, setListH] = React.useState(0)
  React.useLayoutEffect(() => {
    const el = listRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setListH(Math.round(el.offsetHeight)))
    ro.observe(el)
    setListH(Math.round(el.offsetHeight))
    return () => ro.disconnect()
  }, [style])

  const [width, setWidth] = React.useState(0)
  React.useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidth(el.clientWidth))
    ro.observe(el)
    setWidth(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  const btn: React.CSSProperties = { border: `1px solid ${T.brandFaint}`, borderRadius: 6, padding: "3px 10px", background: "transparent", cursor: "pointer", font: "inherit", fontSize: 12 }

  // the scrubber renders inline, or into the workbench toolbar in its skin
  const wb = !!scrubberSlot
  const b = (extra: React.CSSProperties = {}) =>
    wb ? { className: "wb-btn" + (extra.background ? " primary" : ""), style: extra.width ? { width: extra.width, justifyContent: "center", padding: 0 } : undefined }
      : { style: { ...btn, ...extra } }
  const scrubControls = (
    <>
      {!scrubOn ? (
        <button onClick={toggleScrub} {...b()}><I name="sliders-horizontal" size={wb ? 13 : 12} style={wb ? undefined : { marginRight: 5, verticalAlign: -2 }} />{wb ? " " : ""}Scrub</button>
      ) : (
        <>
          <button onClick={() => setPlayStart(scrubPlay ? null : scrubT)}
            {...b({ width: 40, textAlign: "center", background: T.ink, color: "#F9F4EB", borderColor: T.ink })}>
            <I name={scrubPlay ? "pause" : "play"} size={wb ? 12 : 11} style={wb ? undefined : { verticalAlign: -1 }} />
          </button>
          <input type="range" min={0} max={25000} step={100} value={scrubT}
            className={wb ? "wb-slider grow" : undefined}
            onChange={(e) => seek(+e.target.value)} style={{ flex: 1, maxWidth: wb ? 280 : 440 }} />
          <span className={wb ? "wb-time" : undefined} style={wb ? undefined : { fontVariantNumeric: "tabular-nums", width: 44 }}>{(scrubT / 1000).toFixed(1)}s</span>
          {[-1000, -100, 100, 1000].map((d) => (
            <button key={d} onClick={() => seek(Math.max(0, Math.min(25000, scrubT + d)))} {...b()}>
              {d > 0 ? `+${d / 1000}s` : `${d / 1000}s`}
            </button>
          ))}
          <button onClick={toggleScrub} {...b()}>Live</button>
        </>
      )}
    </>
  )
  const scrubBar = !scrubber ? null : wb ? createPortal(scrubControls, scrubberSlot!) : (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, fontSize: 12, color: T.inkSoft }}>
      {scrubControls}
    </div>
  )

  // each step is the single layout, remounted per step so it fades in fresh;
  // steps always play whole (no loop, no segment) and report back to advance
  const shot = (over: Partial<typeof CANVAS_DEFAULTS> = {}) => (
    <div className={scrubOn && !scrubPlay ? "ll-noanim" : undefined}>
      <Single key={stepKey} {...canvas} {...over}
        content={steps[at].content} loop={false} segStart={0} segEnd={0}
        onFinish={style === "list" ? onShotDone : onStepDone}
        debugHold={scrubOn && !scrubPlay ? scrubT : undefined}
        debugPlayFrom={scrubOn && scrubPlay ? playStart! : undefined}
        debugOnTime={scrubOn ? setScrubT : undefined}
      />
    </div>
  )

  if (style === "list") {
    // Figma "Homepage Refresh" 897:4407 (desktop) / 893:4358 (mobile): a
    // 12-column grid with 24px gutters (94px columns at 1392) — list on 2–5,
    // column 6 open, card on 7–12. Under ~820px the card moves above the
    // list. The inset scales with the card (48 of 684 wide; 16 of 370
    // stacked) so the crop reads the same at every size.
    const stacked = width > 0 && width < 820
    const GUTTER = 24
    const ls = Math.max(1, Math.min(11, Math.round(listStart)))
    const le = Math.max(ls, Math.min(11, Math.round(listEnd)))
    const cs = Math.max(le + 1, Math.min(12, Math.round(cardStart)))
    const colW = (width - 11 * GUTTER) / 12
    const cardW = stacked ? width : (13 - cs) * colW + (12 - cs) * GUTTER
    const inset = Math.max(12, Math.round(cardW * (stacked ? 16 / 370 : 48 / 684)))
    // side by side, the card matches the list's height at every width (it
    // follows the rows opening and closing); stacked, it keeps the mock's ratio
    const card = { fit: "bleed" as const, bleedShow: byKey(steps[at].content).bleedShow ?? canvas.bleedShow, bleedRatio: stacked ? 200 / 370 : 520 / 684, insetX: inset, insetY: inset, radius: 12, canvasHeight: stacked ? 0 : listH }
    const rowGap = 16
    const list = (
      <div ref={listRef} style={{ display: "flex", flexDirection: "column", gap: rowGap, width: "100%", gridColumn: stacked ? undefined : `${ls} / ${le + 1}` }}>
        {steps.map((st, i) => {
          const on = i === at
          const last = i === steps.length - 1
          return (
            <React.Fragment key={i}>
              <button onClick={() => onStepClick(i)} aria-pressed={on}
                style={{
                  display: "flex", gap: stacked ? 16 : 24, alignItems: "flex-start", textAlign: "left",
                  background: "none", border: "none", padding: 0, cursor: "pointer", font: "inherit",
                  color: T.brand, fontSize: 20, lineHeight: 1.4, letterSpacing: -0.4,
                }}>
                <span style={{ width: stacked ? 32 : 28, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block" }}>{st.title}</span>
                  <span className={"ll-open" + (on ? " on" : "")} aria-hidden={!on}>
                    <span>
                      <span style={{
                        display: "block", paddingTop: 8, color: T.brandFaint,
                        fontSize: 16, lineHeight: "22px", letterSpacing: -0.32,
                      }}>{st.body}</span>
                    </span>
                  </span>
                </span>
              </button>
              {/* the hairline under each row carries its progress; the last
                  row's has no track, so it only shows while filling */}
              <div style={{ height: 8, display: "flex", alignItems: "center", marginBottom: last ? -8 - rowGap : 0 }}>
                <div style={{ height: 1, width: "100%", background: last ? "transparent" : T.brandFaint, position: "relative", overflow: "hidden" }}>
                  {on && !(scrubOn && !scrubPlay) && (
                    <div key={stepKey + "/" + viewRun} className="ll-fill" style={{
                      position: "absolute", inset: 0, background: T.brand,
                      animationDuration: `${stepMs}ms`,
                      animationPlayState: inView ? "running" : "paused",
                      ...(filled ? { animation: "none" } : {}),
                    }} />
                  )}
                </div>
              </div>
            </React.Fragment>
          )
        })}
      </div>
    )
    return (
      <div ref={rootRef} className="ll" style={{ width: "100%", maxWidth, margin: "0 auto" }}>
        {scrubBar}
        {stacked ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {shot(card)}
            {list}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", columnGap: GUTTER, alignItems: "start" }}>
            {list}
            <div style={{ gridColumn: `${cs} / 13`, minWidth: 0 }}>{shot(card)}</div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div ref={rootRef} className="ll" style={{ width: "100%", maxWidth, margin: "0 auto" }}>
      {scrubBar}
      {shot()}
      <div style={{ display: "flex", gap: 32, marginTop: 28, alignItems: "flex-start" }}>
        {steps.map((s, i) => {
          const on = i === at || i === hovered
          return (
            <button key={i} onClick={() => onStepClick(i)}
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(-1)}
              style={{ flex: 1, textAlign: "left", display: "block", minWidth: 0, background: "none", border: "none", cursor: "pointer", font: "inherit", padding: 0 }}
              aria-pressed={i === at}>
              <span style={{ display: "block", fontSize: 20, lineHeight: 1.3, color: on ? T.brand : T.brandFaint, transition: "color .3s" }}>
                {s.title}
              </span>
              <span style={{ display: "block", fontSize: 15, lineHeight: 1.6, marginTop: 12, color: on ? T.brand : T.brandFaint, transition: "color .3s" }}>
                {s.body}
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
  const merged = mergePreset(props)
  // one set of shell preferences (sidebar collapse, dark mode) per canvas, so
  // a visitor's choice survives loop restarts and step changes (each remounts
  // the scene)
  const prefs = useShellPrefs({ collapsed: merged.startCollapsed, dark: merged.startTheme === "dark" })

  return (
    <ShellPrefs.Provider value={prefs}>
      {merged.layout === "multi-step" ? (
        <MultiStep {...merged} steps={props.steps} scrubberSlot={props.scrubberSlot} />
      ) : (
        <Single {...merged}
          debugHold={props.debugHold}
          debugPlayFrom={props.debugPlayFrom}
          debugOnTime={props.debugOnTime}
          debugCanvasRef={props.debugCanvasRef}
        />
      )}
    </ShellPrefs.Provider>
  )
}

const isSingle = (p: SceneCanvasProps) => (p.layout ?? "single") === "single"
const isMulti = (p: SceneCanvasProps) => p.layout === "multi-step"
/** the list style frames its own shot, so the framing controls step aside */
const isList = (p: SceneCanvasProps) => isMulti(p) && ((p.stepStyle ?? "auto") === "auto"
  ? p.sequence !== "custom" && sequenceByKey(p.sequence ?? "how-it-works").style === "list"
  : p.stepStyle === "list")
const stepContentKeys = REGISTRY.map((e) => e.key)
const stepContentTitles = REGISTRY.map(label)

addPropertyControls(SceneCanvas, {
  // 1 content
  layout: { type: ControlType.Enum, title: "Layout", options: ["single", "multi-step"], optionTitles: ["Single", "Multi-step"], defaultValue: "single", displaySegmentedControl: true },
  preset: { type: ControlType.Enum, title: "Preset", options: ["custom", ...presetNames()], defaultValue: "custom" },
  content: { type: ControlType.Enum, title: "Shot", options: [...REGISTRY.map((e) => e.key), "custom"], optionTitles: [...REGISTRY.map(label), "Custom crop…"], defaultValue: "design-study", hidden: isMulti },
  customScene: { type: ControlType.Enum, title: "Custom scene", options: REGISTRY.map((e) => e.key), optionTitles: REGISTRY.map(label), hidden: (p) => isMulti(p) || p.content !== "custom" },
  cropX: { type: ControlType.Number, title: "Crop X", defaultValue: 0, min: 0, max: APP_W, hidden: (p) => isMulti(p) || p.content !== "custom" },
  cropY: { type: ControlType.Number, title: "Crop Y", defaultValue: 0, min: 0, max: APP_H, hidden: (p) => isMulti(p) || p.content !== "custom" },
  cropW: { type: ControlType.Number, title: "Crop W (0=full)", defaultValue: 0, min: 0, max: APP_W, hidden: (p) => isMulti(p) || p.content !== "custom" },
  cropH: { type: ControlType.Number, title: "Crop H", defaultValue: 0, min: 0, max: APP_H, hidden: (p) => isMulti(p) || p.content !== "custom" },
  sequence: { type: ControlType.Enum, title: "Sequence", options: [...SEQUENCES.map((s) => s.key), "custom"], optionTitles: [...SEQUENCES.map((s) => s.title), "Custom steps…"], defaultValue: "how-it-works", hidden: isSingle },
  steps: {
    type: ControlType.Array, title: "Steps", maxCount: 8,
    control: {
      type: ControlType.Object,
      controls: {
        content: { type: ControlType.Enum, title: "Shot", options: stepContentKeys, optionTitles: stepContentTitles, defaultValue: "design-study" },
        title: { type: ControlType.String, title: "Title", defaultValue: "Step title" },
        body: { type: ControlType.String, title: "Body", defaultValue: "", displayTextArea: true },
      },
    },
    hidden: (p) => !isMulti(p) || p.sequence !== "custom",
  },
  stepStyle: { type: ControlType.Enum, title: "Style", options: ["auto", "captions", "list"], optionTitles: ["Auto", "Captions", "List"], defaultValue: "auto", displaySegmentedControl: true, hidden: isSingle },
  listStart: { type: ControlType.Number, title: "List from column", defaultValue: 2, min: 1, max: 11, step: 1, displayStepper: true, hidden: (p) => !isList(p) },
  listEnd: { type: ControlType.Number, title: "List to column", defaultValue: 5, min: 1, max: 11, step: 1, displayStepper: true, hidden: (p) => !isList(p) },
  cardStart: { type: ControlType.Number, title: "Card from column", defaultValue: 7, min: 2, max: 12, step: 1, displayStepper: true, hidden: (p) => !isList(p) },
  // 2 playback — single loops (optionally a time-slice); multi-step steps play whole, then advance
  loop: { type: ControlType.Boolean, title: "Loop", defaultValue: true, hidden: isMulti },
  loopPause: { type: ControlType.Number, title: "Loop pause (s)", defaultValue: 3, min: 0, max: 20, step: 0.5, hidden: isMulti },
  segStart: { type: ControlType.Number, title: "Segment start (ms)", defaultValue: 0, min: 0, max: 25000, step: 100, hidden: isMulti },
  segEnd: { type: ControlType.Number, title: "Segment end (ms)", defaultValue: 0, min: 0, max: 25000, step: 100, hidden: isMulti },
  autoCycle: { type: ControlType.Boolean, title: "Auto-advance", defaultValue: true, hidden: isSingle },
  resumeDelay: { type: ControlType.Number, title: "Pause after click (s)", defaultValue: 14, min: 4, max: 60, step: 1, hidden: isSingle },
  scrubber: { type: ControlType.Boolean, title: "Scrubber (dev)", defaultValue: false, hidden: isSingle },
  // 3 scene state — how app-shell scenes start (visitors can change it)
  startCollapsed: { type: ControlType.Boolean, title: "Sidebar", enabledTitle: "Collapsed", disabledTitle: "Open", defaultValue: false },
  startTheme: { type: ControlType.Enum, title: "Theme", options: ["light", "dark"], optionTitles: ["Light", "Dark"], defaultValue: "light", displaySegmentedControl: true },
  // 4 framing — shared by both layouts
  fit: { type: ControlType.Enum, title: "Framing", options: ["responsive", "pinned", "bleed"], optionTitles: ["Scale to fit", "Pin", "Bleed"], defaultValue: "responsive", displaySegmentedControl: true, hidden: isList },
  bleedShow: { type: ControlType.Number, title: "Show (px across)", defaultValue: 880, min: 300, max: 1400, step: 10, hidden: (p) => isList(p) || p.fit !== "bleed" },
  anchor: { type: ControlType.Enum, title: "Anchor", options: ANCHORS, optionTitles: ["Top left", "Top center", "Top right", "Left center", "Center", "Right center", "Bottom left", "Bottom center", "Bottom right"], defaultValue: "top-left", hidden: (p) => p.fit !== "pinned" },
  insetX: { type: ControlType.Number, title: "Inset X", defaultValue: 40, min: 0, max: 200, hidden: (p) => isList(p) || (p.fit !== "pinned" && p.fit !== "bleed") },
  insetY: { type: ControlType.Number, title: "Inset Y", defaultValue: 40, min: 0, max: 200, hidden: (p) => isList(p) || (p.fit !== "pinned" && p.fit !== "bleed") },
  zoom: { type: ControlType.Number, title: "Shot zoom", defaultValue: 0.5, min: 0.3, max: 2, step: 0.05, hidden: (p) => p.fit !== "pinned" },
  smallBehavior: { type: ControlType.Enum, title: "Small screens", options: ["fit", "mask"], optionTitles: ["Scale to fit", "Keep pinned"], defaultValue: "fit", hidden: (p) => p.fit !== "pinned" },
  fitBelow: { type: ControlType.Number, title: "Fall back below (px)", defaultValue: 480, min: 240, max: 900, hidden: (p) => p.fit !== "pinned" || p.smallBehavior !== "fit" },
  canvasHeight: { type: ControlType.Number, title: "Height (0 = auto)", defaultValue: 0, min: 0, max: 1200, hidden: isList },
  maxWidth: { type: ControlType.Number, title: "Max width", defaultValue: 1200, min: 640, max: 1600, step: 10, hidden: isSingle },
  // 5 canvas
  pattern: { type: ControlType.Enum, title: "Pattern", options: ["none", "dots", "grid", "circles", "crosshairs"], defaultValue: "none" },
  patternSpacing: { type: ControlType.Number, title: "Pattern spacing", defaultValue: 16, min: 8, max: 120, step: 4, hidden: (p) => p.pattern === "none" },
  patternOpacity: { type: ControlType.Number, title: "Pattern opacity", defaultValue: 1, min: 0.05, max: 1, step: 0.05, hidden: (p) => p.pattern === "none" },
  bgColor: { type: ControlType.Color, title: "Canvas fill", defaultValue: "#EEE8DD" },
  padX: { type: ControlType.Number, title: "Padding X", defaultValue: 56, min: 0, max: 160 },
  padY: { type: ControlType.Number, title: "Padding Y", defaultValue: 44, min: 0, max: 160 },
  radius: { type: ControlType.Number, title: "Radius", defaultValue: 0, min: 0, max: 16 },
})
