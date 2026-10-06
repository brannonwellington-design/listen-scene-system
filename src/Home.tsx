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
//
// Layout is the mock's grid: 12 columns, 24px gutters and margins, content
// capped at 1392 and centered (backgrounds still run full width). Under 1024
// it's 8 columns; under 640, 4 columns with 16px gutters and margins. Every
// block is placed by column span (`sp(desktop, tablet, mobile)`), so it stays
// on the grid at every width.
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
/* zero-specificity reset: the live scenes inside keep their own margins
   (the app sidebar pins its footer with margin-top: auto) */
:where(.hp) :where(*) { box-sizing: border-box; }
:where(.hp) :where(p, h1, h2, h3, ul) { margin: 0; }
.hp > * { --margin: 24px; }
.hp-grid { --cols: 12; --gut: 24px; display: grid; grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
  column-gap: var(--gut); width: 100%; max-width: 1392px; margin: 0 auto; }
.hp-grid > * { grid-column: var(--d, 1 / -1); min-width: 0; }
.hp-sec { padding: 80px var(--margin); }
.hp-sec > .hp-grid { row-gap: 80px; }
.hp-h2 { font-size: 32px; line-height: 1.2; letter-spacing: -0.64px; text-align: center; }
.hp-lede { font-size: 20px; line-height: 1.4; letter-spacing: -0.4px; color: ${C.soft}; text-align: center; }
.hp-head { display: flex; flex-direction: column; gap: 8px; align-items: center; }
.hp-t14 { font-size: 14px; line-height: 20px; letter-spacing: -0.28px; }
.hp-t16 { font-size: 16px; line-height: 22px; letter-spacing: -0.32px; }
.hp-t12 { font-size: 12px; line-height: 16px; letter-spacing: -0.24px; }
.hp-soft { color: ${C.soft}; }

/* nav */
.hp-nav { position: sticky; top: var(--hp-top, 0px); z-index: 40; height: 68px; padding: 0 var(--margin); background: ${C.bg}; }
.hp-navin { position: relative; height: 100%; max-width: 1392px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }
.hp-nav-links { display: flex; gap: 24px; align-items: center; position: absolute; left: 50%; transform: translateX(-50%); }
.hp-nav-links span { display: inline-flex; gap: 4px; align-items: center; }
.hp-nav-right { display: flex; gap: 24px; align-items: center; }
.hp-btn { background: ${C.ink}; color: ${C.onBrand}; border-radius: 8px; display: inline-flex; align-items: center; gap: 8px; white-space: nowrap; }
.hp-menu { display: none; width: 32px; height: 32px; align-items: center; justify-content: center; }

/* hero */
.hp-hero { padding: 0 var(--margin) 24px; }
.hp-hero > .hp-grid { align-items: center; row-gap: 40px; }
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
.hp-feat { display: block; color: ${C.ink}; }
.hp-feat .hp-ms { position: absolute; left: 16px; top: 16px; height: 20px; color: ${C.ink}; }
.hp-feat .hp-up { position: absolute; right: 12px; top: 12px; width: 24px; height: 24px; }
.hp-feat div { position: absolute; left: 16px; bottom: 16px; width: 162px; }
.hp-quad { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 1px; min-width: 0; }
.hp-quad span { background: ${C.highlight}; display: flex; align-items: center; justify-content: center; min-width: 0; }
.hp-quad img { height: 20px; }
.hp-big { font-size: 48px; line-height: 1.2; letter-spacing: -1.92px; }

/* live sections */
.hp-live { width: 100%; }

/* customers */
.hp-cust { position: relative; display: flex; flex-direction: column; gap: 24px; }
.hp-cust-img { position: relative; aspect-ratio: 920 / 518; border-radius: 12px; }
.hp-cust-img img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; border-radius: 12px; }
.hp-cust-img img.ghost { opacity: .2; }
.hp-quote { font-size: clamp(22px, 1.95cqw, 28px); line-height: 1.2; letter-spacing: -0.02em; }
.hp-cust-meta { display: flex; gap: 95px; align-items: flex-start; }
.hp-segs { display: flex; gap: 8px; }

/* how to use */
.hp-video { display: flex; flex-direction: column; gap: 24px; }
.hp-video img { width: 100%; aspect-ratio: 684 / 386; object-fit: cover; border-radius: 12px; display: block; }
.hp-stats { display: flex; gap: 24px; }
.hp-stats > div { flex: 1; min-width: 0; }
.hp-stat { font-size: 64px; line-height: 1.2; letter-spacing: -2.56px; white-space: nowrap; }

/* experts */
.hp-experts { padding: 80px var(--margin); background: ${C.highlight}; }
.hp-experts > .hp-grid { row-gap: 48px; }
.hp-exp-left { display: flex; flex-direction: column; justify-content: space-between; gap: 48px; }
.hp-exp-feat { display: grid; grid-template-columns: 1fr 1fr; gap: 23px; }
.hp-exp-feat img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 12px; display: block; }
.hp-exp-list { display: flex; flex-direction: column; }
.hp-exp-row { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 16px 0; border-bottom: 1px solid ${C.tertiary}; }
.hp-exp-row:first-child { padding-top: 0; }

/* cta + footer */
.hp-ctawrap { padding: var(--margin); }
.hp-cta { position: relative; height: 800px; border-radius: 12px; overflow: hidden; }
.hp-cta > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.hp-form { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 448px; max-width: calc(100% - 32px);
  padding: 24px; border-radius: 12px; background: ${C.bg}; display: flex; flex-direction: column; gap: 24px; }
.hp-field { height: 48px; border: 1px solid ${C.ink}; border-radius: 8px; background: ${C.highlight}; padding: 0 12px; }
.hp-foot { padding: 0 var(--margin) var(--margin); }
.hp-foot > .hp-grid { row-gap: 48px; }
.hp-foot ul { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 4px; margin-top: 12px; }
.hp-foot-bar { display: flex; justify-content: space-between; gap: 16px; }

/* brand band */
.hp-band { position: relative; height: clamp(520px, 55.5cqw, 800px); background: ${C.ink}; color: ${C.onBrand}; overflow: hidden; }
.hp-band .art { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: min(450px, 60cqw); aspect-ratio: 3 / 2; object-fit: cover; }
.hp-band .word { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: min(912px, calc(100cqw - 48px)); }
.hp-bandin { position: absolute; top: 0; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 1440px; }
.hp-band .corner { position: absolute; }
.hp-band .mark { position: absolute; left: 50%; transform: translateX(-50%); width: 15px; height: 20px; }

/* ---- breakpoints (container width) ---- */
@container (max-width: 1024px) {
  .hp-grid { --cols: 8; }
  .hp-grid > * { grid-column: var(--t, 1 / -1); }
  .hp-wall { flex-direction: column; }
}
@container (max-width: 900px) {
  .hp-nav-links { display: none; }
  .hp-menu { display: inline-flex; }
  .hp-cust-meta { gap: 48px; }
}
@container (max-width: 640px) {
  .hp > * { --margin: 16px; }
  .hp-grid { --cols: 4; --gut: 16px; }
  .hp-grid > * { grid-column: var(--m, 1 / -1); }
  .hp-h2 { font-size: 24px; line-height: 1.4; letter-spacing: -0.48px; }
  .hp-lede { font-size: 16px; line-height: 22px; letter-spacing: -0.32px; }
  .hp-nav-right .hp-signin { display: none; }
  .hp-hero { padding-top: 32px; padding-bottom: 16px; }
  .hp-hero-img { aspect-ratio: 1 / 1; }
  .hp-hero-img img { object-position: 50% 35%; }
  .hp-row { flex-direction: column; height: auto; }
  .hp-feat { height: 180px; flex: none; }
  .hp-quad { height: 200px; flex: none; }
  .hp-cust-meta { flex-direction: column; gap: 24px; }
  .hp-stats { flex-direction: column; gap: 24px; }
  .hp-stat { font-size: 48px; }
  .hp-experts { padding-top: 64px; padding-bottom: 64px; }
  .hp-cta { height: 640px; }
  .hp-foot-bar { flex-direction: column; }
}

/* ---- interaction states ---- */
.hp a { color: inherit; text-decoration: none; }
/* the brand buttons outrank the link/button resets above (same elements) */
.hp a.hp-btn, .hp button.hp-btn { background: ${C.ink}; color: ${C.onBrand}; }
.hp a.hp-btn:hover, .hp button.hp-btn:hover { background: #0019A3; }
.hp button { font: inherit; color: inherit; background: none; border: none; padding: 0; cursor: pointer; }
.hp [id] { scroll-margin-top: var(--hp-top, 0px); }
.hp :focus-visible { outline: 2px solid ${C.ink}; outline-offset: 2px; border-radius: 4px; }
.hp-btn { transition: background-color .15s ease; cursor: pointer; }
.hp-btn:hover { background: #0019A3; }
.hp-link { transition: opacity .15s ease; }
.hp-link:hover { opacity: .6; }
.hp-nav { transition: box-shadow .2s ease; }
.hp-nav.scrolled { box-shadow: 0 1px 0 ${C.tertiary}; }
.hp-feat { cursor: pointer; transition: background-color .2s ease; }
.hp-feat:hover { background: #FFFFFF; }
.hp-feat .hp-up { transition: transform .2s ease; }
.hp-feat:hover .hp-up { transform: translate(3px, -3px); }
.hp-quad span { transition: background-color .2s ease; cursor: pointer; }
.hp-quad span:hover { background: #FFFFFF; }
.hp-exp-row { transition: background-color .15s ease; }
.hp-exp-row:hover { background: rgba(0, 33, 204, 0.03); }
.hp-foot a:hover { opacity: .6; }
.hp-foot a { transition: opacity .15s ease; }
@keyframes hp-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
.hp-in { animation: hp-in .45s cubic-bezier(.22,1,.36,1) both; }
@keyframes hp-grow { from { transform: scaleX(0); } to { transform: none; } }

/* nav menus */
.hp-nav-links button { display: inline-flex; gap: 4px; align-items: center; transition: opacity .15s ease; }
.hp-nav-links button:hover, .hp-nav-links button[aria-expanded="true"] { opacity: .6; }
.hp-nav-links button svg { transition: transform .2s ease; }
.hp-nav-links button[aria-expanded="true"] svg { transform: rotate(180deg); }
.hp-drop { position: absolute; top: calc(100% - 8px); left: 50%; transform: translateX(-50%); z-index: 50;
  background: ${C.highlight}; border: 1px solid ${C.tertiary}; border-radius: 12px; padding: 20px 24px;
  box-shadow: 0 12px 32px rgba(0, 33, 204, .08); display: grid; grid-auto-flow: column; gap: 40px; white-space: nowrap; }
.hp-drop h5 { font: inherit; font-size: 12px; line-height: 16px; color: ${C.soft}; margin: 0 0 10px; font-weight: 400; }
.hp-drop a { display: block; font-size: 14px; line-height: 20px; padding: 4px 0; }
.hp-sheet { position: absolute; left: 0; right: 0; top: 100%; height: calc(100dvh - 68px - var(--hp-top, 0px)); overflow-y: auto;
  background: ${C.bg}; padding: 8px var(--margin) 32px; border-top: 1px solid ${C.tertiary}; display: flex; flex-direction: column; }
.hp-sheet details { border-bottom: 1px solid ${C.tertiary}; }
.hp-sheet summary, .hp-sheet > a { list-style: none; display: flex; justify-content: space-between; align-items: center; padding: 16px 0; font-size: 20px; line-height: 1.4; letter-spacing: -0.4px; cursor: pointer; }
.hp-sheet > a { border-bottom: 1px solid ${C.tertiary}; }
.hp-sheet summary::-webkit-details-marker { display: none; }
.hp-sheet details[open] summary svg { transform: rotate(180deg); }
.hp-sheet details a { display: block; padding: 6px 0; font-size: 16px; line-height: 22px; color: ${C.soft}; }
.hp-sheet details > div { padding-bottom: 16px; }

/* forms */
.hp-email input, .hp-field { font: inherit; color: ${C.ink}; }
.hp-email input { flex: 1; min-width: 0; height: 100%; border: 0; outline: 0; background: transparent; padding: 0 12px; }
.hp-email input::placeholder, .hp-field::placeholder { color: ${C.soft}; opacity: 1; }
.hp-email:focus-within { box-shadow: 0 0 0 3px rgba(0, 33, 204, .15); }
.hp-email button.hp-btn { border-radius: 0; padding: 0 12px; height: 100%; }
.hp-field { width: 100%; outline: 0; transition: box-shadow .15s ease; }
.hp-field:focus { box-shadow: 0 0 0 3px rgba(0, 33, 204, .15); }
.hp-field.bad, .hp-email.bad { border-color: #C2261B; }
.hp-err { font-size: 12px; line-height: 16px; color: #C2261B; margin-top: 6px; }

/* customers carousel */
.hp-cust-img { touch-action: pan-y; user-select: none; }
.hp-cust-img img { transition: transform .7s cubic-bezier(.22,1,.36,1), opacity .7s ease; }
.hp-segs button { flex: 1; height: 13px; display: flex; align-items: center; }
.hp-segs button span { display: block; width: 100%; height: 1px; background: ${C.tertiary}; position: relative; overflow: hidden; }
.hp-segs button span i { position: absolute; inset: 0; background: ${C.ink}; transform-origin: left center; }

/* video */
.hp-play { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 72px; height: 72px; border-radius: 50%;
  background: rgba(249, 244, 235, .92); display: flex; align-items: center; justify-content: center; transition: transform .2s ease; }
.hp-videobtn { position: relative; display: block; width: 100%; border-radius: 12px; overflow: hidden; }
.hp-videobtn:hover .hp-play { transform: translate(-50%, -50%) scale(1.08); }
.hp-lightbox { position: fixed; inset: 0; z-index: 200; background: rgba(4, 10, 46, .82); display: flex; align-items: center; justify-content: center; padding: 24px; }
.hp-lightbox > div { position: relative; width: min(1040px, 100%); aspect-ratio: 16 / 9; border-radius: 12px; background: #0E0F14;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: ${C.onBrand}; }
.hp-lightbox .x { position: absolute; top: 12px; right: 12px; width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,.12); color: #FFF;
  display: flex; align-items: center; justify-content: center; }

/* hero widget frame */
.hp-hero-img iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; display: block; }

/* review panel (not part of the page) */
.hp-panel { position: fixed; right: 16px; bottom: 16px; z-index: 100; width: 300px; font: 13px/1.4 'Inter', sans-serif; color: #1F1D1A;
  background: #FFF; border: 1px solid #DDD6C8; border-radius: 12px; box-shadow: 0 6px 24px rgba(0,0,0,.10); padding: 12px; }
.hp-panel h4 { font-size: 12px; font-weight: 500; color: #6B6861; margin: 10px 0 6px; }
.hp-panel h4:first-child { margin-top: 0; }
.hp-seg { display: flex; flex-wrap: wrap; gap: 4px; }
.hp-seg button { font: inherit; font-size: 12px; padding: 4px 8px; border-radius: 6px; border: 1px solid #DDD6C8; background: #FFF; color: #1F1D1A; cursor: pointer; }
.hp-seg button[aria-pressed="true"] { background: #1F1D1A; border-color: #1F1D1A; color: #F9F4EB; }
.hp-panel input[type=range] { width: 100%; }
.hp-gridov { position: absolute; top: 0; bottom: 0; left: 50%; transform: translateX(-50%); width: calc(100% - 2 * var(--margin));
  max-width: 1392px; z-index: 30; pointer-events: none;
  display: grid; grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); column-gap: var(--gut); --cols: 12; --gut: 24px; }
.hp-gridov div { background: rgba(0, 33, 204, 0.05); border-left: 1px solid rgba(0, 33, 204, .16); border-right: 1px solid rgba(0, 33, 204, .16); }
@container (max-width: 1024px) { .hp-gridov { --cols: 8; } .hp-gridov div:nth-child(n+9) { display: none; } }
@container (max-width: 640px) { .hp-gridov { --cols: 4; --gut: 16px; } .hp-gridov div:nth-child(n+5) { display: none; } }
`

/** a grid span per breakpoint: desktop (12 cols), tablet (8), mobile (4);
 *  an omitted span means the full row */
const sp = (d?: string, t?: string, m?: string) => ({ "--d": d, "--t": t, "--m": m }) as React.CSSProperties

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

const USE_CASE_LINKS = ["Consumer Journey Map", "Multi-Market Segmentation", "Brand Perception", "Concept & Prototype Testing", "Creative Testing", "Usability Testing"]
const ROLE_LINKS = ["Consumer Insights", "Brand Marketers", "Product Managers", "UX Researchers", "Agencies", "Investors"]
const INDUSTRY_LINKS = ["Consumer Packaged Goods", "Technology", "E-commerce", "Healthcare", "Financial Services", "Hospitality & Travel"]
const RESOURCE_LINKS = ["Personality Test", "Compare", "Blog", "Docs & Guides", "Media Requests"]
/** the nav's menus: columns of [heading, links]; links named here are the
 *  footer's, plus the product surfaces for Features */
const MENUS: Record<string, Array<[string, string[]]>> = {
  Solutions: [["By use case", USE_CASE_LINKS], ["By role", ROLE_LINKS], ["By industry", INDUSTRY_LINKS]],
  Features: [["Platform", ["Research Agent", "Emotional Intelligence", "Active Observation", "Listen Twins", "Research Library"]]],
  Resources: [["Learn", RESOURCE_LINKS]],
}
const NAV: Array<[string, string]> = [["Solutions", ""], ["Features", ""], ["Customers", "#customers"], ["Resources", ""], ["Careers", "#"]]
/** where a menu or footer link goes: the sections this page has, else nowhere */
const hrefFor = (label: string) => USE_CASE_LINKS.includes(label) || label === "Use cases" ? "#use-cases"
  : label === "Customers" ? "#customers" : "#"
const jump = (e: React.MouseEvent, href: string) => {
  if (!href.startsWith("#")) return
  e.preventDefault()
  if (href === "#") return
  document.querySelector(href)?.scrollIntoView({ behavior: "smooth" })
}

function Nav(): JSX.Element {
  const [open, setOpen] = React.useState("")
  const [sheet, setSheet] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)
  const ref = React.useRef<HTMLElement>(null)
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(""); setSheet(false) } }
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen("") }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("keydown", onKey)
    window.addEventListener("mousedown", onDown)
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("keydown", onKey); window.removeEventListener("mousedown", onDown) }
  }, [])
  const go = (e: React.MouseEvent, href: string) => { setOpen(""); setSheet(false); jump(e, href) }
  return (
    <nav ref={ref} className={"hp-nav" + (scrolled || sheet ? " scrolled" : "")} onMouseLeave={() => setOpen("")}><div className="hp-navin">
      <a href="#top" onClick={(e) => { e.preventDefault(); setSheet(false); window.scrollTo({ top: 0, behavior: "smooth" }) }} aria-label="Listen Labs home">
        <img src={M + "logo.svg"} alt="Listen Labs" style={{ height: 20, display: "block" }} />
      </a>
      <div className="hp-nav-links hp-t14">
        {NAV.map(([l, href]) => MENUS[l] ? (
          <div key={l} style={{ position: "relative" }} onMouseEnter={() => setOpen(l)}>
            <button aria-expanded={open === l} aria-haspopup="true" onClick={() => setOpen(open === l ? "" : l)}>{l}<I name="chevron-down" size={12} /></button>
            {open === l && (
              <div className="hp-drop hp-in" role="menu" style={{ paddingTop: 20 }}>
                {MENUS[l].map(([h, links]) => (
                  <div key={h}><h5>{h}</h5>{links.map((x) => <a key={x} role="menuitem" href={hrefFor(x)} className="hp-link" onClick={(e) => go(e, hrefFor(x))}>{x}</a>)}</div>
                ))}
              </div>
            )}
          </div>
        ) : <a key={l} href={href} className="hp-link" onMouseEnter={() => setOpen("")} onClick={(e) => go(e, href)}>{l}</a>)}
      </div>
      <div className="hp-nav-right hp-t14">
        <a href="#" className="hp-signin hp-link" onClick={(e) => e.preventDefault()}>Sign in</a>
        <a href="#demo" className="hp-btn" style={{ height: 32, padding: "0 8px" }} onClick={(e) => go(e, "#demo")}>Demo</a>
        <button className="hp-menu" aria-label={sheet ? "Close menu" : "Menu"} aria-expanded={sheet} onClick={() => setSheet(!sheet)}>
          {sheet ? <I name="x" size={20} />
            : <svg width="18" height="12" viewBox="0 0 18 12" stroke={C.ink} strokeWidth="1.5"><path d="M0 1h18M0 6h18M0 11h18" /></svg>}
        </button>
      </div>
    </div>
    {sheet && (
      <div className="hp-sheet hp-in">
        {NAV.map(([l, href]) => MENUS[l] ? (
          <details key={l}>
            <summary>{l}<I name="chevron-down" size={16} /></summary>
            <div>{MENUS[l].flatMap(([, links]) => links).map((x) => <a key={x} href={hrefFor(x)} onClick={(e) => go(e, hrefFor(x))}>{x}</a>)}</div>
          </details>
        ) : <a key={l} href={href} onClick={(e) => go(e, href)}>{l}</a>)}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 32 }}>
          <a href="#demo" className="hp-btn hp-t16" style={{ height: 48, justifyContent: "center" }} onClick={(e) => go(e, "#demo")}>Book a demo</a>
          <a href="#" className="hp-t16" style={{ height: 48, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${C.ink}`, borderRadius: 8 }} onClick={(e) => e.preventDefault()}>Sign in</a>
        </div>
      </div>
    )}
    </nav>
  )
}

/** an email check good enough for a mock form */
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())

/** the hero's email capture: validates, then thanks */
function HeroEmail(): JSX.Element {
  const [v, setV] = React.useState("")
  const [err, setErr] = React.useState("")
  const [done, setDone] = React.useState("")
  if (done) return <p className="hp-t16 hp-in" style={{ maxWidth: 448, minHeight: 48, display: "flex", alignItems: "center" }}>Thanks, we’ll be in touch at {done}.</p>
  return (
    <form noValidate onSubmit={(e) => { e.preventDefault(); if (!isEmail(v)) setErr(v ? "Enter a valid work email." : "Enter your work email."); else setDone(v.trim()) }}>
      <div className={"hp-email hp-t16" + (err ? " bad" : "")}>
        <input type="email" value={v} placeholder="What’s your work email?" aria-label="Work email" aria-invalid={!!err}
          onChange={(e) => { setV(e.target.value); setErr("") }} />
        <button type="submit" className="hp-btn">Book a demo <I name="arrow-right" size={20} stroke={1.25} /></button>
      </div>
      {err && <p className="hp-err">{err}</p>}
    </form>
  )
}

/** the hero image: the live insight widget (hero-widget/, synced from its
 *  repo), or the mock's static photo */
function Hero({ widget }: { widget: boolean }): JSX.Element {
  return (
    <section className="hp-hero" id="top"><div className="hp-grid">
      <div style={{ ...sp("1 / 7", "1 / 5"), display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h1>Customer Understanding,<br />Loud and Clear.</h1>
          <p className="hp-soft" style={{ fontSize: 20, lineHeight: 1.4, letterSpacing: -0.4, maxWidth: 684 }}>
            What people think, why they think it, and what to do about it. From real interviews, not anecdotes.
          </p>
        </div>
        <HeroEmail />
      </div>
      <div className="hp-hero-img" style={{ ...sp("7 / 13", "5 / 9"), background: "#5FA0BF" }}>
        {widget ? (
          <iframe src="/hero-widget/index.html?embed=1&controls=0" title="Participant insights" allow="autoplay" />
        ) : (
          <>
            <img src={M + "hero.jpg"} alt="" />
            <div className="hp-chip hp-t14"><p>Amanda Watterson</p><p className="hp-soft">34 years old</p><p className="hp-soft">New York City, NY</p></div>
          </>
        )}
      </div>
    </div></section>
  )
}

// customer logos: the live site's one-color marks (listenlabs.com, pulled
// 2026-10-05 from its logo components), all 40 units tall; each entry is the
// mark's width in those units. Drawn as a mask so they take the page's ink.
const LOGOS: Record<string, number> = {
  "Microsoft": 187, "Skims": 179, "SoFi": 150, "Nestle": 148, "Google": 123, "Sony": 227, "Keurig Dr. Pepper": 134,
  "Anthropic": 355, "ByteDance": 232, "Cognition": 187, "Clear": 149, "Chobani": 206, "Morse": 270, "Calendly": 166,
  "Swarovski": 297, "Perplexity": 166, "Sweetgreen": 276, "Okta": 121, "Chubbies": 178, "Levis": 96, "Square": 40,
  "Bissell": 214, "Robinhood": 209,
}
const logoFile = (c: string) => M + "logos/" + c.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".svg"

// the logo wall's feature tiles: the live site's four case studies
type CaseTile = { company: string; stat: string; label: string }
const CASE_TILES: CaseTile[] = [
  { company: "Microsoft", stat: "150+", label: "Global, multilingual interviews" },
  { company: "Sweetgreen", stat: "300+", label: "Locations tested" },
  { company: "Anthropic", stat: "100", label: "Studies in the time of 5" },
  { company: "Simple Modern", stat: "4x", label: "Larger sample size" },
]
/** a company's mark at height h, capped to maxW; its name if there's no mark
 *  (Simple Modern has none on the live site) */
function Wordmark({ company, h = 20, maxW = 160 }: { company: string; h?: number; maxW?: number }): JSX.Element {
  const units = LOGOS[company]
  if (!units) return <span style={{ fontSize: h * 0.8, lineHeight: h + "px", letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>{company}</span>
  const w = Math.min(maxW, units * h / 40)
  const url = `url("${logoFile(company)}")`
  return <span role="img" aria-label={company} style={{
    display: "block", width: w, height: h, background: "currentColor",
    WebkitMask: `${url} center / contain no-repeat`, mask: `${url} center / contain no-repeat`,
  }} />
}

function Feature({ tile }: { tile: CaseTile }): JSX.Element {
  return (
    <a className="hp-feat" href="#customers" onClick={(e) => jump(e, "#customers")} aria-label={tile.company + " case study"}>
      <span className="hp-ms"><Wordmark company={tile.company} /></span>
      <img className="hp-up" src={M + "arrow-up-right.svg"} alt="" loading="lazy" />
      <div><p className="hp-big">{tile.stat}</p><p className="hp-t12">{tile.label}</p></div>
    </a>
  )
}
// the small tiles: every other mark, two per cell, flipping like the live
// site's (each cell on its own beat)
const WALL = Object.keys(LOGOS).filter((c) => !CASE_TILES.some((t) => t.company === c))
const FLIP_MS = 3200

function LogoCell({ a, b, delay }: { a: string; b: string; delay: number }): JSX.Element {
  const [front, setFront] = React.useState(true)
  React.useEffect(() => {
    let iv: ReturnType<typeof setInterval> | undefined
    const t = setTimeout(() => { setFront((f) => !f); iv = setInterval(() => setFront((f) => !f), FLIP_MS * 2) }, FLIP_MS + delay)
    return () => { clearTimeout(t); if (iv) clearInterval(iv) }
  }, [delay])
  const layer = (c: string, on: boolean) => (
    <span aria-hidden={!on} style={{
      position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
      clipPath: on ? "inset(0 0 0 0)" : "inset(100% 0 0 0)", opacity: on ? 1 : 0,
      transition: "clip-path .6s cubic-bezier(.22,1,.36,1), opacity .4s ease",
    }}><Wordmark company={c} h={20} maxW={110} /></span>
  )
  return <span style={{ position: "relative", color: C.ink }}>{layer(a, front)}{layer(b, !front)}</span>
}

/** one 2×2 block of cells; `at` is its place in the wall (0–3), so the 16
 *  marks showing at once are all different */
function Quad({ at }: { at: number }): JSX.Element {
  return (
    <div className="hp-quad">
      {[0, 1, 2, 3].map((i) => {
        const k = at * 4 + i
        return <LogoCell key={i} a={WALL[k % WALL.length]} b={WALL[(k + 16) % WALL.length]} delay={(k * 397) % FLIP_MS} />
      })}
    </div>
  )
}

function LogoWall(): JSX.Element {
  return (
    <section className="hp-sec"><div className="hp-grid">
      <p className="hp-h2" style={sp("4 / 10", "2 / 8")}>The research partner for hundreds of leading brands</p>
      <div className="hp-wall">
        <div className="hp-half">
          <div className="hp-row"><Feature tile={CASE_TILES[0]} /><Quad at={0} /></div>
          <div className="hp-row"><Quad at={1} /><Feature tile={CASE_TILES[1]} /></div>
        </div>
        <div className="hp-half">
          <div className="hp-row"><Feature tile={CASE_TILES[2]} /><Quad at={2} /></div>
          <div className="hp-row"><Quad at={3} /><Feature tile={CASE_TILES[3]} /></div>
        </div>
      </div>
    </div></section>
  )
}

/** How it works: the mock frames the shot on columns 3–10 of the 1392
 *  container (236 / 40 padding); on 8 columns it takes 2–7; narrower, the
 *  captions style switches to its stacked card and the padding doesn't apply */
function HowItWorks({ style }: { style: StepStyle }): JSX.Element {
  const [ref, w] = useWidth()
  const page = w + 48
  const cols = page > 1024 ? 12 : 8
  const colW = (w - (cols - 1) * 24) / cols
  const padX = Math.round((cols === 12 ? 2 : 1) * (colW + 24))
  const padY = Math.round(w * 40 / 1392)
  return (
    <section className="hp-sec" id="how-it-works"><div className="hp-grid">
      <div className="hp-head" style={sp("5 / 9", "2 / 8")}>
        <p className="hp-h2">A single place to run your research end-to-end.</p>
        <p className="hp-lede">From first question to insights that compound. Enterprise-grade controls throughout.</p>
      </div>
      <div ref={ref} className="hp-live">
        {w > 0 && <SceneCanvas layout="multi-step" sequence="how-it-works" stepStyle={style} maxWidth={1392} padX={padX} padY={padY} radius={12}
          swipeBleed={w <= 608 ? 16 : 24} />}
      </div>
    </div></section>
  )
}

type Testimonial = { quote: string; name: string; role: string; company: string; img: string; stat: string; statLabel: string }
// the live site's three customer stories (listenlabs.ai, 2026-10-05). Romani
// keeps the mock's photo and wording; the others use their case-study poster.
const TESTIMONIALS: Testimonial[] = [
  {
    quote: "“AI removes the drudgery of my work so that I can focus on things that really matter... focusing more on the strategic work, focusing more in talking to the customers, and it makes my day-to-day work a little bit more fun.”",
    name: "Romani Patel", role: "Director of Data Science", company: "Microsoft", img: "customer.jpg", stat: "150+", statLabel: "Global, Multilingual Interviews",
  },
  {
    quote: "“Think about it as 100 studies for the price, at least in terms of time, of five or six. Our researchers’ time is one of the scarcest commodities.”",
    name: "Jane Justice Leibrock", role: "Head of User Experience Research", company: "Anthropic", img: "customer-anthropic.jpg", stat: "100", statLabel: "Studies in the Time of 5",
  },
  {
    quote: "“Actually didn’t cut our research budget. We’re just doing 10 times more and being able to move much quicker.”",
    name: "Jonathan Neman", role: "CEO", company: "Sweetgreen", img: "customer-sweetgreen.jpg", stat: "300+", statLabel: "Locations Tested",
  },
]
const SLIDE_MS = 7000

/** the customers carousel: auto-advances (pausing on hover, off-screen, and
 *  for a beat after you interact), with the segments filling as it goes;
 *  click a segment, swipe the photo, or use the arrow keys */
function Customers(): JSX.Element {
  const n = TESTIMONIALS.length
  const [at, setAt] = React.useState(0)
  const [run, setRun] = React.useState(0)
  const [hold, setHold] = React.useState(false)
  const [seen, setSeen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  const drag = React.useRef<number | null>(null)
  const go = (i: number) => { setAt(((i % n) + n) % n); setRun((r) => r + 1) }
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver((e) => setSeen(e[0].isIntersecting), { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const playing = seen && !hold
  React.useEffect(() => {
    if (!playing) return
    const t = setTimeout(() => go(at + 1), SLIDE_MS)
    return () => clearTimeout(t)
  }, [playing, at, run])
  const t = TESTIMONIALS[at]
  // each slide's offset from the current one, wrapped so neighbors show both sides
  const off = (k: number) => ((k - at + n + Math.floor(n / 2)) % n) - Math.floor(n / 2)
  return (
    <section className="hp-sec" id="customers" style={{ overflow: "hidden" }}><div className="hp-grid">
      <p className="hp-h2">Hear it from our customers</p>
      <div ref={ref} className="hp-cust" style={sp("3 / 11")} tabIndex={0} aria-roledescription="carousel" aria-label="Customer stories"
        onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)}
        onKeyDown={(e) => { if (e.key === "ArrowRight") go(at + 1); if (e.key === "ArrowLeft") go(at - 1) }}>
        <div className="hp-cust-img"
          onPointerDown={(e) => { drag.current = e.clientX }}
          onPointerUp={(e) => { if (drag.current == null) return; const dx = e.clientX - drag.current; drag.current = null; if (Math.abs(dx) > 40) go(at + (dx < 0 ? 1 : -1)) }}>
          {TESTIMONIALS.map((x, k) => {
            const d = off(k)
            return <img key={k} src={M + x.img} alt="" loading="lazy" draggable={false}
              style={{ transform: `translateX(calc(${d} * (100% + 24px)))`, opacity: d === 0 ? 1 : 0.2, visibility: Math.abs(d) > 1 ? "hidden" : "visible" }} />
          })}
        </div>
        <div key={at} className="hp-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <p className="hp-quote">{t.quote}</p>
          <div className="hp-cust-meta">
            <div style={{ width: 495, maxWidth: "100%", display: "flex", flexDirection: "column", gap: 24 }}>
              <div className="hp-t16"><p>{t.name}</p><p className="hp-soft">{t.role}</p></div>
              <span style={{ height: 24, display: "flex", alignItems: "center" }}><Wordmark company={t.company} h={24} maxW={200} /></span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <p className="hp-big">{t.stat}</p><p className="hp-t16">{t.statLabel}</p>
            </div>
          </div>
        </div>
        <div className="hp-segs" style={{ height: 13 }}>
          {TESTIMONIALS.map((_, k) => (
            <button key={k} aria-label={"Story " + (k + 1)} aria-current={k === at} onClick={() => go(k)}>
              <span>{k < at && <i />}{k === at && <i key={run} style={{ animation: `hp-grow ${SLIDE_MS}ms linear both`, animationPlayState: playing ? "running" : "paused" }} />}</span>
            </button>
          ))}
        </div>
      </div>
    </div></section>
  )
}

function UseCases({ style }: { style: StepStyle }): JSX.Element {
  return (
    <section className="hp-sec" id="use-cases"><div className="hp-grid">
      <div className="hp-head" style={sp("4 / 10", "2 / 8")}>
        <p className="hp-h2">Use Cases</p>
        <p className="hp-lede">Designed for your research needs. From AI sentiment and adoption to concept tests and brand tracking.</p>
      </div>
      <div className="hp-live">
        <SceneCanvas layout="multi-step" sequence="use-cases" stepStyle={style} maxWidth={1392} />
      </div>
    </div></section>
  )
}

/** the video player stand-in until the real file exists; Esc or a click
 *  outside closes it */
function Lightbox({ onClose }: { onClose: () => void }): JSX.Element {
  React.useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", k)
    return () => window.removeEventListener("keydown", k)
  }, [onClose])
  return (
    <div className="hp-lightbox hp-in" role="dialog" aria-modal="true" aria-label="How to use Listen" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>
        <button className="x" aria-label="Close" onClick={onClose} autoFocus><I name="x" size={18} /></button>
        <p style={{ fontSize: 20, lineHeight: 1.4 }}>How to use Listen</p>
        <p className="hp-t14" style={{ opacity: .6 }}>Video coming soon</p>
      </div>
    </div>
  )
}

function HowToUse(): JSX.Element {
  const [play, setPlay] = React.useState(false)
  return (
    <section className="hp-sec" style={{ background: C.highlight }}><div className="hp-grid">
      <div className="hp-head" style={sp("5 / 9", "2 / 8")}><p className="hp-h2">How to use Listen</p><p className="hp-lede">Get results in hours instead of weeks</p></div>
      <div className="hp-video" style={sp("3 / 11")}>
        <button className="hp-videobtn" aria-label="Play: How to use Listen" onClick={() => setPlay(true)}>
          <img src={M + "how-to-use.jpg"} alt="" loading="lazy" />
          <span className="hp-play"><svg width="22" height="24" viewBox="0 0 22 24" fill={C.ink}><path d="M21 10.27a2 2 0 0 1 0 3.46L3 23.86A2 2 0 0 1 0 22.13V1.87A2 2 0 0 1 3 .14z" /></svg></span>
        </button>
        {play && <Lightbox onClose={() => setPlay(false)} />}
        <div className="hp-stats">
          {[["3x", "Longer customer responses than average"], ["<24h", "Time to results instead of days"], ["50m+", "Possible respondents for studies"]].map(([n, l]) => (
            <div key={n}><p className="hp-stat">{n}</p><p className="hp-t14 hp-soft">{l}</p></div>
          ))}
        </div>
      </div>
    </div></section>
  )
}

// the mock's list, with portraits and backgrounds from the live site's team
// (listenlabs.ai, 2026-10-05) where it has them. People the live site doesn't
// list keep the mock's placeholder background and have no portrait yet.
type Expert = { name: string; role: string; prev: string[]; photo?: string }
const MOCK_PREV = ["Emerald Research Group", "The Harris Poll"]
const ERIC: Expert = { name: "Eric Knoben", role: "Head of Insights", prev: ["Emerald Research Group", "The Harris Poll", "PSB Insights"], photo: "eric-knoben" }
const EXPERTS: Expert[] = [
  { name: "Camille Le", role: "Lead Insights Strategist", prev: ["Morning Consult", "The Concord Group"], photo: "camille-le" },
  { name: "Andya Pakpahan", role: "Senior Insights Strategist", prev: ["Morning Consult", "MarketCast"], photo: "andya-pakpahan" },
  { name: "Amanda Harrop", role: "Insights Strategist", prev: ["Morning Consult", "Kantar Millward Brown"], photo: "amanda-harrop" },
  { name: "Ryan Kelly", role: "Insights Strategist", prev: ["Quadrant Strategies"], photo: "ryan-kelly" },
  { name: "Katie McIntyre", role: "Insights Strategist", prev: MOCK_PREV },
  { name: "Charlee Roundhill-Dean", role: "Insights Strategist", prev: ["Google", "Emerald Research Group"], photo: "charlee-roundhill-dean" },
  { name: "Eva Starosolsky", role: "Insights Strategist", prev: MOCK_PREV },
  { name: "Emma Siegel", role: "Insights Strategist", prev: MOCK_PREV },
  { name: "Samara Sargeant", role: "Insights Strategist", prev: ["Quadrant Strategies", "Teneo"], photo: "samara-sargeant" },
  { name: "Brenna Falchuk", role: "Insights Strategist", prev: MOCK_PREV },
  { name: "Maggie Brennan", role: "Insights Strategist", prev: ["Square", "Chase"], photo: "maggie-b" },
  { name: "David Bruce", role: "Insights Strategist", prev: ["TL;DR Insights", "Schireson"], photo: "david-bruce" },
]

/** the featured expert follows the row you hover or focus (if they have a
 *  portrait), and settles back on Eric when you leave the list */
function Experts(): JSX.Element {
  const [lead, setLead] = React.useState<Expert>(ERIC)
  const show = (e: Expert) => { if (e.photo) setLead(e) }
  return (
    <section className="hp-experts"><div className="hp-grid">
      <div className="hp-exp-left" style={sp("2 / 6", "1 / 6")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p className="hp-h2" style={{ textAlign: "left" }}>Research experts, on your team</p>
          <p className="hp-lede" style={{ textAlign: "left" }}>Senior in-house researchers across UX, Insights, and Data Science</p>
        </div>
        <div key={lead.name} className="hp-exp-feat hp-in">
          <img src={M + "team/" + lead.photo + ".jpg"} alt={lead.name} loading="lazy" />
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ fontSize: 20, lineHeight: 1.4, letterSpacing: -0.4 }}><p>{lead.name}</p><p className="hp-soft">{lead.role}</p></div>
            <div className="hp-t12" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <p className="hp-soft">Previously:</p><p style={{ whiteSpace: "pre-line" }}>{lead.prev.join("\n")}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="hp-exp-list" style={sp("7 / 13")} onMouseLeave={() => setLead(ERIC)}>
        {EXPERTS.map((e) => (
          <div key={e.name} className="hp-exp-row" tabIndex={e.photo ? 0 : -1} onMouseEnter={() => show(e)} onFocus={() => show(e)}
            onBlur={() => setLead(ERIC)}>
            <div className="hp-t16"><p>{e.name}</p><p className="hp-soft">{e.role}</p></div>
            <p className="hp-t12 hp-soft" style={{ whiteSpace: "pre-line", textAlign: "right" }}>{e.prev.join("\n")}</p>
          </div>
        ))}
      </div>
    </div></section>
  )
}

const FOOT: Array<[string, string[]]> = [
  ["Use Case", ["Consumer Journey Map", "Multi-Market Segmentation", "Brand Perception", "Concept & Prototype Testing", "Creative Testing", "Usability Testing"]],
  ["Role", ["Consumer Insights", "Brand Marketers", "Product Managers", "UX Researchers", "Agencies", "Investors"]],
  ["Industry", ["Consumer Packaged Goods", "Technology", "E-commerce", "Healthcare", "Financial Services", "Hospitality & Travel"]],
  ["Resources", ["Personality Test", "Compare", "Blog", "Docs & Guides", "Media Requests"]],
  ["Company", ["Careers", "Founder Program", "What’s New"]],
  ["Legal", ["Privacy Policy", "Terms & Conditions", "Cookie Policy"]],
  ["Customers", ["Anthropic", "Cognition", "Sweetgreen", "Simple Modern", "McKinney", "KJT Group"]],
  ["Customers", ["Monitas", "Microsoft", "Sling Money", "Emeritus", "Chubbies"]],
]

/** the book-a-demo card: validates every field, then thanks */
function DemoForm(): JSX.Element {
  const [f, setF] = React.useState({ email: "", first: "", last: "" })
  const [err, setErr] = React.useState<Partial<Record<keyof typeof f, string>>>({})
  const [sent, setSent] = React.useState(false)
  const field = (k: keyof typeof f, label: string, type = "text") => (
    <div>
      <input className={"hp-field hp-t16" + (err[k] ? " bad" : "")} type={type} placeholder={label} aria-label={label} aria-invalid={!!err[k]}
        value={f[k]} onChange={(e) => { setF({ ...f, [k]: e.target.value }); setErr({ ...err, [k]: undefined }) }} />
      {err[k] && <p className="hp-err">{err[k]}</p>}
    </div>
  )
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const next: typeof err = {}
    if (!isEmail(f.email)) next.email = f.email ? "Enter a valid email address." : "Enter your email address."
    if (!f.first.trim()) next.first = "Enter your first name."
    if (!f.last.trim()) next.last = "Enter your last name."
    setErr(next)
    if (!Object.keys(next).length) setSent(true)
  }
  return (
    <form className="hp-form" noValidate onSubmit={submit}>
      {sent ? (
        <div key="sent" className="hp-in" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 24, lineHeight: 1.4, letterSpacing: -0.48 }}>Thanks, {f.first.trim()}.</p>
          <p className="hp-t16 hp-soft">We’ll reach out at {f.email.trim()} to find a time that works.</p>
          <button type="button" className="hp-t14" style={{ alignSelf: "flex-start", textDecoration: "underline", marginTop: 8 }}
            onClick={() => { setF({ email: "", first: "", last: "" }); setSent(false) }}>Book another demo</button>
        </div>
      ) : (
        <>
          <p style={{ fontSize: 24, lineHeight: 1.4, letterSpacing: -0.48 }}>Book a demo</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {field("email", "Email address", "email")}{field("first", "First name")}{field("last", "Last name")}
            <button type="submit" className="hp-btn hp-t16" style={{ height: 48, justifyContent: "center" }}>Book now <I name="arrow-right" size={20} stroke={1.25} /></button>
            <p className="hp-soft" style={{ fontSize: 10, lineHeight: "14px", letterSpacing: -0.2 }}>
              By clicking “Submit”, you agree Listen Labs may use your information as described in our <u>Privacy Policy</u>, including to contact you about our products and services.
            </p>
          </div>
        </>
      )}
    </form>
  )
}

function CtaFooter(): JSX.Element {
  return (
    <>
      <div className="hp-ctawrap" id="demo"><div className="hp-grid"><div className="hp-cta">
        <img src={M + "cta.jpg"} alt="" loading="lazy" />
        <DemoForm />
      </div></div></div>
      <footer className="hp-foot hp-t14"><div className="hp-grid">
        {FOOT.map(([h, links], i) => (
          <div key={i} style={sp("span 3", "span 4", "span 2")}><p className="hp-soft">{h}</p><ul>{links.map((l) => <li key={l}><a href={hrefFor(l)} onClick={(e) => jump(e, hrefFor(l))}>{l}</a></li>)}</ul></div>
        ))}
        <div className="hp-foot-bar hp-soft" style={{ marginTop: 48 }}><span>© 2026 Listen Labs • All rights reserved</span><span>LinkedIn • Twitter • YouTube</span></div>
      </div></footer>
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
      <img className="art" src={M + "footer-art.jpg"} alt="" loading="lazy" />
      <img className="word" src={M + "wordmark.svg"} alt="Listen Labs" loading="lazy" />
      <div className="hp-bandin">
        {corner({ left: "var(--margin)", top: 24 })}{corner({ right: "var(--margin)", top: 24 }, true)}
        {corner({ left: "var(--margin)", bottom: 24 })}{corner({ right: "var(--margin)", bottom: 24 }, true)}
      </div>
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
  return { w: +(q.get("w") ?? 0) || 0, hero: q.get("hero") === "image" ? "image" : "widget", hiw: st(q.get("hiw"), "captions"), uc: st(q.get("uc"), "list"), grid: q.get("grid") === "1", panel: q.get("panel") !== "0" }
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
    if (s.hero === "image") q.set("hero", "image")
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
  // the tab reads like the real site while this view is open
  React.useEffect(() => {
    const title = document.title
    document.title = "Listen Labs — Customer Understanding, Loud and Clear"
    let icon = document.querySelector<HTMLLinkElement>("link[rel=icon]")
    const added = !icon
    if (!icon) { icon = document.createElement("link"); icon.rel = "icon"; document.head.appendChild(icon) }
    const prev = icon.href
    icon.href = "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -1 24 24"><g fill="${C.ink}"><path d="M15.37.41H8.46a.89.89 0 0 0-.9.89v6.92c0 .5.4.9.9.9h6.91c.5 0 .9-.4.9-.9V1.3a.89.89 0 0 0-.9-.89Z"/><path d="M6.71 9.11H.89a.85.85 0 0 0-.89.94 15.6 15.6 0 0 0 7.32 12.4c.43.27 1-.13 1.25-.3l2.95-5a.86.86 0 0 0-.27-1.2 7.36 7.36 0 0 1-3.65-6.04.88.88 0 0 0-.89-.8Z"/></g></svg>`)
    return () => { document.title = title; if (added) icon!.remove(); else icon!.href = prev }
  }, [])
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
        <Hero widget={s.hero === "widget"} />
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
          <h4>Hero image</h4>
          {seg(s.hero, [["widget", "Insight widget"], ["image", "Static photo"]], (hero) => set({ hero }))}
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
