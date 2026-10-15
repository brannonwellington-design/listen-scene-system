// ListenMultiMarket — product shots for the Multi-Market Research use-case
// page (listenlabs.ai/use-case/multi-market; copy in the "Use Case LP" tab of
// the Multi-Market Research Launch Doc). Two hero options plus five feature
// cards, all from one fictional study: Vela, a sparkling water brand testing
// its launch ad in Brazil, South Korea and Germany.
//
// Every surface is a real one, checked against the live app on 2026-10-14
// using the "Localized Stimuli" study (en/de/fr, three country panels):
//   - Details → Compare by country: a Total bar plus one bar per country, the
//     brand blue at 100% / 100% / 50% / 25% (measured)
//   - study guide Language card: Translations chips, and the per-language
//     popover with "Voice for …" and "Translation guidance"
//   - Recruit: one Panel recruit per country and per-country quotas
//   - response panel: the fr | en transcript toggle, Moderator / Respondent
//     rows, emotion tags
//   - participant interview: the localized question and stimulus each market
//     sees (the editor UI for per-language media wasn't visible, so Feature 3
//     shows the participant side instead)
//
// Formats match the gabor-granger feature page: heroes are the app in a
// Safari window at 1440×800 (exported 2x → 2880×1600); features are a card
// on a grey panel at 696×640 (2x → 1392×1280), the card inset 80px and
// running off the right and bottom (no stacked ghost cards behind it).
import * as React from "react"
import { T, AppShell, studyNav, studyEditNav, ensureCss, useScene, EMOTIONS, ShellPrefs, useShellPrefs } from "./ListenKit"
import { I } from "./ListenIcons"
import { ChatShell, DocStrip, Marker, EDITOR_ACTIONS } from "./ListenScenes"
import type { SceneProps } from "./ListenScenes"

// ------------------------------------------------------------- formats ----
export const MM_HERO_W = 1440
export const MM_HERO_H = 800
/** Hero A runs narrower: 1280×800 (2x → 2560×1600) */
export const MM_HERO_A_W = 1280
export const MM_CARD_W = 696
export const MM_CARD_H = 640

const CSS = `
.mm-flat .ll-app { border:none; border-radius:0; }
.mm-trunc { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
/* Korean wraps between words, not inside them */
.mm-ko { word-break:keep-all; }
`
function ensureMMCss(): void {
  ensureCss()
  if (typeof document === "undefined" || document.getElementById("listen-mm-css")) return
  const el = document.createElement("style")
  el.id = "listen-mm-css"
  el.textContent = CSS
  document.head.appendChild(el)
}

/** static shots still report done, so posters and sequences behave */
function useStatic(p: SceneProps): void {
  useScene(p.active, async (pl) => { await pl.sleep(400) }, p.onDone, p.runKey ?? 0, p.hold, p.playFrom, p.onTime)
}

/** Safari-style window with the address shown, as in the gabor-granger hero */
function HeroBrowser(props: { width?: number; children: React.ReactNode }): JSX.Element {
  const ic = { color: "#8E8E8E" }
  const pill: React.CSSProperties = { height: 30, borderRadius: 15, background: "#FFF", boxShadow: "0 0 0 1px rgba(0,0,0,.06)", display: "inline-flex", alignItems: "center", gap: 10, padding: "0 10px" }
  return (
    <div className="ll mm-flat" style={{ width: props.width ?? MM_HERO_W, height: MM_HERO_H, background: "#F6F6F6", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ height: 52, flexShrink: 0, display: "flex", alignItems: "center", gap: 12, padding: "0 16px" }}>
        <span style={{ display: "inline-flex", gap: 8, marginRight: 8 }}>
          {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => <span key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />)}
        </span>
        <span style={pill}><I name="panel-left" size={15} style={ic} /><I name="chevron-down" size={12} style={ic} /></span>
        <span style={pill}><I name="chevron-left" size={15} style={ic} /><I name="chevron-right" size={15} style={{ color: "#C4C4C4" }} /></span>
        <span style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <span style={{ ...pill, width: Math.round((props.width ?? MM_HERO_W) * 0.36), justifyContent: "space-between", padding: "0 12px" }}>
            <I name="monitor" size={13} style={ic} />
            <span style={{ fontSize: 13, color: T.ink, letterSpacing: -0.1 }}>listenlabs.ai</span>
            <I name="rotate-cw" size={13} style={ic} />
          </span>
        </span>
        <span style={pill}><I name="download" size={15} style={ic} /><I name="share" size={15} style={ic} /><I name="plus" size={15} style={ic} /><I name="copy" size={15} style={ic} /></span>
      </div>
      <div style={{ flex: 1, minHeight: 0, position: "relative", borderTop: "1px solid #E4E4E4" }}>{props.children}</div>
    </div>
  )
}

/** the feature-card format: a Paper surface-secondary panel (no stroke),
 *  the card running off it */
function FeatureCard(props: { zoom?: number; pad?: number; children: React.ReactNode; bg?: string }): JSX.Element {
  const { zoom = 1.2, pad = 20, bg = "#FFF" } = props
  const edge = "2px solid #E0E0E0"
  return (
    <div className="ll" style={{ width: MM_CARD_W, height: MM_CARD_H, position: "relative", overflow: "hidden", background: T.pageContainer }}>
      <div style={{ position: "absolute", left: 80, top: 80, right: -40, bottom: -40, background: bg, border: edge, borderRadius: 24, overflow: "hidden" }}>
        <div style={{ transform: `scale(${zoom})`, transformOrigin: "top left", padding: pad, width: 760, fontSize: 14, lineHeight: "20px", letterSpacing: -0.28 }}>
          {props.children}
        </div>
      </div>
    </div>
  )
}

// --------------------------------------------------------------- study ----
const STUDY = "Vela Sparkling Launch Ad: Brazil, South Korea & Germany"
const REPORTS = [{ title: "Listen Labs Report", meta: "Oct 9 · Listen Labs" }]

type Market = { name: string; flag: string; lang: string; code: string }
const MARKETS: Market[] = [
  { name: "Brazil", flag: "🇧🇷", lang: "Portuguese (Brazil)", code: "pt" },
  { name: "South Korea", flag: "🇰🇷", lang: "Korean", code: "ko" },
  { name: "Germany", flag: "🇩🇪", lang: "German", code: "de" },
]
/** Compare-by-country bar fills, measured on the live Details page */
const SERIES = [
  { label: "Total", fill: T.brand },
  { label: "Brazil", fill: T.brand },
  { label: "South Korea", fill: "rgba(0, 33, 204, 0.5)" },
  { label: "Germany", fill: "rgba(0, 33, 204, 0.25)" },
]
// 40 completes per market, so Total is the mean of the three
type Theme = { title: string; v: [number, number, number] }
const total = (v: [number, number, number]): number => Math.round((v[0] + v[1] + v[2]) / 3)

const HERO_THEMES: Theme[] = [
  { title: "Wanted to try the flavor", v: [58, 49, 31] },
  { title: "Felt made for people like me", v: [52, 44, 27] },
  { title: "Price felt right for an everyday drink", v: [29, 34, 48] },
  { title: "Tone felt too playful", v: [8, 15, 34] },
]
const CARD_THEMES: Theme[] = [
  { title: "Less sugar than what they usually drink", v: [39, 41, 52] },
  { title: "Liked the flavor options", v: [47, 38, 23] },
  { title: "Local price felt fair", v: [24, 33, 36] },
]

// ------------------------------------------------- Details → Compare -------
function Bars(props: { theme: Theme }): JSX.Element {
  const vals = [total(props.theme.v), ...props.theme.v]
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 14, lineHeight: "20px", color: T.ink }}>{props.theme.title}</div>
      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
        {SERIES.map((s, i) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8, height: 16 }}>
            <span style={{ width: 128, fontSize: 12, lineHeight: "16px", color: T.ink }}>{s.label}</span>
            <span style={{ flex: 1, height: 8, borderRadius: 4, background: "#F0F0F0", position: "relative" }}>
              <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${vals[i]}%`, borderRadius: 4, background: s.fill }} />
            </span>
            <span style={{ width: 48, textAlign: "right", fontSize: 12, lineHeight: "16px", color: T.inkSoft }}>{vals[i]}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function KeyFindingsCompare(props: { link: string; themes: Theme[] }): JSX.Element {
  return (
    <div style={{ background: T.appBg, border: `1px solid ${T.appBorder}`, borderRadius: 12, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: T.inkSoft, height: 24 }}>
        <I name="list" size={14} /> Key Findings
        <span style={{ flex: 1 }} />
        <I name="arrow-left-right" size={13} />
        <span className="mm-trunc" style={{ maxWidth: 150 }}>Which country do you currently live in?</span>
        <I name="x" size={13} style={{ marginLeft: 2 }} />
        <I name="ellipsis" size={15} style={{ marginLeft: 8 }} />
      </div>
      <div style={{ marginTop: 14, fontSize: 14, color: T.brand }}>{props.link}</div>
      {props.themes.map((t, i) => (
        <React.Fragment key={t.title}>
          {i > 0 && <div style={{ borderTop: `1px solid ${T.appBorder}`, margin: "16px 0 4px" }} />}
          <Bars theme={t} />
        </React.Fragment>
      ))}
    </div>
  )
}

function QuestionCard(props: { n: string; q: string; groups: string[] }): JSX.Element {
  return (
    <div style={{ background: T.fill, borderRadius: 12, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.ink }}><I name="circle-help" size={14} /> {props.n}</div>
      <div style={{ marginTop: 10, fontSize: 16, lineHeight: "22px", color: T.ink }}>{props.q}</div>
      <div style={{ marginTop: 12, fontSize: 12, color: T.inkSoft }}>Group <span style={{ color: T.ink }}>120</span> responses by</div>
      <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 2 }}>
        {props.groups.map((g, i) => (
          <div key={g} style={{ padding: "8px 12px", borderRadius: 8, fontSize: 14, background: i === 0 ? T.brandSoft : "transparent", color: i === 0 ? T.brand : T.inkSoft, display: "flex", alignItems: "center", gap: 8 }}>
            {i === 0 && <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.brand }} />}{g}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, height: 32, borderRadius: 8, background: T.appBg, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 14, color: T.ink }}>
        <I name="messages-square" size={14} /> View all responses
      </div>
    </div>
  )
}

const DETAILS_ACTIONS = (
  <>
    <span className="ll-tbtn" style={{ background: "transparent", border: `1px solid ${T.appBorder}`, color: T.inkSoft }}><I name="list-filter" size={14} /> Filters & Segments <I name="chevron-down" size={13} /></span>
    <span className="ll-tbtn">Share <I name="link" size={14} /></span>
  </>
)

/** Hero A — the payoff: one question compared across the three markets */
export function SceneMMHeroCompare(p: SceneProps): JSX.Element {
  ensureMMCss(); useStatic(p)
  // starts with the sidebar collapsed; a surrounding SceneCanvas still decides
  const outer = React.useContext(ShellPrefs)
  const own = useShellPrefs({ collapsed: true })
  return (
    <ShellPrefs.Provider value={outer ?? own}>
    <HeroBrowser width={MM_HERO_A_W}>
      <AppShell nav={studyNav("Details", REPORTS)} title={STUDY} crumb={["Details"]} actions={DETAILS_ACTIONS}>
        <div className="ll-doc-fade" style={{ flex: 1, padding: "28px 64px 0 56px", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ fontSize: 22, lineHeight: "28px", color: T.ink }}>Ad Reaction</span>
            <span style={{ flex: 1 }} />
            <I name="chevron-down" size={16} style={{ color: T.inkSoft }} />
          </div>
          <div style={{ display: "flex", gap: 24, marginTop: 22, alignItems: "flex-start" }}>
            <div style={{ width: 300, flexShrink: 0 }}>
              <QuestionCard n="Q7" q="Take a look at this ad. What's your immediate reaction?" groups={["What Stood Out by Market", "Reaction Tone by Market"]} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <KeyFindingsCompare link="What Stood Out in the Vela Launch Ad" themes={HERO_THEMES} />
            </div>
          </div>
          {/* the page's section rail, right edge */}
          <div style={{ position: "absolute", right: 14, top: 120, display: "flex", flexDirection: "column", gap: 13 }}>
            {Array.from({ length: 18 }, (_, i) => <span key={i} style={{ width: i === 7 ? 18 : 10, height: 1.5, background: i === 7 ? T.ink : "#CFCFCF", marginLeft: i === 7 ? 0 : 8 }} />)}
          </div>
        </div>
      </AppShell>
    </HeroBrowser>
    </ShellPrefs.Provider>
  )
}

// ---------------------------------------------------- Language card ------
function Toggle(props: { on: boolean }): JSX.Element {
  return (
    <span style={{ width: 28, height: 16, borderRadius: 8, background: props.on ? T.brand : T.track, position: "relative", flexShrink: 0, display: "inline-block" }}>
      <span style={{ position: "absolute", top: 2, left: props.on ? 14 : 2, width: 12, height: 12, borderRadius: "50%", background: "#FFF" }} />
    </span>
  )
}

const chip = (active?: boolean): React.CSSProperties => ({
  height: 28, padding: "0 8px", borderRadius: 8, border: `1px solid ${T.appBorder}`, background: active ? T.fill : T.appBg,
  display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, lineHeight: "18px", color: T.ink, whiteSpace: "nowrap",
})

function LanguageCard(props: { open?: string; children?: React.ReactNode }): JSX.Element {
  return (
    <div style={{ background: T.appBg, border: `1px solid ${T.appBorder}`, borderRadius: 12, padding: "16px 16px 18px", position: "relative" }}>
      <div style={{ fontSize: 13, color: T.inkSoft }}>Language</div>
      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
        <span style={{ ...chip(), height: 32, fontSize: 13, padding: "0 10px" }}>🇺🇸 English <I name="chevron-down" size={13} /></span>
        <span style={{ ...chip(), height: 32, width: 32, justifyContent: "center", padding: 0 }}><I name="audio-lines" size={14} /></span>
      </div>
      <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 8 }}>The language questions are originally written in</div>
      <div style={{ fontSize: 13, color: T.ink, marginTop: 14 }}>Translations</div>
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        {MARKETS.map((m) => <span key={m.code} style={chip(props.open === m.code)}>{m.flag} {m.lang}</span>)}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 14, fontSize: 13, color: T.inkSoft }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><I name="plus" size={13} /> Add translations</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><Toggle on /> Read questions aloud</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><Toggle on /> Analysis in English</span>
      </div>
      {props.children}
    </div>
  )
}

/** Hero B — the setup: one study, translated for each market */
export function SceneMMHeroSetup(p: SceneProps): JSX.Element {
  ensureMMCss(); useStatic(p)
  const label = { fontSize: 13, color: T.inkSoft }
  return (
    <HeroBrowser>
      <AppShell nav={studyEditNav("Study Guide")} title={STUDY} crumb={["Study Guide"]} actions={EDITOR_ACTIONS}>
        <ChatShell step="Setup complete · Ready for launch" placeholder="Your message">
          <div style={{ alignSelf: "flex-end", maxWidth: 280, background: T.fill, borderRadius: 12, padding: "8px 12px", color: T.body }}>
            Run this in Brazil, South Korea and Germany, in each local language. Each market should see its own version of the ad.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Marker icon="languages" text="Added translations: Portuguese (Brazil), Korean, German" />
            <Marker icon="user-round-plus" text="Added 3 recruitment groups" />
            <Marker icon="image" text="Updated concept media for 3 languages" />
          </div>
          <div style={{ color: T.body }}>
            Done. Each market takes the interview in its own language, follow-ups included, and sees the ad and price for its country. Every answer comes back in English for analysis.
          </div>
          <div style={{ color: T.body }}>Want me to set quotas so each country gets 40 completes?</div>
        </ChatShell>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <DocStrip />
          <div className="ll-doc-fade" style={{ flex: 1, padding: "26px 96px 0" }}>
            <span style={{ ...chip(), height: 26, color: T.inkSoft }}><I name="clock" size={12} /> 14-18 min</span>
            <div style={{ fontSize: 30, lineHeight: "38px", fontWeight: 500, letterSpacing: -0.6, marginTop: 16, color: T.ink }}>{STUDY}</div>
            <div style={{ ...label, marginTop: 24 }}>Interview type</div>
            <div style={{ marginTop: 8, width: 240, height: 36, borderRadius: 8, background: T.fill, display: "flex", alignItems: "center", gap: 8, padding: "0 10px", fontSize: 14 }}>
              <I name="video" size={15} style={{ color: T.inkSoft }} /> Video recording <span style={{ flex: 1 }} /><I name="chevron-down" size={14} style={{ color: T.inkSoft }} />
            </div>
            <div style={{ marginTop: 22, marginLeft: -16 }}><LanguageCard /></div>
            <div style={{ ...label, marginTop: 24 }}>External Title</div>
            <div style={{ marginTop: 6, fontSize: 15 }}>Share your opinion in a short video interview</div>
            <div style={{ ...label, marginTop: 22 }}>Background info and moderator instructions</div>
            <div style={{ marginTop: 6, fontSize: 15, lineHeight: "23px", color: T.body }}>
              Vela is launching a sparkling water in Brazil, South Korea and Germany. Each market sees a localized version of the launch ad, with the price in local currency. Probe on what feels local, what feels imported, and whether the price fits an everyday drink.
            </div>
          </div>
        </div>
      </AppShell>
    </HeroBrowser>
  )
}

// ------------------------------------------------------------ features ----
/** 01 Reach the right people in every market — Recruit page */
export function FragmentMMRecruit(p: SceneProps): JSX.Element {
  ensureMMCss(); useStatic(p)
  const rows: Array<[string, string, number, number, string]> = [
    ["users", "Brazil General Audience", 40, 40, "62%"],
    ["users", "South Korea General Audience", 40, 40, "48%"],
    ["users", "Germany General Audience", 40, 40, "55%"],
    ["link", "Vela customers (Germany)", 25, 25, "—"],
  ]
  const th: React.CSSProperties = { fontSize: 12, lineHeight: "16px", fontWeight: 500, color: "#71717A" }
  return (
    <FeatureCard zoom={1.1} pad={22}>
      <div style={{ display: "flex", alignItems: "flex-end" }}>
        <div>
          <div className="ll-500" style={{ color: T.body }}>Active Recruits</div>
          <div style={{ color: "#71717A" }}>Overview of all recruitment campaigns</div>
        </div>
      </div>
      <div style={{ marginTop: 16, border: `1px solid ${T.appBorder}`, borderRadius: 8, width: 560, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", height: 32, padding: "0 16px", gap: 12 }}>
          <span style={{ ...th, width: 84 }}>Type</span>
          <span style={{ ...th, width: 196 }}>Name</span>
          <span style={{ ...th, flex: 1 }}>Completed</span>
          <span style={{ ...th, width: 76 }}>Status</span>
        </div>
        {rows.map(([icon, name, n, of]) => (
          <div key={name} style={{ display: "flex", alignItems: "center", height: 54, padding: "0 16px", gap: 12, borderTop: `1px solid ${T.appBorder}` }}>
            <span style={{ width: 84 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 30, padding: "0 10px", border: "1px solid #E5E7EB", borderRadius: 8, color: T.body }}>
                <I name={icon} size={13} style={{ color: T.inkSoft }} /> {icon === "link" ? "Link" : "Panel"}
              </span>
            </span>
            <span className="mm-trunc" style={{ width: 196, color: T.body }}>{name}</span>
            <span style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 70, height: 4, borderRadius: 2, background: T.ink }} />
              <span style={{ color: "#737373", whiteSpace: "nowrap" }}>{n} / <span className="ll-500" style={{ color: T.ink }}>{of}</span></span>
            </span>
            <span style={{ width: 76 }}>
              <span style={{ display: "inline-flex", height: 26, alignItems: "center", padding: "0 8px", borderRadius: 6, fontSize: 12, background: T.brandSoft, color: T.brand }}>Complete</span>
            </span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 30 }}>
        <span style={{ color: T.ink }}>Quotas</span>
        <span style={{ fontSize: 11, lineHeight: "16px", padding: "0 5px", borderRadius: 4, border: `1px solid ${T.appBorder}`, color: T.inkSoft }}>Advanced</span>
      </div>
      <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 2 }}>Set quotas to target precise response mixes.</div>
      <div style={{ marginTop: 14, color: T.ink }}>Which country do you currently live in?</div>
      <div style={{ marginTop: 10, border: `1px solid ${T.appBorder}`, borderRadius: 8, padding: "4px 16px", width: 560 }}>
        {MARKETS.map((m, i) => (
          <div key={m.code} style={{ padding: "12px 0", borderTop: i ? `1px solid ${T.appBorder}` : undefined }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: T.ink }}>{m.name}</span>
              <span style={{ fontSize: 12, color: "#E38B12" }}>✱ Required</span>
              <span style={{ flex: 1 }} />
              <span style={{ fontSize: 12, color: T.inkSoft }}>40 responses</span>
            </div>
            <div style={{ marginTop: 10, height: 3, borderRadius: 2, background: T.ink }} />
            <div style={{ marginTop: 6, fontSize: 12, color: T.inkSoft, textAlign: "right" }}>Exactly 40</div>
          </div>
        ))}
      </div>
    </FeatureCard>
  )
}

/** 02 Hear from people in their own language — per-language voice + guidance */
export function FragmentMMLanguage(p: SceneProps): JSX.Element {
  ensureMMCss(); useStatic(p)
  const GUIDANCE = "Keep \"Vela\" in Latin letters. Translate \"sparkling water\" as 탄산수, and use polite 해요체 throughout."
  return (
    <FeatureCard zoom={1.2} pad={22}>
      <div style={{ width: 560 }}>
        <LanguageCard open="ko">
          <div style={{ position: "absolute", left: 159, top: 188, width: 280, background: T.appBg, border: `1px solid ${T.appBorder}`, borderRadius: 8, padding: "4px 8px 8px", boxShadow: "0 8px 24px rgba(0,0,0,.08)", fontSize: 12, lineHeight: "18px", zIndex: 2 }}>
            <div style={{ padding: "4px 0 0" }}>Voice for Korean</div>
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <span style={{ flex: 1, height: 32, borderRadius: 8, border: `1px solid ${T.appBorder}`, display: "flex", alignItems: "center", padding: "0 8px", color: T.ink }}>
                Ji-woo (feminine) <span style={{ flex: 1 }} /><I name="chevron-down" size={12} style={{ color: T.inkSoft }} />
              </span>
              <span style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.appBorder}`, display: "inline-flex", alignItems: "center", justifyContent: "center" }}><I name="volume-2" size={14} /></span>
            </div>
            <div style={{ padding: "8px 0 0" }}>Translation guidance</div>
            <div style={{ marginTop: 4, minHeight: 60, borderRadius: 6, border: `1px solid ${T.brandFaint}`, padding: "6px 8px", lineHeight: "16px", color: T.ink }}>
              {GUIDANCE}
            </div>
            <div style={{ borderTop: `1px solid ${T.appBorder}`, margin: "10px 0 0", paddingTop: 8, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: T.ink }}>
              <I name="square-x" size={14} /> Remove translation
            </div>
          </div>
          <div style={{ height: 196 }} />
        </LanguageCard>
      </div>
    </FeatureCard>
  )
}

// ---- 03 Test the local version: what each market's participants see ----
type Ad = { headline: string; sub: string; price: string; bg: string; ink: string; tag: string }
const ADS: Record<string, Ad> = {
  ko: { headline: "톡 쏘는 상쾌함", sub: "설탕 0g · 자몽 & 라임", price: "1,900원", bg: "linear-gradient(135deg, #DDF1EA 0%, #BFE3D6 100%)", ink: "#0E3B2E", tag: "편의점에서 만나요" },
  pt: { headline: "Leveza com gás", sub: "Zero açúcar · Maracujá & limão", price: "R$ 6,90", bg: "linear-gradient(135deg, #FFE7B8 0%, #FFC97A 100%)", ink: "#4A2A00", tag: "Nos mercados de todo o Brasil" },
}
const QUESTION: Record<string, string> = {
  ko: "이 광고를 봐 주세요. 가장 먼저 어떤 생각이 드시나요?",
  pt: "Dê uma olhada neste anúncio. Qual é a sua primeira reação?",
}
const START: Record<string, string> = { ko: "녹화 시작", pt: "Começar a gravar" }

function VelaCan(props: { ink: string }): JSX.Element {
  return (
    <svg width="58" height="104" viewBox="0 0 58 104" style={{ flexShrink: 0 }}>
      <rect x="4" y="6" width="50" height="94" rx="9" fill="#FFFFFF" stroke={props.ink} strokeOpacity=".15" />
      <rect x="9" y="2" width="40" height="8" rx="3" fill="#D9D9D9" />
      <rect x="4" y="38" width="50" height="34" fill={props.ink} />
      <text x="29" y="60" textAnchor="middle" fontSize="15" fontWeight="700" fill="#FFF" fontFamily="Inter, sans-serif" letterSpacing="1">VELA</text>
      <circle cx="18" cy="24" r="2.2" fill={props.ink} opacity=".25" /><circle cx="27" cy="18" r="1.6" fill={props.ink} opacity=".25" /><circle cx="38" cy="26" r="2.6" fill={props.ink} opacity=".25" />
    </svg>
  )
}

function AdImage(props: { ad: Ad; w: number }): JSX.Element {
  const { ad } = props
  return (
    <div style={{ width: props.w, height: props.w * 0.5, borderRadius: 8, background: ad.bg, display: "flex", alignItems: "center", gap: 20, padding: "0 26px", color: ad.ink, overflow: "hidden" }}>
      <VelaCan ink={ad.ink} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 26, lineHeight: "32px", fontWeight: 700, letterSpacing: -0.6 }}>{ad.headline}</div>
        <div style={{ fontSize: 13, marginTop: 4, opacity: 0.8 }}>{ad.sub}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
          <span style={{ fontSize: 20, fontWeight: 700, background: "#FFF", borderRadius: 6, padding: "2px 8px" }}>{ad.price}</span>
          <span style={{ fontSize: 11, opacity: 0.75 }}>{ad.tag}</span>
        </div>
      </div>
    </div>
  )
}

/** the participant interview, as one market sees it (scene 3's layout) */
function ParticipantScreen(props: { code: string; w: number; col?: number }): JSX.Element {
  const ad = ADS[props.code]
  const col = props.col ?? props.w - 64
  return (
    <div style={{ width: props.w, background: T.appBg, position: "relative", paddingBottom: 24 }}>
      <div style={{ height: 4, background: "rgba(0,0,0,.1)" }}><div style={{ width: "46%", height: "100%", background: T.brand }} /></div>
      <div style={{ position: "absolute", top: 18, right: 20 }}><I name="settings" size={18} /></div>
      <div style={{ padding: "52px 32px 0", width: col + 64 }}>
        <div className={props.code === "ko" ? "mm-ko" : undefined} style={{ fontSize: 22, lineHeight: "31px", letterSpacing: -0.44, color: T.ink }}>{QUESTION[props.code]}</div>
        <div style={{ marginTop: 18 }}><AdImage ad={ad} w={col} /></div>
        <div style={{ marginTop: 22, height: 40, borderRadius: 8, background: T.brand, color: "#FAFAFA", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{START[props.code]}</div>
      </div>
    </div>
  )
}

export function FragmentMMLocalVersion(p: SceneProps): JSX.Element {
  ensureMMCss(); useStatic(p)
  return (
    <FeatureCard zoom={1} pad={0} bg={T.appBg}>
      <div style={{ position: "relative", width: 760, height: 620 }}>
        <ParticipantScreen code="ko" w={680} col={420} />
        {/* a Brazilian participant's screen, stacked on top lower right */}
        <div style={{ position: "absolute", left: 268, top: 226, border: `1px solid ${T.appBorder}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 12px 32px rgba(0,0,0,.10)" }}>
          <ParticipantScreen code="pt" w={470} />
        </div>
      </div>
    </FeatureCard>
  )
}

/** 04 Compare markets side by side — Details card, compared by country */
export function FragmentMMCompare(p: SceneProps): JSX.Element {
  ensureMMCss(); useStatic(p)
  return (
    <FeatureCard zoom={1.1} pad={22}>
      <div style={{ width: 500 }}>
        <KeyFindingsCompare link="What Would Make Them Choose Vela" themes={CARD_THEMES} />
      </div>
    </FeatureCard>
  )
}

/** the transcript's small emotion tags (live: 10px, 4px radius, 10% fill) */
function TranscriptEmotion(props: { emotion: keyof typeof EMOTIONS }): JSX.Element {
  const e = EMOTIONS[props.emotion]
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, height: 16, padding: "0 4px", borderRadius: 4, fontSize: 10, lineHeight: "14px", color: e.fg, background: e.bg }}>
      <span style={{ width: 6, height: 2, borderRadius: 1, background: e.fg }} />{props.emotion}
    </span>
  )
}

/** 05 Trace every finding to a real person — response panel, ko ⇄ en */
const KO_TURNS: Array<{ who: "m" | "r"; text: string; at?: string; tags?: Array<"happiness" | "surprise"> }> = [
  { who: "m", text: "이 광고를 봐 주세요. 가장 먼저 어떤 생각이 드시나요?" },
  { who: "r", at: "4:12", text: "편의점 냉장고 앞에 서 있는 느낌이었어요. 1,900원이면 점심 먹고 하나 사 마실 만한 가격이라 바로 와닿았어요.", tags: ["happiness", "happiness"] },
  { who: "m", text: "‘바로 와닿았다’고 하셨는데, 광고의 어떤 부분 때문에 그렇게 느끼셨나요?" },
  { who: "r", at: "4:51", text: "‘톡 쏘는 상쾌함’이라는 말이 딱 제가 탄산수를 마시는 이유예요. 번역한 느낌이 전혀 없었어요.", tags: ["surprise"] },
]
export function FragmentMMTrace(p: SceneProps): JSX.Element {
  ensureMMCss(); useStatic(p)
  const seg = (on: boolean): React.CSSProperties => ({ padding: "2px 8px", borderRadius: 4, fontSize: 14, lineHeight: "20px", fontWeight: 500, background: on ? "#FFF" : "transparent", color: on ? "#09090B" : "#71717A", boxShadow: on ? "0 1px 2px rgba(0,0,0,.06)" : undefined })
  return (
    <FeatureCard zoom={1.05} pad={0}>
      <div className="mm-ko" style={{ width: 560 }}>
        <div style={{ height: 52, display: "flex", alignItems: "center", padding: "0 16px 0 16px", gap: 12, borderBottom: `1px solid ${T.appBorder}` }}>
          <span style={{ fontSize: 16, lineHeight: "24px", fontWeight: 600, letterSpacing: -0.32, color: T.body }}>Response #214</span>
          <span style={{ flex: 1 }} />
          <span style={{ display: "inline-flex", padding: 2, borderRadius: 6, background: "#F4F4F5" }}>
            <span style={seg(true)}>ko</span><span style={seg(false)}>en</span>
          </span>
          <span style={{ flex: 1 }} />
          <I name="external-link" size={16} style={{ color: T.inkSoft }} />
          <I name="ellipsis" size={16} style={{ color: T.inkSoft }} />
          <I name="x" size={16} style={{ color: T.inkSoft }} />
        </div>
        <div style={{ height: 52, display: "flex", alignItems: "center", padding: "0 16px", borderBottom: `1px solid ${T.appBorder}` }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#404040" }}>Transcript</span>
          <span style={{ flex: 1 }} />
          <span style={{ height: 32, padding: "0 10px", borderRadius: 8, border: `1px solid ${T.appBorder}`, display: "inline-flex", alignItems: "center", fontSize: 12 }}>Show Video</span>
        </div>
        <div style={{ padding: "18px 18px 0" }}>
          <div style={{ textAlign: "center", fontSize: 12, lineHeight: "18px" }}><span style={{ fontWeight: 500, color: "#6B7280" }}>Section 4</span> <span style={{ color: "#9CA3AF" }}>Ad Reaction</span></div>
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, marginTop: 12 }}>
            <span style={{ fontSize: 12, lineHeight: "18px", fontWeight: 500, color: "#FFF", background: "rgba(0,0,0,.3)", borderRadius: 9999, padding: "1px 7px" }}>Q7 (Vela Launch Ad)</span>
            <I name="plus" size={14} style={{ color: T.inkSoft }} />
          </div>
          {KO_TURNS.map((t, i) => (
            <div key={i} style={{ marginTop: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, lineHeight: "18px", color: t.who === "m" ? "rgba(0,0,0,.4)" : T.inkSoft }}>
                {t.who === "m" ? <I name="agent-hex" size={14} /> : <I name="circle-user-round" size={14} />}
                {t.who === "m" ? "Moderator" : "Respondent"}
                {t.at && (
                  <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 10, color: T.inkSoft }}>
                    <I name="pencil" size={12} /><I name="download" size={12} />
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><I name="play" size={11} /> {t.at}</span>
                  </span>
                )}
              </div>
              <div style={{ marginTop: 6, fontSize: 14, lineHeight: t.who === "m" ? "21px" : "20px", fontWeight: t.who === "m" ? 400 : 500, color: t.who === "m" ? "rgba(0,0,0,.5)" : T.ink }}>{t.text}</div>
              {t.tags && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 10 }}>
                  {t.tags.map((e, k) => <TranscriptEmotion key={k} emotion={e} />)}
                  <span style={{ marginLeft: "auto", fontSize: 12, color: "#71717A", display: "inline-flex", alignItems: "center", gap: 4 }}>Emotional Analysis <I name="chevron-right" size={12} /></span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </FeatureCard>
  )
}
