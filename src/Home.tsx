// Home — a 1:1 build of the homepage refresh mock (Figma "Homepage Refresh"
// 864:744, 1440 wide) with the live How it works and Use Cases sections in
// place, for reviewing them in context at every width. Everything else is
// static, built from the mock's styles and assets (media/home). The mock
// only has desktop (plus a mobile Use Cases frame), so the stacking below
// ~900px is our own call.
//
// Breakpoints are container queries on the page wrapper, not the window, so
// the review panel can narrow the page to any width and everything — the
// live sections included — responds as it would in a browser that size.
import * as React from "react"
import SceneCanvas from "./SceneCanvas"
import { StepStyle } from "./ListenRegistry"
import { I } from "./ListenIcons"
import ToolBar, { TOOLBAR_H, rememberHomeSearch } from "./ToolBar"

// the mock's variables (Paper mode)
const C = {
  bg: "#F9F4EB",          // surface/primary
  highlight: "#FBF9F4",   // surface/highlight
  secondary: "#EEE8DD",   // surface/secondary
  tertiary: "#E2DCCF",    // surface/tertiary
  ink: "#0021CC",         // content/primary, content/brand, surface/brand primary
  soft: "#7586D7",        // content/secondary
  onBrand: "#F9F4EB",     // content/brand contrast
}
const M = "/media/home/"

const CSS = `
.hp { container-type: inline-size; background: ${C.bg}; color: ${C.ink}; font-family: 'Inter', -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; margin: 0 auto; position: relative; }
.hp * { box-sizing: border-box; margin: 0; }
.hp p { margin: 0; }
.hp-sec { padding: 80px 24px; display: flex; flex-direction: column; align-items: center; gap: 80px; }
.hp-h2 { font-size: 32px; line-height: 1.2; letter-spacing: -0.64px; text-align: center; }
.hp-lede { font-size: 20px; line-height: 1.4; letter-spacing: -0.4px; color: ${C.soft}; text-align: center; }
.hp-head { display: flex; flex-direction: column; gap: 8px; align-items: center; max-width: 448px; }
.hp-t14 { font-size: 14px; line-height: 20px; letter-spacing: -0.28px; }
.hp-t16 { font-size: 16px; line-height: 22px; letter-spacing: -0.32px; }
.hp-t12 { font-size: 12px; line-height: 16px; letter-spacing: -0.24px; }
.hp-soft { color: ${C.soft}; }

/* nav */
.hp-nav { position: sticky; top: var(--hp-top, 0px); z-index: 40; height: 68px; padding: 0 24px; background: ${C.bg};
  display: flex; align-items: center; justify-content: space-between; }
.hp-nav-links { display: flex; gap: 24px; align-items: center; position: absolute; left: 50%; transform: translateX(-50%); }
.hp-nav-links span { display: inline-flex; gap: 4px; align-items: center; }
.hp-nav-right { display: flex; gap: 24px; align-items: center; }
.hp-btn { background: ${C.ink}; color: ${C.onBrand}; border-radius: 8px; display: inline-flex; align-items: center; gap: 8px; white-space: nowrap; }
.hp-menu { display: none; width: 32px; height: 32px; align-items: center; justify-content: center; }

/* hero */
.hp-hero { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 0 24px 24px; align-items: center; }
.hp-hero h1 { font-weight: 400; font-size: clamp(36px, 4.03cqw, 58px); line-height: 1; letter-spacing: -0.04em; }
.hp-hero-img { position: relative; aspect-ratio: 684 / 708; border-radius: 12px; overflow: hidden; }
.hp-hero-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
.hp-chip { position: absolute; left: 50%; bottom: 8px; transform: translateX(-50%); width: 180px; padding: 8px 12px; border-radius: 8px; background: ${C.bg}; }
.hp-email { display: flex; height: 48px; width: 100%; max-width: 448px; border: 1px solid ${C.ink}; border-radius: 8px; overflow: hidden; background: ${C.highlight}; }
.hp-email > span:first-child { flex: 1; display: flex; align-items: center; padding: 0 12px; color: ${C.soft}; }
.hp-email .hp-btn { border-radius: 0; padding: 0 12px; }

/* logo wall */
.hp-wall { width: 100%; display: flex; gap: 1px; background: ${C.tertiary}; border: 1px solid ${C.tertiary}; border-radius: 12px; overflow: hidden; }
.hp-half { flex: 1; display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.hp-row { display: flex; gap: 1px; height: 198.5px; }
.hp-feat { flex: 1; position: relative; background: ${C.highlight}; min-width: 0; }
.hp-feat .hp-ms { position: absolute; left: 16px; top: 16px; height: 20px; }
.hp-feat .hp-up { position: absolute; right: 12px; top: 12px; width: 24px; height: 24px; }
.hp-feat div { position: absolute; left: 16px; bottom: 16px; width: 162px; }
.hp-quad { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 1px; min-width: 0; }
.hp-quad span { background: ${C.highlight}; display: flex; align-items: center; justify-content: center; min-width: 0; }
.hp-quad img { height: 20px; }
.hp-big { font-size: 48px; line-height: 1.2; letter-spacing: -1.92px; }

/* live sections */
.hp-live { width: 100%; }

/* customers */
.hp-cust { position: relative; width: 100%; max-width: 920px; display: flex; flex-direction: column; gap: 24px; }
.hp-cust-img { position: relative; aspect-ratio: 920 / 518; border-radius: 12px; }
.hp-cust-img img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; border-radius: 12px; }
.hp-cust-img img.ghost { opacity: .2; }
.hp-quote { font-size: clamp(22px, 1.95cqw, 28px); line-height: 1.2; letter-spacing: -0.02em; }
.hp-cust-meta { display: flex; gap: 95px; align-items: flex-start; }
.hp-segs { display: flex; gap: 8px; height: 1px; }
.hp-segs span { flex: 1; background: ${C.tertiary}; }
.hp-segs span:first-child { background: ${C.ink}; }

/* how to use */
.hp-video { width: 100%; max-width: 920px; display: flex; flex-direction: column; gap: 24px; }
.hp-video img { width: 100%; aspect-ratio: 684 / 386; object-fit: cover; border-radius: 12px; display: block; }
.hp-stats { display: flex; gap: 24px; }
.hp-stats > div { flex: 1; min-width: 0; }
.hp-stat { font-size: 64px; line-height: 1.2; letter-spacing: -2.56px; white-space: nowrap; }

/* experts */
.hp-experts { display: flex; gap: 142px; padding: 80px 24px 80px 142px; background: ${C.highlight}; align-items: stretch; }
.hp-exp-left { width: 448px; flex-shrink: 0; display: flex; flex-direction: column; justify-content: space-between; gap: 48px; }
.hp-exp-feat { display: grid; grid-template-columns: 1fr 1fr; gap: 23px; }
.hp-exp-feat img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 12px; display: block; }
.hp-exp-list { flex: 1; min-width: 0; max-width: 684px; display: flex; flex-direction: column; }
.hp-exp-row { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 16px 0; border-bottom: 1px solid ${C.tertiary}; }
.hp-exp-row:first-child { padding-top: 0; }

/* cta + footer */
.hp-cta { position: relative; height: 800px; border-radius: 12px; overflow: hidden; margin: 24px; }
.hp-cta > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.hp-form { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 448px; max-width: calc(100% - 32px);
  padding: 24px; border-radius: 12px; background: ${C.bg}; display: flex; flex-direction: column; gap: 24px; }
.hp-field { height: 48px; border: 1px solid ${C.ink}; border-radius: 8px; background: ${C.highlight}; display: flex; align-items: center; padding: 0 12px; color: ${C.soft}; }
.hp-foot { padding: 0 24px 24px; display: flex; flex-direction: column; gap: 96px; }
.hp-foot-cols { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 48px 24px; }
.hp-foot-cols ul { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 4px; margin-top: 12px; }
.hp-foot-bar { display: flex; justify-content: space-between; gap: 16px; }

/* brand band */
.hp-band { position: relative; height: clamp(520px, 55.5cqw, 800px); background: ${C.ink}; color: ${C.onBrand}; overflow: hidden; }
.hp-band .art { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: min(450px, 60cqw); aspect-ratio: 3 / 2; object-fit: cover; }
.hp-band .word { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: min(912px, calc(100cqw - 48px)); }
.hp-band .corner { position: absolute; }
.hp-band .mark { position: absolute; left: 50%; transform: translateX(-50%); width: 15px; height: 20px; }

/* ---- breakpoints (container width) ---- */
@container (max-width: 1240px) {
  .hp-experts { padding-left: 24px; gap: 64px; }
}
@container (max-width: 1080px) {
  .hp-wall { flex-direction: column; }
}
@container (max-width: 900px) {
  .hp-nav-links { display: none; }
  .hp-menu { display: inline-flex; }
  .hp-hero { grid-template-columns: 1fr; gap: 40px; padding-top: 48px; }
  .hp-hero-img { aspect-ratio: 4 / 3; }
  .hp-hero-img img { object-position: 50% 35%; }
  .hp-experts { flex-direction: column; gap: 48px; }
  .hp-exp-left { width: 100%; max-width: 560px; }
  .hp-exp-list { max-width: none; }
  .hp-foot-cols { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .hp-cust-meta { gap: 48px; }
}
@container (max-width: 640px) {
  .hp-sec { padding: 80px 16px; gap: 80px; }
  .hp-h2 { font-size: 24px; line-height: 1.4; letter-spacing: -0.48px; }
  .hp-lede { font-size: 16px; line-height: 22px; letter-spacing: -0.32px; }
  .hp-nav { padding: 0 16px; }
  .hp-nav-right .hp-signin { display: none; }
  .hp-hero { padding: 32px 16px 16px; }
  .hp-row { flex-direction: column; height: auto; }
  .hp-feat { height: 180px; flex: none; }
  .hp-quad { height: 200px; flex: none; }
  .hp-cust-meta { flex-direction: column; gap: 24px; }
  .hp-stats { flex-direction: column; gap: 24px; }
  .hp-stat { font-size: 48px; }
  .hp-experts { padding: 64px 16px; }
  .hp-cta { margin: 16px; height: 640px; }
  .hp-foot { padding: 0 16px 16px; }
  .hp-foot-bar { flex-direction: column; }
}

/* review panel (not part of the page) */
.hp-panel { position: fixed; right: 16px; bottom: 16px; z-index: 100; width: 300px; font: 13px/1.4 'Inter', sans-serif; color: #1F1D1A;
  background: #FFF; border: 1px solid #DDD6C8; border-radius: 12px; box-shadow: 0 6px 24px rgba(0,0,0,.10); padding: 12px; }
.hp-panel h4 { font-size: 12px; font-weight: 500; color: #6B6861; margin: 10px 0 6px; }
.hp-panel h4:first-child { margin-top: 0; }
.hp-seg { display: flex; flex-wrap: wrap; gap: 4px; }
.hp-seg button { font: inherit; font-size: 12px; padding: 4px 8px; border-radius: 6px; border: 1px solid #DDD6C8; background: #FFF; color: #1F1D1A; cursor: pointer; }
.hp-seg button[aria-pressed="true"] { background: #1F1D1A; border-color: #1F1D1A; color: #F9F4EB; }
.hp-panel input[type=range] { width: 100%; }
.hp-gridov { position: absolute; top: 0; bottom: 0; left: 24px; right: 24px; z-index: 30; pointer-events: none;
  display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); column-gap: 24px; }
.hp-gridov div { background: rgba(0, 33, 204, 0.05); border-left: 1px solid rgba(0, 33, 204, .16); border-right: 1px solid rgba(0, 33, 204, .16); }
@container (max-width: 640px) { .hp-gridov { left: 16px; right: 16px; grid-template-columns: repeat(4, minmax(0, 1fr)); column-gap: 16px; } }
`

/** measured content width of an element (for the live sections' padding) */
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

const NAV = [["Solutions", true], ["Features", true], ["Customers", false], ["Resources", true], ["Careers", false]] as const

function Nav(): JSX.Element {
  return (
    <nav className="hp-nav">
      <img src={M + "logo.svg"} alt="Listen Labs" style={{ height: 20, display: "block" }} />
      <div className="hp-nav-links hp-t14">
        {NAV.map(([l, chev]) => <span key={l}>{l}{chev && <I name="chevron-down" size={12} />}</span>)}
      </div>
      <div className="hp-nav-right hp-t14">
        <span className="hp-signin">Sign in</span>
        <span className="hp-btn" style={{ height: 32, padding: "0 8px" }}>Demo</span>
        <span className="hp-menu" aria-label="Menu">
          <svg width="18" height="12" viewBox="0 0 18 12" stroke={C.ink} strokeWidth="1.5"><path d="M0 1h18M0 6h18M0 11h18" /></svg>
        </span>
      </div>
    </nav>
  )
}

function Hero(): JSX.Element {
  return (
    <section className="hp-hero">
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h1>Customer Understanding,<br />Loud and Clear.</h1>
          <p className="hp-soft" style={{ fontSize: 20, lineHeight: 1.4, letterSpacing: -0.4, maxWidth: 684 }}>
            What people think, why they think it, and what to do about it. From real interviews, not anecdotes.
          </p>
        </div>
        <div className="hp-email hp-t16">
          <span>What’s your work email?</span>
          <span className="hp-btn">Book A Demo <I name="arrow-right" size={20} stroke={1.25} /></span>
        </div>
      </div>
      <div className="hp-hero-img">
        <img src={M + "hero.jpg"} alt="" />
        <div className="hp-chip hp-t14"><p>Amanda Watterson</p><p className="hp-soft">34 years old</p><p className="hp-soft">New York City, NY</p></div>
      </div>
    </section>
  )
}

function Feature(): JSX.Element {
  return (
    <div className="hp-feat">
      <img className="hp-ms" src={M + "microsoft.svg"} alt="Microsoft" />
      <img className="hp-up" src={M + "arrow-up-right.svg"} alt="" />
      <div><p className="hp-big">150+</p><p className="hp-t12">Global, Multilingual interviews</p></div>
    </div>
  )
}
function Quad(): JSX.Element {
  return (
    <div className="hp-quad">
      {["a", "b", "a", "b"].map((v, i) => <span key={i}><img src={M + `google-${v}.svg`} alt="Google" /></span>)}
    </div>
  )
}

function LogoWall(): JSX.Element {
  return (
    <section className="hp-sec">
      <p className="hp-h2" style={{ maxWidth: 626 }}>The research partner for hundreds of leading brands</p>
      <div className="hp-wall">
        <div className="hp-half">
          <div className="hp-row"><Feature /><Quad /></div>
          <div className="hp-row"><Quad /><Feature /></div>
        </div>
        <div className="hp-half">
          <div className="hp-row"><Feature /><Quad /></div>
          <div className="hp-row"><Quad /><Feature /></div>
        </div>
      </div>
    </section>
  )
}

/** How it works: the mock frames a 920-wide shot in a 1392 container (236 / 40
 *  padding); under 700 the padding drops to 16 so the shot keeps its size */
function HowItWorks({ style }: { style: StepStyle }): JSX.Element {
  const [ref, w] = useWidth()
  const padX = w < 700 ? 16 : Math.round(w * 236 / 1392)
  const padY = w < 700 ? 16 : Math.round(w * 40 / 1392)
  return (
    <section className="hp-sec" id="how-it-works">
      <div className="hp-head">
        <p className="hp-h2">A single place to run your research end-to-end.</p>
        <p className="hp-lede">From first question to insights that compound. Enterprise-grade controls throughout.</p>
      </div>
      <div ref={ref} className="hp-live">
        {w > 0 && <SceneCanvas layout="multi-step" sequence="how-it-works" stepStyle={style} maxWidth={1392} padX={padX} padY={padY} radius={12}
          swipeBleed={w <= 608 ? 16 : 24} />}
      </div>
    </section>
  )
}

function Customers(): JSX.Element {
  return (
    <section className="hp-sec" style={{ overflow: "hidden" }}>
      <p className="hp-h2">Hear it from our customers</p>
      <div className="hp-cust">
        <div className="hp-cust-img">
          <img className="ghost" src={M + "customer.jpg"} alt="" style={{ left: "calc(-100% - 24px)", right: "calc(100% + 24px)" }} />
          <img src={M + "customer.jpg"} alt="" />
          <img className="ghost" src={M + "customer.jpg"} alt="" style={{ left: "calc(100% + 24px)", right: "calc(-100% - 24px)" }} />
        </div>
        <p className="hp-quote">“AI removes the drudgery of my work so that I can focus on things that really matter... focusing more on the strategic work, focusing more in talking to the customers, and it makes my day-to-day work a little bit more fun.”</p>
        <div className="hp-cust-meta">
          <div style={{ width: 495, maxWidth: "100%", display: "flex", flexDirection: "column", gap: 24 }}>
            <div className="hp-t16"><p>Romani Patel</p><p className="hp-soft">Director of Data Science</p></div>
            <img src={M + "customer-logo.svg"} alt="Microsoft" style={{ height: 24, width: 113 }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <p className="hp-big">150+</p><p className="hp-t16">Global, Multilingual Interviews</p>
          </div>
        </div>
        <div className="hp-segs"><span /><span /><span /><span /></div>
      </div>
    </section>
  )
}

function UseCases({ style }: { style: StepStyle }): JSX.Element {
  return (
    <section className="hp-sec" id="use-cases">
      <div className="hp-head" style={{ maxWidth: 614 }}>
        <p className="hp-h2">Use Cases</p>
        <p className="hp-lede">Designed for your research needs. From AI sentiment and adoption to concept tests and brand tracking.</p>
      </div>
      <div className="hp-live">
        <SceneCanvas layout="multi-step" sequence="use-cases" stepStyle={style} maxWidth={1392} />
      </div>
    </section>
  )
}

function HowToUse(): JSX.Element {
  return (
    <section className="hp-sec" style={{ background: C.highlight }}>
      <div className="hp-head"><p className="hp-h2">How to use Listen</p><p className="hp-lede">Get results in hours instead of weeks</p></div>
      <div className="hp-video">
        <img src={M + "how-to-use.jpg"} alt="" />
        <div className="hp-stats">
          {[["3x", "Longer customer responses than average"], ["<24h", "Time to results instead of days"], ["50m+", "Possible respondents for studies"]].map(([n, l]) => (
            <div key={n}><p className="hp-stat">{n}</p><p className="hp-t14 hp-soft">{l}</p></div>
          ))}
        </div>
      </div>
    </section>
  )
}

const HARRIS = "Emerald Research Group\nThe Harris Poll"
const EXPERTS: Array<[string, string, string]> = [
  ["Camille Le", "Lead Insights Strategist", "Morning Consult\nThe Concord Group"],
  ["Andya Pakpahan", "Senior Insights Strategist", "Morning Consult\nMarketCast"],
  ["Amanda Harrop", "Insights Strategist", HARRIS], ["Ryan Kelly", "Insights Strategist", HARRIS],
  ["Katie McIntyre", "Insights Strategist", HARRIS], ["Charlee Roundhill-Dean", "Insights Strategist", HARRIS],
  ["Eva Starosolsky", "Insights Strategist", HARRIS], ["Emma Siegel", "Insights Strategist", HARRIS],
  ["Samara Sergeant", "Insights Strategist", HARRIS], ["Brenna Falchuk", "Insights Strategist", HARRIS],
  ["Maggie Brennan", "Insights Strategist", HARRIS], ["David Bruce", "Insights Strategist", HARRIS],
]

function Experts(): JSX.Element {
  return (
    <section className="hp-experts">
      <div className="hp-exp-left">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p className="hp-h2" style={{ textAlign: "left" }}>Research experts, on your team</p>
          <p className="hp-lede" style={{ textAlign: "left" }}>Senior in-house researchers across UX, Insights, and Data Science</p>
        </div>
        <div className="hp-exp-feat">
          <img src={M + "expert.jpg"} alt="" />
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ fontSize: 20, lineHeight: 1.4, letterSpacing: -0.4 }}><p>Eric Knoben</p><p className="hp-soft">Head of Insights</p></div>
            <div className="hp-t12" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <p className="hp-soft">Previously:</p><p style={{ whiteSpace: "pre-line" }}>{HARRIS}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="hp-exp-list">
        {EXPERTS.map(([n, r, prev]) => (
          <div key={n} className="hp-exp-row">
            <div className="hp-t16"><p>{n}</p><p className="hp-soft">{r}</p></div>
            <p className="hp-t12 hp-soft" style={{ whiteSpace: "pre-line", textAlign: "right" }}>{prev}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

const FOOT: Array<[string, string[]]> = [
  ["Use Case", ["Consumer Journey Map", "Multi-Market Segmentation", "Brand Perception", "Concept & Prototype Testing", "Creative Testing", "Usability Testing"]],
  ["Role", ["Consumer Insights", "Brand Marketers", "Product Managers", "UX Researchers", "Agencies", "Investors"]],
  ["Industry", ["Consumer Packaged Goods", "Technology", "E-commerce", "Healthcare", "Financial Services", "Hospitality & Travel"]],
  ["Resources", ["Personality Test", "Compare", "Blog", "Docs & Guides", "Media Requests"]],
  ["Company", ["Careers", "Founder Program", "What’s New"]],
  ["Legal", ["Privacy Policy", "Terms & Conditions", "Cookie Policy"]],
  ["Customers", ["Anthropic", "Cognition", "Sweet green", "Simple Modern", "McKinney", "KJT Group"]],
  ["Customers", ["Monitas", "Microsoft", "Sling Money", "Emeritus", "Chubbies"]],
]

function CtaFooter(): JSX.Element {
  return (
    <>
      <div className="hp-cta">
        <img src={M + "cta.jpg"} alt="" />
        <div className="hp-form">
          <p style={{ fontSize: 24, lineHeight: 1.4, letterSpacing: -0.48 }}>Book a demo</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {["Email address", "First name", "Last name"].map((f) => <div key={f} className="hp-field hp-t16">{f}</div>)}
            <span className="hp-btn hp-t16" style={{ height: 48, justifyContent: "center" }}>Book now <I name="arrow-right" size={20} stroke={1.25} /></span>
            <p className="hp-soft" style={{ fontSize: 10, lineHeight: "14px", letterSpacing: -0.2 }}>
              By clicking “Submit”, you agree Listen Labs may use your information as described in our <u>Privacy Policy</u>, including to contact you about our products and services.
            </p>
          </div>
        </div>
      </div>
      <footer className="hp-foot hp-t14">
        <div className="hp-foot-cols">
          {FOOT.map(([h, links], i) => (
            <div key={i}><p className="hp-soft">{h}</p><ul>{links.map((l) => <li key={l}>{l}</li>)}</ul></div>
          ))}
        </div>
        <div className="hp-foot-bar hp-soft"><span>© 2026 Listen Labs • All rights reserved</span><span>LinkedIn • Twitter • YouTube</span></div>
      </footer>
    </>
  )
}

const TAG = ["Estd. 2023", "A Human Company", "AI Moderated Research", "San Francisco, CA"]
function Mark({ style }: { style: React.CSSProperties }): JSX.Element {
  return (
    <svg className="mark" style={style} viewBox="0 0 16.3 22.6" fill={C.onBrand}>
      <path d="M15.3743 0.408977H8.45517C7.9619 0.408977 7.56238 0.808502 7.56238 1.30177V8.22092C7.56238 8.71419 7.9619 9.11371 8.45517 9.11371H15.3743C15.8676 9.11371 16.2671 8.71419 16.2671 8.22092V1.30177C16.2671 0.808502 15.8676 0.408977 15.3743 0.408977Z" />
      <path d="M6.71435 9.11354H0.893341C0.383333 9.11354 -0.0284702 9.54096 0.00166153 10.051C0.308559 15.266 3.15769 19.8081 7.3248 22.453C7.75 22.7231 8.31468 22.5847 8.57025 22.1506L11.5232 17.1498C11.7642 16.7413 11.6437 16.2157 11.2486 15.9534C9.23873 14.6221 7.84597 12.4314 7.60268 9.90812C7.55916 9.45503 7.17079 9.11354 6.71547 9.11354H6.71435Z" />
    </svg>
  )
}
function Band(): JSX.Element {
  const corner = (pos: React.CSSProperties, right?: boolean) => (
    <div className="corner hp-t12" style={{ ...pos, textAlign: right ? "right" : "left" }}>{TAG.map((t) => <p key={t}>{t}</p>)}</div>
  )
  return (
    <section className="hp-band">
      <img className="art" src={M + "footer-art.jpg"} alt="" />
      <img className="word" src={M + "wordmark.svg"} alt="Listen Labs" />
      {corner({ left: 24, top: 24 })}{corner({ right: 24, top: 24 }, true)}
      {corner({ left: 24, bottom: 24 })}{corner({ right: 24, bottom: 24 }, true)}
      <Mark style={{ top: 46 }} /><Mark style={{ bottom: 46 }} />
    </section>
  )
}

// ------------------------------------------------------------ review panel ---
const WIDTHS: Array<[string, number]> = [["390", 390], ["768", 768], ["1024", 1024], ["1280", 1280], ["1440", 1440], ["Full", 0]]
const STYLES: Array<[StepStyle, string]> = [["captions", "Captions"], ["list", "List"], ["stage", "Stage"]]

function readParams() {
  const q = new URLSearchParams(location.search)
  const st = (v: string | null, d: StepStyle): StepStyle => (v === "captions" || v === "list" || v === "stage" ? v : d)
  return { w: +(q.get("w") ?? 0) || 0, hiw: st(q.get("hiw"), "captions"), uc: st(q.get("uc"), "list"), grid: q.get("grid") === "1", panel: q.get("panel") !== "0" }
}

export default function Home(): JSX.Element {
  const [s, setS] = React.useState(readParams)
  const [vw, setVw] = React.useState(window.innerWidth)
  const [pageRef, pageW] = useWidth()
  React.useEffect(() => {
    const on = () => setVw(window.innerWidth)
    window.addEventListener("resize", on)
    return () => window.removeEventListener("resize", on)
  }, [])
  // keep the state in the URL so a setup can be shared
  React.useEffect(() => {
    const q = new URLSearchParams()
    if (s.w) q.set("w", String(s.w))
    if (s.hiw !== "captions") q.set("hiw", s.hiw)
    if (s.uc !== "list") q.set("uc", s.uc)
    if (s.grid) q.set("grid", "1")
    if (!s.panel) q.set("panel", "0")
    const search = q.toString() ? "?" + q : ""
    history.replaceState(null, "", location.pathname + search)
    rememberHomeSearch(search)
  }, [s])
  React.useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return
      if (e.key === "g") setS((p) => ({ ...p, grid: !p.grid }))
      if (e.key === "p") setS((p) => ({ ...p, panel: !p.panel }))
    }
    window.addEventListener("keydown", key)
    return () => window.removeEventListener("keydown", key)
  }, [])
  const set = (p: Partial<typeof s>) => setS((o) => ({ ...o, ...p }))
  const seg = <T extends string | number>(v: T, opts: Array<[T, string]>, on: (v: T) => void) => (
    <div className="hp-seg">{opts.map(([o, l]) => <button key={String(o)} aria-pressed={v === o} onClick={() => on(o)}>{l}</button>)}</div>
  )

  return (
    <div style={{ background: s.w ? "#D9D3C7" : C.bg, minHeight: "100vh" }}>
      <style>{CSS}</style>
      {/* the tool bar hides with the panel (P), for clean screenshots */}
      {s.panel && <ToolBar view="home" sticky />}
      <div ref={pageRef} className="hp" style={{ ["--hp-top" as string]: s.panel ? TOOLBAR_H + "px" : "0px", width: s.w ? Math.min(s.w, vw) : "100%", boxShadow: s.w ? "0 0 0 1px #C9C1B2" : undefined }}>
        {s.grid && <div className="hp-gridov">{Array.from({ length: 12 }, (_, i) => <div key={i} />)}</div>}
        <Nav />
        <Hero />
        <LogoWall />
        <HowItWorks style={s.hiw} />
        <Customers />
        <UseCases style={s.uc} />
        <HowToUse />
        <Experts />
        <CtaFooter />
        <Band />
      </div>
      {s.panel ? (
        <div className="hp-panel">
          <h4>Page width · {Math.round(pageW)}px</h4>
          {seg(s.w, WIDTHS.map(([l, w]) => [w, l] as [number, string]), (w) => set({ w }))}
          <input type="range" min={320} max={Math.max(320, vw)} step={1} value={s.w || vw} onChange={(e) => set({ w: +e.target.value >= vw ? 0 : +e.target.value })} />
          <h4>How it works</h4>
          {seg(s.hiw, STYLES, (hiw) => set({ hiw }))}
          <h4>Use Cases</h4>
          {seg(s.uc, STYLES, (uc) => set({ uc }))}
          <h4>View</h4>
          <div className="hp-seg">
            <button aria-pressed={s.grid} onClick={() => set({ grid: !s.grid })}>Grid (G)</button>
            <button onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}>How it works ↓</button>
            <button onClick={() => document.getElementById("use-cases")?.scrollIntoView({ behavior: "smooth" })}>Use Cases ↓</button>
            <button onClick={() => set({ panel: false })}>Hide (P)</button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
