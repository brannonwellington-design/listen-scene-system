// ListenKit — shared tokens, primitives, and the scene-player engine for
// Listen Labs live product shots. Paste into Framer as a code file named
// "ListenKit.tsx"; scenes and section components import from "./ListenKit".
//
// Product tokens harvested from the live app (listenlabs.ai) via computed
// styles on 2026-08-28 — inside the frame we match the product exactly,
// including 500-weight headings; brand marketing rules apply outside it.
import * as React from "react"
import { I } from "./ListenIcons"

// ---------------------------------------------------------------- tokens ----
export const T = {
  // page (Paper / light — marketing wrap around the frame)
  pageBg: "#F9F4EB",        // surface-primary
  pageContainer: "#EEE8DD", // surface-secondary — houses the product frame
  // product surfaces (measured from the live app)
  appBg: "#FFFFFF",
  chromeBg: "#F5F5F5",      // off-white surround behind topbar/tabs; content sits in a white card
  appPanelAlt: "#FAFAFA",   // sidebars, active tab fill
  fill: "#F0F0F0",          // chat bubbles, inactive segmented controls
  appBorder: "#E6E6E6",
  ink: "#1A1A1A",
  inkSoft: "rgba(26, 26, 26, 0.55)",
  inkFaint: "rgba(26, 26, 26, 0.38)",
  body: "rgba(0, 0, 0, 0.88)",
  brand: "#0021CC",
  brandSoft: "#D9DDF2",
  brandFaint: "#B4BCE8",
  positive: "#0F8A38",
  positiveSoft: "#D6F5E0",
  dark: "#1A1A1A",          // Launch / Start Recording buttons
  darkSoft: "#333333",      // secondary dark buttons (Study Guide, Edit)
  shadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
  font: "'Inter', -apple-system, sans-serif",
}

// Design-space size every full scene is authored at. Cursor coordinates and
// layout inside scenes are in this space; ScaleBox maps it to the container.
export const FRAME_W = 1120
export const FRAME_H = 640

// ------------------------------------------------------------------- css ----
const CSS = `
.ll * { margin:0; padding:0; box-sizing:border-box; }
.ll { font-family:${T.font}; font-weight:400; color:${T.ink};
  -webkit-font-smoothing:antialiased;
  font-feature-settings:"calt" 0, "case", "rlig", "kern"; }
.ll button { font:inherit; color:inherit; background:none; border:none; cursor:pointer; }

.ll-frame { background:${T.chromeBg}; border:1px solid ${T.appBorder}; border-radius:12px;
  overflow:hidden; display:flex; flex-direction:column; width:100%; height:100%; position:relative; }
.ll-topbar { height:48px; flex-shrink:0; display:flex; align-items:center; gap:12px;
  padding:0 16px; font-size:14px; }
.ll-logo { width:16px; height:16px; flex-shrink:0; }
.ll-topbar .spacer { flex:1; }
.ll-topbar .meta { color:${T.inkSoft}; font-size:13px; }
.ll-tabs { display:flex; gap:4px; padding:0 12px 8px; font-size:14px; }
.ll-content-card { flex:1; display:flex; min-height:0; margin:0 8px 8px;
  background:${T.appBg}; border:1px solid ${T.appBorder}; border-radius:10px;
  overflow:hidden; box-shadow:${T.shadow}; }
.ll-tab { height:32px; padding:0 12px; border-radius:8px; color:${T.inkSoft};
  display:inline-flex; align-items:center; gap:6px; border:1px solid transparent;
  transition:color .15s ease, background-color .15s ease; }
.ll-tab:hover { color:${T.ink}; }
.ll-tab.active { color:${T.ink}; background:${T.appBg}; border-color:${T.appBorder}; box-shadow:${T.shadow}; }
.ll-body { flex:1; display:flex; min-height:0; position:relative; }

.ll-btn { height:32px; padding:0 14px; border-radius:8px; font-size:14px;
  display:inline-flex; align-items:center; gap:6px; flex-shrink:0;
  transition:background-color .15s ease, border-color .15s ease; }
.ll-btn.primary { background:${T.brand}; color:#FAFAFA; }
.ll-btn.dark { background:${T.dark}; color:#FAFAFA; }
.ll-btn.darksoft { background:${T.darkSoft}; color:#FAFAFA; }
.ll-btn.ghost { border:1px solid ${T.appBorder}; background:${T.appBg}; box-shadow:${T.shadow}; }

.ll-chip { display:inline-flex; align-items:center; gap:5px; height:22px; padding:0 9px;
  border-radius:11px; font-size:12px; border:1px solid ${T.appBorder}; color:${T.inkSoft};
  background:${T.appBg}; white-space:nowrap; }
.ll-chip.live { border-color:transparent; background:${T.positiveSoft}; color:${T.positive}; }
.ll-chip.brand { border-color:transparent; background:${T.brandSoft}; color:${T.brand}; }
.ll-chip.blue { border-color:transparent; background:${T.brand}; color:#FAFAFA; }
.ll-chip .dot { width:6px; height:6px; border-radius:50%; background:currentColor;
  animation:ll-pulse 2s ease-in-out infinite; }
@keyframes ll-pulse { 0%,100%{opacity:1} 50%{opacity:.25} }

.ll-card { background:${T.appBg}; border:1px solid ${T.appBorder}; border-radius:8px; }
.ll-h1 { font-size:36px; line-height:40px; font-weight:500; }
.ll-h2 { font-size:24px; line-height:32px; font-weight:500; }
.ll-500 { font-weight:500; }
.ll-stat { font-weight:500; text-decoration:underline; text-underline-offset:3px; text-decoration-color:${T.inkFaint}; }

.ll-avatar { width:22px; height:22px; border-radius:50%; display:inline-flex; align-items:center;
  justify-content:center; font-size:10px; flex-shrink:0; background:${T.brandSoft}; color:${T.brand}; }
.ll-avatar.ai { background:${T.dark}; color:#FAFAFA; }

.ll-caret { display:inline-block; width:1px; height:1em; background:${T.ink};
  vertical-align:-0.15em; animation:ll-blink 1s step-end infinite; }
@keyframes ll-blink { 50%{opacity:0} }

.ll-cursor { position:absolute; z-index:40; pointer-events:none; left:0; top:0;
  transition:transform .55s cubic-bezier(.3,.9,.35,1), opacity .3s; will-change:transform; }
.ll-cursor svg { display:block; filter:drop-shadow(0 1px 2px rgba(0,0,0,.35)); }
.ll-cursor .ring { position:absolute; left:-9px; top:-9px; width:22px; height:22px;
  border-radius:50%; border:2px solid ${T.brand}; opacity:0; transform:scale(.4); }
.ll-cursor.clicking .ring { animation:ll-click .45s ease-out; }
@keyframes ll-click { 0%{opacity:.7; transform:scale(.4)} 100%{opacity:0; transform:scale(1.5)} }

.ll-enter { animation:ll-in .45s cubic-bezier(.22,1,.36,1) both; }
@keyframes ll-in { from{opacity:0; transform:translateY(6px)} to{opacity:1; transform:none} }

/* -- motion vocabulary harvested from the live app -- */
.ll-ring { box-shadow:inset 0 0 0 2px rgba(0, 34, 204, 0.4); }            /* focus-visible ring */
.ll-dim-pulse { animation:ll-dim-pulse 2s cubic-bezier(.4,0,.6,1) infinite; }
@keyframes ll-dim-pulse { 0%,100%{opacity:.5} 50%{opacity:.3} }
.ll-highlight-fade { animation:ll-highlight-fade 3s ease-out 1; }         /* new-content flash */
@keyframes ll-highlight-fade { from{background-color:#FEF9C3} to{background-color:transparent} }
.ll-shimmer { background:linear-gradient(90deg, ${T.inkFaint} 42%, ${T.ink} 50%, ${T.inkFaint} 58%);
  background-size:200% 100%; -webkit-background-clip:text; background-clip:text; color:transparent;
  animation:ll-shimmer 1.5s linear infinite; }
@keyframes ll-shimmer { 0%{background-position-x:110%} 100%{background-position-x:-10%} }
.ll-dots { animation:ll-spin 1s steps(8) infinite; }
@keyframes ll-spin { to{transform:rotate(360deg)} }

.ll-scene-fade { animation:ll-scene .5s ease both; }
@keyframes ll-scene { from{opacity:0} to{opacity:1} }

.ll-wave { display:inline-flex; align-items:center; gap:2px; height:16px; }
.ll-wave span { width:2px; border-radius:1px; background:${T.ink}; animation:ll-wave 1s ease-in-out infinite; }
.ll-wave span:nth-child(2n) { animation-delay:.2s; }
.ll-wave span:nth-child(3n) { animation-delay:.35s; }
@keyframes ll-wave { 0%,100%{height:4px} 50%{height:14px} }

/* scrub mode renders static frames: no entrance animations or transitions,
   so per-tick replays can't strobe */
.ll-noanim *, .ll-noanim *::before, .ll-noanim *::after {
  animation: none !important;
  transition: none !important;
}

@media (prefers-reduced-motion:reduce) {
  .ll-chip .dot, .ll-caret, .ll-wave span { animation:none; }
  .ll-enter, .ll-scene-fade { animation-duration:.01s; }
  .ll-cursor { transition:none; }
}
`

export function ensureCss(): void {
  if (typeof document === "undefined") return
  if (document.getElementById("listen-kit-css")) return
  const el = document.createElement("style")
  el.id = "listen-kit-css"
  el.textContent = CSS
  document.head.appendChild(el)
}

// ---------------------------------------------------------- scene player ----
export type Player = {
  /** true when the user prefers reduced motion — scripts should jump to end states */
  instant: boolean
  /** true when running on the frozen virtual clock (scrubber) — skip DOM-measured choreography */
  frozen: boolean
  sleep: (ms: number) => Promise<void>
  /** stream text into a state setter, character by character */
  type: (set: (s: string) => void, text: string, cps?: number) => Promise<void>
}

const CANCELLED = Symbol("cancelled")

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

/**
 * Runs `script` whenever `active` flips true (or `runKey` changes while active),
 * cancelling cleanly when the scene deactivates or unmounts.
 * Scenes set their initial state at the top of the script, so replays reset.
 */
export function useScene(
  active: boolean,
  script: (p: Player) => Promise<void>,
  onDone?: () => void,
  runKey: number = 0,
  holdArg?: number,
  playFromArg?: number,
  onTime?: (t: number) => void,
): void {
  const doneRef = React.useRef(onDone)
  doneRef.current = onDone
  const scriptRef = React.useRef(script)
  scriptRef.current = script
  const timeRef = React.useRef(onTime)
  timeRef.current = onTime

  React.useEffect(() => {
    if (!active) return
    let cancelled = false
    const instant = prefersReducedMotion()
    // Freeze-frame debug mode: window.__llHold = <virtual ms> runs the script
    // on a virtual clock and freezes the scene at that exact beat. Used by the
    // visual-accuracy loop (?scene=X&hold=9500); immune to tab throttling.
    const hold: number | undefined = holdArg ?? (typeof window !== "undefined" ? (window as any).__llHold : undefined)
    // playback mode: fast-forward on the virtual clock to playFrom, then run
    // the remainder in real time, reporting elapsed virtual ms via onTime
    const playFrom: number | undefined = hold == null ? playFromArg : undefined
    let vt = 0
    const FREEZE = new Promise<void>(() => {})
    const guard = () => {
      if (cancelled) throw CANCELLED
    }
    const p: Player = {
      instant,
      frozen: hold != null,
      sleep: (ms) => {
        if (hold != null) {
          // superseded runs must stop writing state, or ticks flicker
          if (cancelled) return Promise.reject(CANCELLED)
          vt += ms
          return vt > hold ? FREEZE : Promise.resolve()
        }
        if (playFrom != null) {
          if (cancelled) return Promise.reject(CANCELLED)
          vt += ms
          if (vt <= playFrom) return Promise.resolve() // fast-forward segment
          const wait = Math.min(ms, vt - playFrom)     // partial wait at the boundary
          return new Promise((res, rej) => {
            const id = setTimeout(() => {
              if (cancelled) { rej(CANCELLED); return }
              timeRef.current?.(vt)
              res()
            }, instant ? Math.min(wait, 40) : wait)
            if (cancelled) { clearTimeout(id); rej(CANCELLED) }
          })
        }
        return new Promise((res, rej) => {
          const id = setTimeout(() => (cancelled ? rej(CANCELLED) : res()), instant ? Math.min(ms, 40) : ms)
          if (cancelled) { clearTimeout(id); rej(CANCELLED) }
        })
      },
      type: async (set, text, cps = 30) => {
        guard()
        if (hold != null) {
          for (let i = 1; i <= text.length; i++) {
            guard()
            vt += 1000 / cps
            if (vt > hold) { set(text.slice(0, i)); await FREEZE }
          }
          guard()
          set(text)
          return
        }
        if (instant) { set(text); return }
        for (let i = 1; i <= text.length; i++) {
          set(text.slice(0, i))
          await p.sleep(1000 / cps + Math.random() * 24)
        }
      },
    }
    ;(async () => {
      try {
        await scriptRef.current(p)
        if (!cancelled) doneRef.current?.()
      } catch (e) {
        if (e !== CANCELLED) throw e
      }
    })()
    return () => { cancelled = true }
  }, [active, runKey, holdArg, playFromArg])
}

// -------------------------------------------------------------- ScaleBox ----
/**
 * Renders children authored at a fixed design size, scaled to fill the
 * container width. This is what keeps scripted cursor coordinates exact
 * at every viewport width.
 */
export function ScaleBox(props: {
  designWidth: number
  designHeight: number
  children: React.ReactNode
  style?: React.CSSProperties
}): JSX.Element {
  const { designWidth, designHeight, children, style } = props
  const ref = React.useRef<HTMLDivElement>(null)
  const [scale, setScale] = React.useState(1)

  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setScale(el.clientWidth / designWidth))
    ro.observe(el)
    setScale(el.clientWidth / designWidth)
    return () => ro.disconnect()
  }, [designWidth])

  return (
    <div ref={ref} className="ll" style={{ width: "100%", height: designHeight * scale, ...style }}>
      <div
        style={{
          width: designWidth,
          height: designHeight,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- Cursor ----
export function Cursor(props: { x: number; y: number; visible: boolean; clickKey: number }): JSX.Element {
  const { x, y, visible, clickKey } = props
  const [clicking, setClicking] = React.useState(false)
  React.useEffect(() => {
    if (!clickKey) return
    setClicking(true)
    const id = setTimeout(() => setClicking(false), 480)
    return () => clearTimeout(id)
  }, [clickKey])
  return (
    <div
      className={"ll-cursor" + (clicking ? " clicking" : "")}
      style={{ transform: `translate(${x}px, ${y}px)`, opacity: visible ? 1 : 0 }}
    >
      <span className="ring" />
      <svg width="15" height="20" viewBox="0 0 15 20">
        <path d="M0.5 0.5 L14 10.5 L8 11.5 L11 18 L8.5 19 L5.5 12.5 L0.5 16 Z" fill="#1A1A1A" stroke="#FAFAFA" strokeWidth="1" />
      </svg>
    </div>
  )
}

/** Scene-side hook that pairs with <Cursor/>: move/click in design coords.
 *  Pass a stable id to click() so scrub-mode replays don't re-pulse the ring. */
export function useCursor() {
  const [c, setC] = React.useState({ x: FRAME_W / 2, y: FRAME_H + 40, visible: false, clickKey: 0 })
  return {
    state: c,
    show: (x: number, y: number) => setC((s) => ({ ...s, x, y, visible: true })),
    move: (x: number, y: number) => setC((s) => ({ ...s, x, y })),
    click: (id?: number) => setC((s) => ({ ...s, clickKey: id ?? s.clickKey + 1 })),
    hide: () => setC((s) => ({ ...s, visible: false })),
  }
}

// --------------------------------------------------------- pattern layer ----
export type PatternType = "none" | "dots" | "grid" | "circles" | "crosshairs"

/** Optional canvas texture drawn over the secondary fill, under the shot.
 *  Tokenized (surface-tertiary tones) and static, per the brand's stillness. */
export function PatternLayer(props: {
  type: PatternType
  spacing?: number
  opacity?: number
  color?: string
}): JSX.Element | null {
  const { type, spacing = 24, opacity = 0.5, color = "#E2DCCF" } = props
  if (type === "none") return null
  const common: React.CSSProperties = { position: "absolute", inset: 0, pointerEvents: "none", opacity }

  if (type === "circles") {
    // concentric rings from the container center, spaced by `spacing`
    return (
      <svg style={common} width="100%" height="100%">
        {Array.from({ length: 80 }, (_, i) => (
          <circle key={i} cx="50%" cy="50%" r={(i + 1) * spacing} fill="none" stroke={color} strokeWidth={1} />
        ))}
      </svg>
    )
  }

  const pid = `ll-pat-${type}-${spacing}`
  return (
    <svg style={common} width="100%" height="100%">
      <defs>
        <pattern id={pid} width={spacing} height={spacing} patternUnits="userSpaceOnUse">
          {type === "dots" && <circle cx={spacing / 2} cy={spacing / 2} r={1.2} fill={color} />}
          {type === "grid" && (
            <path d={`M ${spacing} 0 L 0 0 0 ${spacing}`} fill="none" stroke={color} strokeWidth={1} />
          )}
          {type === "crosshairs" && (
            <g stroke={color} strokeWidth={1}>
              <line x1={spacing / 2 - 4} y1={spacing / 2} x2={spacing / 2 + 4} y2={spacing / 2} />
              <line x1={spacing / 2} y1={spacing / 2 - 4} x2={spacing / 2} y2={spacing / 2 + 4} />
            </g>
          )}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${pid})`} />
    </svg>
  )
}

// ------------------------------------------------------------------ logo ----
export function Logo(): JSX.Element {
  // simplified Listen Labs asterisk glyph
  return (
    <svg className="ll-logo" viewBox="0 0 16 16">
      <g stroke={T.ink} strokeWidth="1.6" strokeLinecap="round">
        <path d="M8 2v12" /><path d="M2.8 5l10.4 6" /><path d="M13.2 5L2.8 11" />
      </g>
    </svg>
  )
}

// ---------------------------------------------------------- ProductFrame ----
export const ANALYSIS_TABS = ["Recruit", "Responses", "Report", "Details", "Chat", "Clips"]

/**
 * The product chrome full scenes render inside. Three variants, matching the
 * real app's surfaces:
 *  - "builder":  study editor (Edited · Invite · Preview · Launch)
 *  - "analysis": study analysis (tab row · Invite · Edit)
 *  - "bare":     no chrome (participant-facing interview)
 */
export function ProductFrame(props: {
  title?: string
  step?: string
  variant?: "builder" | "analysis" | "bare"
  activeTab?: string
  /** builder top-right: "saved" shows Just saved; "review" adds Invite + blue Review */
  builderRight?: "saved" | "review"
  children: React.ReactNode
  cursor?: { x: number; y: number; visible: boolean; clickKey: number }
}): JSX.Element {
  const { title, step, variant = "builder", activeTab, builderRight = "saved", children, cursor } = props
  return (
    <div className="ll-frame">
      {variant === "builder" && (
        <div className="ll-topbar" style={{ position: "relative" }}>
          <Logo />
          <span style={{ color: T.inkFaint }}>/</span>
          <span>{title}</span>
          <I name="chevrons-up-down" size={13} style={{ color: T.inkSoft }} />
          {/* centered Create › Review breadcrumb */}
          <span style={{ position: "absolute", left: 0, right: 0, textAlign: "center", pointerEvents: "none", fontSize: 14 }}>
            <span className="ll-500">Create</span>
            <span style={{ color: T.inkFaint }}>  ›  </span>
            <span style={{ color: T.inkFaint }}>Review</span>
          </span>
          <span className="spacer" />
          <span className="meta">Just saved</span>
          {builderRight === "review" && (
            <>
              <button className="ll-btn ghost" style={{ height: 30 }}>Invite <I name="user-round-plus" size={14} /></button>
              <button className="ll-btn primary" style={{ height: 30 }}>Review →</button>
            </>
          )}
        </div>
      )}
      {variant === "analysis" && (
        <>
          <div className="ll-topbar">
            <Logo />
            <span>{title}</span>
            <I name="chevrons-up-down" size={13} style={{ color: T.inkSoft }} />
            <span className="spacer" />
            <button className="ll-btn ghost" style={{ height: 30 }}>Invite <I name="user-round-plus" size={14} /></button>
            <button className="ll-btn darksoft" style={{ height: 30 }}>Edit <I name="square-pen" size={13} /></button>
          </div>
          <div className="ll-tabs">
            {ANALYSIS_TABS.map((t) => (
              <span key={t} className={"ll-tab" + (t === activeTab ? " active" : "")}>
                {t}
              </span>
            ))}
          </div>
        </>
      )}
      {/* Builder and analysis both put content in the inset stroked card
          (site-wide consistency); "bare" surfaces stay full-bleed. */}
      <div className="ll-body" style={variant === "bare" ? { background: T.appBg } : undefined}>
        {variant === "bare" ? children : <div className="ll-content-card">{children}</div>}
      </div>
      {cursor && <Cursor {...cursor} />}
    </div>
  )
}

// ------------------------------------------------------------ primitives ----
export function Chip(props: { kind?: "live" | "brand" | "blue"; children: React.ReactNode }): JSX.Element {
  return (
    <span className={"ll-chip" + (props.kind ? " " + props.kind : "")}>
      {props.kind === "live" && <span className="dot" />}
      {props.children}
    </span>
  )
}

export function Caret(): JSX.Element {
  return <span className="ll-caret" />
}

/** The product's circular dots loader (participant app + research agent). */
export function DotSpinner(props: { size?: number }): JSX.Element {
  const s = props.size ?? 28
  const dots = 7 // 8 positions, one left empty — matches the product's loader
  return (
    <span className="ll-dots" style={{ position: "relative", width: s, height: s, display: "inline-block", flexShrink: 0 }}>
      {Array.from({ length: dots }, (_, i) => {
        const a = (i / 8) * 2 * Math.PI
        return (
          <span key={i} style={{
            position: "absolute", width: s * 0.14, height: s * 0.14, borderRadius: "50%",
            background: T.ink, opacity: 0.3 + (i / dots) * 0.7,
            left: s / 2 + (Math.sin(a) * s * 0.38) - s * 0.07,
            top: s / 2 - (Math.cos(a) * s * 0.38) - s * 0.07,
          }} />
        )
      })}
    </span>
  )
}

// Emotional-intelligence tags — brand emotion tokens (reserved for the six
// Ekman emotions). Verify against the product's Responses view when we have
// access; colors come from the shared token set.
export const EMOTIONS: Record<string, { fg: string; bg: string }> = {
  anger: { fg: "#BF4040", bg: "rgba(191, 64, 64, 0.10)" },
  happiness: { fg: "#D99E26", bg: "rgba(217, 158, 38, 0.10)" },
  disgust: { fg: "#80BF40", bg: "rgba(128, 191, 64, 0.10)" },
  surprise: { fg: "#40BFAA", bg: "rgba(64, 191, 170, 0.10)" },
  sadness: { fg: "#406ABF", bg: "rgba(64, 106, 191, 0.10)" },
  fear: { fg: "#9540BF", bg: "rgba(149, 64, 191, 0.10)" },
}

export function EmotionTag(props: { emotion: keyof typeof EMOTIONS }): JSX.Element {
  const e = EMOTIONS[props.emotion]
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 22, padding: "0 9px", borderRadius: 11, fontSize: 12, color: e.fg, background: e.bg, whiteSpace: "nowrap" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: e.fg }} />
      {props.emotion[0].toUpperCase() + props.emotion.slice(1)}
    </span>
  )
}

export function Waveform(props: { bars?: number }): JSX.Element {
  return (
    <span className="ll-wave">
      {Array.from({ length: props.bars ?? 14 }, (_, i) => <span key={i} />)}
    </span>
  )
}

/** Donut/ring progress, as in the Top Answer report card. */
export function Donut(props: { pct: number; size?: number; stroke?: number; label: string }): JSX.Element {
  const { pct, size = 96, stroke = 10, label } = props
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E6E6E6" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={T.brand} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct / 100)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 1s cubic-bezier(.22,1,.36,1)" }}
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle"
        fontSize={size * 0.22} fontFamily={T.font} fill={T.ink}>{label}</text>
    </svg>
  )
}
