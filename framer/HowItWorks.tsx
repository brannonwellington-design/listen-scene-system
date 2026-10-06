// Framer code file: the homepage's How it works section. Paste this into a Framer code file
// named "HowItWorks". The component itself lives in the listen-scene-system repo;
// to update, change the tag in the URL to the newest release (README › Framer).
import { addPropertyControls } from "framer"
import { HowItWorks as Live } from "https://cdn.jsdelivr.net/gh/brannonwellington-design/listen-scene-system@framer-v2/framer/listen-scenes.js"

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1392
 */
export default function HowItWorks(props) {
    return <Live {...props} />
}

addPropertyControls(HowItWorks, Live.propertyControls)
