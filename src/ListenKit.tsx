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
// Product colors are CSS variables so an app shell can switch to dark mode
// (the sidebar's Dark Mode toggle). Light values are the defaults and the
// var() fallbacks; dark values apply under `.ll-app.dark`.
const LIGHT = {
  // product surfaces (measured from the live app)
  appBg: "#FFFFFF",
  chromeBg: "#F5F5F5",      // quiet fills (input backings, callouts); bare-frame surround
  appPanelAlt: "#FAFAFA",   // side panels inside a page (editor chat, suggestion cards)
  fill: "#F0F0F0",          // chat bubbles, inactive segmented controls, chart tracks
  hoverFill: "#E7E7E7",     // hovered fill
  track: "#D4D4D4",         // switch track, off
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
  darkSoft: "#333333",      // secondary dark buttons (Review, Edit)
  onDark: "#FAFAFA",        // text on dark / darkSoft buttons
  shadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
  // app shell (sidebar + top bar), from the Figma mock "Sidebar Navigation"
  // (Product Design 2026, 2026-09-29)
  navBg: "#F0F0F0",         // surface/secondary — sidebar
  navLine: "#E0E0E0",       // surface/tertiary — shell borders, avatar fill
  surface: "#FAFAFA",       // surface/primary — content + top bar
  inkSecondary: "#666666",  // content/secondary — inactive nav, page titles
  hover: "rgba(0, 0, 0, 0.05)",  // icon-button hover
  tbtnBg: "#F4F4F5",        // top bar buttons (Share), live app
  tbtnInk: "#18181B",
}
type Tok = keyof typeof LIGHT

// dark values from the live app's `.dark` theme (listenlabs.ai stylesheet,
// 2026-09-30): surface-primary/secondary/tertiary/quatenary/highlight,
// content-primary/tertiary, surface-brand-primary, inverse surfaces
const DARK: Record<Tok, string> = {
  appBg: "#292929",         // surface-highlight (cards)
  chromeBg: "#242424",
  appPanelAlt: "#121212",   // surface-primary
  fill: "#1F1F1F",          // surface-secondary
  hoverFill: "#2E2E2E",     // surface-tertiary
  track: "#3D3D3D",         // surface-quatenary
  appBorder: "#2E2E2E",     // surface-tertiary
  ink: "#F5F5F5",           // content-primary
  inkSoft: "rgba(245, 245, 245, 0.55)",
  inkFaint: "rgba(245, 245, 245, 0.38)",
  body: "rgba(255, 255, 255, 0.88)",
  brand: "#3D5DFF",         // surface-brand-primary
  brandSoft: "rgba(61, 93, 255, 0.2)",
  brandFaint: "rgba(61, 93, 255, 0.45)",
  positive: "#54D47E",      // content-positive
  positiveSoft: "rgba(84, 212, 126, 0.14)",
  dark: "#E6E6E6",          // surface-inverse-primary
  darkSoft: "#FAFAFA",      // primary (buttons invert)
  onDark: "#1A1A1A",        // content-inverse-primary
  shadow: "0 1px 2px rgba(0, 0, 0, 0.4)",
  navBg: "#1F1F1F",         // surface-secondary: sidebar sits a step above content
  navLine: "#3D3D3D",       // surface-quatenary
  surface: "#121212",       // surface-primary
  inkSecondary: "#B8B8B8",  // content-tertiary
  hover: "rgba(255, 255, 255, 0.07)",
  tbtnBg: "#27272A",        // secondary
  tbtnInk: "#FAFAFA",
}

const tokens = Object.fromEntries(
  (Object.keys(LIGHT) as Tok[]).map((k) => [k, `var(--ll-${k}, ${LIGHT[k]})`]),
) as Record<Tok, string>
const varBlock = (vals: Record<Tok, string>) =>
  (Object.keys(vals) as Tok[]).map((k) => `--ll-${k}:${vals[k]};`).join(" ")

export const T = {
  // page (Paper / light — marketing wrap around the frame; never themed)
  pageBg: "#F9F4EB",        // surface-primary
  pageContainer: "#EEE8DD", // surface-secondary — houses the product frame
  font: "'Inter', -apple-system, sans-serif",
  ...tokens,
}

// Design-space size every full scene is authored at. Cursor coordinates and
// layout inside scenes are in this space; ScaleBox maps it to the container.
export const FRAME_W = 1120
export const FRAME_H = 640
// Scenes inside the app shell are authored larger (same aspect ratio) so the
// open sidebar leaves the content about the width FRAME_W scenes had.
export const APP_W = 1344
export const APP_H = 768
// open sidebar width, matched to the live app (the Figma mock shows 260);
// rows inset 8px each side
const NAV_W = 235
const ROW_W = NAV_W - 16

// ------------------------------------------------------------------- css ----
const CSS = `
:root { ${varBlock(LIGHT)} }
.ll-app.dark { ${varBlock(DARK)} color-scheme:dark; }
/* theme switch: ease colors only while toggling, so scene motion is untouched */
.ll-app.theming, .ll-app.theming * { transition:background-color .35s ease, color .35s ease, border-color .35s ease, fill .35s ease !important; }
.ll * { margin:0; padding:0; box-sizing:border-box; }
.ll { font-family:${T.font}; font-weight:400; color:${T.ink};
  -webkit-font-smoothing:antialiased;
  font-feature-settings:"calt" 0, "case", "rlig", "kern"; }
.ll button { font:inherit; color:inherit; background:none; border:none; cursor:pointer; }

.ll-frame { background:${T.chromeBg}; border:1px solid ${T.appBorder}; border-radius:12px;
  overflow:hidden; display:flex; flex-direction:column; width:100%; height:100%; position:relative; }
.ll-logo { width:16px; height:16px; flex-shrink:0; }
.ll-body { flex:1; display:flex; min-height:0; position:relative; }
/* doc areas that continue below the frame fade out instead of chopping a heading */
.ll-doc-fade { overflow:hidden; -webkit-mask-image:linear-gradient(#000 calc(100% - 36px), transparent); mask-image:linear-gradient(#000 calc(100% - 36px), transparent); }

.ll-btn { height:32px; padding:0 14px; border-radius:8px; font-size:14px;
  display:inline-flex; align-items:center; gap:6px; flex-shrink:0;
  transition:background-color .15s ease, border-color .15s ease; }
.ll-btn.primary { background:${T.brand}; color:#FAFAFA; }
.ll-btn.dark { background:${T.dark}; color:${T.onDark}; }
.ll-btn.darksoft { background:${T.darkSoft}; color:${T.onDark}; }
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
/* bars that grow from zero to their width on mount */
.ll-grow { animation:ll-grow .9s cubic-bezier(.22,1,.36,1) both; transform-origin:left center; }
@keyframes ll-grow { from{transform:scaleX(0)} to{transform:none} }

/* -- app shell: sidebar + top bar (Figma mock, live-app content) -- */
.ll-app { display:flex; width:100%; height:100%; position:relative; overflow:hidden;
  background:${T.navBg}; border:1px solid ${T.navLine}; border-radius:12px;
  font-size:14px; line-height:20px; letter-spacing:-0.28px; }
.ll-side { width:${NAV_W}px; flex-shrink:0; display:flex; flex-direction:column; overflow:hidden;
  transition:width .36s cubic-bezier(.22,1,.36,1); }
.ll-app.collapsed .ll-side { width:48px; }
.ll-side-inner { width:${NAV_W}px; height:100%; display:flex; flex-direction:column; }
.ll-side-head { height:48px; flex-shrink:0; position:relative; border-bottom:1px solid ${T.navLine}; }
.ll-side-head .mark { position:absolute; left:16px; top:16px; width:117px; height:16px; overflow:hidden;
  transition:opacity .2s, width .36s cubic-bezier(.22,1,.36,1), left .36s cubic-bezier(.22,1,.36,1); }
.ll-app.collapsed .ll-side-head .mark { width:12px; left:18px; }
.ll-side-head .toggle { position:absolute; top:8px; right:8px; }
.ll-app.collapsed .ll-side-head .toggle { right:auto; left:8px; opacity:0; }
.ll-app.collapsed .ll-side-head:hover .toggle { opacity:1; }
.ll-app.collapsed .ll-side-head:hover .mark { opacity:0; }
.ll-iconbtn { width:32px; height:32px; flex-shrink:0; display:inline-flex; align-items:center;
  justify-content:center; border-radius:8px; color:${T.inkSecondary}; transition:background-color .15s, opacity .2s; }
.ll-iconbtn.sm { width:24px; height:24px; }
button.ll-iconbtn:hover { background:${T.hover}; }
.ll-nav { padding:8px 8px 0; display:flex; flex-direction:column; min-height:0; }
.ll-row { height:32px; width:${ROW_W}px; display:flex; align-items:center; gap:4px; border-radius:8px;
  color:${T.inkSecondary}; white-space:nowrap; flex-shrink:0; transition:color .15s, background-color .15s; }
.ll-row:hover { color:${T.ink}; }
.ll-row.on { color:${T.ink}; }
.ll-row.chat.on { background:${T.navLine}; }  /* live: the open chat is highlighted */
.ll-row .lbl { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; transition:opacity .2s; }
.ll-row .end { margin-left:auto; }
.ll-app.collapsed .ll-row .lbl, .ll-app.collapsed .ll-row .end,
.ll-app.collapsed .ll-group, .ll-app.collapsed .ll-sub { opacity:0; }
.ll-group { padding:8px; font-size:12px; line-height:16px; letter-spacing:-0.24px; color:${T.inkSecondary}; transition:opacity .2s; }
.ll-sub { margin-left:36px; width:${ROW_W - 36}px; height:38px; padding:4px 8px; border-radius:8px; flex-shrink:0; overflow:hidden;
  transition:opacity .2s, height .36s cubic-bezier(.22,1,.36,1), padding .36s cubic-bezier(.22,1,.36,1), background-color .15s; }
.ll-app.collapsed .ll-sub { height:0; padding-top:0; padding-bottom:0; }
.ll-sub .t { font-size:12px; line-height:16px; letter-spacing:-0.24px; color:${T.inkSecondary}; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.ll-sub .m { font-size:10px; line-height:14px; letter-spacing:0; color:${T.inkSecondary}; opacity:.8; }
.ll-sub.on { background:${T.navLine}; }
.ll-sub.on .t { color:${T.ink}; }
.ll-side-foot { margin-top:auto; padding:0 8px 8px; display:flex; flex-direction:column; }
.ll-app .ll-toggle { width:36px; height:20px; border-radius:16px; background:${T.navBg}; border:1px solid ${T.navLine};
  position:relative; flex-shrink:0; margin-left:auto; transition:opacity .2s; }
.ll-app .ll-toggle::after { content:""; position:absolute; left:-1px; top:-1px; width:20px; height:20px; border-radius:16px;
  background:#FFF; border:1px solid ${T.navLine}; box-sizing:border-box; transition:transform .3s cubic-bezier(.22,1,.36,1); }
.ll-app button.ll-toggle { cursor:pointer; padding:0; }
.ll-app .ll-toggle.on { background:${T.brand}; border-color:${T.brand}; }
.ll-app .ll-toggle.on::after { transform:translateX(16px); border-color:${T.brand}; }
.ll-app.collapsed .ll-toggle { opacity:0; pointer-events:none; }
.ll-account { border-top:1px solid ${T.navLine}; padding:8px; flex-shrink:0; }
.ll-account .row { width:${ROW_W}px; height:32px; padding:4px; display:flex; align-items:center; gap:8px; border-radius:8px; color:${T.ink}; }
.ll-account .av { width:24px; height:24px; border-radius:8px; background:${T.navLine}; display:inline-flex;
  align-items:center; justify-content:center; flex-shrink:0; }
.ll-main { flex:1; min-width:0; display:flex; flex-direction:column; background:${T.surface};
  border-left:1px solid ${T.navLine}; }
.ll-top { height:48px; flex-shrink:0; display:flex; align-items:center; gap:8px; padding:0 8px;
  border-bottom:1px solid ${T.navLine}; position:relative; }
.ll-top .ttl { height:32px; padding:0 6px; display:inline-flex; align-items:center; gap:4px;
  color:${T.inkSoft}; max-width:300px; white-space:nowrap; position:relative; z-index:1; }
.ll-top .ttl span { overflow:hidden; text-overflow:ellipsis; }
.ll-top .crumb { position:absolute; left:0; right:0; text-align:center; pointer-events:none; color:${T.inkSecondary}; }
.ll-top .crumb .cur { color:${T.ink}; }
.ll-top .acts { margin-left:auto; display:flex; align-items:center; gap:8px; position:relative; z-index:1; }
.ll-top .meta { color:${T.inkSoft}; }
.ll-tbtn { height:32px; padding:0 8px; border-radius:8px; display:inline-flex; align-items:center; gap:6px;
  background:${T.tbtnBg}; color:${T.tbtnInk}; flex-shrink:0; }
.ll-tbtn.dark { background:${T.darkSoft}; color:${T.onDark}; }
.ll-tbtn.plain { background:transparent; color:${T.body}; }
.ll-view { flex:1; min-height:0; display:flex; position:relative; overflow:hidden; }
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
  .ll-enter, .ll-scene-fade, .ll-grow { animation-duration:.01s; }
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
/** Cursor state: a point in design coords, or a `data-cursor` target to track.
 *  Targets are resolved from the DOM after each render and followed while the
 *  layout reflows (e.g. the sidebar collapsing), so scripted clicks land at any
 *  sidebar width and in freeze-frame mode. */
export type CursorState = {
  x: number; y: number; visible: boolean; clickKey: number
  target?: string; dx?: number; dy?: number
}

export function Cursor(props: CursorState): JSX.Element {
  const { visible, clickKey, target, dx = 0, dy = 0 } = props
  const ref = React.useRef<HTMLDivElement>(null)
  const [clicking, setClicking] = React.useState(false)
  const [at, setAt] = React.useState<{ x: number; y: number } | null>(null)
  React.useEffect(() => {
    if (!clickKey) return
    setClicking(true)
    const id = setTimeout(() => setClicking(false), 480)
    return () => clearTimeout(id)
  }, [clickKey])

  // resolve the target's center relative to the cursor's positioned parent,
  // in unscaled design px; keep following it while visible
  React.useLayoutEffect(() => {
    if (!target) { setAt(null); return }
    let raf = 0
    const resolve = () => {
      const el = ref.current
      const root = el?.offsetParent as HTMLElement | null
      const hit = root?.querySelector(`[data-cursor="${target}"]`) as HTMLElement | null
      if (root && hit) {
        const rb = root.getBoundingClientRect()
        const s = rb.width / root.offsetWidth || 1
        const r = hit.getBoundingClientRect()
        const x = (r.x + r.width / 2 - rb.x) / s + dx
        const y = (r.y + r.height / 2 - rb.y) / s + dy
        setAt((p) => (p && Math.abs(p.x - x) < 0.5 && Math.abs(p.y - y) < 0.5 ? p : { x, y }))
      }
      if (visible) raf = requestAnimationFrame(resolve)
    }
    resolve()
    return () => cancelAnimationFrame(raf)
  }, [target, dx, dy, visible])

  const x = target && at ? at.x : props.x
  const y = target && at ? at.y : props.y
  return (
    <div
      ref={ref}
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

type CursorTo = string | { x: number; y: number }

/** Scene-side hook that pairs with <Cursor/>. Aim at a `data-cursor` key
 *  (preferred — survives reflow) or a raw design-space point; dx/dy nudge off
 *  the target's center. Pass a stable id to click() so scrub-mode replays
 *  don't re-pulse the ring. */
export function useCursor(start: { x: number; y: number } = { x: FRAME_W / 2, y: FRAME_H + 40 }) {
  const [c, setC] = React.useState<CursorState>({ ...start, visible: false, clickKey: 0 })
  const aim = (to: CursorTo, dx = 0, dy = 0) =>
    typeof to === "string" ? { target: to, dx, dy } : { target: undefined, x: to.x + dx, y: to.y + dy, dx: 0, dy: 0 }
  return {
    state: c,
    show: (to: CursorTo | number, a?: number, b?: number) => setC((s) => ({
      ...s, visible: true, ...(typeof to === "number" ? aim({ x: to, y: a ?? 0 }) : aim(to, a, b)),
    })),
    move: (to: CursorTo | number, a?: number, b?: number) => setC((s) => ({
      ...s, ...(typeof to === "number" ? aim({ x: to, y: a ?? 0 }) : aim(to, a, b)),
    })),
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
  const { type, spacing = 16, opacity = 1, color = "#E2DCCF" } = props
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
  // the Listen Labs mark: the two glyph paths of the brand plugin's
  // assets/listen-labs-logo.svg (wordmark), cropped to the mark's own box
  return (
    <svg className="ll-logo" viewBox="0 0 16.3 22.6" style={{ fill: T.ink }}>
      <path d="M15.3743 0.408977H8.45517C7.9619 0.408977 7.56238 0.808502 7.56238 1.30177V8.22092C7.56238 8.71419 7.9619 9.11371 8.45517 9.11371H15.3743C15.8676 9.11371 16.2671 8.71419 16.2671 8.22092V1.30177C16.2671 0.808502 15.8676 0.408977 15.3743 0.408977Z" />
      <path d="M6.71435 9.11354H0.893341C0.383333 9.11354 -0.0284702 9.54096 0.00166153 10.051C0.308559 15.266 3.15769 19.8081 7.3248 22.453C7.75 22.7231 8.31468 22.5847 8.57025 22.1506L11.5232 17.1498C11.7642 16.7413 11.6437 16.2157 11.2486 15.9534C9.23873 14.6221 7.84597 12.4314 7.60268 9.90812C7.55916 9.45503 7.17079 9.11354 6.71547 9.11354H6.71435Z" />
    </svg>
  )
}

// ------------------------------------------------------------ BareFrame -----
/** Chrome-less product surface (participant-facing interview): the rounded
 *  frame and a white body, no app navigation. */
export function BareFrame(props: { children: React.ReactNode; cursor?: CursorState }): JSX.Element {
  return (
    <div className="ll-frame">
      <div className="ll-body" style={{ background: T.appBg }}>{props.children}</div>
      {props.cursor && <Cursor {...props.cursor} />}
    </div>
  )
}

// -------------------------------------------------------------- AppShell ----
// The product's current chrome: a collapsible sidebar plus a 48px top bar over
// the content area. Visuals follow the Figma mock ("Sidebar Navigation",
// Product Design 2026); what each surface shows (study nav, breadcrumbs, top
// bar actions) follows the live app (2026-09-29). Full scenes render their
// content as children, inside the content area under the top bar.

/** one line in the sidebar */
export type NavNode =
  | { type: "item"; icon: string; label: string; chevron?: boolean; open?: boolean; add?: boolean; cursor?: string; sub?: Array<{ title: string; meta: string }> }
  | { type: "back"; label: string }
  | { type: "new"; label: string }
  | { type: "group"; label: string }
  | { type: "chat"; label: string }

export type NavSpec = { key: string; nodes: NavNode[]; active?: string }

export const workspaceNav = (active = "Studies"): NavSpec => ({
  key: "workspace", active,
  nodes: [
    { type: "item", icon: "file-text", label: "Studies" },
    { type: "item", icon: "sparkles-nav", label: "Research Library", chevron: true },
    { type: "item", icon: "users", label: "Listen Twins", chevron: true },
    { type: "item", icon: "building-2", label: "Workspace" },
    { type: "item", icon: "chart-column-increasing", label: "Usage & Billing" },
    { type: "item", icon: "mail", label: "Emails" },
    { type: "item", icon: "shield-check", label: "Administrator" },
  ],
})

/** study editor (Create): Study Guide → Review */
export const studyEditNav = (active = "Study Guide"): NavSpec => ({
  key: "study-edit", active,
  nodes: [
    { type: "back", label: "Studies" },
    { type: "item", icon: "list-todo", label: "Study Guide" },
    { type: "item", icon: "circle-user-round", label: "Review" },
  ],
})

/** a launched study's analysis; `reports` expands the Report item */
export const studyNav = (active: string, reports?: Array<{ title: string; meta: string }>): NavSpec => ({
  key: "study", active,
  nodes: [
    { type: "back", label: "Studies" },
    { type: "item", icon: "list-todo", label: "Study Guide" },
    { type: "item", icon: "circle-user-round", label: "Recruit" },
    { type: "item", icon: "messages-square", label: "Responses" },
    { type: "item", icon: "clipboard-list", label: "Report", chevron: true, open: !!reports, add: true, sub: reports },
    { type: "item", icon: "file-chart-pie", label: "Details" },
    { type: "item", icon: "film", label: "Clips" },
    { type: "item", icon: "message-circle", label: "Chat" },
  ],
})

/** the study Chat drill-in: back to the study, new chat, artifacts, history */
export const chatNav = (study: string, history: Array<{ group: string; chats: string[] }>, active?: string): NavSpec => ({
  key: "chat", active,
  nodes: [
    { type: "back", label: study },
    { type: "new", label: "New Chat" },
    { type: "item", icon: "layers", label: "Artifacts" },
    ...history.flatMap((h): NavNode[] => [{ type: "group", label: h.group }, ...h.chats.map((c): NavNode => ({ type: "chat", label: c }))]),
  ],
})

/** Visitor-controlled shell preferences. SceneCanvas provides these so a
 *  collapse or theme switch survives loop restarts and multi-step changes;
 *  without a provider each shell keeps its own state. */
export type ShellPrefsValue = {
  collapsed: boolean; setCollapsed: (v: boolean) => void
  dark: boolean; setDark: (v: boolean) => void
}
export const ShellPrefs = React.createContext<ShellPrefsValue | null>(null)

/** state for a ShellPrefs provider; follows `start` whenever it changes (a
 *  preset or the workbench), while visitor clicks change it in between */
export function useShellPrefs(start: { collapsed?: boolean; dark?: boolean } = {}): ShellPrefsValue {
  const [collapsed, setCollapsed] = React.useState(!!start.collapsed)
  const [dark, setDark] = React.useState(!!start.dark)
  React.useEffect(() => setCollapsed(!!start.collapsed), [start.collapsed])
  React.useEffect(() => setDark(!!start.dark), [start.dark])
  return { collapsed, setCollapsed, dark, setDark }
}

const WORDMARK_D: string[] = ["M10.7424 0.288086H5.90755C5.56287 0.288086 5.28369 0.568061 5.28369 0.913731V5.76248C5.28369 6.10815 5.56287 6.38813 5.90755 6.38813H10.7424C11.0871 6.38813 11.3662 6.10815 11.3662 5.76248V0.913731C11.3662 0.568061 11.0871 0.288086 10.7424 0.288086Z","M4.69168 6.38672H0.624159C0.267784 6.38672 -0.0199686 6.68623 0.00108638 7.04367C0.215535 10.6982 2.2064 13.8812 5.11823 15.7347C5.41535 15.9239 5.80993 15.8269 5.98851 15.5227L8.05192 12.0183C8.22033 11.732 8.13611 11.3637 7.86004 11.1799C6.45561 10.247 5.4824 8.71179 5.31241 6.94354C5.28199 6.62602 5.01062 6.38672 4.69244 6.38672H4.69168Z","M18.2685 14.3778V0H20.3968V12.5479H26.7014V14.3778H18.2685Z","M28.3113 3.82069H30.3392V14.3778H28.3113V3.82069ZM28.271 2.29242V0H30.3793V2.29242H28.271Z","M32.0672 11.1604H34.0751C34.4165 12.2865 35.1594 12.9702 36.625 12.9702C37.8297 12.9702 38.6932 12.4273 38.6932 11.4822C38.6932 10.4968 37.6893 10.2354 36.2034 9.87344L35.4604 9.67236C33.7138 9.25007 32.4085 8.46583 32.4085 6.63592C32.4085 4.76579 34.0951 3.53916 36.4444 3.53916C38.7736 3.53916 40.2995 4.54461 40.5403 6.61582H38.6129C38.3117 5.67069 37.609 5.14788 36.3841 5.14788C35.0991 5.14788 34.4767 5.67069 34.4767 6.45494C34.4767 7.31962 35.0991 7.56092 36.3841 7.94301L37.5086 8.26474C39.6169 8.86801 40.7212 9.51148 40.7212 11.2811C40.7212 13.3121 38.9743 14.6191 36.565 14.6191C33.9948 14.6191 32.4889 13.5131 32.0672 11.1604Z","M45.0967 0.965224V3.82069H47.0644V5.38918H45.0967V11.7235C45.0967 12.749 45.5987 13.0305 46.3817 13.0305C46.5224 13.0305 46.7431 13.0104 46.8837 12.9903V14.4985C46.5824 14.5588 46.3617 14.5789 46.1007 14.5789C44.2334 14.5789 43.0488 13.9555 43.0488 11.8441V5.38918H41.4626V3.82069H43.0488V0.965224H45.0967Z","M58.1753 9.63214H49.9232C49.9835 11.4822 51.2282 12.9501 53.2361 12.9501C54.6817 12.9501 55.3844 12.2664 55.9267 11.3615H57.9546C57.3723 13.2718 55.6657 14.6393 53.1558 14.6393C49.9032 14.6393 47.8753 12.4474 47.8753 9.14952C47.8753 5.85167 50.0035 3.51905 53.1558 3.51905C56.5893 3.51905 58.1753 6.13321 58.1753 8.96854V9.63214ZM50.0035 8.02344H56.0671C55.8864 6.33429 54.8624 5.16798 53.1157 5.16798C51.4492 5.16798 50.2245 6.25386 50.0035 8.02344Z","M61.9279 3.82069V5.24841C62.4699 4.3435 63.5141 3.51905 65.281 3.51905C67.7104 3.51905 68.9753 5.14788 68.9753 7.88268V14.3778H66.9274V8.64681C66.9274 6.55549 66.2447 5.24841 64.5782 5.24841C62.8916 5.24841 61.9679 6.61582 61.9679 8.28485V14.3778H59.94V4.62504C59.94 4.36363 59.94 4.0821 59.92 3.82069H61.9279Z","M76.3423 14.3778V0H78.4705V12.5479H84.7753V14.3778H76.3423Z","M95.2195 14.3778H93.3122C93.2519 13.9555 93.2319 13.7142 93.2116 12.93C92.4086 14.0762 91.3444 14.5789 89.6578 14.5789C87.4492 14.5789 85.8429 13.493 85.8429 11.5224C85.8429 9.27017 88.0114 8.50605 90.8224 8.12397C91.525 8.02344 92.2882 7.94299 92.9909 7.88268C92.9909 5.75112 92.1074 5.14788 90.722 5.14788C89.1961 5.14788 88.4731 5.85167 88.3327 7.11854H86.3449C86.4454 4.86634 88.2524 3.53916 90.7621 3.53916C93.0109 3.53916 94.9585 4.28318 94.9585 8.4055V10.4566C94.9585 12.1659 95.0389 13.4126 95.2195 14.3778ZM93.031 9.35063C89.5977 9.67236 88.0315 10.0544 88.0315 11.5023C88.0315 12.4876 88.8347 13.111 90.1197 13.111C92.027 13.111 93.0109 11.9849 93.0109 9.91367V9.59193C93.0109 9.49138 93.011 9.41095 93.031 9.35063Z","M96.9484 14.3778V0H98.9964V4.12232C98.9964 4.44406 98.9964 4.78592 98.9764 5.16798C99.5987 4.3033 100.723 3.49895 102.41 3.49895C105.381 3.49895 107.329 5.87177 107.329 9.06909C107.329 12.3669 105.321 14.6191 102.43 14.6191C100.603 14.6191 99.4784 13.8349 98.8558 12.8898V14.3778H96.9484ZM102.008 5.2082C100.061 5.2082 98.876 6.837 98.876 9.08919C98.876 11.4218 100.02 12.9501 102.028 12.9501C104.016 12.9501 105.14 11.4419 105.14 9.08919C105.14 6.837 103.996 5.2082 102.008 5.2082Z","M108.346 11.1604H110.354C110.696 12.2865 111.438 12.9702 112.904 12.9702C114.109 12.9702 114.972 12.4273 114.972 11.4822C114.972 10.4968 113.968 10.2354 112.482 9.87344L111.739 9.67236C109.993 9.25007 108.688 8.46583 108.688 6.63592C108.688 4.76579 110.374 3.53916 112.723 3.53916C115.052 3.53916 116.578 4.54461 116.819 6.61582H114.892C114.591 5.67069 113.888 5.14788 112.663 5.14788C111.378 5.14788 110.756 5.67069 110.756 6.45494C110.756 7.31962 111.378 7.56092 112.663 7.94301L113.787 8.26474C115.896 8.86801 117 9.51148 117 11.2811C117 13.3121 115.253 14.6191 112.844 14.6191C110.274 14.6191 108.768 13.5131 108.346 11.1604Z"]
const ORG_MARK_D: string[] = ["M18 11.5C18 12.424 17.8302 13.2224 17.4906 13.8954C17.151 14.5684 16.6852 15.0875 16.0931 15.4525C15.5009 15.8175 14.8247 16 14.0642 16C13.3038 16 12.6275 15.8175 12.0354 15.4525C11.4433 15.0875 10.9774 14.5684 10.6378 13.8954C10.2982 13.2224 10.1284 12.424 10.1284 11.5C10.1284 10.576 10.2982 9.77757 10.6378 9.10456C10.9774 8.43156 11.4433 7.91255 12.0354 7.54753C12.6275 7.18251 13.3038 7 14.0642 7C14.8247 7 15.5009 7.18251 16.0931 7.54753C16.6852 7.91255 17.151 8.43156 17.4906 9.10456C17.8302 9.77757 18 10.576 18 11.5ZM16.9551 11.5C16.9551 10.7414 16.8259 10.1012 16.5676 9.57937C16.3122 9.05751 15.9653 8.66255 15.5271 8.39449C15.0917 8.12643 14.6041 7.9924 14.0642 7.9924C13.5243 7.9924 13.0353 8.12643 12.597 8.39449C12.1616 8.66255 11.8148 9.05751 11.5565 9.57937C11.301 10.1012 11.1733 10.7414 11.1733 11.5C11.1733 12.2586 11.301 12.8988 11.5565 13.4206C11.8148 13.9425 12.1616 14.3375 12.597 14.6055C13.0353 14.8736 13.5243 15.0076 14.0642 15.0076C14.6041 15.0076 15.0917 14.8736 15.5271 14.6055C15.9653 14.3375 16.3122 13.9425 16.5676 13.4206C16.8259 12.8988 16.9551 12.2586 16.9551 11.5Z","M15.9358 11.5C15.9358 12.424 15.766 13.2224 15.4264 13.8954C15.0868 14.5684 14.621 15.0875 14.0288 15.4525C13.4367 15.8175 12.7605 16 12 16C11.2395 16 10.5633 15.8175 9.97115 15.4525C9.37904 15.0875 8.91319 14.5684 8.5736 13.8954C8.23401 13.2224 8.06421 12.424 8.06421 11.5C8.06421 10.576 8.23401 9.77757 8.5736 9.10456C8.91319 8.43156 9.37904 7.91255 9.97115 7.54753C10.5633 7.18251 11.2395 7 12 7C12.7605 7 13.4367 7.18251 14.0288 7.54753C14.621 7.91255 15.0868 8.43156 15.4264 9.10456C15.766 9.77757 15.9358 10.576 15.9358 11.5ZM14.8909 11.5C14.8909 10.7414 14.7617 10.1012 14.5034 9.57937C14.248 9.05751 13.9011 8.66255 13.4629 8.39449C13.0275 8.12643 12.5399 7.9924 12 7.9924C11.4601 7.9924 10.9711 8.12643 10.5328 8.39449C10.0974 8.66255 9.75056 9.05751 9.49224 9.57937C9.23682 10.1012 9.10911 10.7414 9.10911 11.5C9.10911 12.2586 9.23682 12.8988 9.49224 13.4206C9.75056 13.9425 10.0974 14.3375 10.5328 14.6055C10.9711 14.8736 11.4601 15.0076 12 15.0076C12.5399 15.0076 13.0275 14.8736 13.4629 14.6055C13.9011 14.3375 14.248 13.9425 14.5034 13.4206C14.7617 12.8988 14.8909 12.2586 14.8909 11.5Z","M13.8716 11.5C13.8716 12.424 13.7018 13.2224 13.3622 13.8954C13.0226 14.5684 12.5567 15.0875 11.9646 15.4525C11.3725 15.8175 10.6962 16 9.93579 16C9.17533 16 8.49905 15.8175 7.90694 15.4525C7.31483 15.0875 6.84898 14.5684 6.50939 13.8954C6.1698 13.2224 6 12.424 6 11.5C6 10.576 6.1698 9.77757 6.50939 9.10456C6.84898 8.43156 7.31483 7.91255 7.90694 7.54753C8.49905 7.18251 9.17533 7 9.93579 7C10.6962 7 11.3725 7.18251 11.9646 7.54753C12.5567 7.91255 13.0226 8.43156 13.3622 9.10456C13.7018 9.77757 13.8716 10.576 13.8716 11.5ZM12.8267 11.5C12.8267 10.7414 12.6975 10.1012 12.4392 9.57937C12.1838 9.05751 11.8369 8.66255 11.3986 8.39449C10.9633 8.12643 10.4757 7.9924 9.93579 7.9924C9.39592 7.9924 8.90685 8.12643 8.46858 8.39449C8.0332 8.66255 7.68635 9.05751 7.42803 9.57937C7.17261 10.1012 7.0449 10.7414 7.0449 11.5C7.0449 12.2586 7.17261 12.8988 7.42803 13.4206C7.68635 13.9425 8.0332 14.3375 8.46858 14.6055C8.90685 14.8736 9.39592 15.0076 9.93579 15.0076C10.4757 15.0076 10.9633 14.8736 11.3986 14.6055C11.8369 14.3375 12.1838 13.9425 12.4392 13.4206C12.6975 12.8988 12.8267 12.2586 12.8267 11.5Z"]

/** the full wordmark; the collapsed rail crops it to the mark */
function Wordmark(): JSX.Element {
  return (
    <span className="mark">
      <svg width={117} height={16} viewBox="0 0 117 16" aria-label="Listen Labs" style={{ display: "block", fill: T.ink }}>
        {WORDMARK_D.map((d, i) => <path key={i} d={d} />)}
      </svg>
    </span>
  )
}

function OrgMark(): JSX.Element {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      {/* a customer's brand mark: its tile stays light in either theme */}
      <rect x={0.5} y={0.5} width={23} height={23} rx={7.5} fill="#FAFAFA" style={{ stroke: T.navLine }} />
      {ORG_MARK_D.map((d, i) => <path key={i} d={d} fill="#120F08" />)}
    </svg>
  )
}

const NAV_STROKE = 1.5 // the mock's 1px icon stroke at 16px

function NavRow(props: { node: NavNode; on: boolean; activeSub?: string }): JSX.Element {
  const { node, on } = props
  if (node.type === "group") return <div className="ll-group">{node.label}</div>
  if (node.type === "back") {
    return (
      <div className="ll-row">
        <span className="ll-iconbtn" style={{ color: "inherit" }}><I name="chevron-left" stroke={NAV_STROKE} /></span>
        <span className="lbl">{node.label}</span>
      </div>
    )
  }
  if (node.type === "new") {
    return (
      <div className="ll-row" style={{ color: T.ink, gap: 8, paddingLeft: 4 }}>
        <span style={{ width: 24, height: 24, borderRadius: 16, background: T.navLine, border: `2px solid ${T.navBg}`, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <I name="plus" size={14} stroke={NAV_STROKE} />
        </span>
        <span className="lbl">{node.label}</span>
      </div>
    )
  }
  if (node.type === "chat") {
    return (
      <div className={"ll-row chat" + (on ? " on" : "")} style={{ color: T.ink, paddingLeft: 4 }}>
        <span className="ll-iconbtn sm" style={{ color: T.inkSecondary }}><I name="message-circle" stroke={NAV_STROKE} /></span>
        <span className="lbl">{node.label}</span>
      </div>
    )
  }
  return (
    <>
      <div className={"ll-row" + (on ? " on" : "")} data-cursor={node.cursor ?? "nav-" + node.label}>
        <span className="ll-iconbtn" style={{ color: "inherit" }}><I name={node.icon} stroke={NAV_STROKE} /></span>
        <span className="lbl">{node.label}</span>
        {node.add && <span className="ll-iconbtn sm end" style={{ marginRight: 2 }}><I name="plus" stroke={NAV_STROKE} /></span>}
        {(node.chevron || node.sub) && (
          <span className="ll-iconbtn end" style={node.add ? { marginLeft: 0 } : undefined}>
            <I name={node.open ? "chevron-down" : "chevron-right"} stroke={NAV_STROKE} />
          </span>
        )}
      </div>
      {node.open && node.sub?.map((r) => (
        <div key={r.title} className={"ll-sub" + (r.title === props.activeSub ? " on" : "")}>
          <div className="t">{r.title}</div>
          <div className="m">{r.meta}</div>
        </div>
      ))}
    </>
  )
}

export function AppShell(props: {
  nav: NavSpec
  /** active Report sub-item (study nav) */
  activeSub?: string
  /** top bar, left: the study title + switcher chevron */
  title?: string
  /** top bar, center: breadcrumb parts; the last one is the current page */
  crumb?: string[]
  /** the current page is a switcher (chat picker): chevron after it */
  crumbMenu?: boolean
  /** top bar, right: meta text + buttons (use .ll-tbtn) */
  actions?: React.ReactNode
  children: React.ReactNode
  cursor?: CursorState
}): JSX.Element {
  const { nav, activeSub, title, crumb, crumbMenu, actions, children, cursor } = props
  const own = useShellPrefs()
  const { collapsed, setCollapsed, dark, setDark } = React.useContext(ShellPrefs) ?? own
  const toggle = (e: React.MouseEvent) => { e.stopPropagation(); setCollapsed(!collapsed) }
  // colors ease only during a theme switch
  const [theming, setTheming] = React.useState(false)
  const themeTimer = React.useRef<ReturnType<typeof setTimeout>>()
  React.useEffect(() => () => clearTimeout(themeTimer.current), [])
  const toggleDark = (e: React.MouseEvent) => {
    e.stopPropagation()
    setTheming(true)
    setDark(!dark)
    clearTimeout(themeTimer.current)
    themeTimer.current = setTimeout(() => setTheming(false), 400)
  }
  const isOn = (n: NavNode) => (n.type === "item" || n.type === "chat") && n.label === nav.active

  return (
    <div className={"ll ll-app" + (collapsed ? " collapsed" : "") + (dark ? " dark" : "") + (theming ? " theming" : "")}>
      <div className="ll-side">
        <div className="ll-side-inner">
          <div className="ll-side-head">
            <Wordmark />
            <button className="ll-iconbtn toggle" onClick={toggle} onMouseDown={(e) => e.stopPropagation()}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
              <I name={collapsed ? "panel-left" : "panel-left-close"} stroke={NAV_STROKE} />
            </button>
          </div>
          {/* keyed so a nav swap (workspace → study) crossfades */}
          <div key={nav.key} className="ll-nav ll-scene-fade">
            {nav.nodes.map((n, i) => <NavRow key={i} node={n} on={isOn(n)} activeSub={activeSub} />)}
          </div>
          <div className="ll-side-foot">
            <div className="ll-row">
              <span className="ll-iconbtn" style={{ color: "inherit" }}><I name="moon" stroke={NAV_STROKE} /></span>
              <span className="lbl" style={{ flex: "none" }}>Dark Mode</span>
              <button className={"ll-toggle" + (dark ? " on" : "")} onClick={toggleDark} onMouseDown={(e) => e.stopPropagation()}
                role="switch" aria-checked={dark} aria-label="Dark Mode" />
            </div>
            <div className="ll-row">
              <span className="ll-iconbtn" style={{ color: "inherit" }}><I name="megaphone" stroke={NAV_STROKE} /></span>
              <span className="lbl">Whats new</span>
              <span className="ll-iconbtn end"><I name="chevron-right" stroke={NAV_STROKE} /></span>
            </div>
            <div className="ll-row" style={{ gap: 8, paddingLeft: 4, color: T.ink }}>
              <OrgMark />
              <span className="lbl" style={{ fontSize: 12, lineHeight: "16px", letterSpacing: -0.24 }}>Omni Corporation</span>
              <span className="ll-iconbtn end"><I name="chevrons-up-down" stroke={NAV_STROKE} /></span>
            </div>
          </div>
          <div className="ll-account">
            <div className="row">
              <span className="av">B</span>
              <span className="lbl" style={{ flex: 1, transition: "opacity .2s", opacity: collapsed ? 0 : 1 }}>Brannon Wellington</span>
              <span className="ll-iconbtn sm" style={{ opacity: collapsed ? 0 : 1 }}><I name="ellipsis-vertical" stroke={NAV_STROKE} /></span>
            </div>
          </div>
        </div>
      </div>
      <div className="ll-main">
        <div className="ll-top">
          {title && (
            <span className="ttl"><span>{title}</span><I name="chevron-down" size={14} stroke={NAV_STROKE} style={{ flexShrink: 0 }} /></span>
          )}
          {crumb && crumb.length > 0 && (
            <div className="crumb">
              {crumb.length === 1
                ? crumb[0]
                : crumb.map((c, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && " / "}
                      <span className={i === crumb.length - 1 ? "cur" : undefined}>{c}</span>
                    </React.Fragment>
                  ))}
              {crumbMenu && <I name="chevron-down" size={14} stroke={NAV_STROKE} style={{ marginLeft: 4, verticalAlign: -2, color: T.ink }} />}
            </div>
          )}
          {actions && <div className="acts">{actions}</div>}
        </div>
        <div className="ll-view">{children}</div>
      </div>
      {cursor && <Cursor {...cursor} />}
    </div>
  )
}

// -------------------------------------------------------- device shells -----
// Real-device chrome for composed marketing shots: a Safari-like desktop
// window, an iPhone screen authored in real device points, and Safari's iOS
// toolbar for it. Plain set dressing — the scene supplies the content.

/** Safari-style desktop window. `progress` (0..1) fills the interview bar. */
export function BrowserWindow(props: { progress?: number; children: React.ReactNode; style?: React.CSSProperties }): JSX.Element {
  const icon = { color: "#9A9A9A" }
  return (
    <div style={{ background: "#FFF", border: `1px solid ${T.appBorder}`, borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column", ...props.style }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, height: 40, padding: "0 14px", flexShrink: 0 }}>
        {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
          <span key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c, marginRight: -4 }} />
        ))}
        <I name="panel-left" size={14} style={{ ...icon, marginLeft: 10 }} />
        <I name="chevron-down" size={11} style={icon} />
        <I name="chevron-left" size={14} style={{ ...icon, marginLeft: 6 }} />
        <I name="chevron-right" size={14} style={{ color: "#C9C9C9" }} />
        <span style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <span style={{ width: 220, height: 24, borderRadius: 7, background: "#F0F0F0", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <I name="monitor" size={12} style={icon} />
            <I name="rotate-cw" size={11} style={icon} />
          </span>
        </span>
        <I name="download" size={14} style={icon} />
        <I name="share" size={14} style={icon} />
        <I name="plus" size={14} style={icon} />
        <I name="copy" size={14} style={icon} />
      </div>
      {props.progress != null && (
        <div style={{ height: 3, background: "#EDEDED", flexShrink: 0 }}>
          <div style={{ width: `${props.progress * 100}%`, height: "100%", background: T.ink }} />
        </div>
      )}
      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>{props.children}</div>
    </div>
  )
}

/** An iPhone screen as a screen capture (no bezel), authored in real device
 *  points (393×852) and scaled as one piece, so the status bar, type, and
 *  controls keep true iOS proportions at any width. Children lay out in
 *  points below the 54pt status bar. */
export function IPhoneScreen(props: {
  width: number
  time?: string
  battery?: number
  /** rounded screen corners in points (55 on device; smaller reads as a crop) */
  radius?: number
  /** pinned above the home indicator, in points (e.g. a Safari toolbar) */
  footer?: React.ReactNode
  children: React.ReactNode
  style?: React.CSSProperties
}): JSX.Element {
  const { width, time = "9:41", battery = 81, radius = 55, footer, children, style } = props
  const s = width / 393
  return (
    <div style={{ width, height: 852 * s, position: "relative", ...style }}>
      <div style={{
        width: 393, height: 852, transform: `scale(${s})`, transformOrigin: "top left",
        background: "#FFF", borderRadius: radius, overflow: "hidden", boxShadow: `0 0 0 ${1 / s}px ${T.appBorder}`,
        display: "flex", flexDirection: "column", fontFamily: T.font, color: "#000",
      }}>
        {/* iOS status bar: time · island · signal, wifi, battery */}
        <div style={{ height: 54, flexShrink: 0, position: "relative", display: "flex", alignItems: "center", padding: "4px 32px 0 48px" }}>
          <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: -0.4 }}>{time}</span>
          <span style={{ position: "absolute", left: "50%", top: 11, transform: "translateX(-50%)", width: 126, height: 37, borderRadius: 19, background: "#000" }} />
          <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 7 }}>
            <span style={{ display: "inline-flex", alignItems: "flex-end", gap: 2 }}>
              {[4, 6.5, 9, 11.5].map((h) => <span key={h} style={{ width: 3, height: h, borderRadius: 1, background: "#000" }} />)}
            </span>
            <svg width="17" height="12" viewBox="0 0 14 10"><path d="M7 9.5a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8ZM2.1 5.2a7 7 0 0 1 9.8 0l-1.5 1.5a4.9 4.9 0 0 0-6.8 0Zm-2-2a9.8 9.8 0 0 1 13.8 0l-1.4 1.4a7.8 7.8 0 0 0-11 0Z" fill="#000" /></svg>
            <span style={{ position: "relative", width: 27, height: 13, borderRadius: 4, background: "#000", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#FFF", letterSpacing: -0.2 }}>{battery}</span>
              <span style={{ position: "absolute", right: -3, top: 4.5, width: 1.5, height: 4, borderRadius: 1, background: "#000", opacity: 0.4 }} />
            </span>
          </span>
        </div>
        <div style={{ flex: 1, position: "relative", minHeight: 0 }}>{children}</div>
        {footer}
        <div style={{ height: 34, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ width: 134, height: 5, borderRadius: 3, background: "#000" }} />
        </div>
      </div>
    </div>
  )
}

/** iOS Safari's compact bottom toolbar, in points, for IPhoneScreen's footer */
export function SafariBar(props: { host: string; more?: boolean }): JSX.Element {
  return (
    <div style={{ height: 70, borderTop: "1px solid #EEE", display: "flex", alignItems: "center", gap: 15, padding: "0 21px", flexShrink: 0 }}>
      <I name="chevron-left" size={24} style={{ color: "#B9B9B9" }} />
      <span style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, fontSize: 18 }}>
        <I name="video" size={21} style={{ color: "#22C55E" }} />
        <span style={{ fontWeight: 500 }}>{props.host}</span>
      </span>
      <I name="rotate-cw" size={20} style={{ color: T.inkSoft }} />
      {props.more && (
        <span style={{ width: 37, height: 37, borderRadius: 19, border: "1.5px solid #E3E3E3", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <I name="ellipsis" size={18} style={{ color: T.inkSoft }} />
        </span>
      )}
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
        strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct / 100)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ stroke: T.brand, transition: "stroke-dashoffset 1s cubic-bezier(.22,1,.36,1)" }}
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle"
        fontSize={size * 0.22} fontFamily={T.font} style={{ fill: T.ink }}>{label}</text>
    </svg>
  )
}
