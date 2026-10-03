// ToolBar — the thin bar across the top of both review views, with the
// Workbench | Homepage switch in the same place on each. It sits outside the
// page being reviewed, so it never reads as part of the site.
import * as React from "react"
import { T, Logo } from "./ListenKit"

export type View = "workbench" | "home"
export const TOOLBAR_H = 57

/** the homepage view's last settings (width, styles, grid), so switching away
 *  and back restores them; a per-tab convenience, so failures are fine */
const HOME_KEY = "ll-home-search"
export function rememberHomeSearch(search: string): void {
  try { sessionStorage.setItem(HOME_KEY, search) } catch { /* private mode */ }
}
function homeSearch(): string {
  try { return sessionStorage.getItem(HOME_KEY) ?? "" } catch { return "" }
}

/** client-side switch: push the path and let the root re-render */
export function goTo(view: View): void {
  const to = view === "home" ? "/home" + homeSearch() : "/"
  history.pushState(null, "", to)
  window.dispatchEvent(new PopStateEvent("popstate"))
  window.scrollTo(0, 0)
}

const SEG_BTN: React.CSSProperties = {
  height: 26, padding: "0 12px", borderRadius: 6, border: "none", cursor: "pointer", font: `12px ${T.font}`,
}

export default function ToolBar({ view, sticky }: { view: View; sticky?: boolean }): JSX.Element {
  const opt = (v: View, label: string) => {
    const on = v === view
    return (
      <button key={v} aria-pressed={on} onClick={() => !on && goTo(v)} style={{
        ...SEG_BTN, background: on ? "#FFF" : "transparent", color: on ? T.ink : T.inkSoft,
        boxShadow: on ? "0 1px 2px rgba(0,0,0,.07)" : "none",
      }}>{label}</button>
    )
  }
  return (
    <div style={{
      height: TOOLBAR_H, display: "flex", alignItems: "center", gap: 12, padding: "0 20px", boxSizing: "border-box",
      background: "#FFF", borderBottom: "1px solid #E7E1D6", fontFamily: T.font, color: T.ink,
      ...(sticky ? { position: "sticky", top: 0, zIndex: 90 } : {}),
    }}>
      <span style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14, fontWeight: 500 }}><Logo /> Scene Workbench</span>
      <span style={{ flex: 1 }} />
      <div role="group" aria-label="View" style={{ display: "inline-flex", background: "#F0EBDF", borderRadius: 8, padding: 2, gap: 2 }}>
        {opt("workbench", "Workbench")}{opt("home", "Homepage")}
      </div>
    </div>
  )
}
