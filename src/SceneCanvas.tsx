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
import { Anchor, ANCHORS, SHOT_DEFAULTS, ShotConfig, Single } from "./ListenShot"
import { REGISTRY, SEQUENCES, byKey, label, sequenceByKey, RegistryEntry, Step, StepStyle } from "./ListenRegistry"
import { SceneProps } from "./ListenScenes"
import { PRESETS, getPreset, presetNames } from "./ListenPresets"
import { I } from "./ListenIcons"

export { ANCHORS, anchorAxes } from "./ListenShot"
export type { Anchor, CropRect } from "./ListenShot"

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
  /** list / stage styles: how the shot sits in its card (bleed = the mock's
   *  crop) and the card's height (0 = auto: list height / panel ratio).
   *  Under ~820px both styles keep their stacked bleed card. */
  frameFit?: "responsive" | "pinned" | "bleed"
  frameHeight?: number
  /** captions style, under ~820px: how far the swipe rail of captions runs
   *  past the component's edges (match the page's side padding so it bleeds
   *  to the screen edge) */
  swipeBleed?: number
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
  /** multi-step: told the shot key on stage whenever the step changes (the
   *  workbench's Export step JSON exports it, via `stepShotAt`) */
  onStepChange?: (content: string) => void
}

/** control defaults — single source for destructuring and preset merging */
export const CANVAS_DEFAULTS = {
  ...SHOT_DEFAULTS,
  layout: "single" as "single" | "multi-step", sequence: "how-it-works",
  stepStyle: "auto" as "auto" | StepStyle,
  autoCycle: true, resumeDelay: 14, scrubber: false, maxWidth: 1200,
  listStart: 2, listEnd: 5, cardStart: 7,
  frameFit: "bleed" as "responsive" | "pinned" | "bleed", frameHeight: 0, swipeBleed: 16,
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


// ------------------------------------------------------------ multi-step -----
function MultiStep(props: typeof CANVAS_DEFAULTS & { steps?: Step[]; scrubberSlot?: HTMLElement | null; onStepChange?: (content: string) => void }): JSX.Element {
  const { sequence, stepStyle, autoCycle, resumeDelay, scrubber, maxWidth, listStart, listEnd, cardStart, frameFit, frameHeight, swipeBleed, steps: customSteps, scrubberSlot, onStepChange, ...canvas } = props
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
  const stepContent = steps[at].content
  React.useEffect(() => { onStepChange?.(stepContent) }, [stepContent, onStepChange])

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

  // list and stage styles: the active progress fills over the shot's length. The
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
  const shot = (over: Partial<typeof CANVAS_DEFAULTS> = {}, frame?: "card" | "bare") => (
    <div className={scrubOn && !scrubPlay ? "ll-noanim" : undefined} style={frame === "bare" ? { height: "100%" } : undefined}>
      <Single key={stepKey} {...canvas} {...over} frame={frame}
        content={steps[at].content} loop={false} segStart={0} segEnd={0}
        onFinish={style === "captions" ? onStepDone : onShotDone}
        debugHold={scrubOn && !scrubPlay ? scrubT : undefined}
        debugPlayFrom={scrubOn && scrubPlay ? playStart! : undefined}
        debugOnTime={scrubOn ? setScrubT : undefined}
      />
    </div>
  )

  const showPx = byKey(steps[at].content).bleedShow ?? canvas.bleedShow

  // captions style, narrow: the captions become a swipe rail that loops.
  // It renders three copies and lives in the middle one: advancing scrolls
  // to the nearest copy of the active caption (so 05 → 01 moves forward), a
  // swipe that settles on another caption jumps to it like a click, and any
  // settle in an outer copy hops back to its middle twin without a visible jump.
  const swiping = style === "captions" && width > 0 && width < 820
  const railRef = React.useRef<HTMLDivElement>(null)
  const autoScroll = React.useRef(0)
  const placed = React.useRef(false)
  /** the rendered caption a tap or swipe landed on, so the rail goes there */
  const railPick = React.useRef(-1)
  const settle = React.useRef<ReturnType<typeof setTimeout>>()
  React.useEffect(() => () => clearTimeout(settle.current), [])
  const railItems = () => Array.from(railRef.current?.children ?? []) as HTMLElement[]
  const leftOf = (el: HTMLElement) => el.offsetLeft - swipeBleed
  React.useLayoutEffect(() => {
    if (!swiping) { placed.current = false; return }
    const rail = railRef.current, items = railItems()
    if (!rail || !items.length) return
    const n = steps.length
    if (!placed.current) {
      placed.current = true
      rail.scrollLeft = leftOf(items[n + at])
      return
    }
    // a tap goes to the caption tapped; advancing goes to the next copy of the
    // active caption ahead of the rail (so 05 → 01 keeps moving forward)
    let target = items[n + at]
    const picked = items[railPick.current]
    railPick.current = -1
    if (picked && +(picked.dataset.step ?? -1) === at) target = picked
    else {
      let best = Infinity
      for (let c = 0; c < 3; c++) {
        const el = items[c * n + at], d = leftOf(el) - rail.scrollLeft
        if (d > -2 && d < best) { best = d; target = el }
      }
    }
    if (Math.abs(leftOf(target) - rail.scrollLeft) < 2) return
    autoScroll.current = Date.now()
    rail.scrollTo({ left: leftOf(target), behavior: "smooth" })
  }, [at, swiping, swipeBleed, steps.length])
  const onRailScroll = () => {
    clearTimeout(settle.current)
    settle.current = setTimeout(() => {
      const rail = railRef.current, items = railItems()
      if (!rail || !items.length) return
      const n = steps.length
      let r = 0, best = Infinity
      items.forEach((el, i) => {
        const d = Math.abs(leftOf(el) - rail.scrollLeft)
        if (d < best) { best = d; r = i }
      })
      const i = r % n
      // settled in an outer copy: hop to the middle twin (same pixels)
      if (r < n || r >= 2 * n) rail.scrollLeft = leftOf(items[n + i])
      if (Date.now() - autoScroll.current >= 900 && i !== at) { railPick.current = n + i; onStepClick(i) }
    }, 140)
  }

  if (style === "stage") {
    // one big panel (the How it works container): counter, title, and body on
    // columns 1–4, progress segments and arrows at their foot, and
    // the shot inset from the top and running off the right and bottom edges,
    // cropped like the Use Cases card. Under ~820px the caption sits above a
    // stacked card and the controls drop below it.
    const stacked = width > 0 && width < 820
    const GUTTER = 24
    // the panel's columns are the page's: 12 across its full width with
    // 24px gutters (8 once the page drops to its tablet grid, under 1024).
    // 24px of inner padding; the caption runs from it to the end of column 4
    // (3 of 8), and the shot starts on the next column.
    const P = stacked ? 0 : GUTTER
    const COLS = width + 2 * GUTTER > 1024 ? 12 : 8
    const CAP = COLS === 12 ? 4 : 3
    const colW = (width - (COLS - 1) * GUTTER) / COLS
    const capW = Math.round(CAP * colW + (CAP - 1) * GUTTER) - P
    const stackedCard = { fit: "bleed" as const, bleedShow: showPx, bleedRatio: 200 / 370, bleedInset: 16 / 370, radius: 12, canvasHeight: 0 }
    const H = frameHeight > 0 ? frameHeight : Math.round(width * 640 / 1392)
    const col5 = Math.round(CAP * (colW + GUTTER))
    // the shot's region in the panel, per mode: bleed hangs off the right and
    // bottom from column 5; fit sits inside the padding; pin fills from column 5
    // positions are measured from the panel's outer edge; its 1px border
    // would otherwise push everything 1px off the page's columns
    const B = 1
    const region: React.CSSProperties = frameFit === "responsive"
      ? { left: col5 - B, top: P - B, right: P - B, bottom: P - B }
      : frameFit === "pinned" ? { left: col5 - B, top: 0, right: 0, bottom: 0 }
      : { left: col5 - B, top: P - B, right: 0, bottom: 0 }
    const regionCard = frameFit === "responsive"
      ? { fit: "responsive" as const, padX: 0, padY: 0, canvasHeight: H - 2 * P, pattern: "none" as PatternType }
      : frameFit === "pinned" ? { fit: "pinned" as const, canvasHeight: H, pattern: "none" as PatternType }
      : { fit: "bleed" as const, bleedShow: showPx, insetX: 1, insetY: 1, canvasHeight: H - P, pattern: "none" as PatternType }
    const go = (d: number) => onStepClick((at + d + steps.length) % steps.length)
    const arrow = (d: number) => (
      <button onClick={() => go(d)} aria-label={d < 0 ? "Previous" : "Next"} style={{
        width: 36, height: 36, borderRadius: "50%", border: `1px solid ${T.brandFaint}`, background: "transparent",
        color: T.brand, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0,
      }}><I name={d < 0 ? "chevron-left" : "chevron-right"} size={16} /></button>
    )
    const caption = (
      <div key={at} className="ll-enter">
        <div style={{ fontSize: 14, color: T.brandFaint, fontVariantNumeric: "tabular-nums" }}>
          {String(at + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
        </div>
        <div style={{ fontSize: stacked ? 24 : 32, lineHeight: 1.2, letterSpacing: stacked ? -0.48 : -0.64, color: T.brand, marginTop: 12 }}>{steps[at].title}</div>
        <div style={{ fontSize: 16, lineHeight: "24px", letterSpacing: -0.32, color: T.brandFaint, marginTop: 12 }}>{steps[at].body}</div>
      </div>
    )
    // one segment per step: done ones full, the active one filling over the
    // shot's length; each jumps to its step
    const controls = (
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ flex: 1, display: "flex", gap: 6 }}>
          {steps.map((_, i) => (
            <button key={i} onClick={() => onStepClick(i)} aria-label={"Step " + (i + 1)} aria-pressed={i === at}
              style={{ flex: 1, height: 16, padding: 0, border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center" }}>
              <span style={{ display: "block", width: "100%", height: 2, borderRadius: 1, background: i < at ? T.brand : T.brandSoft, position: "relative", overflow: "hidden" }}>
                {i === at && !(scrubOn && !scrubPlay) && (
                  <span key={stepKey + "/" + viewRun} className="ll-fill" style={{
                    position: "absolute", inset: 0, background: T.brand,
                    animationDuration: `${stepMs}ms`,
                    animationPlayState: inView ? "running" : "paused",
                    ...(filled ? { animation: "none" } : {}),
                  }} />
                )}
              </span>
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>{arrow(-1)}{arrow(1)}</div>
      </div>
    )
    return (
      <div ref={rootRef} className="ll" style={{ width: "100%", maxWidth, margin: "0 auto" }}>
        {scrubBar}
        {stacked ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {caption}
            {shot(stackedCard)}
            {controls}
          </div>
        ) : (
          <div style={{ position: "relative", height: H, borderRadius: 12, overflow: "hidden", background: canvas.bgColor, border: `1px solid ${T.pageLine}` }}>
            <PatternLayer type={canvas.pattern} spacing={canvas.patternSpacing} opacity={canvas.patternOpacity} />
            <div style={{ position: "absolute", ...region }}>{shot(regionCard, "bare")}</div>
            <div style={{ position: "absolute", left: P - B, top: P - B, bottom: P - B, width: capW, display: "flex", flexDirection: "column", justifyContent: "space-between", pointerEvents: "none" }}>
              {caption}
              <div style={{ pointerEvents: "auto" }}>{controls}</div>
            </div>
          </div>
        )}
      </div>
    )
  }

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
    const insetFrac = stacked ? 16 / 370 : 48 / 684
    // side by side, the card matches the list's height at every width (it
    // follows the rows opening and closing); stacked, it keeps the mock's ratio
    const cardH = frameHeight > 0 ? frameHeight : listH
    const card = stacked
      ? { fit: "bleed" as const, bleedShow: showPx, bleedRatio: 200 / 370, bleedInset: insetFrac, radius: 12, canvasHeight: 0 }
      : frameFit === "responsive" ? { fit: "responsive" as const, radius: 12, canvasHeight: cardH }
      : frameFit === "pinned" ? { fit: "pinned" as const, radius: 12, canvasHeight: cardH }
      : { fit: "bleed" as const, bleedShow: showPx, bleedRatio: 520 / 684, bleedInset: insetFrac, radius: 12, canvasHeight: cardH }
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
            {shot(card, "card")}
            {list}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", columnGap: GUTTER, alignItems: "start" }}>
            {list}
            <div style={{ gridColumn: `${cs} / 13`, minWidth: 0 }}>{shot(card, "card")}</div>
          </div>
        )}
      </div>
    )
  }

  if (swiping) {
    // Figma "Homepage Refresh" 897:4431: a 252-of-370 card with the shot inset
    // 16 and shown at 493 of 1344 (~965 design px across), then 241px
    // captions 16 apart, the active one full and the rest at 40%
    const capW = Math.min(241, Math.round(width * 241 / 370))
    return (
      <div ref={rootRef} className="ll" style={{ width: "100%", maxWidth, margin: "0 auto" }}>
        {scrubBar}
        {shot({ fit: "bleed", bleedShow: 965, bleedRatio: 252 / 370, bleedInset: 16 / 370, radius: 12, canvasHeight: 0 }, "card")}
        <div ref={railRef} className="ll-swipe" onScroll={onRailScroll} style={{
          display: "flex", gap: 16, marginTop: 16, overflowX: "auto", scrollSnapType: "x mandatory",
          marginLeft: -swipeBleed, marginRight: -swipeBleed, padding: `0 ${swipeBleed}px`, scrollPaddingLeft: swipeBleed,
        }}>
          {[0, 1, 2].flatMap((copy) => steps.map((st, i) => (
            <button key={copy + "-" + i} data-step={i} onClick={() => { railPick.current = copy * steps.length + i; onStepClick(i) }} aria-pressed={i === at}
              aria-hidden={copy !== 1} tabIndex={copy === 1 ? 0 : -1}
              style={{
                flex: `0 0 ${capW}px`, scrollSnapAlign: "start", textAlign: "left", display: "flex", flexDirection: "column", gap: 4,
                background: "none", border: "none", padding: 0, cursor: "pointer", font: "inherit", color: T.brand,
                opacity: i === at ? 1 : 0.4, transition: "opacity .3s",
              }}>
              <span style={{ fontSize: 18, lineHeight: "24px", letterSpacing: -0.36, fontVariantNumeric: "tabular-nums" }}>{String(i + 1).padStart(2, "0")}</span>
              <span style={{ fontSize: 18, lineHeight: "24px", letterSpacing: -0.36 }}>{st.title}</span>
              <span style={{ fontSize: 14, lineHeight: "20px", letterSpacing: -0.28, opacity: 0.54 }}>{st.body}</span>
            </button>
          )))}
        </div>
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

// ---------------------------------------------------------- step export ----
/** the widths "Export step JSON" frames a step at, one per Framer breakpoint */
export const EXPORT_WIDTHS = { desktop: 1280, tablet: 768, mobile: 375 }

/**
 * A multi-step step as a standalone single shot at a given component width:
 * its shot plus the framing its style gives it there, the same math as the
 * style branches in MultiStep. Two things can't come from the width alone,
 * so they take the mock's values: the list card's auto height (it follows
 * the list's rows live; here 520/684) and the stage region's crop becomes
 * its own card at the region's ratio.
 */
export function stepShotAt(p: typeof CANVAS_DEFAULTS, content: string, width: number): Partial<ShotConfig> {
  const style: StepStyle = p.stepStyle !== "auto" ? p.stepStyle : p.sequence === "custom" ? "captions" : sequenceByKey(p.sequence).style
  const showPx = byKey(content).bleedShow ?? p.bleedShow
  const stacked = width < 820
  const GUTTER = 24
  const stackedCard = { fit: "bleed" as const, bleedShow: showPx, bleedRatio: 200 / 370, bleedInset: 16 / 370, radius: 12, canvasHeight: 0 }
  let frame: Partial<ShotConfig> = {}
  if (style === "captions") {
    // wide: the shot in the canvas as set; narrow: the swipe layout's card
    if (stacked) frame = { fit: "bleed", bleedShow: 965, bleedRatio: 252 / 370, bleedInset: 16 / 370, radius: 12, canvasHeight: 0 }
  } else if (style === "stage") {
    if (stacked) frame = stackedCard
    else {
      const P = GUTTER, B = 1
      const COLS = width + 2 * GUTTER > 1024 ? 12 : 8
      const CAP = COLS === 12 ? 4 : 3
      const colW = (width - (COLS - 1) * GUTTER) / COLS
      const col5 = Math.round(CAP * (colW + GUTTER))
      const H = p.frameHeight > 0 ? p.frameHeight : Math.round(width * 640 / 1392)
      const regionW = width - (col5 - B)
      frame = p.frameFit === "responsive" ? { fit: "responsive", padX: 0, padY: 0, canvasHeight: H - 2 * P, pattern: "none" }
        : p.frameFit === "pinned" ? { fit: "pinned", canvasHeight: H, pattern: "none" }
        : { fit: "bleed", bleedShow: showPx, insetX: 1, insetY: 1, pattern: "none", radius: 12,
            canvasHeight: p.frameHeight > 0 ? H - P : 0, bleedRatio: (H - P) / Math.max(1, regionW) }
    }
  } else {
    if (stacked) frame = stackedCard
    else {
      const ls = Math.max(1, Math.min(11, Math.round(p.listStart)))
      const le = Math.max(ls, Math.min(11, Math.round(p.listEnd)))
      const cs = Math.max(le + 1, Math.min(12, Math.round(p.cardStart)))
      const colW = (width - 11 * GUTTER) / 12
      const cardW = (13 - cs) * colW + (12 - cs) * GUTTER
      const cardH = p.frameHeight > 0 ? p.frameHeight : Math.round(cardW * 520 / 684)
      frame = p.frameFit === "responsive" ? { fit: "responsive", radius: 12, canvasHeight: cardH }
        : p.frameFit === "pinned" ? { fit: "pinned", radius: 12, canvasHeight: cardH }
        : { fit: "bleed", bleedShow: showPx, bleedRatio: 520 / 684, bleedInset: 48 / 684, radius: 12, canvasHeight: p.frameHeight }
    }
  }
  // steps play whole, so the export loops the whole session
  return { content, ...frame, loop: true, segStart: 0, segEnd: 0 }
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
        <MultiStep {...merged} steps={props.steps} scrubberSlot={props.scrubberSlot} onStepChange={props.onStepChange} />
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
/** the multi-step style in effect: forced, or the sequence's own */
const styleOf = (p: SceneCanvasProps): StepStyle | null => !isMulti(p) ? null
  : (p.stepStyle ?? "auto") !== "auto" ? p.stepStyle as StepStyle
  : p.sequence === "custom" ? "captions" : sequenceByKey(p.sequence ?? "how-it-works").style
const isList = (p: SceneCanvasProps) => styleOf(p) === "list"
/** list and stage frame their own shot, so the framing controls step aside */
const isFramed = (p: SceneCanvasProps) => styleOf(p) === "list" || styleOf(p) === "stage"
/** the fit mode the framing controls are editing */
const modeOf = (p: SceneCanvasProps) => isFramed(p) ? p.frameFit ?? "bleed" : p.fit ?? "responsive"
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
  stepStyle: { type: ControlType.Enum, title: "Style", options: ["auto", "captions", "list", "stage"], optionTitles: ["Auto", "Captions", "List", "Stage"], defaultValue: "auto", displaySegmentedControl: true, hidden: isSingle },
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
  fit: { type: ControlType.Enum, title: "Framing", options: ["responsive", "pinned", "bleed"], optionTitles: ["Scale to fit", "Pin", "Bleed"], defaultValue: "responsive", displaySegmentedControl: true, hidden: isFramed },
  frameFit: { type: ControlType.Enum, title: "Framing", options: ["responsive", "pinned", "bleed"], optionTitles: ["Scale to fit", "Pin", "Bleed"], defaultValue: "bleed", displaySegmentedControl: true, hidden: (p) => !isFramed(p) },
  bleedShow: { type: ControlType.Number, title: "Show (px across)", defaultValue: 880, min: 300, max: 1400, step: 10, hidden: (p) => modeOf(p) !== "bleed" },
  anchor: { type: ControlType.Enum, title: "Anchor", options: ANCHORS, optionTitles: ["Top left", "Top center", "Top right", "Left center", "Center", "Right center", "Bottom left", "Bottom center", "Bottom right"], defaultValue: "top-left", hidden: (p) => modeOf(p) !== "pinned" },
  // in list / stage, bleed insets follow the card's width, so only pin's show
  insetX: { type: ControlType.Number, title: "Inset X", defaultValue: 40, min: 0, max: 200, hidden: (p) => modeOf(p) !== "pinned" && (isFramed(p) || p.fit !== "bleed") },
  insetY: { type: ControlType.Number, title: "Inset Y", defaultValue: 40, min: 0, max: 200, hidden: (p) => modeOf(p) !== "pinned" && (isFramed(p) || p.fit !== "bleed") },
  zoom: { type: ControlType.Number, title: "Shot zoom", defaultValue: 0.5, min: 0.3, max: 2, step: 0.05, hidden: (p) => modeOf(p) !== "pinned" },
  smallBehavior: { type: ControlType.Enum, title: "Small screens", options: ["fit", "mask"], optionTitles: ["Scale to fit", "Keep pinned"], defaultValue: "fit", hidden: (p) => modeOf(p) !== "pinned" },
  fitBelow: { type: ControlType.Number, title: "Fall back below (px)", defaultValue: 480, min: 240, max: 900, hidden: (p) => modeOf(p) !== "pinned" || p.smallBehavior !== "fit" },
  canvasHeight: { type: ControlType.Number, title: "Height (0 = auto)", defaultValue: 0, min: 0, max: 1200, hidden: isFramed },
  swipeBleed: { type: ControlType.Number, title: "Swipe bleed (mobile)", defaultValue: 16, min: 0, max: 64, hidden: (p) => styleOf(p) !== "captions" },
  frameHeight: { type: ControlType.Number, title: "Height (0 = auto)", defaultValue: 0, min: 0, max: 1200, hidden: (p) => !isFramed(p) },
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
