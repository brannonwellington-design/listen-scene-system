// ProductShot — preset wrapper over SceneCanvas (variant="callout", bare:
// no canvas fill, pattern, or padding). Kept for back-compat; new placements
// can use SceneCanvas directly for the full container/fit/crop system.
import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import SceneCanvas from "./SceneCanvas"
import { REGISTRY } from "./ListenRegistry"

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function ProductShot(props: { scene?: string; loop?: boolean; loopPause?: number }): JSX.Element {
  const { scene = "deliver-results", loop = true, loopPause = 3 } = props
  return (
    <SceneCanvas
      variant="callout"
      content={scene}
      loop={loop}
      loopPause={loopPause}
      pattern="none"
      bgColor="transparent"
      padX={0}
      padY={0}
    />
  )
}

addPropertyControls(ProductShot, {
  scene: {
    type: ControlType.Enum,
    title: "Scene",
    options: REGISTRY.map((e) => e.key),
    optionTitles: REGISTRY.map((e) => e.title),
    defaultValue: "deliver-results",
  },
  loop: { type: ControlType.Boolean, title: "Loop", defaultValue: true },
  loopPause: { type: ControlType.Number, title: "Loop pause (s)", defaultValue: 3, min: 0, max: 20, step: 0.5 },
})
