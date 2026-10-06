// ListenScene — one live product shot, configured by a JSON blob.
// The Framer component for placing scenes on a page: drop an instance per
// shot and paste its config (the workbench's "Export JSON" writes it). Single
// shots only; the multi-step carousels stay in SceneCanvas.
//   {"content":"design-study","segStart":8000,"segEnd":16000,"pattern":"dots","radius":16}
// Keys are SceneCanvas's single-shot controls (see SHOT_DEFAULTS); anything
// left out takes its default.
// One config per breakpoint. Breakpoint "Auto" picks by the instance's own
// width (the width the workbench framed each one at), so every breakpoint,
// canvas included, shows its own with no setup; Desktop / Tablet / Mobile
// force one. An empty Tablet or Mobile config falls back to the next size up
// (Mobile → Tablet → Desktop). The Desktop box also takes a bundle of all
// three, which "Export step JSON" writes:
//   {"desktop":{…},"tablet":{…},"mobile":{…}}
// A filled Tablet or Mobile box still wins over the bundle's entry.
// On the Framer canvas the shot holds still on one frame (the end of its
// segment, or of its session) unless "On canvas" is set to Animate.
import * as React from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { T, ensureCss, ShellPrefs, useShellPrefs } from "./ListenKit"
import { Single, parseShot } from "./ListenShot"

type Breakpoint = "desktop" | "tablet" | "mobile"

export type ListenSceneProps = {
  breakpoint?: "auto" | Breakpoint
  /** the Desktop config (named `config` so instances made before breakpoints keep theirs) */
  config?: string
  tablet?: string
  mobile?: string
  /** Framer canvas: hold one frame, or play as on the site */
  canvasMode?: "still" | "animate"
  /** the held frame, in seconds into the session; 0 = the end of the segment
   *  (or of the session when there's no segment) */
  stillAt?: number
}

/** Auto: the breakpoint for an instance this wide. 820 is where the
 *  multi-step layouts switch to their stacked card; the tablet / mobile line
 *  sits between the export widths (768 and 375). */
const breakpointFor = (w: number): Breakpoint => (w <= 0 || w >= 820 ? "desktop" : w >= 572 ? "tablet" : "mobile")

const ORDER: Record<Breakpoint, Breakpoint[]> = {
  desktop: ["desktop"],
  tablet: ["tablet", "desktop"],
  mobile: ["mobile", "tablet", "desktop"],
}

/** the Desktop box as a per-breakpoint bundle, or null when it's one config */
function bundleOf(json: string): Partial<Record<Breakpoint, unknown>> | null {
  try {
    const v = JSON.parse(json)
    if (!v || typeof v !== "object" || Array.isArray(v) || "content" in v) return null
    return ["desktop", "tablet", "mobile"].some((k) => k in v) ? v : null
  } catch { return null }
}

/** the config for a breakpoint: its own box, then its bundle entry, then the
 *  next size up */
function configFor(p: ListenSceneProps, bp: Breakpoint): string {
  const filled = (s?: string) => (s && s.trim() ? s : undefined)
  const bundle = bundleOf(p.config ?? "")
  const own: Record<Breakpoint, string | undefined> = {
    desktop: bundle ? undefined : filled(p.config), tablet: filled(p.tablet), mobile: filled(p.mobile),
  }
  for (const b of ORDER[bp]) {
    if (own[b]) return own[b]!
    if (bundle?.[b]) return JSON.stringify(bundle[b])
  }
  return bundle ? "" : p.config ?? ""
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function ListenScene(props: ListenSceneProps): JSX.Element {
  ensureCss()
  const { breakpoint = "auto", canvasMode = "still", stillAt = 0 } = props

  // Auto follows the instance's own width
  const rootRef = React.useRef<HTMLDivElement>(null)
  const [width, setWidth] = React.useState(0)
  React.useLayoutEffect(() => {
    const el = rootRef.current
    if (breakpoint !== "auto" || !el || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(() => setWidth(el.clientWidth))
    ro.observe(el)
    setWidth(el.clientWidth)
    return () => ro.disconnect()
  }, [breakpoint])
  const bp = breakpoint === "auto" ? breakpointFor(width) : breakpoint

  const config = configFor(props, bp)
  const { cfg, error } = React.useMemo(() => parseShot(config), [config])
  // keep a visitor's sidebar / theme choice across loop restarts
  const prefs = useShellPrefs({ collapsed: cfg.startCollapsed, dark: cfg.startTheme === "dark" })

  // canvas: freeze on one frame of the session (the scene engine's virtual
  // clock jumps straight there) with CSS motion off
  const still = useIsStaticRenderer() && canvasMode === "still"
  const hold = stillAt > 0 ? stillAt * 1000 : cfg.segEnd > 0 ? cfg.segEnd : 60000

  return (
    <div ref={rootRef} className={still ? "ll-noanim" : undefined} style={{ position: "relative", width: "100%" }}>
      <ShellPrefs.Provider value={prefs}>
        {/* keyed so a breakpoint change restarts the shot in its new framing */}
        <Single key={config + (still ? "/" + hold : "")} {...cfg} debugHold={still ? hold : undefined} />
      </ShellPrefs.Provider>
      {error && (
        <div style={{
          position: "absolute", left: 12, top: 12, padding: "6px 10px", borderRadius: 8,
          background: "#B42318", color: "#FFF", font: `500 12px ${T.font}`,
        }}>{error}</div>
      )}
    </div>
  )
}

addPropertyControls(ListenScene, {
  breakpoint: {
    type: ControlType.Enum, title: "Breakpoint", options: ["auto", "desktop", "tablet", "mobile"],
    optionTitles: ["Auto", "Desktop", "Tablet", "Mobile"], defaultValue: "auto", displaySegmentedControl: true,
    description: "Auto picks by this instance's width. Or force one per Framer breakpoint.",
  },
  config: {
    type: ControlType.String, title: "Desktop", displayTextArea: true,
    defaultValue: '{"content":"design-study"}',
    placeholder: "Paste from the workbench's Export JSON (one config, or all three breakpoints)",
  },
  tablet: {
    type: ControlType.String, title: "Tablet", displayTextArea: true, defaultValue: "",
    placeholder: "Empty = the bundle's tablet config, or Desktop's",
  },
  mobile: {
    type: ControlType.String, title: "Mobile", displayTextArea: true, defaultValue: "",
    placeholder: "Empty = the bundle's mobile config, or the size up",
  },
  canvasMode: {
    type: ControlType.Enum, title: "On canvas", options: ["still", "animate"], optionTitles: ["Still", "Animate"],
    defaultValue: "still", displaySegmentedControl: true,
    description: "The editor only; the live site always plays.",
  },
  stillAt: {
    type: ControlType.Number, title: "Still at", defaultValue: 0, min: 0, max: 30, step: 0.5, unit: "s",
    description: "0 = the end of the segment, or of the session.",
    hidden: (p: ListenSceneProps) => p.canvasMode === "animate",
  },
})
