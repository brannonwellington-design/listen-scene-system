// Local demo page — renders the Framer components outside Framer so the
// whole system can be verified in a plain browser.
import * as React from "react"
import { createRoot } from "react-dom/client"
import HowItWorks from "./HowItWorks"
import ProductShot, { REGISTRY } from "./ProductShot"
import { T, ScaleBox } from "./ListenKit"

function Demo(): JSX.Element {
  return (
    <div style={{ background: T.pageBg, minHeight: "100vh", fontFamily: T.font, color: T.ink, padding: "80px 48px 160px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <h1 style={{ fontSize: 44, fontWeight: 400, maxWidth: 640, lineHeight: 1.15 }}>
          How it works
        </h1>
        <div style={{ height: 48 }} />
        <HowItWorks scrubber />

        <div style={{ height: 160 }} />

        {/* minor-section example: copy + a single fragment */}
        <div style={{ display: "flex", gap: 64, alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 32, fontWeight: 400 }}>Answers, not exports</h2>
            <p style={{ marginTop: 16, fontSize: 16, lineHeight: 1.6, color: T.inkSoft, maxWidth: 400 }}>
              Quantified results roll up automatically, and every number stays
              connected to the interviews behind it.
            </p>
          </div>
          <div style={{ flex: 1 }}>
            <ProductShot scene="top-answer-card" />
          </div>
        </div>

        <div style={{ height: 120 }} />

        <div style={{ display: "flex", gap: 64, alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <ProductShot scene="live-interview-card" />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 32, fontWeight: 400 }}>A real conversation</h2>
            <p style={{ marginTop: 16, fontSize: 16, lineHeight: 1.6, color: T.inkSoft, maxWidth: 400 }}>
              The AI moderator listens, probes, and follows up — in the
              participant's own words and language.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Compare mode: /?scene=design-study&ref=01.png overlays a reference
// screenshot (from "image examples/") on the live scene with an opacity
// slider, so drift is measured instead of judged.
function Compare(props: { scene: string; refImg: string }): JSX.Element {
  const [opacity, setOpacity] = React.useState(0.5)
  const [offsetY, setOffsetY] = React.useState(0)
  const [diff, setDiff] = React.useState(false)
  const W = 1000
  return (
    <div style={{ background: T.pageBg, minHeight: "100vh", padding: 24, fontFamily: T.font, fontSize: 13 }}>
      <div style={{ width: W, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}>
          <strong style={{ fontWeight: 400 }}>{props.scene} vs {props.refImg}</strong>
          <label>overlay {Math.round(opacity * 100)}%
            <input type="range" min={0} max={1} step={0.05} value={opacity}
              onChange={(e) => setOpacity(+e.target.value)} style={{ marginLeft: 8, verticalAlign: "middle" }} />
          </label>
          <label>offset Y {offsetY}px
            <input type="range" min={-120} max={120} step={1} value={offsetY}
              onChange={(e) => setOffsetY(+e.target.value)} style={{ marginLeft: 8, verticalAlign: "middle" }} />
          </label>
          {[0, 0.5, 1].map((v) => (
            <button key={v} onClick={() => { setOpacity(v); setDiff(false) }}
              style={{ border: "1px solid #C6C0B4", borderRadius: 6, padding: "2px 10px", background: !diff && opacity === v ? "#E2DCCF" : "transparent", cursor: "pointer" }}>
              {v * 100}%
            </button>
          ))}
          <button onClick={() => setDiff(!diff)}
            style={{ border: "1px solid #C6C0B4", borderRadius: 6, padding: "2px 10px", background: diff ? "#1A1A1A" : "transparent", color: diff ? "#F9F4EB" : "inherit", cursor: "pointer" }}>
            diff
          </button>
        </div>
        {/* In diff mode both layers sit on an isolated white ground; identical
            pixels cancel to black, misalignments glow as bright edges. */}
        <div style={{ position: "relative", isolation: "isolate", background: diff ? "#FFF" : "transparent" }}>
          <ProductShot scene={props.scene} />
          <img
            src={`/image examples/${props.refImg}`}
            style={{
              position: "absolute", top: offsetY, left: 0, width: "100%", pointerEvents: "none",
              opacity: diff ? 1 : opacity,
              mixBlendMode: diff ? "difference" : "normal",
            }}
          />
        </div>
      </div>
    </div>
  )
}

// Solo scene view with a toggleable timeline scrubber: dragging re-runs the
// scene's script on the virtual clock, frozen at the chosen millisecond.
function Solo(props: { scene: string }): JSX.Element {
  const entry = REGISTRY[props.scene] ?? REGISTRY["deliver-results"]
  const [scrub, setScrub] = React.useState((window as any).__llHold != null)
  const [t, setT] = React.useState<number>((window as any).__llHold ?? 0)
  // playing: single run, fast-forwarded to playStart then real time
  const [playStart, setPlayStart] = React.useState<number | null>(null)
  const playing = playStart != null
  const [runKey, setRunKey] = React.useState(0)

  // the ?hold= URL global seeds initial state; clear it so it can't override
  // the transport's hold/playFrom props afterwards
  React.useEffect(() => { delete (window as any).__llHold }, [])

  React.useEffect(() => {
    if (t >= 25000 && playing) setPlayStart(null)
  }, [t, playing])

  const toggle = () => {
    delete (window as any).__llHold
    setPlayStart(null)
    setScrub(!scrub)
    setRunKey((k) => k + 1)
  }

  const btn: React.CSSProperties = { border: "1px solid #C6C0B4", borderRadius: 6, padding: "3px 10px", background: "transparent", cursor: "pointer", font: "inherit" }
  const { Scene, w, h } = entry
  return (
    <div style={{ background: T.pageBg, minHeight: "100vh", padding: "24px 48px 48px", fontFamily: T.font, fontSize: 13 }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
          <strong style={{ fontWeight: 400 }}>{props.scene}</strong>
          {!scrub ? (
            <button onClick={toggle} style={btn}>🎚 scrub</button>
          ) : (
            <>
              <button onClick={() => setPlayStart(playing ? null : t)}
                style={{ ...btn, width: 66, background: "#1A1A1A", color: "#F9F4EB", borderColor: "#1A1A1A" }}>
                {playing ? "⏸ pause" : "▶ play"}
              </button>
              <input type="range" min={0} max={25000} step={100} value={t}
                onChange={(e) => { setPlayStart(null); setT(+e.target.value) }}
                style={{ flex: 1, maxWidth: 460 }} />
              <span style={{ fontVariantNumeric: "tabular-nums", width: 56 }}>{(t / 1000).toFixed(1)}s</span>
              {[-1000, -100, 100, 1000].map((d) => (
                <button key={d} onClick={() => { setPlayStart(null); setT(Math.max(0, Math.min(25000, t + d))) }} style={btn}>
                  {d > 0 ? `+${d / 1000}s` : `${d / 1000}s`}
                </button>
              ))}
              <button onClick={toggle} style={btn}>✕ live</button>
            </>
          )}
        </div>
        {scrub ? (
          <div className={playing ? undefined : "ll-noanim"}>
            <ScaleBox designWidth={w} designHeight={h}>
              <Scene active runKey={runKey}
                hold={playing ? undefined : t}
                playFrom={playing ? playStart! : undefined}
                onTime={setT} />
            </ScaleBox>
          </div>
        ) : (
          <ProductShot key={runKey} scene={props.scene} />
        )}
      </div>
    </div>
  )
}

// Solo-scene test mode: /?scene=deliver-results renders one scene alone.
const params = new URLSearchParams(location.search)
const solo = params.get("scene")
const refImg = params.get("ref")
if (params.get("hold")) (window as any).__llHold = +params.get("hold")!
createRoot(document.getElementById("root")!).render(
  solo && refImg ? (
    <Compare scene={solo} refImg={refImg} />
  ) : solo ? (
    <Solo scene={solo} />
  ) : (
    <Demo />
  ),
)
