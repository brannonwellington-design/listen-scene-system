// Framer code file: the homepage's Use Cases section. Paste this into a Framer code file
// named "UseCases". The component itself lives in the listen-scene-system repo;
// to update, change the tag in the URL to the newest release (README › Framer).
import { addPropertyControls } from "framer"
import { UseCases as Live } from "https://cdn.jsdelivr.net/gh/brannonwellington-design/listen-scene-system@framer-v2/framer/listen-scenes.js"

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1392
 */
export default function UseCases(props) {
    return <Live {...props} />
}

addPropertyControls(UseCases, Live.propertyControls)
