// HowItWorks — preset wrapper over SceneCanvas (variant="hero").
// Kept for back-compat; new placements can use SceneCanvas directly.
import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import SceneCanvas from "./SceneCanvas"

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function HowItWorks(props: {
  autoCycle?: boolean
  resumeDelay?: number
  maxWidth?: number
  scrubber?: boolean
}): JSX.Element {
  return <SceneCanvas variant="hero" {...props} />
}

addPropertyControls(HowItWorks, {
  autoCycle: { type: ControlType.Boolean, title: "Auto-cycle", defaultValue: true },
  scrubber: { type: ControlType.Boolean, title: "Scrubber (dev)", defaultValue: false },
  resumeDelay: { type: ControlType.Number, title: "Resume after (s)", defaultValue: 14, min: 4, max: 60, step: 1 },
  maxWidth: { type: ControlType.Number, title: "Max width", defaultValue: 1200, min: 640, max: 1600, step: 10 },
})
