// Local stand-in for the "framer" module so components build outside Framer.
// Inside Framer, the real module resolves and these are never used.
export function addPropertyControls(_component: unknown, _controls: unknown): void {}

export const ControlType: Record<string, string> = new Proxy(
  {},
  { get: (_t, key) => String(key) },
)

/** Framer: true on the canvas and in export renders. Locally, `?canvas=1`
 *  stands in for the canvas (the /framer preview uses it). */
export function useIsStaticRenderer(): boolean {
  return typeof location !== "undefined" && new URLSearchParams(location.search).get("canvas") === "1"
}
