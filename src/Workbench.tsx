// Workbench — the composition studio (the landing page). Local-only; not
// pasted into Framer. Tune every SceneCanvas setting live, manipulate the
// shot directly (drag to pin, wheel to zoom, drag-resize the preview frame),
// scrub to the beat.
// UI: a shadcn-style inspector kit hand-rolled on the Listen Labs tokens.
import * as React from "react"
import SceneCanvas, { CANVAS_DEFAULTS, ANCHORS, anchorAxes, Anchor } from "./SceneCanvas"
import { byKey, grouped, label, shortLabel, SEQUENCES } from "./ListenRegistry"
import { T, Logo, ScaleBox, PatternLayer, PatternType, APP_W } from "./ListenKit"
import { I } from "./ListenIcons"

type Cfg = typeof CANVAS_DEFAULTS

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
  .wb-panel { width: 344px; flex-shrink: 0; background: #FFF; border-left: 1px solid #E7E1D6;
    padding: 0 20px 28px; overflow-y: auto; height: calc(100vh - 57px); position: sticky; top: 0; }
  .wb-panel::-webkit-scrollbar { width: 8px; }
  .wb-panel::-webkit-scrollbar-thumb { background: #E7E1D6; border-radius: 4px; }
  .wb-toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; min-height: 38px; }
  .wb-tools { display: inline-flex; align-items: center; gap: 6px; background: #FFF;
    border: 1px solid #E7E1D6; border-radius: 12px; padding: 4px; }
  .wb-tools .wb-slider { margin: 0 6px; }
  .wb-tools .wb-time { margin-right: 4px; }
  .wb-group { margin: 0 -20px; border-top: 1px solid #EEE8DD; }
  .wb-group:first-child { border-top: none; }
  .wb-group-body { padding: 0 20px 14px; }
  .wb-section { display: flex; align-items: center; gap: 8px; width: 100%; font: 500 13px ${T.font}; color: ${T.ink};
    padding: 13px 20px; background: none; border: none; cursor: pointer; text-align: left; }
  .wb-group.open .wb-section { padding-bottom: 6px; }
  .wb-section:hover { background: #FCFBF8; }
  .wb-section:focus-visible { outline: none; box-shadow: inset 0 0 0 2px rgba(0, 33, 204, 0.35); }
  .wb-summary { font-weight: 400; font-size: 12px; color: ${T.inkFaint}; min-width: 0; overflow: hidden;
    text-overflow: ellipsis; white-space: nowrap; }
  .wb-num { width: 18px; height: 18px; border-radius: 5px; background: #F0EBDF; color: ${T.inkSoft};
    font-size: 11px; display: inline-flex; align-items: center; justify-content: center; font-variant-numeric: tabular-nums; }
  .wb-sub { margin: 2px 0 4px; padding-left: 10px; border-left: 2px solid #EEE8DD; }
  .wb-unit { font-size: 12px; color: ${T.inkFaint}; margin-left: -2px; }
  .wb-iconbtn { width: 26px; height: 26px; border-radius: 7px; border: 1px solid #DDD6C8; background: #FFF; color: ${T.inkSoft};
    display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
  .wb-iconbtn:disabled { opacity: .4; cursor: default; }
  .wb-btn:disabled { opacity: .45; cursor: default; }
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
  .wb-corner { display: grid; grid-template-columns: repeat(3, 10px); grid-auto-rows: 10px; gap: 5px;
    padding: 6px; border: 1px solid #DDD6C8; border-radius: 8px; background: #FCFBF8; flex-shrink: 0; }
  .wb-corner span { width: 10px; height: 10px; border-radius: 3px;
    border: 1.5px solid #C6BEAC; background: #FFF; cursor: pointer; transition: background .1s, border-color .1s; box-sizing: border-box; }
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
/** a numbered, foldable rail section; folded, it shows a one-line summary */
const Section = (p: { n: number; title: string; open: boolean; onToggle: () => void; summary: string; children: React.ReactNode }) => (
  <div className={"wb-group" + (p.open ? " open" : "")}>
    <button className="wb-section" onClick={p.onToggle} aria-expanded={p.open}>
      <span className="wb-num">{p.n}</span>
      <span>{p.title}</span>
      {!p.open && <span className="wb-summary">{p.summary}</span>}
      <I name="chevron-down" size={13} style={{ marginLeft: "auto", flexShrink: 0, color: T.inkFaint, transform: p.open ? "none" : "rotate(-90deg)", transition: "transform .15s ease" }} />
    </button>
    {p.open && <div className="wb-group-body">{p.children}</div>}
  </div>
)

type FoldKey = "content" | "playback" | "state" | "framing" | "canvas"
const FOLD_KEY = "llWorkbenchFold"
const FOLD_ALL: Record<FoldKey, boolean> = { content: true, playback: true, state: true, framing: true, canvas: true }
const loadFold = (): Record<FoldKey, boolean> => {
  try { return { ...FOLD_ALL, ...JSON.parse(localStorage.getItem(FOLD_KEY) ?? "{}") } } catch { return { ...FOLD_ALL } }
}

/** a ms value edited in seconds (0 shows empty) */
const Secs = (p: { v: number; set: (ms: number) => void }) => (
  <input type="number" className="wb-input" step={0.1} min={0} max={25} placeholder="–"
    value={p.v ? +(p.v / 1000).toFixed(1) : ""} onChange={(e) => p.set(Math.round(+e.target.value * 10) * 100)} />
)

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

/** 3×3 anchor grid — corners, edge midpoints, center (ANCHORS is row-major) */
const CornerPick = (p: { v: string; set: (s: string) => void }) => (
  <span className="wb-corner">
    {ANCHORS.map((c) => (
      <span key={c} tabIndex={0} title={c} className={p.v === c ? "on" : ""} onClick={() => p.set(c)} />
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
// content is one list of every shot in the registry, sectioned by group and
// numbered in page order, with planned shots greyed out —
// plus "Custom crop…" for framing a rect out of any scene
/** shot select, with a header per group */
function ShotSel(p: { v: string; set: (s: string) => void; custom?: boolean }): JSX.Element {
  return (
    <select className="wb-select" value={p.v} onChange={(e) => p.set(e.target.value)}>
      {grouped().map(([g, items]) => (
        <optgroup key={g} label={g}>
          {items.map((it) => it.planned
            ? <option key={"planned-" + it.entry.n} disabled>{shortLabel(it.entry)} — not built yet</option>
            : <option key={it.entry.key} value={it.entry.key}>{shortLabel(it.entry)}</option>)}
        </optgroup>
      ))}
      {p.custom && <optgroup label="Other"><option value="custom">Custom crop…</option></optgroup>}
    </select>
  )
}


export default function Workbench(): JSX.Element {
  const [cfg, setCfg] = React.useState<Cfg>({ ...CANVAS_DEFAULTS, layout: "multi-step" })
  // which rail sections are open — a per-browser convenience
  const [fold, setFold] = React.useState<Record<FoldKey, boolean>>(loadFold)
  const saveFold = (f: Record<FoldKey, boolean>) => {
    setFold(f)
    try { localStorage.setItem(FOLD_KEY, JSON.stringify(f)) } catch { /* storage unavailable */ }
  }
  const toggleFold = (k: FoldKey) => saveFold({ ...fold, [k]: !fold[k] })
  const [previewW, setPreviewW] = React.useState<number | "full">("full")
  const [cropEdit, setCropEdit] = React.useState(false)
  const [scrubSlot, setScrubSlot] = React.useState<HTMLSpanElement | null>(null)
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

  const set = <K extends keyof Cfg>(k: K) => (v: Cfg[K]) => setCfg((c) => ({ ...c, [k]: v }))

  const entry = cfg.content === "custom" ? byKey(cfg.customScene) : byKey(cfg.content)
  const rect: Rect = cfg.content === "custom" && cfg.cropW > 0
    ? { x: cfg.cropX, y: cfg.cropY, w: cfg.cropW, h: cfg.cropH }
    : { x: 0, y: 0, w: entry.w, h: entry.h }

  // --- pin drag + wheel zoom over the live canvas ---------------------------
  const onPinDown = (e: React.MouseEvent) => {
    if (cfg.fit !== "pinned" || !canvasRef.current || cropEdit) return
    const cb = canvasRef.current.getBoundingClientRect()
    const shotW = rect.w * cfg.zoom, shotH = rect.h * cfg.zoom
    const ax0 = anchorAxes(cfg.anchor)
    const left0 = ax0.h === "left" ? cfg.insetX : ax0.h === "right" ? cb.width - cfg.insetX - shotW : (cb.width - shotW) / 2
    const top0 = ax0.v === "top" ? cfg.insetY : ax0.v === "bottom" ? cb.height - cfg.insetY - shotH : (cb.height - shotH) / 2
    setDragging("pin")
    startDrag(e, {
      cursor: "grabbing",
      onMove: (dx, dy, ev) => {
        const left = left0 + dx, top = top0 + dy
        // anchor follows the pointer through a 3×3 grid: corners, edge
        // midpoints, center — centered axes snap centered and ignore insets
        const px = ev.clientX - cb.left, py = ev.clientY - cb.top
        const h = px < cb.width / 3 ? "left" : px > (cb.width * 2) / 3 ? "right" : "center"
        const v = py < cb.height / 3 ? "top" : py > (cb.height * 2) / 3 ? "bottom" : "center"
        const anchor: Anchor = v === "center"
          ? (h === "center" ? "center" : (`${h}-center` as Anchor))
          : (`${v}-${h}` as Anchor)
        const insetX = h === "center" ? 0 : Math.round(Math.max(0, h === "left" ? left : cb.width - left - shotW))
        const insetY = v === "center" ? 0 : Math.round(Math.max(0, v === "top" ? top : cb.height - top - shotH))
        setCfg((c) => ({ ...c, anchor, insetX, insetY }))
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
      onMove: (_dx, dy) => { setCfg((c) => ({ ...c, canvasHeight: Math.max(160, Math.min(1200, Math.round(h0 + dy))) })) },
      onEnd: () => setDragging(""),
    })
  }

  const isMulti = cfg.layout === "multi-step"

  // scene state only means something for scenes inside the app shell
  const shellShot = isMulti || entry.w === APP_W

  // list and stage frame their own shot (the mock's bleed card)
  const stepStyle = !isMulti ? null : cfg.stepStyle === "auto"
    ? SEQUENCES.find((q) => q.key === cfg.sequence)?.style ?? "captions"
    : cfg.stepStyle
  const listStyle = stepStyle === "list"
  const stageStyle = stepStyle === "stage"
  // list and stage edit their own card's fit and height; single edits the canvas's
  const framed = listStyle || stageStyle
  const curFit = framed ? cfg.frameFit : cfg.fit
  const fitKey = framed ? "frameFit" as const : "fit" as const
  const curH = framed ? cfg.frameHeight : cfg.canvasHeight
  const hKey = framed ? "frameHeight" as const : "canvasHeight" as const
  // one-line summaries for folded sections
  const secs = (ms: number) => +(ms / 1000).toFixed(1) + "s"
  const summary: Record<FoldKey, string> = {
    content: isMulti
      ? "Multi-step · " + (SEQUENCES.find((q) => q.key === cfg.sequence)?.title ?? cfg.sequence) + " · " + (listStyle ? "List" : stageStyle ? "Stage" : "Captions")
      : "Single · " + (cfg.content === "custom" ? "Crop of " + label(byKey(cfg.customScene)) : label(byKey(cfg.content))),
    playback: isMulti
      ? (cfg.autoCycle ? "Auto-advance · " + cfg.resumeDelay + "s pause" : "Manual")
      : (cfg.loop ? "Loop · " + cfg.loopPause + "s" : "Once") + (cfg.segEnd ? " · " + secs(cfg.segStart) + "–" + secs(cfg.segEnd) : ""),
    state: (cfg.startCollapsed ? "Collapsed" : "Open") + " · " + (cfg.startTheme === "dark" ? "Dark" : "Light"),
    framing: (stageStyle ? "Stage · " : listStyle ? "List " + cfg.listStart + "–" + cfg.listEnd + " · card " + cfg.cardStart + "–12 · " : "")
      + (curFit === "pinned" ? "Pin " + cfg.anchor.replace("-", " ") + " · " + Math.round(cfg.zoom * 100) + "%"
        : curFit === "bleed" ? "Bleed · " + cfg.bleedShow + "px across" : "Scale to fit")
      + " · " + (curH ? curH + "px" : "Auto"),
    canvas: (cfg.pattern === "none" ? "No pattern" : cfg.pattern[0].toUpperCase() + cfg.pattern.slice(1))
      + " · " + cfg.bgColor.toUpperCase() + (cfg.radius ? " · r" + cfg.radius : ""),
  }

  const setContent = (v: string) => {
    setCropEdit(false)
    setCfg((c) => ({ ...c, content: v }))
  }

  const punch = (k: "segStart" | "segEnd") => () => { setCfg((c) => ({ ...c, [k]: Math.round(t / 100) * 100 })) }

  const editCropStart = () => {
    setCfg((c) => ({
      ...c, content: "custom", customScene: entry.key,
      cropX: rect.x, cropY: rect.y, cropW: rect.w, cropH: rect.h,
    }))
    if (!scrubOn) { setScrubOn(true); setPlayStart(null) }
    setCropEdit(true)
  }

  const pw = previewW === "full" ? "100%" : previewW
  const bpValue = previewW === "full" ? "full" : String(previewW)
  const sizeLabel = `${previewW === "full" ? "full width" : Math.round(previewW as number) + "px"} × ${cfg.canvasHeight ? cfg.canvasHeight + "px" : "auto"}`

  return (
    <div className="wb" style={{ background: T.pageBg, minHeight: "100vh" }}>
      <style>{WB_CSS}</style>

      {/* header */}
      <div className="wb-header">
        <span className="wb-title"><Logo /> Scene Workbench</span>
      </div>

      <div className="wb-main">
        {/* stage */}
        <div className="wb-stage">
          <div className="wb-toolbar">
            {!isMulti && (
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
            {/* multi-step's scrubber lives inside SceneCanvas; it renders here */}
            {isMulti && <span className="wb-tools" ref={setScrubSlot} />}
            <span style={{ flex: 1 }} />
            <Seg v={bpValue} set={(v) => setPreviewW(v === "full" ? "full" : +v)}
              options={[["375", "375"], ["768", "768"], ["1024", "1024"], ["full", "Full"]]} />
            {!isMulti && (
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
              className={!isMulti && scrubOn && !playing ? "ll-noanim" : undefined}
              onMouseDown={!isMulti ? onPinDown : undefined}
              style={{ position: "relative", cursor: !isMulti && cfg.fit === "pinned" && !cropEdit ? (dragging === "pin" ? "grabbing" : "grab") : undefined }}
            >
              {isMulti ? (
                <SceneCanvas key={runNonce} {...cfg} scrubber scrubberSlot={scrubSlot} maxWidth={4000} />
              ) : cropEdit ? (
                <CropEditor sceneKey={cfg.customScene} holdT={t}
                  rect={{ x: cfg.cropX, y: cfg.cropY, w: cfg.cropW, h: cfg.cropH }}
                  onChange={(r) => { setCfg((c) => ({ ...c, cropX: r.x, cropY: r.y, cropW: r.w, cropH: r.h })) }} />
              ) : (
                <>
                  <SceneCanvas key={runNonce} {...cfg}
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
            {!isMulti && !cropEdit && <div className={"wb-grab-h" + (dragging === "h" ? " on" : "")} onMouseDown={onHeightDown} />}
          </div>
          <div style={{ textAlign: "center", marginTop: 26 }} className="wb-hint">
            {sizeLabel} · drag the handles to test any size
          </div>
        </div>

        {/* inspector: the five steps of building a shot */}
        <div className="wb-panel">
          <Section n={1} title="Content" open={fold.content} onToggle={() => toggleFold("content")} summary={summary.content}>
            <Field label="Layout">
              <Seg v={cfg.layout} set={(v) => { set("layout")(v as Cfg["layout"]); setCropEdit(false) }}
                options={[["single", "Single"], ["multi-step", "Multi-step"]]} />
            </Field>
            {isMulti ? (
              <Field label="Sequence">
                <Sel v={cfg.sequence} set={(v) => set("sequence")(v)}
                  options={SEQUENCES.map((q) => q.key)} titles={SEQUENCES.map((q) => q.title)} />
              </Field>
            ) : null}
            {isMulti ? (
              <Field label="Style">
                <Seg v={cfg.stepStyle} set={(v) => set("stepStyle")(v as Cfg["stepStyle"])}
                  options={[["auto", "Auto"], ["captions", "Captions"], ["list", "List"], ["stage", "Stage"]]} />
              </Field>
            ) : (
              <>
                <Field label="Shot">
                  <ShotSel v={cfg.content} set={setContent} custom />
                </Field>
                {cfg.content === "custom" && (
                  <div className="wb-sub">
                    <Field label="From scene">
                      <ShotSel v={cfg.customScene} set={(v) => set("customScene")(v)} />
                    </Field>
                    <Field label="Crop x · y">
                      <Num v={cfg.cropX} set={set("cropX")} /><Num v={cfg.cropY} set={set("cropY")} />
                    </Field>
                    <Field label="Crop w · h">
                      <Num v={cfg.cropW} set={set("cropW")} /><Num v={cfg.cropH} set={set("cropH")} />
                    </Field>
                  </div>
                )}
              </>
            )}

          </Section>
          <Section n={2} title="Playback" open={fold.playback} onToggle={() => toggleFold("playback")} summary={summary.playback}>
            {isMulti ? (
              <>
                <Field label="Auto-advance"><Toggle v={cfg.autoCycle} set={set("autoCycle")} /></Field>
                <Field label="Pause after click">
                  <Num v={cfg.resumeDelay} set={set("resumeDelay")} min={4} max={60} /><span className="wb-unit">s</span>
                </Field>
              </>
            ) : (
              <>
                <Field label="Loop">
                  <Toggle v={cfg.loop} set={set("loop")} />
                  <span className="wb-label" style={{ marginLeft: 6 }}>pause</span>
                  <Num v={cfg.loopPause} set={set("loopPause")} min={0} max={20} step={0.5} /><span className="wb-unit">s</span>
                </Field>
                <Field label="Segment">
                  <Secs v={cfg.segStart} set={set("segStart")} />
                  <span className="wb-label">→</span>
                  <Secs v={cfg.segEnd} set={set("segEnd")} />
                  <button className="wb-iconbtn" title="Play the whole session" disabled={!cfg.segStart && !cfg.segEnd}
                    onClick={() => setCfg((c) => ({ ...c, segStart: 0, segEnd: 0 }))}><I name="rotate-cw" size={12} /></button>
                </Field>
                <div className="wb-hint">Set In / Out from the playhead while scrubbing. Empty = whole session.</div>
              </>
            )}

          </Section>
          <Section n={3} title="Scene state" open={fold.state} onToggle={() => toggleFold("state")} summary={summary.state}>
            <Field label="Sidebar">
              <Seg v={cfg.startCollapsed ? "collapsed" : "open"} set={(v) => set("startCollapsed")(v === "collapsed")}
                options={[["open", "Open"], ["collapsed", "Collapsed"]]} />
            </Field>
            <Field label="Theme">
              <Seg v={cfg.startTheme} set={(v) => set("startTheme")(v as Cfg["startTheme"])}
                options={[["light", "Light"], ["dark", "Dark"]]} />
            </Field>
            {!shellShot && <div className="wb-hint">Applies to app scenes; this shot has no product chrome.</div>}

          </Section>
          <Section n={4} title="Framing" open={fold.framing} onToggle={() => toggleFold("framing")} summary={summary.framing}>
            {listStyle && <>
              <Field label="List columns">
                <Num v={cfg.listStart} set={set("listStart")} min={1} max={11} /><Num v={cfg.listEnd} set={set("listEnd")} min={1} max={11} />
              </Field>
              <Field label="Card from">
                <Num v={cfg.cardStart} set={set("cardStart")} min={2} max={12} />
              </Field>
              <div className="wb-hint">A 12-column grid, 24px gutters. The card runs to column 12. Bleed crops its shot like the mock (48px inset, 16px on mobile).</div>
            </>}
            {stageStyle && (
              <div className="wb-hint">One panel on a 12-column grid. The caption, progress, and arrows sit on columns 1–4; the shot takes column 5 onward (Bleed runs it off the right and bottom, like the Use Cases card).</div>
            )}
            <Field label="Mode">
              <Seg v={curFit} set={(v) => set(fitKey)(v as Cfg["fit"])} options={[["responsive", "Scale to fit"], ["pinned", "Pin"], ["bleed", "Bleed"]]} />
            </Field>
            {curFit === "bleed" && (
              <div className="wb-sub">
                {!framed && <Field label="Insets x · y">
                  <Num v={cfg.insetX} set={set("insetX")} /><Num v={cfg.insetY} set={set("insetY")} />
                </Field>}
                <Field label="Show">
                  <Num v={cfg.bleedShow} set={set("bleedShow")} wide /><span className="wb-unit">px across</span>
                </Field>
              </div>
            )}
            {curFit === "pinned" && (
              <div className="wb-sub">
                <Field label="Anchor"><CornerPick v={cfg.anchor} set={(v) => set("anchor")(v as Cfg["anchor"])} /></Field>
                <Field label="Insets x · y">
                  <Num v={cfg.insetX} set={set("insetX")} /><Num v={cfg.insetY} set={set("insetY")} />
                </Field>
                <Field label="Zoom">
                  <Slider v={cfg.zoom} set={set("zoom")} min={0.3} max={2} step={0.05} fmt={(n) => Math.round(n * 100) + "%"} />
                </Field>
                <Field label="Below">
                  <Num v={cfg.fitBelow} set={set("fitBelow")} wide /><span className="wb-unit">px</span>
                  <Seg v={cfg.smallBehavior} set={(v) => set("smallBehavior")(v as Cfg["smallBehavior"])} options={[["fit", "Fit"], ["mask", "Pin"]]} />
                </Field>
              </div>
            )}
            <Field label="Height">
              <Seg v={curH ? "fixed" : "auto"}
                set={(v) => set(hKey)(v === "auto" ? 0 : Math.round((framed ? previewRef : canvasRef).current?.getBoundingClientRect().height || 400))}
                options={[["auto", "Auto"], ["fixed", "Fixed"]]} />
              {curH > 0 && <><Num v={curH} set={set(hKey)} wide /><span className="wb-unit">px</span></>}
            </Field>
            {framed && <div className="wb-hint">Under 820px the card stacks and keeps the bleed crop at auto height.</div>}

          </Section>
          <Section n={5} title="Canvas" open={fold.canvas} onToggle={() => toggleFold("canvas")} summary={summary.canvas}>
            <Field label="Fill">
              <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(cfg.bgColor) ? cfg.bgColor : "#EEE8DD"}
                onChange={(e) => set("bgColor")(e.target.value)}
                style={{ width: 28, height: 28, border: "1px solid #DDD6C8", borderRadius: 8, background: "none", padding: 2, cursor: "pointer" }} />
              <input className="wb-input wide text" value={cfg.bgColor} onChange={(e) => set("bgColor")(e.target.value)} />
            </Field>
            <Field label="Pattern"><PatternPick v={cfg.pattern} set={(v) => set("pattern")(v)} /></Field>
            {cfg.pattern !== "none" && (
              <div className="wb-sub">
                <Field label="Spacing"><Slider v={cfg.patternSpacing} set={set("patternSpacing")} min={8} max={120} step={4} /></Field>
                <Field label="Opacity"><Slider v={cfg.patternOpacity} set={set("patternOpacity")} min={0.05} max={1} step={0.05} fmt={(n) => Math.round(n * 100) + "%"} /></Field>
              </div>
            )}
            <Field label="Padding x · y">
              <Num v={cfg.padX} set={set("padX")} /><Num v={cfg.padY} set={set("padY")} />
            </Field>
            <Field label="Radius"><Num v={cfg.radius} set={set("radius")} min={0} max={16} /></Field>
          </Section>
        </div>
      </div>
    </div>
  )
}
