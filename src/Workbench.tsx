// Workbench — the composition studio (/?compose=1). Local-only; not pasted
// into Framer. Tune every SceneCanvas setting live, manipulate the shot
// directly (drag to pin, wheel to zoom, drag-resize the crop), scrub to the
// beat, then save the composition as a named preset.
// UI: a shadcn-style inspector kit hand-rolled on the Listen Labs tokens.
import * as React from "react"
import SceneCanvas, { CANVAS_DEFAULTS, SceneCanvasProps } from "./SceneCanvas"
import { PRESETS, Preset } from "./ListenPresets"
import { framingOptions, resolveContent, byKey, REGISTRY } from "./ListenRegistry"
import { T, Logo, ScaleBox, PatternLayer, PatternType } from "./ListenKit"

type Cfg = typeof CANVAS_DEFAULTS
const DRAFT_KEY = "llPresetDrafts"

const loadDrafts = (): Preset[] => {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "[]") } catch { return [] }
}

// ------------------------------------------------------------------ styles --
const WB_CSS = `
  .wb * { box-sizing: border-box; }
  .wb { font-family: ${T.font}; font-weight: 400; color: ${T.ink}; }
  .wb-header { display: flex; align-items: center; gap: 14px; padding: 12px 20px;
    background: #FFF; border-bottom: 1px solid #E7E1D6; flex-wrap: wrap; }
  .wb-title { display: flex; gap: 10px; align-items: center; font-size: 14px; font-weight: 500; }
  .wb-main { display: flex; align-items: stretch; }
  .wb-stage { flex: 1; min-width: 0; padding: 20px 24px 64px; }
  .wb-panel { width: 336px; flex-shrink: 0; background: #FFF; border-left: 1px solid #E7E1D6;
    padding: 8px 20px 24px; overflow-y: auto; height: calc(100vh - 57px); position: sticky; top: 0; }
  .wb-toolbar { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; flex-wrap: wrap; }
  .wb-section { font-size: 11px; font-weight: 500; color: ${T.inkFaint}; text-transform: uppercase;
    margin: 20px 0 6px; }
  .wb-field { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 32px; }
  .wb-label { font-size: 12.5px; color: ${T.inkSoft}; flex-shrink: 0; }
  .wb-input, .wb-select { height: 28px; border: 1px solid #DDD6C8; border-radius: 8px; padding: 0 8px;
    font: 12.5px ${T.font}; background: #FCFBF8; color: ${T.ink}; }
  .wb-input { width: 60px; }
  .wb-input.wide { width: 76px; }
  .wb-input.grow { width: 100%; }
  .wb-select { max-width: 196px; }
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
  .wb-seg { display: inline-flex; background: #F0EBDF; border-radius: 8px; padding: 2px; gap: 2px; }
  .wb-seg button { height: 24px; padding: 0 10px; border-radius: 6px; border: none; background: transparent;
    font: 12px ${T.font}; color: ${T.inkSoft}; cursor: pointer; }
  .wb-seg button.on { background: #FFF; color: ${T.ink}; box-shadow: 0 1px 2px rgba(0,0,0,.07); }
  .wb-slider { -webkit-appearance: none; appearance: none; height: 4px; border-radius: 2px;
    background: #E2DCCF; flex: 1; min-width: 60px; cursor: pointer; }
  .wb-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%;
    background: ${T.brand}; border: 2px solid #FFF; box-shadow: 0 1px 3px rgba(0,0,0,.25); cursor: pointer; }
  .wb-slider::-moz-range-thumb { width: 12px; height: 12px; border-radius: 50%; background: ${T.brand};
    border: 2px solid #FFF; box-shadow: 0 1px 3px rgba(0,0,0,.25); cursor: pointer; }
  .wb-switch { width: 34px; height: 20px; border-radius: 10px; background: #DDD6C8; border: none;
    position: relative; cursor: pointer; transition: background .15s ease; flex-shrink: 0; }
  .wb-switch.on { background: ${T.brand}; }
  .wb-switch::after { content: ""; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px;
    border-radius: 50%; background: #FFF; box-shadow: 0 1px 2px rgba(0,0,0,.2); transition: left .15s ease; }
  .wb-switch.on::after { left: 16px; }
  .wb-corner { width: 46px; height: 38px; border: 1px solid #DDD6C8; border-radius: 8px;
    position: relative; background: #FCFBF8; flex-shrink: 0; }
  .wb-corner span { position: absolute; width: 10px; height: 10px; border-radius: 3px;
    border: 1.5px solid #C6BEAC; background: #FFF; cursor: pointer; }
  .wb-corner span.on { background: ${T.brand}; border-color: ${T.brand}; }
  .wb-swatch { width: 38px; height: 28px; border: 1px solid #DDD6C8; border-radius: 7px;
    background: ${T.pageContainer}; position: relative; overflow: hidden; cursor: pointer; padding: 0; }
  .wb-swatch.on { border-color: ${T.brand}; box-shadow: 0 0 0 2px rgba(0, 33, 204, 0.15); }
  .wb-time { font-variant-numeric: tabular-nums; font-size: 12px; color: ${T.inkSoft}; width: 42px; }
  .wb-hint { font-size: 11.5px; color: ${T.inkFaint}; line-height: 1.5; }
  .wb-grab { position: absolute; right: -16px; top: 50%; transform: translateY(-50%);
    width: 10px; height: 52px; border-radius: 5px; background: #D8D1C2; cursor: ew-resize; }
  .wb-grab:hover { background: #C6BEAC; }
  .wb-float { position: absolute; left: 12px; bottom: 12px; background: rgba(26,26,26,.82); color: #F9F4EB;
    font-size: 11px; padding: 5px 10px; border-radius: 7px; pointer-events: none; }
`

// -------------------------------------------------------------- UI pieces ---
const Section = (p: { title: string }) => <div className="wb-section">{p.title}</div>

const Field = (p: { label: string; children: React.ReactNode }) => (
  <div className="wb-field">
    <span className="wb-label">{p.label}</span>
    <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flex: "0 1 auto" }}>{p.children}</span>
  </div>
)

const Num = (p: { v: number; set: (n: number) => void; min?: number; max?: number; step?: number; wide?: boolean }) => (
  <input type="number" className={"wb-input" + (p.wide ? " wide" : "")} value={p.v} min={p.min} max={p.max}
    step={p.step ?? 1} onChange={(e) => p.set(+e.target.value)} />
)

const Sel = (p: { v: string; set: (s: string) => void; options: string[]; titles?: string[]; grow?: boolean }) => (
  <select className="wb-select" style={p.grow ? { width: "100%", maxWidth: "none" } : undefined}
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
    <span style={{ width: 36, fontSize: 12, color: T.inkSoft, textAlign: "right" }}>{p.fmt ? p.fmt(p.v) : p.v}</span>
  </>
)

const CornerPick = (p: { v: string; set: (s: string) => void }) => (
  <span className="wb-corner">
    {(["top-left", "top-right", "bottom-left", "bottom-right"] as const).map((c) => (
      <span key={c} className={p.v === c ? "on" : ""} onClick={() => p.set(c)} style={{
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
  const dragRef = React.useRef<{ mode: string; startX: number; startY: number; r0: Rect } | null>(null)

  const toDesign = (e: React.MouseEvent) => {
    const b = wrapRef.current!.getBoundingClientRect()
    const s = b.width / entry.w
    return { x: (e.clientX - b.left) / s, y: (e.clientY - b.top) / s }
  }
  const clampRect = (r: Rect): Rect => ({
    x: Math.round(Math.max(0, Math.min(entry.w - 60, r.x))),
    y: Math.round(Math.max(0, Math.min(entry.h - 40, r.y))),
    w: Math.round(Math.max(60, Math.min(entry.w - Math.max(0, r.x), r.w))),
    h: Math.round(Math.max(40, Math.min(entry.h - Math.max(0, r.y), r.h))),
  })
  const onMove = (e: React.MouseEvent) => {
    const d = dragRef.current
    if (!d) return
    const p = toDesign(e)
    const dx = p.x - d.startX, dy = p.y - d.startY
    const r0 = d.r0
    let r = { ...r0 }
    if (d.mode === "move") { r.x = r0.x + dx; r.y = r0.y + dy }
    else {
      if (d.mode.includes("w")) { r.x = r0.x + dx; r.w = r0.w - dx }
      if (d.mode.includes("e")) { r.w = r0.w + dx }
      if (d.mode.includes("n")) { r.y = r0.y + dy; r.h = r0.h - dy }
      if (d.mode.includes("s")) { r.h = r0.h + dy }
    }
    props.onChange(clampRect(r))
  }
  const start = (mode: string) => (e: React.MouseEvent) => {
    e.stopPropagation()
    const p = toDesign(e)
    dragRef.current = { mode, startX: p.x, startY: p.y, r0: { ...props.rect } }
  }

  const b = wrapRef.current?.getBoundingClientRect()
  const s = b ? b.width / entry.w : 1
  const r = props.rect
  const Scene = entry.Scene
  return (
    <div
      ref={wrapRef}
      className="ll-noanim"
      style={{ position: "relative", cursor: "crosshair", userSelect: "none", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.08)" }}
      onMouseMove={onMove}
      onMouseUp={() => (dragRef.current = null)}
      onMouseLeave={() => (dragRef.current = null)}
      onMouseDown={start("move")}
    >
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
          ["nw", 0, 0, "nwse-resize"], ["n", 0.5, 0, "ns-resize"], ["ne", 1, 0, "nesw-resize"],
          ["e", 1, 0.5, "ew-resize"], ["se", 1, 1, "nwse-resize"], ["s", 0.5, 1, "ns-resize"],
          ["sw", 0, 1, "nesw-resize"], ["w", 0, 0.5, "ew-resize"],
        ].map(([m, fx, fy, cur]) => (
          <div key={m as string} onMouseDown={start(m as string)} style={{
            position: "absolute",
            left: (r.x + r.w * (fx as number)) * s - 5, top: (r.y + r.h * (fy as number)) * s - 5,
            width: 10, height: 10, background: "#FFF", border: "1.5px solid #0021CC", borderRadius: 3,
            cursor: cur as string, pointerEvents: "auto",
          }} />
        ))}
      </div>
      <div className="wb-float">frame the crop · drag to move, handles to resize</div>
    </div>
  )
}

// -------------------------------------------------------------- workbench ---
export default function Workbench(): JSX.Element {
  const [cfg, setCfg] = React.useState<Cfg>({ ...CANVAS_DEFAULTS, canvasHeight: 300, pattern: "dots", radius: 16 })
  const [presetSel, setPresetSel] = React.useState("")
  const [drafts, setDrafts] = React.useState<Preset[]>(loadDrafts)
  const [saveName, setSaveName] = React.useState("")
  const [previewW, setPreviewW] = React.useState<number | "full">("full")
  const [cropEdit, setCropEdit] = React.useState(false)
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

  const resolved = cfg.content === "custom"
    ? { entry: byKey(cfg.customScene), framing: cfg.cropW > 0 ? { name: "custom", x: cfg.cropX, y: cfg.cropY, w: cfg.cropW, h: cfg.cropH } : undefined }
    : resolveContent(cfg.content)
  const rect: Rect = resolved.framing ?? { x: 0, y: 0, w: resolved.entry.w, h: resolved.entry.h }

  // --- pin drag + wheel zoom over the live canvas ---------------------------
  const pinDrag = React.useRef<{ mx: number; my: number; left: number; top: number } | null>(null)
  const onPinDown = (e: React.MouseEvent) => {
    if (cfg.fit !== "pinned" || !canvasRef.current) return
    const cb = canvasRef.current.getBoundingClientRect()
    const shotW = rect.w * cfg.zoom, shotH = rect.h * cfg.zoom
    const left = cfg.anchor.includes("left") ? cfg.insetX : cb.width - cfg.insetX - shotW
    const top = cfg.anchor.includes("top") ? cfg.insetY : cb.height - cfg.insetY - shotH
    pinDrag.current = { mx: e.clientX, my: e.clientY, left, top }
  }
  const onPinMove = (e: React.MouseEvent) => {
    const d = pinDrag.current
    if (!d || !canvasRef.current) return
    const cb = canvasRef.current.getBoundingClientRect()
    const shotW = rect.w * cfg.zoom, shotH = rect.h * cfg.zoom
    const left = d.left + (e.clientX - d.mx)
    const top = d.top + (e.clientY - d.my)
    // anchor follows the pointer: drag toward a corner to pin there
    const px = e.clientX - cb.left, py = e.clientY - cb.top
    const anchor = `${py < cb.height / 2 ? "top" : "bottom"}-${px < cb.width / 2 ? "left" : "right"}` as Cfg["anchor"]
    const insetX = Math.round(Math.max(0, anchor.includes("left") ? left : cb.width - left - shotW))
    const insetY = Math.round(Math.max(0, anchor.includes("top") ? top : cb.height - top - shotH))
    setCfg((c) => ({ ...c, anchor, insetX, insetY }))
    setPresetSel("")
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

  const widthDrag = React.useRef<{ mx: number; w: number } | null>(null)

  // --- preset apply / save --------------------------------------------------
  const allPresets = [...PRESETS, ...drafts]
  const applyPreset = (name: string) => {
    setPresetSel(name)
    const p = allPresets.find((x) => x.name === name)
    if (p) setCfg({ ...CANVAS_DEFAULTS, ...(p.props as Partial<Cfg>) })
  }
  const changedProps = (): Partial<Cfg> => {
    const out: Partial<Cfg> = {}
    for (const k of Object.keys(CANVAS_DEFAULTS) as Array<keyof Cfg>) {
      if (cfg[k] !== CANVAS_DEFAULTS[k]) (out as any)[k] = cfg[k]
    }
    return out
  }
  const presetBlock = () => {
    const props = changedProps()
    const body = Object.entries(props).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(", ")
    return `  {\n    name: ${JSON.stringify(saveName || "untitled")},\n    props: { ${body} },\n  },`
  }
  const jsxBlock = () => {
    const props = changedProps()
    const body = Object.entries(props).map(([k, v]) => typeof v === "string" ? `${k}=${JSON.stringify(v)}` : `${k}={${JSON.stringify(v)}}`).join(" ")
    return `<SceneCanvas variant="callout" ${body} />`
  }
  const saveDraft = () => {
    if (!saveName) return
    const next = [...drafts.filter((d) => d.name !== saveName), { name: saveName, props: changedProps() as Partial<SceneCanvasProps> }]
    setDrafts(next)
    localStorage.setItem(DRAFT_KEY, JSON.stringify(next))
    setPresetSel(saveName)
  }

  const punch = (k: "segStart" | "segEnd") => () => { setCfg((c) => ({ ...c, [k]: Math.round(t / 100) * 100 })); setPresetSel("") }

  const editCropStart = () => {
    setCfg((c) => ({
      ...c, content: "custom", customScene: resolved.entry.key,
      cropX: rect.x, cropY: rect.y, cropW: rect.w, cropH: rect.h,
    }))
    if (!scrubOn) { setScrubOn(true); setPlayStart(null) }
    setCropEdit(true)
    setPresetSel("")
  }

  const pw = previewW === "full" ? "100%" : previewW
  const bpValue = previewW === "full" ? "full" : String(previewW)

  return (
    <div className="wb" style={{ background: T.pageBg, minHeight: "100vh" }}>
      <style>{WB_CSS}</style>

      {/* header */}
      <div className="wb-header">
        <span className="wb-title"><Logo /> Scene Workbench</span>
        <Sel v={presetSel} set={applyPreset}
          options={["", ...allPresets.map((p) => p.name)]}
          titles={["Load a preset…", ...allPresets.map((p) => p.name)]} />
        <span style={{ flex: 1 }} />
        <input className="wb-input" style={{ width: 170 }} placeholder="Preset name…" value={saveName}
          onChange={(e) => setSaveName(e.target.value)} />
        <button className="wb-btn primary" onClick={saveDraft}>Save draft</button>
        <CopyBtn label="Copy preset TS" text={presetBlock} />
        <CopyBtn label="Copy JSX" text={jsxBlock} />
      </div>

      <div className="wb-main">
        {/* stage */}
        <div className="wb-stage">
          <div className="wb-toolbar">
            {!scrubOn ? (
              <button className="wb-btn" onClick={() => { setScrubOn(true); setPlayStart(null) }}>🎚 Scrub</button>
            ) : (
              <>
                <button className="wb-btn primary" style={{ width: 44, justifyContent: "center" }}
                  onClick={() => setPlayStart(playing ? null : t)}>
                  {playing ? "⏸" : "▶"}
                </button>
                <input type="range" className="wb-slider" style={{ maxWidth: 300 }} min={0} max={25000} step={100}
                  value={t} onChange={(e) => { setPlayStart(null); setT(+e.target.value) }} />
                <span className="wb-time">{(t / 1000).toFixed(1)}s</span>
                <button className="wb-btn" onClick={punch("segStart")}>⇤ In</button>
                <button className="wb-btn" onClick={punch("segEnd")}>⇥ Out</button>
                <button className="wb-btn" onClick={() => { setScrubOn(false); setPlayStart(null); setCropEdit(false); setRunNonce((n) => n + 1) }}>Live</button>
              </>
            )}
            <span style={{ flex: 1 }} />
            <Seg v={bpValue} set={(v) => setPreviewW(v === "full" ? "full" : +v)}
              options={[["375", "375"], ["768", "768"], ["1024", "1024"], ["full", "Full"]]} />
            <button className={"wb-btn" + (cropEdit ? " accent" : "")}
              onClick={() => (cropEdit ? setCropEdit(false) : editCropStart())}>
              {cropEdit ? "✓ Done cropping" : "▣ Edit crop"}
            </button>
          </div>

          {/* resizable preview frame */}
          <div style={{ position: "relative", width: pw, maxWidth: "100%", margin: "0 auto", transition: widthDrag.current ? "none" : "width .2s ease" }}
            onMouseMove={(e) => { const d = widthDrag.current; if (d) setPreviewW(Math.max(300, d.w + (e.clientX - d.mx))) }}
            onMouseUp={() => (widthDrag.current = null)}
            onMouseLeave={() => (widthDrag.current = null)}
          >
            <div ref={previewRef}
              className={scrubOn && !playing ? "ll-noanim" : undefined}
              onMouseDown={onPinDown}
              onMouseMove={onPinMove}
              onMouseUp={() => (pinDrag.current = null)}
              style={{ position: "relative", cursor: cfg.fit === "pinned" && !cropEdit ? "grab" : undefined }}
            >
              {cropEdit ? (
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
            <div className="wb-grab"
              onMouseDown={(e) => { widthDrag.current = { mx: e.clientX, w: previewRef.current?.getBoundingClientRect().width ?? 0 }; if (previewW === "full") setPreviewW(previewRef.current?.getBoundingClientRect().width ?? 800) }}
            />
          </div>
          <div style={{ textAlign: "center", marginTop: 10 }} className="wb-hint">
            {previewW === "full" ? "full width" : `${Math.round(previewW as number)}px`} · drag the handle to test any width
          </div>
        </div>

        {/* inspector */}
        <div className="wb-panel">
          <Section title="Content" />
          <Field label="Snippet">
            <Sel v={cfg.content} set={(v) => set("content")(v)} options={[...framingOptions(), "custom"]} />
          </Field>
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
          <Field label="Canvas height"><Num v={cfg.canvasHeight} set={set("canvasHeight")} wide /><span className="wb-hint">0 = auto</span></Field>

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
            <input className="wb-input wide" value={cfg.bgColor} onChange={(e) => set("bgColor")(e.target.value)} />
          </Field>
          <Field label="Padding x · y">
            <Num v={cfg.padX} set={set("padX")} /><Num v={cfg.padY} set={set("padY")} />
          </Field>
          <Field label="Radius"><Num v={cfg.radius} set={set("radius")} min={0} max={16} /></Field>

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
            Scrub to a beat and use ⇤ In / ⇥ Out to set the loop window. 0 · 0 plays the whole session.
          </div>

          <div className="wb-hint" style={{ marginTop: 20, borderTop: "1px solid #EEE8DD", paddingTop: 12 }}>
            <strong style={{ fontWeight: 500, color: T.inkSoft }}>Saving:</strong> drafts live in this browser and
            appear in the preset menu. Copy preset TS into <code>ListenPresets.tsx</code> to make a composition
            permanent — it then shows up in SceneCanvas's Preset dropdown in Framer.
          </div>
        </div>
      </div>
    </div>
  )
}
