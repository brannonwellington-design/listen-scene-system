// Workbench — the composition studio (/?compose=1). Local-only; not pasted
// into Framer. Tune every SceneCanvas setting live, manipulate the shot
// directly (drag to pin, wheel to zoom, drag-resize the crop), scrub to the
// beat, then save the composition as a named preset.
import * as React from "react"
import SceneCanvas, { CANVAS_DEFAULTS, SceneCanvasProps } from "./SceneCanvas"
import { PRESETS, Preset } from "./ListenPresets"
import { framingOptions, resolveContent, byKey, REGISTRY } from "./ListenRegistry"
import { T, ScaleBox } from "./ListenKit"

type Cfg = typeof CANVAS_DEFAULTS
const DRAFT_KEY = "llPresetDrafts"

const loadDrafts = (): Preset[] => {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "[]") } catch { return [] }
}

// ------------------------------------------------------------ UI helpers ----
const rowStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: T.inkSoft }
const inputStyle: React.CSSProperties = { font: "inherit", fontSize: 12, border: "1px solid #C6C0B4", borderRadius: 6, padding: "3px 6px", background: "#FFF", width: 64 }
const btnStyle: React.CSSProperties = { font: "inherit", fontSize: 12, border: "1px solid #C6C0B4", borderRadius: 6, padding: "3px 10px", background: "transparent", cursor: "pointer" }

function Row(props: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <div style={rowStyle}>
      <span style={{ width: 92, flexShrink: 0 }}>{props.label}</span>
      {props.children}
    </div>
  )
}

function Num(props: { v: number; set: (n: number) => void; min?: number; max?: number; step?: number; wide?: boolean }): JSX.Element {
  return (
    <input type="number" value={props.v} min={props.min} max={props.max} step={props.step ?? 1}
      onChange={(e) => props.set(+e.target.value)} style={{ ...inputStyle, width: props.wide ? 84 : 64 }} />
  )
}

function Sel(props: { v: string; set: (s: string) => void; options: string[]; titles?: string[] }): JSX.Element {
  return (
    <select value={props.v} onChange={(e) => props.set(e.target.value)} style={{ ...inputStyle, width: "auto", maxWidth: 210 }}>
      {props.options.map((o, i) => <option key={o} value={o}>{props.titles?.[i] ?? o}</option>)}
    </select>
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
  const handle = (mode: string, left: number, top: number, cursor: string) => (
    <div key={mode} onMouseDown={start(mode)} style={{
      position: "absolute", left: left - 5, top: top - 5, width: 10, height: 10,
      background: "#FFF", border: "1.5px solid #0021CC", borderRadius: 2, cursor, zIndex: 3,
    }} />
  )
  const Scene = entry.Scene
  return (
    <div
      ref={wrapRef}
      className="ll-noanim"
      style={{ position: "relative", cursor: "crosshair", userSelect: "none" }}
      onMouseMove={onMove}
      onMouseUp={() => (dragRef.current = null)}
      onMouseLeave={() => (dragRef.current = null)}
      onMouseDown={start("move")}
    >
      <ScaleBox designWidth={entry.w} designHeight={entry.h}>
        <Scene active runKey={0} hold={props.holdT} />
      </ScaleBox>
      {/* crop rect + scrim + handles */}
      <div style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }}>
        <div style={{
          position: "absolute", left: r.x * s, top: r.y * s, width: r.w * s, height: r.h * s,
          border: "1.5px solid #0021CC", boxShadow: "0 0 0 9999px rgba(18, 15, 8, 0.35)",
        }} />
      </div>
      <div style={{ position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none" }}>
        <div style={{ position: "absolute", left: r.x * s, top: r.y * s, width: r.w * s, height: r.h * s, pointerEvents: "auto", cursor: "move" }} onMouseDown={start("move")} />
        {[
          ["nw", 0, 0, "nwse-resize"], ["n", 0.5, 0, "ns-resize"], ["ne", 1, 0, "nesw-resize"],
          ["e", 1, 0.5, "ew-resize"], ["se", 1, 1, "nwse-resize"], ["s", 0.5, 1, "ns-resize"],
          ["sw", 0, 1, "nesw-resize"], ["w", 0, 0.5, "ew-resize"],
        ].map(([m, fx, fy, cur]) => (
          <div key={m as string} style={{ position: "absolute", left: (r.x + r.w * (fx as number)) * s, top: (r.y + r.h * (fy as number)) * s, pointerEvents: "auto" }}>
            {handle(m as string, 0, 0, cur as string)}
          </div>
        ))}
      </div>
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

  // resolved content for gesture math + crop editor seed
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

  // preview width drag handle
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
    // editing always works on an explicit custom rect for the current scene
    setCfg((c) => ({
      ...c, content: "custom", customScene: resolved.entry.key,
      cropX: rect.x, cropY: rect.y, cropW: rect.w, cropH: rect.h,
    }))
    if (!scrubOn) { setScrubOn(true); setPlayStart(null) }
    setCropEdit(true)
    setPresetSel("")
  }

  const pw = previewW === "full" ? "100%" : previewW
  return (
    <div style={{ background: T.pageBg, minHeight: "100vh", fontFamily: T.font, color: T.ink, padding: "20px 24px 80px" }}>
      {/* header: presets + save */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <strong style={{ fontWeight: 400, fontSize: 15 }}>Composition workbench</strong>
        <Sel v={presetSel} set={applyPreset} options={["", ...allPresets.map((p) => p.name)]} titles={["— preset —", ...allPresets.map((p) => p.name)]} />
        <span style={{ flex: 1 }} />
        <input placeholder="preset name…" value={saveName} onChange={(e) => setSaveName(e.target.value)} style={{ ...inputStyle, width: 160 }} />
        <button style={btnStyle} onClick={saveDraft}>Save draft</button>
        <button style={btnStyle} onClick={() => navigator.clipboard?.writeText(presetBlock())}>Copy preset TS</button>
        <button style={btnStyle} onClick={() => navigator.clipboard?.writeText(jsxBlock())}>Copy JSX</button>
      </div>

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        {/* preview column */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* transport */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, fontSize: 12, color: T.inkSoft }}>
            {!scrubOn ? (
              <button style={btnStyle} onClick={() => { setScrubOn(true); setPlayStart(null) }}>🎚 scrub</button>
            ) : (
              <>
                <button style={{ ...btnStyle, background: T.ink, color: "#F9F4EB", borderColor: T.ink, width: 62 }}
                  onClick={() => setPlayStart(playing ? null : t)}>
                  {playing ? "⏸" : "▶"}
                </button>
                <input type="range" min={0} max={25000} step={100} value={t}
                  onChange={(e) => { setPlayStart(null); setT(+e.target.value) }} style={{ flex: 1, maxWidth: 360 }} />
                <span style={{ fontVariantNumeric: "tabular-nums", width: 44 }}>{(t / 1000).toFixed(1)}s</span>
                <button style={btnStyle} onClick={punch("segStart")}>⤓ seg start</button>
                <button style={btnStyle} onClick={punch("segEnd")}>⤓ seg end</button>
                <button style={btnStyle} onClick={() => { setScrubOn(false); setPlayStart(null); setCropEdit(false); setRunNonce((n) => n + 1) }}>✕ live</button>
              </>
            )}
            <span style={{ flex: 1 }} />
            {[375, 768, 1024].map((wpx) => (
              <button key={wpx} style={{ ...btnStyle, background: previewW === wpx ? "#E2DCCF" : "transparent" }} onClick={() => setPreviewW(wpx)}>{wpx}</button>
            ))}
            <button style={{ ...btnStyle, background: previewW === "full" ? "#E2DCCF" : "transparent" }} onClick={() => setPreviewW("full")}>full</button>
            <button style={{ ...btnStyle, background: cropEdit ? "#0021CC" : "transparent", color: cropEdit ? "#F9F4EB" : "inherit", borderColor: cropEdit ? "#0021CC" : "#C6C0B4" }}
              onClick={() => (cropEdit ? setCropEdit(false) : editCropStart())}>
              {cropEdit ? "✓ done cropping" : "▣ edit crop"}
            </button>
          </div>

          {/* resizable preview frame */}
          <div style={{ position: "relative", width: pw, maxWidth: "100%", transition: widthDrag.current ? "none" : "width .2s ease" }}
            onMouseMove={(e) => { const d = widthDrag.current; if (d) setPreviewW(Math.max(300, d.w + (e.clientX - d.mx))) }}
            onMouseUp={() => (widthDrag.current = null)}
            onMouseLeave={() => (widthDrag.current = null)}
          >
            <div ref={previewRef}
              className={scrubOn && !playing ? "ll-noanim" : undefined}
              onMouseDown={onPinDown}
              onMouseMove={onPinMove}
              onMouseUp={() => (pinDrag.current = null)}
              style={{ cursor: cfg.fit === "pinned" && !cropEdit ? "grab" : undefined }}
            >
              {cropEdit ? (
                <CropEditor sceneKey={cfg.customScene} holdT={t}
                  rect={{ x: cfg.cropX, y: cfg.cropY, w: cfg.cropW, h: cfg.cropH }}
                  onChange={(r) => { setCfg((c) => ({ ...c, cropX: r.x, cropY: r.y, cropW: r.w, cropH: r.h })); setPresetSel("") }} />
              ) : (
                <SceneCanvas key={runNonce} variant="callout" {...cfg}
                  debugHold={scrubOn && !playing ? t : undefined}
                  debugPlayFrom={scrubOn && playing ? playStart! : undefined}
                  debugOnTime={scrubOn ? setT : undefined}
                  debugCanvasRef={canvasRef}
                />
              )}
            </div>
            {/* width drag handle */}
            <div
              onMouseDown={(e) => { widthDrag.current = { mx: e.clientX, w: previewRef.current?.getBoundingClientRect().width ?? 0 }; if (previewW === "full") setPreviewW(previewRef.current?.getBoundingClientRect().width ?? 800) }}
              style={{ position: "absolute", right: -14, top: "50%", transform: "translateY(-50%)", width: 10, height: 56, borderRadius: 5, background: "#C6C0B4", cursor: "ew-resize" }}
            />
          </div>
          {cfg.fit === "pinned" && !cropEdit && (
            <div style={{ marginTop: 8, fontSize: 11.5, color: T.inkFaint }}>drag the canvas to reposition the pinned shot · scroll to zoom</div>
          )}
        </div>

        {/* controls panel */}
        <div style={{ width: 320, flexShrink: 0, display: "flex", flexDirection: "column", gap: 8, background: "#FFFFFF", border: "1px solid #E2DCCF", borderRadius: 12, padding: 16 }}>
          <Row label="Content">
            <Sel v={cfg.content} set={(v) => set("content")(v)} options={[...framingOptions(), "custom"]} />
          </Row>
          {cfg.content === "custom" && (
            <>
              <Row label="Scene"><Sel v={cfg.customScene} set={(v) => set("customScene")(v)} options={REGISTRY.map((e) => e.key)} /></Row>
              <Row label="Crop x/y">
                <Num v={cfg.cropX} set={set("cropX")} /><Num v={cfg.cropY} set={set("cropY")} />
              </Row>
              <Row label="Crop w/h">
                <Num v={cfg.cropW} set={set("cropW")} /><Num v={cfg.cropH} set={set("cropH")} />
              </Row>
            </>
          )}
          <div style={{ borderTop: "1px solid #EEE8DD", margin: "4px 0" }} />
          <Row label="Fit">
            <Sel v={cfg.fit} set={(v) => set("fit")(v as Cfg["fit"])} options={["responsive", "pinned"]} />
          </Row>
          {cfg.fit === "pinned" && (
            <>
              <Row label="Anchor"><Sel v={cfg.anchor} set={(v) => set("anchor")(v as Cfg["anchor"])} options={["top-left", "top-right", "bottom-left", "bottom-right"]} /></Row>
              <Row label="Insets x/y"><Num v={cfg.insetX} set={set("insetX")} /><Num v={cfg.insetY} set={set("insetY")} /></Row>
              <Row label="Zoom">
                <input type="range" min={0.4} max={2} step={0.05} value={cfg.zoom} onChange={(e) => set("zoom")(+e.target.value)} style={{ flex: 1 }} />
                <span style={{ width: 36, fontSize: 12 }}>{cfg.zoom.toFixed(2)}</span>
              </Row>
              <Row label="When small"><Sel v={cfg.smallBehavior} set={(v) => set("smallBehavior")(v as Cfg["smallBehavior"])} options={["fit", "mask"]} /></Row>
              {cfg.smallBehavior === "fit" && <Row label="Below (px)"><Num v={cfg.fitBelow} set={set("fitBelow")} wide /></Row>}
            </>
          )}
          <Row label="Canvas h (0=auto)"><Num v={cfg.canvasHeight} set={set("canvasHeight")} wide /></Row>
          <div style={{ borderTop: "1px solid #EEE8DD", margin: "4px 0" }} />
          <Row label="Pattern">
            <Sel v={cfg.pattern} set={(v) => set("pattern")(v as Cfg["pattern"])} options={["none", "dots", "grid", "circles", "crosshairs"]} />
          </Row>
          {cfg.pattern !== "none" && (
            <>
              <Row label="Spacing"><Num v={cfg.patternSpacing} set={set("patternSpacing")} min={8} max={120} step={4} /></Row>
              <Row label="Opacity">
                <input type="range" min={0.05} max={1} step={0.05} value={cfg.patternOpacity} onChange={(e) => set("patternOpacity")(+e.target.value)} style={{ flex: 1 }} />
                <span style={{ width: 32, fontSize: 12 }}>{cfg.patternOpacity.toFixed(2)}</span>
              </Row>
            </>
          )}
          <Row label="Fill">
            <input type="color" value={/^#/.test(cfg.bgColor) ? cfg.bgColor : "#EEE8DD"} onChange={(e) => set("bgColor")(e.target.value)} style={{ width: 36, height: 24, border: "none", background: "none", padding: 0 }} />
            <input value={cfg.bgColor} onChange={(e) => set("bgColor")(e.target.value)} style={{ ...inputStyle, width: 92 }} />
          </Row>
          <Row label="Padding x/y"><Num v={cfg.padX} set={set("padX")} /><Num v={cfg.padY} set={set("padY")} /></Row>
          <Row label="Radius"><Num v={cfg.radius} set={set("radius")} min={0} max={16} /></Row>
          <div style={{ borderTop: "1px solid #EEE8DD", margin: "4px 0" }} />
          <Row label="Loop">
            <input type="checkbox" checked={cfg.loop} onChange={(e) => set("loop")(e.target.checked)} />
            <span>pause</span><Num v={cfg.loopPause} set={set("loopPause")} min={0} max={20} step={0.5} />
          </Row>
          <Row label="Segment"><Num v={cfg.segStart} set={set("segStart")} step={100} wide /><Num v={cfg.segEnd} set={set("segEnd")} step={100} wide /></Row>
          <div style={{ fontSize: 11, color: T.inkFaint, marginTop: 4 }}>
            Save draft keeps it in this browser and the preset dropdown. Copy
            preset TS and paste into ListenPresets.tsx to make it permanent.
          </div>
        </div>
      </div>
    </div>
  )
}
