// Framer export preview (/framer) — renders ListenScene from the exported
// framer/ files, several instances down a page, the way they'd sit in Framer.
// Each instance has Framer's controls: a config per breakpoint plus the
// Breakpoint switch (Auto follows the instance's width; resize the window).
// ?canvas=1 renders as the Framer canvas would: held still on one frame.
// Built by scripts/export-framer.mjs; not part of the export.
import * as React from "react"
import { createRoot } from "react-dom/client"
import ListenScene from "../framer/ListenScene"
import { shotJson } from "../framer/ListenShot"
import { T } from "../framer/ListenKit"
import { PRESETS } from "../src/ListenPresets"

const CSS = `
  body { margin: 0; background: ${T.pageBg}; }
  .fp { font-family: ${T.font}; color: ${T.ink}; -webkit-font-smoothing: antialiased; max-width: 1200px; margin: 0 auto; padding: 48px 32px 120px; }
  .fp h1 { font-size: 28px; font-weight: 400; margin: 0 0 6px; }
  .fp p { color: ${T.inkSoft}; font-size: 14px; margin: 0 0 32px; line-height: 1.5; }
  .fp-inst { margin-bottom: 48px; }
  .fp-bar { display: flex; gap: 8px; align-items: flex-start; margin-bottom: 12px; }
  .fp-bar textarea { flex: 1; font: 12px ui-monospace, Menlo, monospace; padding: 8px 10px; border: 1px solid #DDD6C8;
    border-radius: 8px; background: #FFF; color: ${T.ink}; resize: vertical; min-height: 34px; box-sizing: border-box; }
  .fp-bar textarea:focus { outline: none; border-color: ${T.brand}; box-shadow: 0 0 0 2px rgba(0, 33, 204, 0.12); }
  .fp-btn { height: 34px; padding: 0 12px; border-radius: 8px; border: 1px solid #DDD6C8; background: #FFF;
    font: 13px ${T.font}; color: ${T.ink}; cursor: pointer; white-space: nowrap; }
  .fp-btn:hover { background: #F6F2E9; }
  .fp-seg { display: inline-flex; background: #F0EBDF; border-radius: 8px; padding: 2px; gap: 2px; }
  .fp-seg button { height: 30px; padding: 0 12px; border-radius: 6px; border: none; background: transparent;
    font: 13px ${T.font}; color: ${T.inkSoft}; cursor: pointer; }
  .fp-seg button.on { background: #FFF; color: ${T.ink}; box-shadow: 0 1px 2px rgba(0,0,0,.07); }
  .fp-configs { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-bottom: 12px; }
  .fp-configs label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: ${T.inkFaint}; }
  .fp-configs label.on { color: ${T.ink}; }
  .fp-configs textarea { font: 12px ui-monospace, Menlo, monospace; padding: 8px 10px; border: 1px solid #DDD6C8;
    border-radius: 8px; background: #FFF; color: ${T.ink}; resize: vertical; min-height: 34px; box-sizing: border-box; }
  .fp-configs label.on textarea { border-color: ${T.brand}; }
  @media (max-width: 640px) { .fp-configs { grid-template-columns: 1fr; } }
  .fp-btn.primary { background: ${T.ink}; color: #F9F4EB; border-color: ${T.ink}; }
`

/** ?canvas=1: render as the Framer canvas would (framer-stub's useIsStaticRenderer) */
const CANVAS = new URLSearchParams(location.search).get("canvas") === "1"

const SEEDS = PRESETS.filter((p) => p.props.layout !== "multi-step").slice(0, 4).map((p) => shotJson(p.props as any))

type BP = "desktop" | "tablet" | "mobile"
const BPS: Array<[BP, string]> = [["desktop", "Desktop"], ["tablet", "Tablet"], ["mobile", "Mobile"]]

function Instance(props: { initial: string; onRemove: () => void }): JSX.Element {
  // one config per breakpoint, like the Framer controls; the switch plays as
  // that breakpoint would (empty Tablet / Mobile fall back to the size up)
  const [configs, setConfigs] = React.useState<Record<BP, string>>({ desktop: props.initial, tablet: "", mobile: "" })
  const [bp, setBp] = React.useState<BP | "auto">("auto")
  return (
    <div className="fp-inst">
      <div className="fp-bar">
        <span className="fp-seg">
          {([["auto", "Auto"], ...BPS] as Array<[BP | "auto", string]>).map(([k, t]) =>
            <button key={k} className={k === bp ? "on" : ""} onClick={() => setBp(k)}>{t}</button>)}
        </span>
        <span style={{ flex: 1 }} />
        <button className="fp-btn" onClick={props.onRemove} title="Remove instance">✕</button>
      </div>
      <div className="fp-configs">
        {BPS.map(([k, t]) => (
          <label key={k} className={k === bp ? "on" : ""}>
            <span>{t}</span>
            <textarea rows={2} value={configs[k]} spellCheck={false}
              placeholder={k === "desktop" ? "" : k === "tablet" ? "Empty = the bundle's tablet, or Desktop's" : "Empty = the bundle's mobile, or the size up"}
              onChange={(e) => setConfigs((c) => ({ ...c, [k]: e.target.value }))} />
          </label>
        ))}
      </div>
      <ListenScene breakpoint={bp} config={configs.desktop} tablet={configs.tablet} mobile={configs.mobile} />
    </div>
  )
}

function Preview(): JSX.Element {
  const [items, setItems] = React.useState(() => SEEDS.map((c, i) => ({ id: i, config: c })))
  const nextId = React.useRef(items.length)
  return (
    <div className="fp">
      <style>{CSS}</style>
      <h1>ListenScene · Framer export preview</h1>
      <p><a href={CANVAS ? "/framer" : "/framer?canvas=1"}>{CANVAS ? "Back to live playback" : "Show as on the Framer canvas (still)"}</a></p>
      <p>Built from the exported <code>framer/</code> files, so what plays here is what you paste into Framer. Each block is one
        instance with Framer's controls: a config per breakpoint, and a Breakpoint switch that plays the one you'd set on that
        Framer breakpoint.</p>
      {items.map((it) => (
        <Instance key={it.id} initial={it.config} onRemove={() => setItems((xs) => xs.filter((x) => x.id !== it.id))} />
      ))}
      <button className="fp-btn primary" onClick={() => setItems((xs) => [...xs, { id: nextId.current++, config: '{"content":"design-study"}' }])}>
        Add instance
      </button>
    </div>
  )
}

createRoot(document.getElementById("root")!).render(<Preview />)
