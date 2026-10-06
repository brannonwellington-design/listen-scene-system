// Framer code file: any shot or sequence (the universal component). Paste this into a Framer code file
// named "SceneCanvas". The component itself lives in the listen-scene-system repo;
// to update, change the tag in the URL to the newest release (README › Framer).
import { addPropertyControls } from "framer"
import { SceneCanvas as Live } from "https://cdn.jsdelivr.net/gh/brannonwellington-design/listen-scene-system@framer-v1/framer/listen-scenes.js"

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1392
 */
export default function SceneCanvas(props) {
    return <Live {...props} />
}

addPropertyControls(SceneCanvas, Live.propertyControls)
