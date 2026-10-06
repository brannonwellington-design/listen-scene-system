// ListenSections — the homepage's two live sections as ready-made components.
// Each is SceneCanvas locked to its sequence, with the page's framing built
// in, so in Framer they drop onto the page with no setup:
//   HowItWorks → the how-it-works sequence (captions style by default); its
//                shot sits on the page's columns, worked out from its width
//   UseCases   → the use-cases sequence (list style by default)
// /home renders these same components, so the review page and the site run
// the same code. The Framer panel is SceneCanvas's, minus the layout and
// sequence pickers and the single-shot controls.
import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import SceneCanvas, { SceneCanvasProps, CANVAS_CONTROLS } from "./SceneCanvas"

export type SectionProps = Omit<SceneCanvasProps, "layout" | "sequence" | "steps" | "preset">

/** How it works on the page grid. The mock frames the shot on columns 3–10 of
 *  12 (2–7 of 8 under a 1024 page), with top and bottom padding scaled from
 *  40 at 1392; the swipe rail bleeds to the page margin (16 under 640, else
 *  24). `w` is the component's width, the page's content width. */
export function howItWorksGrid(w: number): Pick<SceneCanvasProps, "padX" | "padY" | "radius" | "swipeBleed"> {
  const page = w + 48
  const cols = page > 1024 ? 12 : 8
  const colW = (w - (cols - 1) * 24) / cols
  return {
    padX: Math.round((cols === 12 ? 2 : 1) * (colW + 24)),
    padY: Math.round(w * 40 / 1392),
    radius: 12,
    swipeBleed: w <= 608 ? 16 : 24,
  }
}

/** the element's width, kept current */
function useWidth(): [React.RefObject<HTMLDivElement>, number] {
  const ref = React.useRef<HTMLDivElement>(null)
  const [w, setW] = React.useState(0)
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el)
    setW(el.clientWidth)
    return () => ro.disconnect()
  }, [])
  return [ref, w]
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export function HowItWorks(props: SectionProps & { pageGrid?: boolean }): JSX.Element {
  const { pageGrid = true, ...rest } = props
  const [ref, w] = useWidth()
  // before the first measure (and when pre-rendered) assume the full 1392
  const grid = pageGrid ? howItWorksGrid(w || 1392) : {}
  return (
    <div ref={ref} style={{ width: "100%" }}>
      <SceneCanvas maxWidth={1392} {...rest} {...grid} layout="multi-step" sequence="how-it-works" />
    </div>
  )
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export function UseCases(props: SectionProps): JSX.Element {
  return <SceneCanvas maxWidth={1392} {...props} layout="multi-step" sequence="use-cases" />
}

// --------------------------------------------------------- Framer panel ----
/** what a section fixes; the shared controls' show/hide rules see these */
const FIXED = { layout: "multi-step" }
/** controls a section doesn't offer: what it fixes, and the single layout's */
const DROP = new Set([
  "layout", "preset", "sequence", "steps",
  "shot", "cropScene", "cropX", "cropY", "cropW", "cropH",
  "loop", "loopPause", "loopFrom", "loopTo",
])

function sectionControls(sequence: string, over: Record<string, any> = {}): Record<string, any> {
  const out: Record<string, any> = {}
  for (const [k, c] of Object.entries(CANVAS_CONTROLS)) {
    if (DROP.has(k)) continue
    const hidden = c.hidden
    out[k] = {
      ...c,
      ...(k === "maxWidth" ? { defaultValue: 1392 } : {}),
      hidden: (p: any) => !!over[k]?.hiddenToo?.(p) || (hidden ? hidden({ ...p, ...FIXED, sequence }) : false),
    }
  }
  return out
}

/** with the page grid on, it sets the padding, radius, and swipe bleed */
const GRID_KEYS = ["padX", "padY", "radius", "swipeBleed"]
const hiwControls = sectionControls("how-it-works",
  Object.fromEntries(GRID_KEYS.map((k) => [k, { hiddenToo: (p: any) => p.pageGrid ?? true }])))

addPropertyControls(HowItWorks, {
  pageGrid: { type: ControlType.Boolean, title: "Page grid", enabledTitle: "On", disabledTitle: "Off", defaultValue: true,
    description: "Sets padding, radius, and rail bleed from the page's columns" },
  ...hiwControls,
})
addPropertyControls(UseCases, sectionControls("use-cases"))
