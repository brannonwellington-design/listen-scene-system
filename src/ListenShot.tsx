// ListenShot — one product shot in a canvas: a scene, fragment, or custom
// crop, framed by the fit engine (scale to fit, pinned, or bleed) over the
// canvas fill and pattern. SceneCanvas's single layout is this, and each
// multi-step step is this plus the rail; ListenScene (the Framer component)
// is this alone, configured by a JSON blob that `shotJson` writes.
import * as React from "react"
import { T, PatternLayer, PatternType } from "./ListenKit"
import { byKey, RegistryEntry } from "./ListenRegistry"
import { SceneProps } from "./ListenScenes"

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

// ---------------------------------------------------------------- config -----
/** single-shot defaults — the subset of SceneCanvas's controls one shot reads */
export const SHOT_DEFAULTS = {
  content: "design-study", customScene: "design-study",
  cropX: 0, cropY: 0, cropW: 0, cropH: 0,
  loop: true, loopPause: 3, segStart: 0, segEnd: 0,
  startCollapsed: false, startTheme: "light" as "light" | "dark",
  fit: "responsive" as "responsive" | "pinned" | "bleed", bleedShow: 880, bleedRatio: 0.76, anchor: "top-left" as Anchor, insetX: 40, insetY: 40,
  /** bleed: the inset as a fraction of the card's width (never under 12px),
   *  so the crop holds at every size; 0 = fixed insetX / insetY */
  bleedInset: 0,
  zoom: 0.5, smallBehavior: "fit" as "fit" | "mask", fitBelow: 480, canvasHeight: 0,
  pattern: "none" as PatternType, patternSpacing: 16, patternOpacity: 1,
  bgColor: T.pageContainer, padX: 56, padY: 44, radius: 0,
}
export type ShotConfig = typeof SHOT_DEFAULTS

/** a shot as JSON, keeping only what differs from the defaults (plus the shot
 *  itself), so the blob pasted into ListenScene stays short */
export function shotJson(cfg: Partial<ShotConfig>): string {
  return JSON.stringify(shotObject(cfg))
}

/** `shotJson` as an object, for nesting in a per-breakpoint bundle */
export function shotObject(cfg: Partial<ShotConfig>): Record<string, unknown> {
  const out: Record<string, unknown> = { content: cfg.content ?? SHOT_DEFAULTS.content }
  const custom = out.content === "custom"
  for (const k of Object.keys(SHOT_DEFAULTS) as Array<keyof ShotConfig>) {
    if (k === "content") continue
    // crop fields mean nothing unless the shot is a custom crop
    if (!custom && (k === "customScene" || k.startsWith("crop"))) continue
    const v = cfg[k]
    if (v !== undefined && v !== SHOT_DEFAULTS[k]) out[k] = v
  }
  return out
}

/** parse a ListenScene blob onto the defaults; unknown keys are dropped and
 *  values of the wrong type fall back to the default */
export function parseShot(json: string): { cfg: ShotConfig; error?: string } {
  if (!json || !json.trim()) return { cfg: { ...SHOT_DEFAULTS } }
  let raw: unknown
  try { raw = JSON.parse(json) } catch (e) { return { cfg: { ...SHOT_DEFAULTS }, error: "Config isn't valid JSON" } }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { cfg: { ...SHOT_DEFAULTS }, error: "Config must be a JSON object" }
  const cfg: any = { ...SHOT_DEFAULTS }
  for (const k of Object.keys(SHOT_DEFAULTS) as Array<keyof ShotConfig>) {
    const v = (raw as any)[k]
    if (v !== undefined && typeof v === typeof SHOT_DEFAULTS[k]) cfg[k] = v
  }
  const missing = [cfg.content === "custom" ? cfg.customScene : cfg.content].find((k) => byKey(k).key !== k)
  return { cfg, error: missing ? `No shot called "${missing}"` : undefined }
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
export function Single(props: ShotConfig & {
  debugHold?: number
  debugPlayFrom?: number
  debugOnTime?: (t: number) => void
  debugCanvasRef?: React.Ref<HTMLDivElement>
  /** multi-step hands control here: called when the shot finishes instead of looping */
  onFinish?: () => void
  /** multi-step framing: "card" draws the hairline at every fit; "bare" drops
   *  fill, radius, and line (the stage panel draws its own) */
  frame?: "card" | "bare"
}): JSX.Element {
  const {
    content, customScene, cropX, cropY, cropW, cropH,
    loop, loopPause, segStart, segEnd,
    fit, anchor, insetX, insetY, zoom, smallBehavior, fitBelow, canvasHeight,
    bleedShow, bleedRatio, bleedInset,
    pattern, patternSpacing, patternOpacity, bgColor, padX, padY, radius,
    debugHold, debugPlayFrom, debugOnTime, debugCanvasRef, onFinish, frame,
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

  const bare = frame === "bare"
  const containerStyle: React.CSSProperties = {
    position: "relative", overflow: "hidden", background: bare ? "transparent" : bgColor, borderRadius: bare ? 0 : radius,
    width: "100%", boxSizing: "border-box",
    ...(!bare && (frame === "card" || fit === "bleed") ? { border: `1px solid ${T.pageLine}` } : {}),
  }

  if (fit === "bleed") {
    // a card with the shot inset from its top-left corner and running off the
    // right and bottom edges; scale follows the card width, so the crop reads
    // the same at every size
    // the larger of: `bleedShow` px across, or enough to still run off the
    // bottom when the card is tall (most of the shot's height, never all of it)
    const h = canvasHeight || availW * bleedRatio
    const ix = bleedInset > 0 ? Math.max(12, Math.round(availW * bleedInset)) : insetX
    const iy = bleedInset > 0 ? ix : insetY
    const s = availW > 0 ? Math.max(0.1, (availW - ix) / bleedShow, (h - iy) / (rect.h * 0.95)) : 0
    return (
      <div ref={setRefs} style={{ ...containerStyle, height: h }}>
        <PatternLayer type={pattern} spacing={patternSpacing} opacity={patternOpacity} />
        {s > 0 && (
          // one stroke, drawn here at 1 screen px in the card's own color
          // (the mock gives card and shot the same surface-tertiary); the
          // app's scaled border (a blurry ~0.6px at this size) is hidden, and
          // the radius is the app's 12, scaled with it
          <div key={runKey} className="ll-scene-fade ll-bleed" style={{
            position: "absolute", left: ix - 1, top: iy - 1,
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
