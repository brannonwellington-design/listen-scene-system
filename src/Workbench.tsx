// Workbench — the composition studio (the landing page). Local-only; not
// pasted into Framer. Tune every SceneCanvas setting live, manipulate the
// shot directly (drag to pin, wheel to zoom, drag-resize the preview frame),
// scrub to the beat, then save as a named preset.
// UI: a shadcn-style inspector kit hand-rolled on the Listen Labs tokens.
import * as React from "react"
import SceneCanvas, { CANVAS_DEFAULTS, SceneCanvasProps } from "./SceneCanvas"
import { PRESETS, Preset } from "./ListenPresets"
import { byKey, REGISTRY } from "./ListenRegistry"
import { T, Logo, ScaleBox, PatternLayer, PatternType } from "./ListenKit"
import { I } from "./ListenIcons"

type Cfg = typeof CANVAS_DEFAULTS
const DRAFT_KEY = "llPresetDrafts"

const loadDrafts = (): Preset[] => {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "[]") } catch { return [] }
}

// -------------------------------------------------------------- drag engine --
/** window-scoped drag: survives leaving the handle, suppresses text selection */
function startDrag(
  e: React.MouseEvent,
  opts: { cursor: string; onMove: (dx: number, dy: number, ev: MouseEvent) => void; onEnd?: () => void },
): void {
  e.preventDefault()
  const sx = e.clientX, sy = e.clientY
  const prevSelect = document.body.style.userSelect
  const prevCursor = document.body.style.cursor
  document.body.style.userSelect = "none"
  document.body.style.cursor = opts.cursor
  const move = (ev: MouseEvent) => opts.onMove(ev.clientX - sx, ev.clientY - sy, ev)
  const up = () => {
    window.removeEventListener("mousemove", move)
    window.removeEventListener("mouseup", up)
    document.body.style.userSelect = prevSelect
    document.body.style.cursor = prevCursor
    opts.onEnd?.()
  }
  window.addEventListener("mousemove", move)
  window.addEventListener("mouseup", up)
}

// ------------------------------------------------------------------ styles --
const CHEVRON = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%236B6861' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`

const WB_CSS = `
  .wb * { box-sizing: border-box; }
  .wb { font-family: ${T.font}; font-weight: 400; color: ${T.ink}; }
  .wb-header { display: flex; align-items: center; gap: 12px; padding: 12px 20px;
    background: #FFF; border-bottom: 1px solid #E7E1D6; flex-wrap: wrap; }
  .wb-title { display: flex; gap: 10px; align-items: center; font-size: 14px; font-weight: 500; margin-right: 6px; }
  .wb-main { display: flex; align-items: stretch; }
  .wb-stage { flex: 1; min-width: 0; padding: 24px 32px 72px; }
  .wb-panel { width: 336px; flex-shrink: 0; background: #FFF; border-left: 1px solid #E7E1D6;
    padding: 8px 20px 28px; overflow-y: auto; height: calc(100vh - 57px); position: sticky; top: 0; }
  .wb-panel::-webkit-scrollbar { width: 8px; }
  .wb-panel::-webkit-scrollbar-thumb { background: #E7E1D6; border-radius: 4px; }
  .wb-toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; min-height: 38px; }
  .wb-tools { display: inline-flex; align-items: center; gap: 6px; background: #FFF;
    border: 1px solid #E7E1D6; border-radius: 12px; padding: 4px; }
  .wb-tools .wb-slider { margin: 0 6px; }
  .wb-tools .wb-time { margin-right: 4px; }
  .wb-section { font-size: 11px; font-weight: 500; color: ${T.inkFaint}; text-transform: uppercase; margin: 22px 0 8px; }
  .wb-field { display: grid; grid-template-columns: 104px 1fr; align-items: center; min-height: 34px; gap: 8px; }
  .wb-label { font-size: 12.5px; color: ${T.inkSoft}; }
  .wb-ctl { display: flex; align-items: center; gap: 6px; justify-content: flex-end; min-width: 0; }
  .wb-input, .wb-select { height: 28px; border: 1px solid #DDD6C8; border-radius: 8px; padding: 0 8px;
    font: 12.5px ${T.font}; background: #FCFBF8; color: ${T.ink}; }
  .wb-input { width: 58px; text-align: center; appearance: textfield; -moz-appearance: textfield; }
  .wb-input::-webkit-outer-spin-button, .wb-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  .wb-input.wide { width: 72px; }
  .wb-input.text { text-align: left; }
  .wb-select { appearance: none; -webkit-appearance: none; padding-right: 24px; max-width: 200px;
    background-image: ${CHEVRON}; background-repeat: no-repeat; background-position: right 8px center;
    text-overflow: ellipsis; }
  .wb-input:focus, .wb-select:focus { outline: none; border-color: ${T.brand};
    box-shadow: 0 0 0 2px rgba(0, 33, 204, 0.12); }
  .wb-btn { height: 28px; padding: 0 12px; border-radius: 8px; border: 1px solid #DDD6C8;
    background: #FFF; font: 12.5px ${T.font}; color: ${T.ink}; cursor: pointer;
    display: inline-flex; align-items: center; gap: 6px; white-space: nowrap;
    transition: background .12s ease, border-color .12s ease; }
  .wb-btn:hover { background: #F6F2E9; }
  .wb-btn.primary { background: ${T.ink}; color: #F9F4EB; border-color: ${T.ink}; }
  .wb-btn.primary:hover { background: #33302A; }
  .wb-btn.accent { background: ${T.brand}; color: #F9F4EB; border-color: ${T.brand}; }
  .wb-btn:focus-visible, .wb-seg button:focus-visible, .wb-switch:focus-visible,
  .wb-swatch:focus-visible, .wb-corner span:focus-visible { outline: none; box-shadow: 0 0 0 2px rgba(0, 33, 204, 0.35); }
  .wb-seg { display: inline-flex; background: #F0EBDF; border-radius: 8px; padding: 2px; gap: 2px; }
  .wb-seg button { height: 24px; padding: 0 10px; border-radius: 6px; border: none; background: transparent;
    font: 12px ${T.font}; color: ${T.inkSoft}; cursor: pointer; }
  .wb-seg button.on { background: #FFF; color: ${T.ink}; box-shadow: 0 1px 2px rgba(0,0,0,.07); }
  .wb-seg.block { display: flex; margin: 2px 0 6px; }
  .wb-seg.block button { flex: 1; height: 26px; }
  .wb-slider { -webkit-appearance: none; appearance: none; height: 4px; border-radius: 2px;
    background: #E2DCCF; width: 104px; cursor: pointer; }
  .wb-slider.grow { flex: 1; width: auto; min-width: 120px; }
  .wb-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%;
    background: ${T.brand}; border: 2px solid #FFF; box-shadow: 0 1px 3px rgba(0,0,0,.25); cursor: pointer; }
  .wb-slider::-moz-range-thumb { width: 12px; height: 12px; border-radius: 50%; background: ${T.brand};
    border: 2px solid #FFF; box-shadow: 0 1px 3px rgba(0,0,0,.25); cursor: pointer; }
  .wb-val { width: 34px; font-size: 12px; color: ${T.inkSoft}; text-align: right;
    font-variant-numeric: tabular-nums; flex-shrink: 0; }
  .wb-switch { width: 34px; height: 20px; border-radius: 10px; background: #DDD6C8; border: none;
    position: relative; cursor: pointer; transition: background .15s ease; flex-shrink: 0; }
  .wb-switch.on { background: ${T.brand}; }
  .wb-switch::after { content: ""; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px;
    border-radius: 50%; background: #FFF; box-shadow: 0 1px 2px rgba(0,0,0,.2); transition: left .15s ease; }
  .wb-switch.on::after { left: 16px; }
  .wb-corner { width: 46px; height: 38px; border: 1px solid #DDD6C8; border-radius: 8px;
    position: relative; background: #FCFBF8; flex-shrink: 0; }
  .wb-corner span { position: absolute; width: 10px; height: 10px; border-radius: 3px;
    border: 1.5px solid #C6BEAC; background: #FFF; cursor: pointer; transition: background .1s, border-color .1s; }
  .wb-corner span:hover { border-color: ${T.brand}; }
  .wb-corner span.on { background: ${T.brand}; border-color: ${T.brand}; }
  .wb-swatch { width: 38px; height: 28px; border: 1px solid #DDD6C8; border-radius: 7px;
    background: ${T.pageContainer}; position: relative; overflow: hidden; cursor: pointer; padding: 0;
    transition: border-color .1s ease; }
  .wb-swatch:hover { border-color: #B9B09B; }
  .wb-swatch.on { border-color: ${T.brand}; box-shadow: 0 0 0 2px rgba(0, 33, 204, 0.15); }
  .wb-time { font-variant-numeric: tabular-nums; font-size: 12px; color: ${T.inkSoft}; width: 42px; text-align: right; }
  .wb-hint { font-size: 11.5px; color: ${T.inkFaint}; line-height: 1.5; }
  .wb-grab-w { position: absolute; right: -18px; top: 50%; transform: translateY(-50%);
    width: 10px; height: 56px; border-radius: 5px; background: #D8D1C2; cursor: ew-resize; transition: background .12s; }
  .wb-grab-h { position: absolute; bottom: -18px; left: 50%; transform: translateX(-50%);
    height: 10px; width: 56px; border-radius: 5px; background: #D8D1C2; cursor: ns-resize; transition: background .12s; }
  .wb-grab-w:hover, .wb-grab-h:hover, .wb-grab-w.on, .wb-grab-h.on { background: ${T.brand}; }
  .wb-float { position: absolute; left: 12px; bottom: 12px; background: rgba(26,26,26,.82); color: #F9F4EB;
    font-size: 11px; padding: 5px 10px; border-radius: 7px; pointer-events: none; z-index: 5; }
  .wb-chip { position: absolute; top: -30px; right: 0; background: ${T.ink}; color: #F9F4EB; font-size: 11px;
    padding: 4px 8px; border-radius: 6px; font-variant-numeric: tabular-nums; z-index: 5; }
`

// -------------------------------------------------------------- UI pieces ---
const Section = (p: { title: string }) => <div className="wb-section">{p.title}</div>

const Field = (p: { label: string; children: React.ReactNode }) => (
  <div className="wb-field">
    <span className="wb-label">{p.label}</span>
    <span className="wb-ctl">{p.children}</span>
  </div>
)

const Num = (p: { v: number; set: (n: number) => void; min?: number; max?: number; step?: number; wide?: boolean }) => (
  <input type="number" className={"wb-input" + (p.wide ? " wide" : "")} value={p.v} min={p.min} max={p.max}
    step={p.step ?? 1} onChange={(e) => p.set(+e.target.value)} />
)

const Sel = (p: { v: string; set: (s: string) => void; options: string[]; titles?: string[]; width?: number }) => (
  <select className="wb-select" style={p.width ? { width: p.width, maxWidth: p.width } : undefined}
    value={p.v} onChange={(e) => p.set(e.target.value)}>
    {p.options.map((o, i) => <option key={o + i} value={o}>{p.titles?.[i] ?? o}</option>)}
  </select>
)

const Seg = (p: { v: string; set: (s: string) => void; options: Array<[string, string]> }) => (
  <span className="wb-seg">
    {p.options.map(([v, label]) => (
      <button key={v} className={p.v === v ? "on" : ""} onClick={() => p.set(v)}>{label}</button>
    ))}
  </span>
)

const Toggle = (p: { v: boolean; set: (b: boolean) => void }) => (
  <button className={"wb-switch" + (p.v ? " on" : "")} onClick={() => p.set(!p.v)} aria-pressed={p.v} />
)

const Slider = (p: { v: number; set: (n: number) => void; min: number; max: number; step: number; fmt?: (n: number) => string }) => (
  <>
    <input type="range" className="wb-slider" min={p.min} max={p.max} step={p.step} value={p.v}
      onChange={(e) => p.set(+e.target.value)} />
    <span className="wb-val">{p.fmt ? p.fmt(p.v) : p.v}</span>
  </>
)

const CornerPick = (p: { v: string; set: (s: string) => void }) => (
  <span className="wb-corner">
    {(["top-left", "top-right", "bottom-left", "bottom-right"] as const).map((c) => (
      <span key={c} tabIndex={0} className={p.v === c ? "on" : ""} onClick={() => p.set(c)} style={{
        top: c.includes("top") ? 5 : undefined, bottom: c.includes("bottom") ? 5 : undefined,
        left: c.includes("left") ? 5 : undefined, right: c.includes("right") ? 5 : undefined,
      }} />
    ))}
  </span>
)

const PATTERNS: Array<[PatternType, string]> = [["none", "None"], ["dots", "Dots"], ["grid", "Grid"], ["circles", "Circles"], ["crosshairs", "Cross"]]
const PatternPick = (p: { v: PatternType; set: (t: PatternType) => void }) => (
  <span style={{ display: "flex", gap: 6 }}>
    {PATTERNS.map(([type, label]) => (
      <button key={type} className={"wb-swatch" + (p.v === type ? " on" : "")} onClick={() => p.set(type)} title={label}>
        {type === "none"
          ? <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: T.inkFaint }}>—</span>
          : <PatternLayer type={type} spacing={type === "circles" ? 7 : 9} opacity={0.9} color="#B9B09B" />}
      </button>
    ))}
  </span>
)

function CopyBtn(p: { label: string; text: () => string }): JSX.Element {
  const [done, setDone] = React.useState(false)
  return (
    <button className="wb-btn" onClick={() => { navigator.clipboard?.writeText(p.text()); setDone(true); setTimeout(() => setDone(false), 1400) }}>
      {done ? "Copied ✓" : p.label}
    </button>
  )
}

// ------------------------------------------------------------ crop editor ----
type Rect = { x: number; y: number; w: number; h: number }

function CropEditor(props: { sceneKey: string; rect: Rect; holdT: number; onChange: (r: Rect) => void }): JSX.Element {
  const entry = byKey(props.sceneKey)
  const wrapRef = React.useRef<HTMLDivElement>(null)

  const clampRect = (r: Rect): Rect => ({
    x: Math.round(Math.max(0, Math.min(entry.w - 60, r.x))),
    y: Math.round(Math.max(0, Math.min(entry.h - 40, r.y))),
    w: Math.round(Math.max(60, Math.min(entry.w - Math.max(0, r.x), r.w))),
    h: Math.round(Math.max(40, Math.min(entry.h - Math.max(0, r.y), r.h))),
  })

  const start = (mode: string) => (e: React.MouseEvent) => {
    e.stopPropagation()
    const b = wrapRef.current!.getBoundingClientRect()
    const s = b.width / entry.w
    const r0 = { ...props.rect }
    const cursor = mode === "move" ? "move" : `${mode}-resize`
    startDrag(e, {
      cursor,
      onMove: (dxPx, dyPx) => {
        const dx = dxPx / s, dy = dyPx / s
        let r = { ...r0 }
        if (mode === "move") { r.x = r0.x + dx; r.y = r0.y + dy }
        else {
          if (mode.includes("w")) { r.x = r0.x + dx; r.w = r0.w - dx }
          if (mode.includes("e")) { r.w = r0.w + dx }
          if (mode.includes("n")) { r.y = r0.y + dy; r.h = r0.h - dy }
          if (mode.includes("s")) { r.h = r0.h + dy }
        }
        props.onChange(clampRect(r))
      },
    })
  }

  const b = wrapRef.current?.getBoundingClientRect()
  const s = b ? b.width / entry.w : 1
  const r = props.rect
  const Scene = entry.Scene
  return (
    <div ref={wrapRef} className="ll-noanim"
      style={{ position: "relative", userSelect: "none", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.08)" }}>
      <ScaleBox designWidth={entry.w} designHeight={entry.h}>
        <Scene active runKey={0} hold={props.holdT} />
      </ScaleBox>
      <div style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{
          position: "absolute", left: r.x * s, top: r.y * s, width: r.w * s, height: r.h * s,
          border: "1.5px solid #0021CC", boxShadow: "0 0 0 9999px rgba(18, 15, 8, 0.4)",
        }} />
      </div>
      <div style={{ position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none" }}>
        <div style={{ position: "absolute", left: r.x * s, top: r.y * s, width: r.w * s, height: r.h * s, pointerEvents: "auto", cursor: "move" }} onMouseDown={start("move")} />
        {[
          ["nw", 0, 0], ["n", 0.5, 0], ["ne", 1, 0], ["e", 1, 0.5],
          ["se", 1, 1], ["s", 0.5, 1], ["sw", 0, 1], ["w", 0, 0.5],
        ].map(([m, fx, fy]) => {
          const cur = { nw: "nwse", n: "ns", ne: "nesw", e: "ew", se: "nwse", s: "ns", sw: "nesw", w: "ew" }[m as string]
          return (
            <div key={m as string} onMouseDown={start(m as string)} style={{
              position: "absolute",
              left: (r.x + r.w * (fx as number)) * s - 5, top: (r.y + r.h * (fy as number)) * s - 5,
              width: 10, height: 10, background: "#FFF", border: "1.5px solid #0021CC", borderRadius: 3,
              cursor: `${cur}-resize`, pointerEvents: "auto",
            }} />
          )
        })}
      </div>
      <div className="wb-float">frame the crop · drag to move, handles to resize · {r.w} × {r.h}</div>
    </div>
  )
}

// -------------------------------------------------------------- workbench ---
// content is one unified list — full scenes + fragments straight from the
// registry — plus "Custom crop…" for framing a rect out of any scene
const CONTENT_OPTS: Array<[string, string]> = REGISTRY.map((e) => [e.key, e.title])

// hero display only applies to the five How-It-Works stage scenes
const isSceneContent = (content: string) => content !== "custom" && !!byKey(content).stage

/** unified content select */
function ContentSel(p: { v: string; set: (s: string) => void }): JSX.Element {
  return (
    <select className="wb-select" value={p.v} onChange={(e) => p.set(e.target.value)}>
      {CONTENT_OPTS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      <option value="custom">Custom crop…</option>
    </select>
  )
}

const HERO_KEYS: Array<keyof Cfg> = ["autoCycle", "resumeDelay", "pattern", "patternSpacing", "patternOpacity", "bgColor", "padX", "padY", "radius"]
const CALLOUT_EXCLUDE: Array<keyof Cfg> = ["autoCycle", "resumeDelay", "scrubber", "maxWidth"]

export default function Workbench(): JSX.Element {
  const [display, setDisplay] = React.useState<"hero" | "callout">("hero")
  const [cfg, setCfg] = React.useState<Cfg>({ ...CANVAS_DEFAULTS })
  const [presetSel, setPresetSel] = React.useState("")
  const [drafts, setDrafts] = React.useState<Preset[]>(loadDrafts)
  const [saveName, setSaveName] = React.useState("")
  const [previewW, setPreviewW] = React.useState<number | "full">("full")
  const [cropEdit, setCropEdit] = React.useState(false)
  const [dragging, setDragging] = React.useState<"" | "w" | "h" | "pin">("")
  // transport
  const [scrubOn, setScrubOn] = React.useState(false)
  const [t, setT] = React.useState(0)
  const [playStart, setPlayStart] = React.useState<number | null>(null)
  const playing = playStart != null
  const [runNonce, setRunNonce] = React.useState(0)
  const canvasRef = React.useRef<HTMLDivElement>(null)
  const previewRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => { if (t >= 25000 && playing) setPlayStart(null) }, [t, playing])

  const set = <K extends keyof Cfg>(k: K) => (v: Cfg[K]) => { setCfg((c) => ({ ...c, [k]: v })); setPresetSel("") }

  const entry = cfg.content === "custom" ? byKey(cfg.customScene) : byKey(cfg.content)
  const rect: Rect = cfg.content === "custom" && cfg.cropW > 0
    ? { x: cfg.cropX, y: cfg.cropY, w: cfg.cropW, h: cfg.cropH }
    : { x: 0, y: 0, w: entry.w, h: entry.h }

  // --- pin drag + wheel zoom over the live canvas ---------------------------
  const onPinDown = (e: React.MouseEvent) => {
    if (cfg.fit !== "pinned" || !canvasRef.current || cropEdit) return
    const cb = canvasRef.current.getBoundingClientRect()
    const shotW = rect.w * cfg.zoom, shotH = rect.h * cfg.zoom
    const left0 = cfg.anchor.includes("left") ? cfg.insetX : cb.width - cfg.insetX - shotW
    const top0 = cfg.anchor.includes("top") ? cfg.insetY : cb.height - cfg.insetY - shotH
    setDragging("pin")
    startDrag(e, {
      cursor: "grabbing",
      onMove: (dx, dy, ev) => {
        const left = left0 + dx, top = top0 + dy
        // anchor follows the pointer: drag toward a corner to pin there
        const px = ev.clientX - cb.left, py = ev.clientY - cb.top
        const anchor = `${py < cb.height / 2 ? "top" : "bottom"}-${px < cb.width / 2 ? "left" : "right"}` as Cfg["anchor"]
        const insetX = Math.round(Math.max(0, anchor.includes("left") ? left : cb.width - left - shotW))
        const insetY = Math.round(Math.max(0, anchor.includes("top") ? top : cb.height - top - shotH))
        setCfg((c) => ({ ...c, anchor, insetX, insetY }))
        setPresetSel("")
      },
      onEnd: () => setDragging(""),
    })
  }
  React.useEffect(() => {
    const el = previewRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (cfg.fit !== "pinned" || cropEdit) return
      e.preventDefault()
      setCfg((c) => ({ ...c, zoom: Math.round(Math.max(0.4, Math.min(2, c.zoom * (1 - e.deltaY * 0.0012))) * 100) / 100 }))
      setPresetSel("")
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [cfg.fit, cropEdit])

  // --- frame resize handles -------------------------------------------------
  const onWidthDown = (e: React.MouseEvent) => {
    const w0 = previewRef.current?.getBoundingClientRect().width ?? 800
    if (previewW === "full") setPreviewW(w0)
    setDragging("w")
    startDrag(e, {
      cursor: "ew-resize",
      onMove: (dx) => setPreviewW(Math.max(320, Math.round(w0 + dx))),
      onEnd: () => setDragging(""),
    })
  }
  const onHeightDown = (e: React.MouseEvent) => {
    const h0 = cfg.canvasHeight || canvasRef.current?.getBoundingClientRect().height || 420
    setDragging("h")
    startDrag(e, {
      cursor: "ns-resize",
      onMove: (_dx, dy) => { setCfg((c) => ({ ...c, canvasHeight: Math.max(160, Math.min(1200, Math.round(h0 + dy))) })); setPresetSel("") },
      onEnd: () => setDragging(""),
    })
  }

  // --- preset apply / save --------------------------------------------------
  const sceneContent = isSceneContent(cfg.content)
  const isHero = display === "hero" && sceneContent

  const allPresets = [...PRESETS, ...drafts]
  const applyPreset = (name: string) => {
    setPresetSel(name)
    const p = allPresets.find((x) => x.name === name)
    if (!p) return
    setDisplay((p.props as any).variant === "hero" ? "hero" : "callout")
    setCfg({ ...CANVAS_DEFAULTS, ...(p.props as Partial<Cfg>) })
    setCropEdit(false)
  }
  const changedProps = (): Partial<Cfg> => {
    const out: Partial<Cfg> = {}
    for (const k of Object.keys(CANVAS_DEFAULTS) as Array<keyof Cfg>) {
      if (isHero && !HERO_KEYS.includes(k)) continue
      if (!isHero && CALLOUT_EXCLUDE.includes(k)) continue
      if (cfg[k] !== CANVAS_DEFAULTS[k]) (out as any)[k] = cfg[k]
    }
    return out
  }
  const serialize = (props: Record<string, unknown>) =>
    Object.entries(props).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(", ")
  const presetBlock = () => {
    const props: Record<string, unknown> = isHero ? { variant: "hero", ...changedProps() } : changedProps()
    return `  {\n    name: ${JSON.stringify(saveName || "untitled")},\n    props: { ${serialize(props)} },\n  },`
  }
  const jsxBlock = () => {
    const props = changedProps()
    const body = Object.entries(props).map(([k, v]) => typeof v === "string" ? `${k}=${JSON.stringify(v)}` : `${k}={${JSON.stringify(v)}}`).join(" ")
    return `<SceneCanvas variant=${JSON.stringify(isHero ? "hero" : "callout")} ${body} />`
  }
  const saveDraft = () => {
    if (!saveName) return
    const props = (isHero ? { variant: "hero" as const, ...changedProps() } : changedProps()) as Partial<SceneCanvasProps>
    const next = [...drafts.filter((d) => d.name !== saveName), { name: saveName, props }]
    setDrafts(next)
    localStorage.setItem(DRAFT_KEY, JSON.stringify(next))
    setPresetSel(saveName)
  }

  const setContent = (v: string) => {
    setCropEdit(false)
    setPresetSel("")
    setCfg((c) => ({ ...c, content: v }))
    // hero display only applies to full scenes; anything else is a callout
    if (!isSceneContent(v)) setDisplay("callout")
  }

  const punch = (k: "segStart" | "segEnd") => () => { setCfg((c) => ({ ...c, [k]: Math.round(t / 100) * 100 })); setPresetSel("") }

  const editCropStart = () => {
    setCfg((c) => ({
      ...c, content: "custom", customScene: entry.key,
      cropX: rect.x, cropY: rect.y, cropW: rect.w, cropH: rect.h,
    }))
    if (!scrubOn) { setScrubOn(true); setPlayStart(null) }
    setCropEdit(true)
    setPresetSel("")
  }

  const pw = previewW === "full" ? "100%" : previewW
  const bpValue = previewW === "full" ? "full" : String(previewW)
  const sizeLabel = `${previewW === "full" ? "full width" : Math.round(previewW as number) + "px"} × ${!isHero && cfg.canvasHeight ? cfg.canvasHeight + "px" : "auto"}`

  return (
    <div className="wb" style={{ background: T.pageBg, minHeight: "100vh" }}>
      <style>{WB_CSS}</style>

      {/* header */}
      <div className="wb-header">
        <span className="wb-title"><Logo /> Scene Workbench</span>
        <Sel v={presetSel} set={applyPreset} width={210}
          options={["", ...allPresets.map((p) => p.name)]}
          titles={["Load a preset…", ...allPresets.map((p) => p.name)]} />
        <span style={{ flex: 1 }} />
        <input className="wb-input text" style={{ width: 170 }} placeholder="Preset name…" value={saveName}
          onChange={(e) => setSaveName(e.target.value)} />
        <button className="wb-btn primary" onClick={saveDraft}>Save draft</button>
        <CopyBtn label="Copy preset TS" text={presetBlock} />
        <CopyBtn label="Copy JSX" text={jsxBlock} />
      </div>

      <div className="wb-main">
        {/* stage */}
        <div className="wb-stage">
          <div className="wb-toolbar">
            {!isHero && (
              <span className="wb-tools">
                {!scrubOn ? (
                  <button className="wb-btn" onClick={() => { setScrubOn(true); setPlayStart(null) }}>
                    <I name="sliders-horizontal" size={13} /> Scrub
                  </button>
                ) : (
                  <>
                    <button className="wb-btn primary" style={{ width: 40, justifyContent: "center", padding: 0 }}
                      onClick={() => setPlayStart(playing ? null : t)} title={playing ? "Pause" : "Play"}>
                      <I name={playing ? "pause" : "play"} size={12} />
                    </button>
                    <input type="range" className="wb-slider grow" style={{ maxWidth: 280 }} min={0} max={25000} step={100}
                      value={t} onChange={(e) => { setPlayStart(null); setT(+e.target.value) }} />
                    <span className="wb-time">{(t / 1000).toFixed(1)}s</span>
                    <button className="wb-btn" onClick={punch("segStart")} title="Set segment start from playhead">
                      <I name="arrow-left-to-line" size={12} /> In
                    </button>
                    <button className="wb-btn" onClick={punch("segEnd")} title="Set segment end from playhead">
                      <I name="arrow-right-to-line" size={12} /> Out
                    </button>
                    <button className="wb-btn" onClick={() => { setScrubOn(false); setPlayStart(null); setCropEdit(false); setRunNonce((n) => n + 1) }}>Live</button>
                  </>
                )}
              </span>
            )}
            <span style={{ flex: 1 }} />
            <Seg v={bpValue} set={(v) => setPreviewW(v === "full" ? "full" : +v)}
              options={[["375", "375"], ["768", "768"], ["1024", "1024"], ["full", "Full"]]} />
            {!isHero && (
              <button className={"wb-btn" + (cropEdit ? " accent" : "")}
                onClick={() => (cropEdit ? setCropEdit(false) : editCropStart())}>
                <I name="crop" size={13} /> {cropEdit ? "Done" : "Edit crop"}
              </button>
            )}
          </div>

          {/* resizable preview frame */}
          <div style={{ position: "relative", width: pw, maxWidth: "100%", margin: "0 auto", transition: dragging ? "none" : "width .2s ease" }}>
            {dragging && <span className="wb-chip">{sizeLabel}</span>}
            <div ref={previewRef}
              className={!isHero && scrubOn && !playing ? "ll-noanim" : undefined}
              onMouseDown={!isHero ? onPinDown : undefined}
              style={{ position: "relative", cursor: !isHero && cfg.fit === "pinned" && !cropEdit ? (dragging === "pin" ? "grabbing" : "grab") : undefined }}
            >
              {isHero ? (
                <SceneCanvas key={runNonce} variant="hero" scrubber maxWidth={4000}
                  autoCycle={cfg.autoCycle} resumeDelay={cfg.resumeDelay}
                  pattern={cfg.pattern} patternSpacing={cfg.patternSpacing} patternOpacity={cfg.patternOpacity}
                  bgColor={cfg.bgColor} padX={cfg.padX} padY={cfg.padY} radius={cfg.radius}
                />
              ) : cropEdit ? (
                <CropEditor sceneKey={cfg.customScene} holdT={t}
                  rect={{ x: cfg.cropX, y: cfg.cropY, w: cfg.cropW, h: cfg.cropH }}
                  onChange={(r) => { setCfg((c) => ({ ...c, cropX: r.x, cropY: r.y, cropW: r.w, cropH: r.h })); setPresetSel("") }} />
              ) : (
                <>
                  <SceneCanvas key={runNonce} variant="callout" {...cfg}
                    debugHold={scrubOn && !playing ? t : undefined}
                    debugPlayFrom={scrubOn && playing ? playStart! : undefined}
                    debugOnTime={scrubOn ? setT : undefined}
                    debugCanvasRef={canvasRef}
                  />
                  {cfg.fit === "pinned" && (
                    <div className="wb-float">drag to reposition · scroll to zoom</div>
                  )}
                </>
              )}
            </div>
            <div className={"wb-grab-w" + (dragging === "w" ? " on" : "")} onMouseDown={onWidthDown} />
            {!isHero && !cropEdit && <div className={"wb-grab-h" + (dragging === "h" ? " on" : "")} onMouseDown={onHeightDown} />}
          </div>
          <div style={{ textAlign: "center", marginTop: 26 }} className="wb-hint">
            {sizeLabel} · drag the handles to test any size
          </div>
        </div>

        {/* inspector */}
        <div className="wb-panel">
          <Section title="Content" />
          <Field label="What plays">
            <ContentSel v={cfg.content} set={setContent} />
          </Field>
          {sceneContent && (
            <Field label="Display as">
              <Seg v={display} set={(v) => { setDisplay(v as "hero" | "callout"); setCropEdit(false); setPresetSel("") }}
                options={[["hero", "Hero (rail)"], ["callout", "Callout"]]} />
            </Field>
          )}

          {isHero ? (
            <>
              <div className="wb-hint" style={{ margin: "8px 0 2px" }}>
                The hero cycles all five stages; the rail below the canvas is
                live — click a stage to jump, just like the site.
              </div>
              <Section title="Hero" />
              <Field label="Auto-cycle">
                <Toggle v={cfg.autoCycle} set={set("autoCycle")} />
              </Field>
              <Field label="Resume after">
                <Num v={cfg.resumeDelay} set={set("resumeDelay")} min={4} max={60} />
                <span className="wb-hint">sec</span>
              </Field>
            </>
          ) : (
            <>
              {cfg.content === "custom" && (
                <>
                  <Field label="Scene">
                    <Sel v={cfg.customScene} set={(v) => set("customScene")(v)}
                      options={REGISTRY.map((e) => e.key)} titles={REGISTRY.map((e) => e.title)} />
                  </Field>
                  <Field label="Crop x · y">
                    <Num v={cfg.cropX} set={set("cropX")} /><Num v={cfg.cropY} set={set("cropY")} />
                  </Field>
                  <Field label="Crop w · h">
                    <Num v={cfg.cropW} set={set("cropW")} /><Num v={cfg.cropH} set={set("cropH")} />
                  </Field>
                </>
              )}

              <Section title="Layout" />
              <Field label="Fit">
                <Seg v={cfg.fit} set={(v) => set("fit")(v as Cfg["fit"])} options={[["responsive", "Responsive"], ["pinned", "Pinned"]]} />
              </Field>
              {cfg.fit === "pinned" && (
                <>
                  <Field label="Anchor">
                    <CornerPick v={cfg.anchor} set={(v) => set("anchor")(v as Cfg["anchor"])} />
                  </Field>
                  <Field label="Insets x · y">
                    <Num v={cfg.insetX} set={set("insetX")} /><Num v={cfg.insetY} set={set("insetY")} />
                  </Field>
                  <Field label="Zoom">
                    <Slider v={cfg.zoom} set={set("zoom")} min={0.4} max={2} step={0.05} fmt={(n) => n.toFixed(2)} />
                  </Field>
                  <Field label="When small">
                    <Seg v={cfg.smallBehavior} set={(v) => set("smallBehavior")(v as Cfg["smallBehavior"])} options={[["fit", "Fit"], ["mask", "Mask"]]} />
                  </Field>
                  {cfg.smallBehavior === "fit" && (
                    <Field label="Below (px)"><Num v={cfg.fitBelow} set={set("fitBelow")} wide /></Field>
                  )}
                </>
              )}
              <Field label="Canvas height">
                <Num v={cfg.canvasHeight} set={set("canvasHeight")} wide />
                <span className="wb-hint">0 = auto</span>
              </Field>
            </>
          )}

          <Section title="Canvas" />
          <Field label="Pattern">
            <PatternPick v={cfg.pattern} set={(v) => set("pattern")(v)} />
          </Field>
          {cfg.pattern !== "none" && (
            <>
              <Field label="Spacing">
                <Slider v={cfg.patternSpacing} set={set("patternSpacing")} min={8} max={120} step={4} />
              </Field>
              <Field label="Opacity">
                <Slider v={cfg.patternOpacity} set={set("patternOpacity")} min={0.05} max={1} step={0.05} fmt={(n) => n.toFixed(2)} />
              </Field>
            </>
          )}
          <Field label="Fill">
            <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(cfg.bgColor) ? cfg.bgColor : "#EEE8DD"}
              onChange={(e) => set("bgColor")(e.target.value)}
              style={{ width: 28, height: 28, border: "1px solid #DDD6C8", borderRadius: 8, background: "none", padding: 2, cursor: "pointer" }} />
            <input className="wb-input wide text" value={cfg.bgColor} onChange={(e) => set("bgColor")(e.target.value)} />
          </Field>
          <Field label="Padding x · y">
            <Num v={cfg.padX} set={set("padX")} /><Num v={cfg.padY} set={set("padY")} />
          </Field>
          <Field label="Radius"><Num v={cfg.radius} set={set("radius")} min={0} max={16} /></Field>

          {!isHero && (
            <>
              <Section title="Playback" />
              <Field label="Loop">
                <Toggle v={cfg.loop} set={set("loop")} />
                <span className="wb-label">pause</span>
                <Num v={cfg.loopPause} set={set("loopPause")} min={0} max={20} step={0.5} />
              </Field>
              <Field label="Segment in · out">
                <Num v={cfg.segStart} set={set("segStart")} step={100} wide />
                <Num v={cfg.segEnd} set={set("segEnd")} step={100} wide />
              </Field>
              <div className="wb-hint" style={{ marginTop: 6 }}>
                Scrub to a beat and use In / Out to set the loop window. 0 · 0 plays the whole session.
              </div>
            </>
          )}

          <div className="wb-hint" style={{ marginTop: 22, borderTop: "1px solid #EEE8DD", paddingTop: 12 }}>
            <strong style={{ fontWeight: 500, color: T.inkSoft }}>Saving:</strong> drafts live in this browser and
            appear in the preset menu. Copy preset TS into <code>ListenPresets.tsx</code> to make a composition
            permanent — it then shows up in SceneCanvas's Preset dropdown in Framer.
          </div>
        </div>
      </div>
    </div>
  )
}
