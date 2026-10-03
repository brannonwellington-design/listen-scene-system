// ListenScenes — live recreations of real Listen Labs product surfaces.
// Scenes 1–2 mirror the actual study-creation flow, rebuilt frame-by-frame
// from a screen recording of the product (2026-08-28): chip questions in
// chat, "Thinking…" shimmer beats, status-marker streams, and the doc
// filling in sync. Timing constants are measured from the recording.
// All full scenes are authored in the fixed 1120x640 design space.
import * as React from "react"
import {
  T, BareFrame, Chip, Caret, Donut, Waveform, DotSpinner, EmotionTag,
  EMOTIONS, useScene, useCursor, ensureCss,
  IPhoneScreen, APP_W,
  AppShell, workspaceNav, studyEditNav, studyNav, chatNav,
} from "./ListenKit"
import { I } from "./ListenIcons"
import { INTERVIEW_CLIP } from "./ListenClip"

export type SceneProps = {
  active: boolean
  onDone?: () => void
  /** bump to replay while active */
  runKey?: number
  /** freeze the scripted session at this virtual millisecond (scrubber) */
  hold?: number
  /** play once from this virtual millisecond: fast-forward, then real time */
  playFrom?: number
  /** during playFrom playback, reports elapsed virtual ms */
  onTime?: (t: number) => void
}

const SIDE = 350 // builder chat panel width, per product recording

// measured pacing (screen recording): human typing ~5cps → stylized 14;
// AI text streams fast (~110cps) after a shimmer beat; markers ~450ms apart
const USER_CPS = 40
const AI_CPS = 110
const MARKER_MS = 450

// ---------------------------------------------------------------- helpers ---
/** study editor top bar, right side (live app) */
const EDITOR_ACTIONS = (
  <>
    <span className="meta">Just saved</span>
    <span className="ll-tbtn">Share <I name="link" size={14} /></span>
    <span className="ll-tbtn dark">Review <I name="arrow-right" size={14} /></span>
  </>
)
/** app-shell scenes start the cursor just below the frame */
const APP_CURSOR_START = { x: APP_W / 2, y: 880 }

function ChatShell(props: { step: string; placeholder: string; busy?: boolean; children: React.ReactNode }): JSX.Element {
  return (
    <div style={{ width: SIDE, borderRight: `1px solid ${T.appBorder}`, background: T.appPanelAlt, display: "flex", flexDirection: "column", fontSize: 13, lineHeight: 1.5 }}>
      <div style={{ padding: "10px 16px", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: T.inkSoft }}>{props.step.split("·")[0]}</span>
        <span className="ll-500">{props.step.split("·")[1]}</span>
        <span style={{ flex: 1 }} />
        <I name="panel-left-close" size={14} style={{ color: T.inkSoft }} />
      </div>
      <div style={{ flex: 1, padding: "4px 16px", display: "flex", flexDirection: "column", gap: 12, overflow: "hidden" }}>
        {props.children}
      </div>
      <div style={{ margin: 16, background: T.appBg, border: `1px solid ${T.appBorder}`, borderRadius: 10, boxShadow: T.shadow }}>
        <div style={{ padding: "10px 12px", color: T.inkFaint, fontSize: 13 }}>{props.placeholder}</div>
        <div style={{ display: "flex", alignItems: "center", padding: "0 8px 8px" }}>
          <span style={{ width: 22, height: 22, display: "inline-flex", alignItems: "center", justifyContent: "center", color: T.inkSoft }}><I name="plus" size={14} /></span>
          <span style={{ flex: 1 }} />
          {props.busy ? (
            <span style={{ width: 24, height: 24, borderRadius: 7, background: T.dark, color: T.onDark, display: "inline-flex", alignItems: "center", justifyContent: "center" }}><I name="square" size={9} style={{ fill: "currentColor" } as React.CSSProperties} /></span>
          ) : (
            <span style={{ width: 24, height: 24, borderRadius: 12, background: T.fill, color: T.inkSoft, display: "inline-flex", alignItems: "center", justifyContent: "center" }}><I name="arrow-up" size={13} /></span>
          )}
        </div>
      </div>
    </div>
  )
}

/** doc pane icon strip, per the recording's editor */
function DocStrip(): JSX.Element {
  const c = { color: T.inkSoft }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "12px 20px 4px" }}>
      <I name="list" size={15} style={c} /><I name="chevrons-down-up" size={14} style={c} />
      <span style={{ flex: 1 }} />
      <I name="sparkles" size={15} style={c} /><I name="undo" size={15} style={c} /><I name="redo" size={15} style={c} />
      <I name="history" size={15} style={c} /><I name="languages" size={15} style={c} /><I name="play" size={15} style={c} />
      <I name="download" size={15} style={c} /><I name="settings" size={15} style={c} />
    </div>
  )
}

/** in-chat multiple-choice card, bottom-anchored above the composer,
 *  per the recording: white card, blue number chips, ‹ page › + Skip Esc +
 *  bordered Continue button; the last option carries a pencil icon */
function ChipQuestion(props: { title: string; options: string[]; hovered: number; picked: number; footer: string }): JSX.Element {
  return (
    <div style={{ marginTop: "auto", background: T.appBg, border: `1px solid ${T.appBorder}`, borderRadius: 12, boxShadow: T.shadow, padding: 14, fontSize: 13 }}>
      <div style={{ fontSize: 13.5, marginBottom: 10 }}>{props.title}</div>
      {props.options.map((o, i) => {
        const last = i === props.options.length - 1
        return (
          <div key={o} data-cursor={"opt-" + i} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "5px 8px", borderRadius: 8, marginTop: 2,
            background: i === props.picked ? T.brandSoft : i === props.hovered ? T.fill : "transparent",
            transition: "background-color .15s ease",
          }}>
            <span style={{ width: 21, height: 21, borderRadius: 6, background: T.brandSoft, fontSize: 11, display: "inline-flex", alignItems: "center", justifyContent: "center", color: T.brand, flexShrink: 0 }}>
              {last ? <I name="square-pen" size={11} /> : i + 1}
            </span>
            {o}
          </div>
        )
      })}
      <div style={{ display: "flex", gap: 8, marginTop: 12, fontSize: 12, color: T.inkSoft, alignItems: "center" }}>
        <span style={{ color: T.inkFaint }}>‹</span>
        <span>{props.footer}</span>
        <span style={{ color: T.inkFaint }}>›</span>
        <span style={{ flex: 1 }} />
        <span>Skip <span style={{ color: T.inkFaint, fontSize: 10 }}>Esc</span></span>
        <span style={{ border: `1px solid ${T.appBorder}`, borderRadius: 8, padding: "4px 10px", color: T.ink, boxShadow: T.shadow }}>Continue <span style={{ color: T.inkFaint }}>↵</span></span>
      </div>
    </div>
  )
}

/** collapsed Q&A summary bubble shown after chip questions are answered */
function AnsweredCard(props: { qa: Array<[string, string]> }): JSX.Element {
  return (
    <div style={{ background: T.fill, borderRadius: 10, padding: "10px 12px", fontSize: 12.5, alignSelf: "stretch" }}>
      <I name="sparkles" size={11} style={{ color: T.inkFaint, marginBottom: 4, display: "block" }} />
      {props.qa.map(([q, a]) => (
        <div key={q} style={{ marginTop: 4 }}>
          <div style={{ color: T.inkSoft }}>{q}</div>
          <div>{a}</div>
        </div>
      ))}
    </div>
  )
}

function Marker(props: { icon: string; text: string; active?: boolean }): JSX.Element {
  return (
    <div className="ll-enter" style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: T.inkSoft }}>
      <I name={props.icon} size={12} style={{ marginTop: 2 }} />
      <span className={props.active ? "ll-shimmer" : undefined}>{props.text}</span>
    </div>
  )
}

function Thinking(): JSX.Element {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
      <I name="chevron-down" size={12} style={{ color: T.inkFaint }} />
      <span className="ll-shimmer">Thinking...</span>
    </div>
  )
}

/** doc section: Language selector, per the recording */
function LanguageSection(): JSX.Element {
  return (
    <div>
      <div style={{ fontSize: 13, color: T.inkSoft }}>Language</div>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <span className="ll-chip" style={{ height: 26, fontSize: 12.5, color: T.ink }}>🇺🇸 English <I name="chevron-down" size={11} style={{ color: T.inkSoft }} /></span>
        <span className="ll-chip" style={{ height: 26, width: 32, justifyContent: "center" }}><I name="audio-lines" size={13} /></span>
      </div>
      <div style={{ fontSize: 11.5, color: T.inkFaint, marginTop: 8 }}>The language questions are originally written in</div>
      <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 12.5, alignItems: "center" }}>
        <span style={{ color: T.inkSoft }}>+ Add translations</span>
        <span style={{ width: 26, height: 15, borderRadius: 8, background: T.brand, position: "relative" }}>
          <span style={{ position: "absolute", right: 2, top: 2, width: 11, height: 11, borderRadius: "50%", background: "#FFF" }} />
        </span>
        <span>Analysis in English</span>
      </div>
    </div>
  )
}

const Divider = (): JSX.Element => <div style={{ borderTop: `1px solid ${T.appBorder}`, margin: "18px 0" }} />

// -------------------------------------------------------- shared-element ----
type Rect = { x: number; y: number; w: number; h: number }

/** FLIP overlay: the entry input card flying into the chat bubble.
 *  Mounts at `from`; adding `to` transitions position/size/style. */
function MorphCard(props: { from: Rect; to?: Rect; text: string }): JSX.Element {
  const t = props.to ?? props.from
  return (
    <div style={{
      position: "absolute", left: t.x, top: t.y, width: t.w, height: t.h,
      background: props.to ? T.fill : T.appBg,
      border: props.to ? "1.5px solid transparent" : `1.5px solid ${T.brand}`,
      borderRadius: 14, padding: props.to ? "10px 14px" : "14px 16px",
      fontSize: 13, lineHeight: 1.5, color: T.ink, overflow: "hidden",
      boxSizing: "border-box", zIndex: 30,
      transition: "all .68s cubic-bezier(.22, 1, .36, 1)",
    }}>
      {props.text}
    </div>
  )
}

// =================================================== 1. Design the study ====
// Content: the "Listen Labs Billboard Ad Test - C-Suite Demo" study (the
// hard-to-reach audience story); insights in later stages come from the
// general-population run of the same billboard test.
const GOAL_TEXT = "I want to understand how C-suite executives react to our billboard ad"
// shown without the source study's "Demo" suffix
const STUDY_TITLE = "Listen Labs Billboard Ad Test - C-Suite"
const GOAL_PARA = "Decide whether the billboard clearly communicates what Listen Labs is and resonates with C-suite executives at large enterprises, or whether the messaging needs to be revised."
const KEY_QS = [
  "What do they think the product or service is after seeing the ad?",
  "What are their unfiltered first reactions, and what triggers them?",
  "Does the ad make them curious enough to learn more or visit the site?",
]
const RECAP = "I've set this up to test the billboard with chief officers at 1,000+ employee enterprises. Sound right?"

const TEMPLATES: Array<[string, string, string, boolean?]> = [
  ["MARKET RESEARCH", "What makes AI research feel trustworthy to enterprise buyers?", "Understand the proof points that turn interest into purchase confidence."],
  ["PRODUCT RESEARCH", "How do research teams adopt continuous customer discovery?", "Find the workflows and triggers that drive repeat research usage."],
  ["BRAND RESEARCH", "What messaging clarifies Listen Labs' value for broader buyers?", "Identify language that makes the product easier to understand.", true],
  ["PRODUCT FEEDBACK", "How can AI interviews preserve depth while scaling research?", "Explore what makes automated interviews feel genuinely insightful."],
]

export function SceneDesignStudy({ active, onDone, runKey = 0, hold, playFrom, onTime }: SceneProps): JSX.Element {
  ensureCss()
  const [phase, setPhase] = React.useState<"entry" | "editor">("entry")
  const [entryFade, setEntryFade] = React.useState(false)
  const [morph, setMorph] = React.useState<{ from: Rect; to?: Rect; text: string } | null>(null)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const entryInputRef = React.useRef<HTMLDivElement>(null)
  const bubbleRef = React.useRef<HTMLDivElement>(null)
  const measure = (el: HTMLElement | null): Rect | null => {
    const root = rootRef.current
    if (!el || !root) return null
    const rb = root.getBoundingClientRect()
    const r = el.getBoundingClientRect()
    if (!rb.width || !r.width) return null
    const s = rb.width / root.offsetWidth
    return { x: (r.x - rb.x) / s, y: (r.y - rb.y) / s, w: r.width / s, h: r.height / s }
  }
  const [goal, setGoal] = React.useState("")
  const [question, setQuestion] = React.useState(0)      // 0 none, 1, 2, 3 answered
  const [hovered, setHovered] = React.useState(-1)
  const [picked, setPicked] = React.useState(-1)
  const [thinking, setThinking] = React.useState(false)
  const [markers, setMarkers] = React.useState<Array<[string, string, boolean?]>>([])
  const [docTitle, setDocTitle] = React.useState("Empty Study")
  const [showGoals, setShowGoals] = React.useState(false)
  const [bullets, setBullets] = React.useState(0)
  const [recap, setRecap] = React.useState("")
  const [nextBtn, setNextBtn] = React.useState(false)
  const cur = useCursor(APP_CURSOR_START)

  useScene(active, async (p) => {
    setPhase("entry"); setEntryFade(false); setMorph(null); setGoal(""); setQuestion(0)
    setHovered(-1); setPicked(-1)
    setThinking(false); setMarkers([]); setDocTitle("Empty Study"); setShowGoals(false)
    setBullets(0); setRecap(""); setNextBtn(false); cur.hide()
    await p.sleep(600)
    await p.type(setGoal, GOAL_TEXT, USER_CPS)
    await p.sleep(450)
    // shared-element morph: the input card flies into the chat bubble.
    // (Skipped when rects can't be measured — reduced motion, frozen scrubs.)
    const from = p.instant || p.frozen ? null : measure(entryInputRef.current)
    if (from) {
      setMorph({ from, text: GOAL_TEXT })
      setEntryFade(true)
      await p.sleep(60)
      // the editor mounts (its bubble hidden under the flight), then the card
      // flies onto the bubble's measured rect while the nav crossfades
      setPhase("editor")
      await p.sleep(40)
      const to = measure(bubbleRef.current)
      if (to) { setMorph((m) => m && { ...m, to }); await p.sleep(760) }
      setMorph(null)
    } else {
      setPhase("editor")
    }
    await p.sleep(500)
    setThinking(true)
    await p.sleep(1100)
    setThinking(false)
    setQuestion(1)
    // cursor picks option 3 ("Evaluate ad clarity and appeal")
    cur.show("opt-2", 0, 160); await p.sleep(300)
    cur.move("opt-2"); await p.sleep(550)
    setHovered(2); await p.sleep(250)
    cur.click(1); await p.sleep(200); setHovered(-1); setPicked(2)
    await p.sleep(500)
    setQuestion(2); setPicked(-1)
    // option 2 ("Chief officers at 1,000+ employee companies")
    cur.move("opt-1"); await p.sleep(550)
    setHovered(1); await p.sleep(250)
    cur.click(2); await p.sleep(200); setHovered(-1); setPicked(1)
    await p.sleep(450)
    cur.hide()
    setQuestion(3); setPicked(-1)
    setThinking(true)
    await p.sleep(1200)
    setThinking(false)
    setMarkers([["square-pen", "Updating study title", true]])
    await p.type(setDocTitle, STUDY_TITLE, 25)
    setMarkers([["square-pen", "Updated study title"]])
    await p.sleep(MARKER_MS)
    setMarkers((m) => [...m, ["square-pen", "Updated study goal"]])
    setShowGoals(true)
    for (let i = 1; i <= KEY_QS.length; i++) { setBullets(i); await p.sleep(320) }
    setMarkers((m) => [...m, ["notepad-text", "Updated study guide (2 changes)"], ["sparkles", "Done"]])
    await p.sleep(500)
    await p.type(setRecap, RECAP, AI_CPS)
    setNextBtn(true)
    await p.sleep(2400)
  }, onDone, runKey, hold, playFrom, onTime)

  // -- one persistent shell across entry → editor: the workspace nav
  // crossfades to the study nav and the content swaps under the same top bar,
  // so the morph never blanks or "reloads"
  const isEditor = phase === "editor"
  return (
    <div ref={rootRef} className="ll" style={{ position: "relative", width: "100%", height: "100%" }}>
      <AppShell cursor={cur.state}
        nav={isEditor ? studyEditNav("Study Guide") : workspaceNav("Studies")}
        title={isEditor ? docTitle : undefined}
        crumb={isEditor ? ["Study Guide"] : ["Omni Corporation", "Create"]}
        actions={isEditor ? EDITOR_ACTIONS : undefined}>
            {!isEditor ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 56 }}>
              <div style={{ width: 540, opacity: entryFade ? 0 : 1, transition: "opacity .3s ease" }}>
                  <div className="ll-500" style={{ fontSize: 20 }}>Create Study</div>
                  <div style={{ fontSize: 13.5, color: T.inkSoft, marginTop: 4 }}>Describe your study goals to get started</div>
                  {/* input card over its gray backing strip */}
                  <div style={{ marginTop: 14, background: T.chromeBg, borderRadius: 14, paddingBottom: 6 }}>
                    <div ref={entryInputRef} style={{ background: T.appBg, border: goal ? `1.5px solid ${T.brand}` : `1px solid ${T.appBorder}`, borderRadius: 14, transition: "border-color .15s ease", visibility: morph ? "hidden" : "visible" }}>
                      <div style={{ padding: "14px 16px", fontSize: 13.5, minHeight: 64 }}>
                        {goal ? <>{goal}{goal.length < GOAL_TEXT.length && <Caret />}</> : <span style={{ color: T.inkFaint }}>I want to understand how [Audience] thinks about [Topic]...</span>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", padding: "0 12px 12px" }}>
                        <I name="paperclip" size={14} style={{ color: T.inkSoft }} />
                        <span style={{ flex: 1 }} />
                        <span style={{ width: 26, height: 26, borderRadius: 13, background: T.appBg, border: `1px solid ${T.appBorder}`, color: T.inkSoft, display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: T.shadow }}><I name="arrow-up" size={13} /></span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, padding: "7px 10px 3px" }}>
                      <span className="ll-chip" style={{ height: 25, fontSize: 12, color: T.ink }}><I name="upload" size={12} /> Upload Discussion Guide</span>
                      <span className="ll-chip" style={{ height: 25, fontSize: 12, color: T.ink }}>Skip Guided Setup</span>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginTop: 22 }}>
                    {TEMPLATES.map(([cat, q, desc, followUp], i) => (
                      <div key={cat} className="ll-card" style={{ padding: "12px 14px", background: i === 0 ? T.fill : T.appBg, borderColor: i === 0 ? "transparent" : T.appBorder }}>
                        <div style={{ fontSize: 10.5, color: T.inkSoft, display: "flex", alignItems: "center" }}>
                          {cat}
                          {followUp && <span style={{ marginLeft: "auto", color: T.brand, display: "inline-flex", alignItems: "center", gap: 4 }}><I name="sparkles" size={10} /> Follow up study</span>}
                        </div>
                        <div className="ll-500" style={{ fontSize: 12.5, lineHeight: 1.45, marginTop: 5 }}>{q}</div>
                        <div style={{ fontSize: 11, lineHeight: 1.45, marginTop: 4, color: T.inkSoft }}>{desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
            </div>
            ) : (
            <div className="ll-scene-fade" style={{ flex: 1, display: "flex", minWidth: 0 }}>
      <ChatShell step="Step 1 / 5 · Set your study goals" placeholder="Describe your study goals..." busy={thinking || markers.some((m) => m[2])}>
        <div ref={bubbleRef} style={{ alignSelf: "flex-end", background: T.fill, borderRadius: 14, padding: "10px 14px", maxWidth: 240, visibility: morph ? "hidden" : "visible" }}>{GOAL_TEXT}</div>
        {question >= 1 && question < 3 && (
          <>
            <div style={{ color: T.body }}>Welcome! Testing a billboard with C-suite executives is a sharp brief. Let me ask one thing to sharpen the focus.</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: T.inkSoft }}>
              <I name="sparkles" size={12} /> Waiting for selection...
            </div>
          </>
        )}
        {question === 1 && (
          <ChipQuestion title="What decision should this study inform?" footer="1 of 2"
            options={["Decide whether to run the campaign", "Revise the messaging before launch", "Evaluate ad clarity and appeal", "Compare how regions interpret it", "Something else..."]}
            hovered={hovered} picked={picked} />
        )}
        {question === 2 && (
          <ChipQuestion title="Which executives matter most?" footer="2 of 2"
            options={["Any senior leader (VP and above)", "Chief officers at 1,000+ employee companies", "Marketing leaders only", "Founders and owners", "Something else..."]}
            hovered={hovered} picked={picked} />
        )}
        {question === 3 && (
          <AnsweredCard qa={[["What decision should this study inform?", "Evaluate ad clarity and appeal"], ["Which executives matter most?", "Chief officers at 1,000+ employee companies"]]} />
        )}
        {thinking && question >= 1 && <Thinking />}
        {markers.map(([icon, text, act]) => <Marker key={text} icon={icon} text={text} active={act} />)}
        {markers.some((m) => m[2]) && <DotSpinner size={18} />}
        {recap && <div style={{ color: T.body }}>{recap}{recap.length < RECAP.length && <Caret />}</div>}
        {nextBtn && <button className="ll-btn primary ll-enter" style={{ alignSelf: "flex-end", height: 28, fontSize: 13 }}>Next step →</button>}
      </ChatShell>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <DocStrip />
        <div className="ll-doc-fade" style={{ flex: 1, padding: "16px 105px 0" }}>
          <div className="ll-500" style={{ fontSize: 27, lineHeight: "33px", borderLeft: docTitle.length < STUDY_TITLE.length && docTitle !== "Empty Study" ? `2px solid ${T.inkSoft}` : "2px solid transparent", paddingLeft: 6, marginLeft: -8 }}>
            {docTitle}
          </div>
          <div style={{ marginTop: 20 }}><LanguageSection /></div>
          <Divider />
          <div className="ll-500" style={{ fontSize: 18 }}>Study Goals</div>
          <div style={{ marginTop: 10, background: T.chromeBg, borderRadius: 10, padding: "10px 12px", fontSize: 12, lineHeight: 1.5, color: T.inkSoft, display: "flex", gap: 8 }}>
            <I name="lightbulb" size={13} style={{ flexShrink: 0, marginTop: 1 }} />
            Study goals inform the AI what to focus on in each interview and what to highlight in the analysis. The clearer they are, the more focused and useful your results will be.
          </div>
          {showGoals ? (
            <div style={{ marginTop: 12, fontSize: 13, lineHeight: 1.55, color: T.body }}>
              {GOAL_PARA}
              <div style={{ marginTop: 8 }}>Key questions:</div>
              <ul style={{ paddingLeft: 20, marginTop: 4, display: "flex", flexDirection: "column", gap: 3 }}>
                {KEY_QS.slice(0, bullets).map((q) => <li key={q} className="ll-enter">{q}</li>)}
              </ul>
            </div>
          ) : (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 14, color: T.inkSoft }}>Enter study goals</div>
              <div style={{ marginTop: 8, fontSize: 12.5, color: T.inkSoft, display: "flex", alignItems: "center", gap: 7 }}>
                <I name="message-circle" size={12} /> Let me know if you want to change your study goals
              </div>
            </div>
          )}
          <Divider />
          <div className="ll-500" style={{ fontSize: 18 }}>Audience</div>
          <div style={{ marginTop: 8, fontSize: 13, color: T.inkFaint }}>Your target audience will be displayed here</div>
        </div>
      </div>
            </div>
            )}
      </AppShell>
      {morph && <MorphCard {...morph} />}
    </div>
  )
}

// ================================================ 2. Reach the right people =
const COUNTRIES_PICK = "United States, France, Japan and Brazil"
const SETUP_TEXT = "Adding four country panels and a screener for chief officers at 1,000+ employee enterprises."
const WELCOME_TEXT = "Hi, and thanks for joining! We'll show you something briefly and ask for your honest, first impressions. There are no right or wrong answers — we just want to hear what you genuinely think. Let's get started!"
const PANELS: Array<[string, string, string]> = [
  ["C-Suite Executives (US)", "🇺🇸", "United States"],
  ["C-Suite Executives (France)", "🇫🇷", "France"],
  ["C-Suite Executives (Japan)", "🇯🇵", "Japan"],
  ["C-Suite Executives (Brazil)", "🇧🇷", "Brazil"],
]

export function SceneReachPeople({ active, onDone, runKey = 0, hold, playFrom, onTime }: SceneProps): JSX.Element {
  ensureCss()
  const [step, setStep] = React.useState(2)
  const [aiMsg, setAiMsg] = React.useState("")
  const [srcHover, setSrcHover] = React.useState(-1)
  const [srcPicked, setSrcPicked] = React.useState(false)
  const [thinking, setThinking] = React.useState(false)
  const [country, setCountry] = React.useState(0)        // 0 none, 1 asking, 2 answered
  const [cHover, setCHover] = React.useState(-1)
  const [cPicked, setCPicked] = React.useState(-1)
  const [setupText, setSetupText] = React.useState("")
  const [markers, setMarkers] = React.useState<Array<[string, string, boolean?]>>([])
  const [audStage, setAudStage] = React.useState(0)      // 0 none, 1 source chip, 2 criteria, 3 screener
  const [screener, setScreener] = React.useState(false)
  const [adjust, setAdjust] = React.useState("")
  const [suggestions, setSuggestions] = React.useState(false)
  const cur = useCursor(APP_CURSOR_START)
  const ADJUST = "Happy with this, or want to adjust anything (e.g. include SVPs, different sample size)?"

  const MSG = "Great! Now let's determine how you'll find participants for your research. Which option do you want to go for?"

  useScene(active, async (p) => {
    setStep(2); setAiMsg(""); setSrcHover(-1); setSrcPicked(false); setThinking(false)
    setCountry(0); setCHover(-1); setCPicked(-1); setSetupText(""); setMarkers([])
    setAudStage(0); setScreener(false); setAdjust(""); setSuggestions(false); cur.hide()
    await p.sleep(700)
    await p.type(setAiMsg, MSG, AI_CPS)
    await p.sleep(400)
    cur.show("src-0", 0, 180); await p.sleep(300)
    cur.move("src-0"); await p.sleep(550)
    setSrcHover(0); await p.sleep(250)
    cur.click(1); await p.sleep(200)
    setSrcHover(-1); setSrcPicked(true); setAudStage(1)
    await p.sleep(500)
    setThinking(true); await p.sleep(800); setThinking(false)
    setMarkers([["history", "Updated participant source"]])
    await p.sleep(600)
    setStep(3); setMarkers([]); setCountry(1)
    cur.move("opt-1"); await p.sleep(550)
    setCHover(1); await p.sleep(250)
    cur.click(2); await p.sleep(200); setCHover(-1); setCPicked(1)
    await p.sleep(450)
    cur.hide(); setCountry(2)
    await p.type(setSetupText, SETUP_TEXT, AI_CPS)
    setMarkers([["users", "Updating audience", true]])
    await p.sleep(900)
    setMarkers([["users", "Added audience"]]); setAudStage(2)
    await p.sleep(MARKER_MS)
    setMarkers((m) => [...m, ["user-round-plus", "Added 4 recruitment groups"]])
    await p.sleep(MARKER_MS)
    setMarkers((m) => [...m, ["notepad-text", "Added New Section Screener"]]); setAudStage(3)
    await p.sleep(600)
    setMarkers([]); setScreener(true)
    await p.sleep(500)
    await p.type(setAdjust, ADJUST, AI_CPS)
    await p.sleep(300)
    setSuggestions(true)
    await p.sleep(2600)
  }, onDone, runKey, hold, playFrom, onTime)

  const srcBtn = (icon: string, label: string, sub: string, hovered: boolean, target: string): JSX.Element => (
    <div data-cursor={target} style={{
      background: hovered ? T.hoverFill : T.fill, borderRadius: 10, padding: "9px 12px", fontSize: 12.5,
      display: "flex", gap: 9, alignItems: "flex-start", transition: "background-color .15s ease",
    }}>
      <I name={icon} size={14} style={{ marginTop: 2, color: T.inkSoft }} />
      <div>
        <div className="ll-500">{label}</div>
        <div style={{ fontSize: 11.5, color: T.inkSoft, marginTop: 1 }}>{sub}</div>
      </div>
    </div>
  )

  return (
    <AppShell cursor={cur.state} nav={studyEditNav("Study Guide")}
      title={STUDY_TITLE} crumb={["Study Guide"]} actions={EDITOR_ACTIONS}>
      <ChatShell
        step={step === 2 ? "Step 2 / 5 · Choose participant source" : "Step 3 / 5 · Find your audience"}
        placeholder={step === 2 ? "Choose participant source" : "Suggest changes to the screening questions..."}
        busy={thinking || markers.some((m) => m[2])}
      >
        {aiMsg && !srcPicked && <div style={{ color: T.body }}>{aiMsg}{aiMsg.length < MSG.length && <Caret />}</div>}
        {aiMsg.length >= MSG.length && !srcPicked && (
          <>
            {srcBtn("users", "Listen finds participants for me", "Use our network of 50M+ global participants", srcHover === 0, "src-0")}
            {srcBtn("link", "I'll bring my own participants", "Share a link via Email or in-app message", srcHover === 1, "src-1")}
          </>
        )}
        {srcPicked && (
          <div style={{ alignSelf: "flex-end", background: T.fill, borderRadius: 10, padding: "8px 12px", display: "flex", gap: 7, alignItems: "center", fontSize: 12.5 }}>
            <I name="users" size={13} style={{ color: T.inkSoft }} /> Listen finds participants for me
          </div>
        )}
        {thinking && <Thinking />}
        {country === 1 && (
          <ChipQuestion title="Which country should participants live in?" footer="1 of 1"
            options={["United States", COUNTRIES_PICK, "United States + United Kingdom", "Something else..."]}
            hovered={cHover} picked={cPicked} />
        )}
        {country === 2 && <AnsweredCard qa={[["Which country should participants live in?", COUNTRIES_PICK]]} />}
        {setupText && <div style={{ color: T.body }}>{setupText}{setupText.length < SETUP_TEXT.length && <Caret />}</div>}
        {markers.map(([icon, text, act]) => <Marker key={text} icon={icon} text={text} active={act} />)}
        {markers.some((m) => m[2]) && <DotSpinner size={18} />}
        {screener && (
          <div className="ll-enter" style={{ color: T.body, fontSize: 12.5, lineHeight: 1.45 }}>
            <div className="ll-500">Screener (9 questions):</div>
            <ul style={{ paddingLeft: 18, marginTop: 3, display: "flex", flexDirection: "column", gap: 2 }}>
              <li>Title → Chief Officer (CEO, CFO, CMO, COO…)</li>
              <li>Organisation size → 1,000+ employees</li>
            </ul>
          </div>
        )}
        {adjust && <div style={{ color: T.body }}>{adjust}{adjust.length < ADJUST.length && <Caret />}</div>}
        {adjust.length >= ADJUST.length && (
          <button className="ll-btn primary ll-enter" style={{ alignSelf: "flex-start", height: 30, fontSize: 13 }}>Next Step →</button>
        )}
        {suggestions && (
          <div className="ll-enter" style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 5 }}>
            <div style={{ fontSize: 11.5, color: T.inkSoft }}>Suggestions</div>
            {["Also allow Senior Vice Presidents to qualify", "Increase each panel from 100 to 200 executives"].map((s) => (
              <span key={s} className="ll-chip" style={{ height: 24, fontSize: 11, justifyContent: "space-between", background: T.fill, borderColor: "transparent" }}>{s} <I name="arrow-up" size={10} /></span>
            ))}
          </div>
        )}
      </ChatShell>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <DocStrip />
        <div style={{ flex: 1, padding: "16px 105px 0" }}>
          <div className="ll-500" style={{ fontSize: 22 }}>Audience</div>
          {audStage >= 1 && (
            <div className="ll-enter" style={{ marginTop: 10 }}>
              <Chip>{<I name="users" size={12} />} Listen finds participants for me</Chip>
            </div>
          )}
          {audStage >= 2 ? (
            <>
              <div style={{ marginTop: 10, fontSize: 12.5, color: T.inkSoft }}>Listen will find participants with the following criteria</div>
              <div className="ll-enter" style={{ marginTop: 12, borderLeft: `2px solid ${T.brandFaint}`, paddingLeft: 14, display: "flex", flexDirection: "column", gap: 5 }}>
                {PANELS.map(([name, flag, country]) => (
                  <div key={name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, flexWrap: "nowrap", whiteSpace: "nowrap" }}>
                    <span className="ll-500" style={{ fontSize: 13 }}>{name}</span>
                    <Chip>Draft</Chip>
                    <span style={{ flex: 1 }} />
                    <span className="ll-chip" style={{ height: 22, fontSize: 11.5, color: T.ink }}><I name="users" size={11} /> 100</span>
                    <span style={{ color: T.inkFaint, fontSize: 11 }}>×</span>
                    <span className="ll-chip" style={{ height: 22, fontSize: 11.5, color: T.ink }}>{flag} {country} <I name="chevron-down" size={10} style={{ color: T.inkSoft }} /></span>
                    <span className="ll-chip" style={{ height: 22, fontSize: 11.5, color: T.ink }}>Professionals <I name="chevron-down" size={10} style={{ color: T.inkSoft }} /></span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ marginTop: 10, fontSize: 13, color: T.inkFaint }}>Your target audience will be displayed here</div>
          )}
          <div style={{ borderTop: `1px solid ${T.appBorder}`, margin: "14px 0" }} />
          <div className="ll-enter" style={audStage >= 2 ? { borderLeft: `2px solid ${T.brandFaint}`, paddingLeft: 14 } : undefined}>
            <Chip>{<I name="message-circle" size={12} />} Welcome Message</Chip>
            {audStage >= 2 && <div className="ll-500" style={{ marginTop: 10, fontSize: 15 }}>Welcome</div>}
            <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.55, color: T.body }}>
              {audStage >= 2
                ? WELCOME_TEXT
                : "Welcome! I would like to ask you a couple of questions."}
            </div>
            <div style={{ marginTop: 12, border: `1px solid ${T.appBorder}`, borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13 }}>Consent checkbox <I name="info" size={11} style={{ color: T.inkFaint, verticalAlign: -1 }} /></div>
                <div style={{ fontSize: 11.5, color: T.inkSoft, marginTop: 2 }}>Optionally require users consent before beginning the study.</div>
              </div>
              <span style={{ width: 34, height: 19, borderRadius: 10, background: T.track, position: "relative", flexShrink: 0 }}>
                <span style={{ position: "absolute", left: 2, top: 2, width: 15, height: 15, borderRadius: "50%", background: "#FFF", boxShadow: T.shadow }} />
              </span>
            </div>
          </div>
          {audStage >= 3 && (
            <div className="ll-enter">
              <div style={{ borderTop: `1px solid ${T.appBorder}`, margin: "14px 0" }} />
              <div style={{ display: "flex", gap: 8 }}>
                <Chip>Screening Section</Chip>
                <span style={{ fontSize: 12, color: T.inkSoft, alignSelf: "center" }}>9 Questions</span>
              </div>
              <div style={{ marginTop: 12, borderLeft: `2px solid ${T.brandFaint}`, paddingLeft: 14 }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <Chip>{<I name="circle-help" size={11} />} Q1</Chip>
                  <Chip>Multiple choice <I name="chevron-down" size={10} /></Chip>
                </div>
                <div style={{ marginTop: 8, fontSize: 14 }}>Which of the following best describes your current employment situation?</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}

// ================================================== 3. Interview at scale ===
// Participant interview UI, rebuilt from a product screen recording
// (2026-09-17) and re-measured against the live interview (2026-09-30): a
// 4px progress bar, a left-aligned question column (552px, centred), a small
// webcam tile bottom-right, a wide brand-blue Start Recording button that
// becomes a Pause · timer · Submit bar while recording, then a three-dot
// loader and the moderator's follow-up streaming in word by word. The
// product does not transcribe live, so no text appears while recording.
// Drawn 1:1 in live px, as the page lays out in a 1344x768 window — the
// size every full product shot shares.
const IV_COL_W = 552                 // centred question column
const IV_COL_X = (APP_W - IV_COL_W) / 2
const IV_INSET = 12                  // question text sits inside the column
const IV_BTN_H = 40
const IV_EDGE = 24                   // bottom / right margins
const IV_CAM = 120                   // webcam tile on question screens
const IV_Q_FONT = { fontSize: 24, lineHeight: "33.6px", letterSpacing: -0.48 }
const IV_PROGRESS = 0.3              // progress bar fill, this far into the study
// webcam tile (bottom right) with the participant clip. Off for now: the
// recording visualizer carries the moment. Flip to true to bring it back —
// the clip, its sync, and the prep script are all still wired up.
const IV_SHOW_CAM = false
const IV_RED = "#DC2626"
const IV_QUESTION = "What do you think the company or service being advertised actually does? What is it offering?"
// verbatim moderator follow-up from the general-population Billboard Ad Test, respondent 6
const IV_FOLLOWUP = "How confident are you in that understanding? Is there anything about the ad that leaves you uncertain about what they actually do?"
const IV_WORDS = IV_FOLLOWUP.split(" ")
const IV_WORD_MS = 95
// the recording beat lasts exactly as long as the webcam clip
const IV_REC_MS = Math.round(INTERVIEW_CLIP.durationMs / 30) * 30
const IV_TICK = 30                   // ms per grid column (scrollMs), and the script's tick

// --- Webcam clip: slaved to the recording clock (not the other way round), so
// the participant's mouth and the dot grid can never drift apart. Live, it plays
// and eases its rate (±15%) toward the clock — the scene's 30ms ticks run a hair
// slow — seeking only past 300ms; scrubbing and freeze-frames seek exactly.
function ClipVideo({ t, playing }: { t: number; playing: boolean }): JSX.Element {
  const ref = React.useRef<HTMLVideoElement>(null)
  const [ready, setReady] = React.useState(false)
  React.useEffect(() => {
    const v = ref.current
    if (!v || !ready) return
    const target = Math.min(t, INTERVIEW_CLIP.durationMs - 40) / 1000
    // at the tail, hold the last frame (play() on an ended video would restart it)
    const atEnd = v.ended || target >= INTERVIEW_CLIP.durationMs / 1000 - 0.1
    if (playing && !atEnd) {
      const drift = target - v.currentTime
      if (Math.abs(drift) > 0.3) v.currentTime = target
      v.playbackRate = Math.max(0.85, Math.min(1.15, 1 + drift * 2))
      if (v.paused) v.play().catch(() => {})
    } else {
      if (!v.paused) v.pause()
      if (Math.abs(v.currentTime - target) > 0.02) v.currentTime = target
    }
  }, [t, playing, ready])
  return (
    <video ref={ref} src={INTERVIEW_CLIP.src} muted playsInline preload="auto"
      onLoadedData={() => setReady(true)} onError={() => setReady(false)}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: ready ? 1 : 0, transition: "opacity .3s ease" }} />
  )
}

// --- Speech dot grid — port of brannonwellington-design/audio-visualizer
// (DotGridVisualizer, "chronological" view, binary dots) at its defaults:
// 140 columns × 17 rows, 75% dot size, 30ms/column, 5% edge tapers.
// The scene has no microphone, so a deterministic synthetic speech envelope
// (syllable bursts, fast attack / slow release, gated phrase gaps) stands in
// for the analyzer's level. Everything is a pure function of the recording
// clock, so freeze-frame and scrubbing land on the exact same dots.
const DG_COLS = 140
const DG_ROWS = 17
const DG_DOT = 0.75
const DG_ACTIVE = "#CF2617"
const DG_TAPER = 0.05

type Syllable = { at: number; dur: number; amp: number }
function buildSyllables(seed: number, totalMs: number): Syllable[] {
  // mulberry32
  let a = seed >>> 0
  const rnd = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
  const out: Syllable[] = []
  let t = 380 // a breath before the first word
  while (t < totalMs) {
    const n = 3 + Math.floor(rnd() * 7)           // syllables per phrase
    for (let i = 0; i < n && t < totalMs; i++) {
      const dur = 90 + rnd() * 130
      out.push({ at: t, dur, amp: 0.45 + rnd() * 0.55 })
      t += dur + 20 + rnd() * 45
    }
    t += 300 + rnd() * 350                          // phrase gap
  }
  return out
}
const DG_SYLLABLES = buildSyllables(7, 12000)
const DG_ATTACK = 12, DG_RELEASE = 110
// real loudness from the webcam clip (scripts/prep-interview-clip.py): one
// value per 30ms, linearly interpolated; the synthetic envelope below is the
// fallback when no clip is present
const CLIP_LEVELS: number[] = (INTERVIEW_CLIP.levels.match(/\d\d/g) ?? []).map((d) => +d / 99)
function clipLevel(t: number): number {
  const f = t / INTERVIEW_CLIP.frameMs
  const i = Math.floor(f)
  if (i < 0 || i >= CLIP_LEVELS.length) return 0
  const a = CLIP_LEVELS[i], b = CLIP_LEVELS[Math.min(i + 1, CLIP_LEVELS.length - 1)]
  const v = a + (b - a) * (f - i)
  return v < 0.03 ? 0 : v
}

function speechLevel(t: number): number {
  if (CLIP_LEVELS.length) return clipLevel(t)
  let v = 0
  for (const s of DG_SYLLABLES) {
    if (t < s.at) break
    const dt = t - s.at
    const e = dt <= s.dur
      ? 1 - Math.exp(-dt / DG_ATTACK)
      : Math.exp(-(dt - s.dur) / DG_RELEASE)
    v = Math.max(v, s.amp * e)
  }
  return v < 0.03 ? 0 : v
}
const smoothstep = (p: number) => p * p * (3 - 2 * p)

/** Column values at recording time t: newest at the right, one column per tick. */
function gridValues(t: number): number[] {
  const vals = new Array(DG_COLS).fill(0)
  for (let c = 0; c < DG_COLS; c++) {
    const end = t - (DG_COLS - 1 - c) * IV_TICK
    if (end <= 0) continue
    let m = 0
    for (let k = 0; k < 4; k++) m = Math.max(m, speechLevel(end - (k * IV_TICK) / 4))
    vals[c] = m
  }
  const taperCols = Math.max(1, Math.round(DG_COLS * DG_TAPER))
  for (let c = 0; c < taperCols; c++) {
    const f = smoothstep(c / taperCols)
    vals[c] *= f; vals[DG_COLS - 1 - c] *= f
  }
  return vals
}

function DotStrip({ t, w, h }: { t: number; w: number; h: number }): JSX.Element {
  const ref = React.useRef<HTMLCanvasElement>(null)
  React.useEffect(() => {
    const cv = ref.current; if (!cv) return
    const S = 3 // backing scale: dots are ~1px in design space and get scaled up by ScaleBox
    cv.width = w * S; cv.height = h * S
    const ctx = cv.getContext("2d"); if (!ctx) return
    ctx.clearRect(0, 0, cv.width, cv.height)
    const cellW = (w * S) / DG_COLS, cellH = (h * S) / DG_ROWS
    const radius = (Math.min(cellW, cellH) / 2) * DG_DOT
    const centerRow = (DG_ROWS - 1) / 2
    const maxRowDist = Math.max(1, centerRow - (DG_ROWS % 2 === 0 ? 0.5 : 0))
    const vals = gridValues(t)
    // inactive dots are not drawn: only the active dots and the center line show
    ctx.fillStyle = DG_ACTIVE
    ctx.beginPath()
    for (let c = 0; c < DG_COLS; c++) {
      const v = vals[c], x = (c + 0.5) * cellW
      for (let r = 0; r < DG_ROWS; r++) {
        let dist = Math.abs(r - centerRow)
        if (DG_ROWS % 2 === 0) dist = Math.max(0, dist - 0.5)
        const th = dist / maxRowDist
        if (!(v >= th && (th === 0 || v > 0))) continue
        ctx.moveTo(x + radius, (r + 0.5) * cellH)
        ctx.arc(x, (r + 0.5) * cellH, radius, 0, Math.PI * 2)
      }
    }
    ctx.fill()
  }, [t, w, h])
  return <canvas ref={ref} style={{ width: w, height: h, display: "block" }} />
}

export function SceneInterviewScale({ active, onDone, runKey = 0, hold, playFrom, onTime }: SceneProps): JSX.Element {
  ensureCss()
  const [phase, setPhase] = React.useState<"idle" | "recording" | "loading" | "reply">("idle")
  const [recT, setRecT] = React.useState(0)        // ms since Start Recording
  const [words, setWords] = React.useState(0)
  const [enabled, setEnabled] = React.useState(false)
  const cur = useCursor(APP_CURSOR_START)
  const CARD_PAD = 8, CARD_GAP = 7, STRIP_H = 60, ROW_H = 32
  const CARD_H = CARD_PAD * 2 + STRIP_H + CARD_GAP + ROW_H

  useScene(active, async (p) => {
    setPhase("idle"); setRecT(0); setWords(0); setEnabled(false); cur.hide()
    await p.sleep(700)
    cur.show("iv-start", -240, -150)
    await p.sleep(350)
    cur.move("iv-start")
    await p.sleep(750)
    cur.click(1); await p.sleep(250)
    setPhase("recording"); cur.hide()
    for (let i = 1; i <= IV_REC_MS / IV_TICK; i++) { await p.sleep(IV_TICK); setRecT(i * IV_TICK) }
    cur.show("iv-submit", -160, -120)
    await p.sleep(300)
    cur.move("iv-submit")
    await p.sleep(600)
    cur.click(2); await p.sleep(250)
    setPhase("loading"); cur.hide()
    await p.sleep(1400)
    setPhase("reply")
    for (let i = 1; i <= IV_WORDS.length; i++) { await p.sleep(IV_WORD_MS); setWords(i) }
    // short tail: the button re-arms as the last word lands, one beat to read
    await p.sleep(250)
    setEnabled(true)
    await p.sleep(950)
  }, onDone, runKey, hold, playFrom, onTime)

  const mm = (ms: number) => `00:${String(Math.floor(ms / 1000)).padStart(2, "0")}`
  const recording = phase === "recording"
  const barBtn: React.CSSProperties = { height: 32, padding: "0 12px", borderRadius: 8, fontSize: 16, display: "inline-flex", alignItems: "center", gap: 7 }

  return (
    <BareFrame cursor={cur.state}>
      <div style={{ flex: 1, position: "relative" }}>
        {/* progress bar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "rgba(0, 0, 0, 0.1)" }}>
          <div style={{ width: `${IV_PROGRESS * 100}%`, height: "100%", background: T.brand }} />
        </div>
        {/* header: settings (Skip is admin-only, so participants don't see it) */}
        <div style={{ position: "absolute", top: 19, right: IV_EDGE, color: T.ink }}>
          <I name="settings" size={20} />
        </div>

        {/* question column */}
        <div style={{ position: "absolute", left: IV_COL_X + IV_INSET, top: 88, width: IV_COL_W - IV_INSET * 2 }}>
          <div style={{ ...IV_Q_FONT, color: T.ink, opacity: phase === "idle" || recording ? 1 : 0, transition: "opacity .3s ease" }}>
            {IV_QUESTION}
          </div>
          {phase === "loading" && (
            <div className="ll-enter" style={{ position: "absolute", top: 16, left: 0, display: "flex", gap: 11 }}>
              {[0, 1, 2].map((i) => (
                <span key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: T.ink, animation: "ll-pulse 1s ease-in-out infinite", animationDelay: `${i * 0.18}s` }} />
              ))}
            </div>
          )}
          {phase === "reply" && (
            <div style={{ position: "absolute", top: 0, left: 0, width: IV_COL_W - IV_INSET * 2, ...IV_Q_FONT }}>
              {IV_WORDS.map((w, i) => (
                <span key={i} style={{ color: i < words ? T.ink : "#E4E4E4", opacity: i < words ? 1 : 0, transition: "color .7s ease, opacity .25s ease" }}>{w}{i < IV_WORDS.length - 1 ? " " : ""}</span>
              ))}
            </div>
          )}
        </div>

        {/* bottom control: Start Recording ⇄ Pause · timer · Submit */}
        <div style={{ position: "absolute", left: IV_COL_X, width: IV_COL_W, bottom: IV_EDGE }}>
          {recording ? (
            <div className="ll-enter" style={{ height: CARD_H, borderRadius: 16, background: "#EEEEEE", padding: CARD_PAD, display: "flex", flexDirection: "column", gap: CARD_GAP }}>
              <DotStrip t={recT} w={IV_COL_W - CARD_PAD * 2} h={STRIP_H} />
              <div style={{ height: ROW_H, display: "flex", alignItems: "center", gap: 11 }}>
                <span style={{ ...barBtn, border: `1px solid ${IV_RED}`, color: IV_RED, background: T.appBg }}>Pause <I name="circle-pause" size={16} /></span>
                <span style={{ flex: 1, textAlign: "center", color: IV_RED, fontSize: 17, fontVariantNumeric: "tabular-nums" }}>{mm(recT)}</span>
                <span data-cursor="iv-submit" style={{ ...barBtn, background: T.brand, color: "#FAFAFA" }}>Submit <I name="circle-stop" size={16} /></span>
              </div>
            </div>
          ) : (
            <button data-cursor="iv-start" className="ll-btn primary" style={{
              width: "100%", height: IV_BTN_H, borderRadius: 8, justifyContent: "center", fontSize: 16, letterSpacing: -0.32,
              background: phase === "idle" || enabled ? T.brand : "#ECEFFF", color: phase === "idle" || enabled ? "#FAFAFA" : T.brandFaint,
              transition: "background-color .35s ease, color .35s ease",
            }}>Start Recording</button>
          )}
        </div>

        {/* webcam tile (see IV_SHOW_CAM) */}
        {IV_SHOW_CAM && (
          <div style={{ position: "absolute", right: IV_EDGE, bottom: IV_EDGE, width: IV_CAM, height: IV_CAM, borderRadius: 8, overflow: "hidden", background: "linear-gradient(160deg, #E3DCCE 0%, #CFC7B6 55%, #B9AF9C 100%)" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 50% at 55% 60%, rgba(255,255,255,.4), transparent 70%)" }} />
            <span className="ll-avatar" style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: 40, height: 40, fontSize: 18 }}>M</span>
            {/* the participant: the clip covers the fallback avatar once it loads */}
            <ClipVideo t={phase === "idle" ? 0 : recording ? recT : IV_REC_MS} playing={recording && hold == null && active} />
            {recording && <span style={{ position: "absolute", top: 9, right: 9, width: 8, height: 8, borderRadius: "50%", background: IV_RED }} />}
          </div>
        )}

      </div>
    </BareFrame>
  )
}

// ============================================ 4. Deliver meaningful results =
// findings and counts from the general-population Billboard Ad Test analysis
const BULLETS: Array<Array<string | { stat: string }>> = [
  ["The creative earns attention: the blue-and-green palette, retro phones, and simple composition read as eye-catching and modern, not overbearing."],
  ["The core promise connects. The benefit-led tagline signalled AI-powered customer understanding and research, but the exact product is hard to grasp at billboard speed."],
  [{ stat: "6 of 11" }, " were curious enough to look up Listen Labs, and ", { stat: "4" }, " showed clear enthusiasm. Add one fast product cue such as “AI customer research.”"],
]

// curiosity after seeing the billboard (Q6), from the analysis scalars:
// 6 of 11 high-or-moderate, of which 4 high; the remaining 5 low or none
const CURIOSITY: Array<[string, number]> = [["High", 4], ["Moderate", 2], ["Low or none", 5]]
const REPORT_STATS: Array<[string, string]> = [["11", "interviews analysed"], ["6 of 11", "curious to learn more"], ["4", "clearly enthusiastic"]]
// verbatim, general-population Billboard Ad Test respondent 8, Q6
const REPORT_QUOTE = "I would say that this ad makes me very curious to learn more, and I think if I saw this, I would definitely Google just to find out more about it"
const REPORT_SCROLL = 352 // px the report document scrolls to reveal the visuals

// the Billboard Ad Test's reports list (study sidebar, Report expanded)
const BILLBOARD_REPORTS = [{ title: "Listen Labs Report", meta: "Jul 8 · Listen Labs" }]
const REPORT_ACTIONS = (
  <>
    <span className="ll-tbtn">Share <I name="link" size={14} /></span>
    <span className="ll-tbtn plain">Edit <I name="file-pen-line" size={14} /></span>
    <span className="ll-tbtn plain">New Report <I name="plus" size={14} /></span>
  </>
)

export function SceneDeliverResults({ active, onDone, runKey = 0, hold, playFrom, onTime }: SceneProps): JSX.Element {
  ensureCss()
  const [title, setTitle] = React.useState("")
  const [showH2, setShowH2] = React.useState(false)
  const [bullets, setBullets] = React.useState(0)
  const [scrolled, setScrolled] = React.useState(false)
  const [chart, setChart] = React.useState(false)
  const [quoteTag, setQuoteTag] = React.useState(false)
  const TITLE = "Keep the creative, sharpen what Listen Labs actually does"

  useScene(active, async (p) => {
    setTitle(""); setShowH2(false); setBullets(0); setScrolled(false); setChart(false); setQuoteTag(false)
    await p.sleep(700)
    await p.type(setTitle, TITLE, 40)
    await p.sleep(400)
    setShowH2(true)
    await p.sleep(600)
    for (let i = 1; i <= BULLETS.length; i++) { setBullets(i); await p.sleep(750) }
    await p.sleep(1400)
    // scroll the document to the visuals below the summary
    setScrolled(true)
    await p.sleep(900)
    setChart(true)
    await p.sleep(700)
    setQuoteTag(true)
    await p.sleep(2600)
  }, onDone, runKey, hold, playFrom, onTime)
  const maxCount = Math.max(...CURIOSITY.map((c) => c[1]))

  return (
    <AppShell nav={studyNav("Report", BILLBOARD_REPORTS)} activeSub="Listen Labs Report"
      title="Listen Labs Billboard Ad Test" crumb={["Report", "Listen Labs Report"]} actions={REPORT_ACTIONS}>
      {/* report document, centered like the live report view */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ display: "flex", gap: 14, padding: "12px 16px 0", color: T.inkSoft, justifyContent: "flex-end" }}>
          <I name="download" size={14} /><I name="ellipsis" size={14} />
        </div>
        <div className="ll-doc-fade" style={{ flex: 1, position: "relative" }}>
          <div style={{ width: 660, margin: "0 auto", padding: "16px 0 0", transform: `translateY(${scrolled ? -REPORT_SCROLL : 0}px)`, transition: "transform 1s cubic-bezier(.22,1,.36,1)" }}>
            <h1 className="ll-h1" style={{ maxWidth: 620, minHeight: 80 }}>
              {title}{title && title.length < TITLE.length && <Caret />}
            </h1>
            {showH2 && <div className="ll-h2 ll-enter" style={{ marginTop: 28 }}>Executive summary</div>}
            <ul style={{ marginTop: 16, paddingLeft: 22, display: "flex", flexDirection: "column", gap: 12, fontSize: 15, lineHeight: "26px", color: T.ink, maxWidth: 660 }}>
              {BULLETS.slice(0, bullets).map((b, i) => (
                <li key={i} className="ll-enter ll-highlight-fade">
                  {b.map((part, j) =>
                    typeof part === "string" ? part : <span key={j} className="ll-stat">{part.stat}</span>,
                  )}
                </li>
              ))}
            </ul>
            {bullets >= BULLETS.length && (
              <div style={{ maxWidth: 660 }}>
                {/* stat tiles */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 28 }}>
                  {REPORT_STATS.map(([n, label]) => (
                    <div key={label} className="ll-card" style={{ padding: "14px 16px" }}>
                      <div className="ll-500" style={{ fontSize: 26, lineHeight: "30px" }}>{n}</div>
                      <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 4 }}>{label}</div>
                    </div>
                  ))}
                </div>
                {/* curiosity chart */}
                <div className="ll-h2" style={{ marginTop: 28, fontSize: 20, lineHeight: "28px" }}>The billboard sparks meaningful curiosity</div>
                <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 4 }}>Stated curiosity to learn more or visit the website, after seeing the billboard</div>
                <div className="ll-card" style={{ marginTop: 14, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                  {CURIOSITY.map(([label, n]) => (
                    <div key={label} style={{ display: "grid", gridTemplateColumns: "110px 1fr 28px", alignItems: "center", gap: 12, fontSize: 13 }}>
                      <span style={{ color: T.body }}>{label}</span>
                      <span style={{ height: 18, background: T.fill, borderRadius: 4, overflow: "hidden" }}>
                        <span style={{ display: "block", height: "100%", width: `${chart ? (n / maxCount) * 100 : 0}%`, background: T.brand, borderRadius: 4, transition: "width .9s cubic-bezier(.22,1,.36,1)" }} />
                      </span>
                      <span className="ll-500" style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{n}</span>
                    </div>
                  ))}
                </div>
                {/* sourced quote */}
                <div className="ll-card" style={{ marginTop: 16, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="ll-avatar" style={{ width: 24, height: 24, fontSize: 11 }}>P</span>
                    <div>
                      <div style={{ fontSize: 13 }}>Participant 8</div>
                      <div style={{ fontSize: 11, color: T.inkSoft }}>Q6 · Curiosity to learn more</div>
                    </div>
                    <span style={{ flex: 1 }} />
                    {quoteTag && <span className="ll-enter"><Chip kind="brand">High curiosity</Chip></span>}
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.6, color: T.body }}>"{REPORT_QUOTE}"</div>
                </div>
                <div style={{ height: 40 }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}

// ============================================== 5. Compound your learnings ==
// The study's Agent chat, rebuilt from the live app (2026-09-30): an empty
// state with six suggestion cards, then a conversation — the question as a
// pill, a collapsed "Analyzed the responses" step, and a streamed answer
// with an inline chart. Answer grounded in the general-population Billboard
// Ad Test analysis (same data as the report scene).

// live suggestion cards, verbatim
const AGENT_CARDS: Array<[string, string]> = [
  ["sparkles", "What are the key takeaways from this study?"],
  ["notebook-pen", "Write an executive summary memo"],
  ["presentation", "Build a presentation with the key insights"],
  ["quote", "Find compelling quotes from the interviews"],
  ["video", "Create a highlight reel from the most compelling moments"],
  ["users", "How do different segments compare in their responses?"],
]
const AGENT_Q = AGENT_CARDS[0][1]

type Rich = Array<string | { b: string }>
const ANS_1: Rich = [
  "Across 11 interviews, the billboard ", { b: "earns attention but not understanding" },
  ". People liked the blue-and-green palette and the retro phones, but few could say what Listen Labs does at billboard speed.",
]
const ANS_H = "Curiosity is the real win"
const ANS_2: Rich = [
  { b: "6 of 11" }, " were curious enough to look Listen Labs up, and 4 showed clear enthusiasm. The line about finding out what people think is what made it read as AI research.",
]
const richLen = (r: Rich) => r.reduce((n, x) => n + (typeof x === "string" ? x : x.b).length, 0)
const richText = (r: Rich) => r.map((x) => (typeof x === "string" ? x : x.b)).join("")

/** the first `n` characters of a rich run, bold spans kept */
function RichSlice({ parts, n }: { parts: Rich; n: number }): JSX.Element {
  let left = n
  return (
    <>
      {parts.map((x, i) => {
        if (left <= 0) return null
        const t = typeof x === "string" ? x : x.b
        const shown = t.slice(0, left)
        left -= t.length
        return typeof x === "string" ? <React.Fragment key={i}>{shown}</React.Fragment> : <strong key={i} className="ll-500" style={{ color: T.ink }}>{shown}</strong>
      })}
    </>
  )
}

/** live chat composer */
function AgentComposer(): JSX.Element {
  return (
    <div style={{ width: 728, background: T.appBg, border: `1px solid ${T.appBorder}`, borderRadius: 16, padding: 8, flexShrink: 0 }}>
      <div style={{ padding: 8, height: 44, color: T.inkSoft }}>Ask Agent...</div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span className="ll-iconbtn" style={{ color: T.inkSoft }}><I name="plus" size={16} /></span>
        <span className="ll-iconbtn" style={{ background: T.fill, color: T.ink }}><I name="arrow-up" size={16} /></span>
      </div>
    </div>
  )
}

export function SceneCompound({ active, onDone, runKey = 0, hold, playFrom, onTime }: SceneProps): JSX.Element {
  ensureCss()
  const [hovered, setHovered] = React.useState(-1)
  const [asked, setAsked] = React.useState(false)
  const [thinking, setThinking] = React.useState(false)
  const [n1, setN1] = React.useState(0)
  const [showH, setShowH] = React.useState(false)
  const [n2, setN2] = React.useState(0)
  const [chart, setChart] = React.useState(false)
  const cur = useCursor(APP_CURSOR_START)

  useScene(active, async (p) => {
    setHovered(-1); setAsked(false); setThinking(false); setN1(0); setShowH(false); setN2(0); setChart(false); cur.hide()
    await p.sleep(1000)
    cur.show("agent-card-0", 260, 140)
    await p.sleep(350)
    cur.move("agent-card-0")
    await p.sleep(550)
    setHovered(0)
    await p.sleep(300)
    cur.click(1); await p.sleep(250)
    setHovered(-1); setAsked(true)
    cur.hide()
    await p.sleep(300)
    setThinking(true)
    await p.sleep(1400)
    setThinking(false)
    await p.type((t) => setN1(t.length), richText(ANS_1), AI_CPS)
    await p.sleep(300)
    setShowH(true)
    await p.sleep(250)
    await p.type((t) => setN2(t.length), richText(ANS_2), AI_CPS)
    await p.sleep(300)
    setChart(true)
    await p.sleep(3000)
  }, onDone, runKey, hold, playFrom, onTime)

  const total = CURIOSITY.reduce((n, c) => n + c[1], 0)
  return (
    <AppShell cursor={cur.state}
      nav={chatNav("Listen Labs Billboard Ad Test", asked ? [{ group: "Today", chats: [AGENT_Q] }] : [], asked ? AGENT_Q : undefined)}
      title="Listen Labs Billboard Ad Test" crumb={["Chat", asked ? AGENT_Q : "New Chat"]} crumbMenu
      actions={<span className="ll-tbtn">Share <I name="link" size={14} /></span>}>
      {!asked ? (
        // empty state: centered column
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 728 }}>
            <I name="agent-hex" size={24} style={{ color: T.brand }} />
            <div style={{ fontSize: 20, lineHeight: "28px", marginTop: 6 }}>Agent</div>
            <div style={{ marginTop: 8, color: T.inkSoft }}>
              I can help you understand this study's interviews, pull out quotes and themes, and turn them into memos and presentations. Start with a suggestion or ask below.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 16 }}>
              {AGENT_CARDS.map(([icon, label], i) => (
                <div key={label} data-cursor={"agent-card-" + i} style={{
                  height: 102, padding: 16, borderRadius: 16, display: "flex", flexDirection: "column", justifyContent: "space-between",
                  background: i === hovered ? T.hoverFill : T.fill, border: `1px solid ${T.appBorder}`, transition: "background-color .15s ease",
                }}>
                  <I name={icon} size={16} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12 }}><AgentComposer /></div>
          </div>
        </div>
      ) : (
        // conversation: answer column, composer pinned to the bottom
        <div className="ll-scene-fade" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", minWidth: 0 }}>
          <div className="ll-doc-fade" style={{ flex: 1, width: 632, paddingTop: 16, fontSize: 16, lineHeight: "25px" }}>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <span style={{ background: T.fill, borderRadius: 16, padding: "6px 12px", lineHeight: "24px", color: T.body }}>{AGENT_Q}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 20, fontSize: 12, lineHeight: "16px", color: T.inkSoft }}>
              <I name="chevron-right" size={12} />
              <span className={thinking ? "ll-shimmer" : undefined}>{thinking ? "Analyzing the responses…" : "Analyzed the responses"}</span>
            </div>
            {n1 > 0 && (
              <p style={{ marginTop: 16, color: T.ink }}>
                <RichSlice parts={ANS_1} n={n1} />{n1 < richLen(ANS_1) && <Caret />}
              </p>
            )}
            {showH && <div className="ll-500 ll-enter" style={{ fontSize: 20, lineHeight: "32px", marginTop: 24 }}>{ANS_H}</div>}
            {n2 > 0 && (
              <p style={{ marginTop: 8, color: T.ink }}>
                <RichSlice parts={ANS_2} n={n2} />{n2 < richLen(ANS_2) && <Caret />}
              </p>
            )}
            {chart && (
              <div className="ll-enter" style={{ marginTop: 24, fontSize: 14 }}>
                <div style={{ lineHeight: "21px" }}>Curiosity after seeing the billboard</div>
                <div style={{ lineHeight: "17.5px", color: T.inkSecondary, marginTop: 4 }}>Q6: stated curiosity to learn more or visit the website</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
                  {CURIOSITY.map(([label, n]) => (
                    <div key={label}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, lineHeight: "16px", color: T.inkSecondary }}>
                        <span>{label}</span><span>{Math.round((n / total) * 100)} %</span>
                      </div>
                      <div style={{ marginTop: 4, height: 12, borderRadius: 2, background: T.fill, overflow: "hidden" }}>
                        <div className="ll-grow" style={{ height: "100%", borderRadius: 2, background: T.brand, width: `${(n / total) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div style={{ padding: "8px 0 16px" }}><AgentComposer /></div>
        </div>
      )}
    </AppShell>
  )
}

// ------------------------------------------------------------- fragments ----
// Small standalone pieces for minor page sections. Authored at their own
// design sizes; wrap in <ScaleBox designWidth={..} designHeight={..}>.

export const TOP_ANSWER_W = 640
export const TOP_ANSWER_H = 220

export function FragmentTopAnswer({ active, onDone, runKey = 0, hold, playFrom, onTime }: SceneProps): JSX.Element {
  ensureCss()
  const [donut, setDonut] = React.useState(0)
  const [label, setLabel] = React.useState(0)
  useScene(active, async (p) => {
    setDonut(0); setLabel(0)
    await p.sleep(500)
    // ring eases via its own CSS transition; the label ticks in step with it
    setDonut(50)
    await eiTimeline(p, 1000, (t) => setLabel(Math.round(50 * eiEase(t / 1000))))
    await p.sleep(2500)
  }, onDone, runKey, hold, playFrom, onTime)
  return (
    <div className="ll-card" style={{ width: TOP_ANSWER_W, height: TOP_ANSWER_H, padding: 32, display: "flex", gap: 28, alignItems: "center", borderRadius: 12 }}>
      <Donut pct={donut} size={140} stroke={14} label={`${label}%`} />
      <div>
        <div style={{ fontSize: 13, color: T.inkSoft }}>TOP ANSWER</div>
        <div className="ll-500" style={{ fontSize: 30, marginTop: 6 }}>Midnight Blue</div>
        <div style={{ fontSize: 16, color: T.inkSoft, marginTop: 6 }}>50% (49 of 101) chose Midnight Blue.</div>
      </div>
    </div>
  )
}

export const EMOTION_QUOTE_W = 520
export const EMOTION_QUOTE_H = 240

/** Participant quote with emotional-intelligence tags. Tag colors use the
 *  shared emotion tokens; verify layout against Responses when we get access. */
export function FragmentEmotionQuote({ active, onDone, runKey = 0, hold, playFrom, onTime }: SceneProps): JSX.Element {
  ensureCss()
  const [tags, setTags] = React.useState(0)
  const q = "I got all the way to the last step and then saw $12 shipping. That felt like a bait and switch — I just closed the tab."
  useScene(active, async (p) => {
    setTags(0)
    await p.sleep(900)
    setTags(1); await p.sleep(450)
    setTags(2)
    await p.sleep(2600)
  }, onDone, runKey, hold, playFrom, onTime)
  return (
    <div className="ll-card" style={{ width: EMOTION_QUOTE_W, height: EMOTION_QUOTE_H, padding: 24, display: "flex", flexDirection: "column", gap: 14, borderRadius: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span className="ll-avatar" style={{ width: 26, height: 26, fontSize: 11 }}>P</span>
        <div>
          <div style={{ fontSize: 13 }}>Participant 94</div>
          <div style={{ fontSize: 11, color: T.inkSoft }}>Interview · 09:41</div>
        </div>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: T.inkSoft }}>▸ play clip</span>
      </div>
      <div style={{ fontSize: 15, lineHeight: 1.6, color: T.body }}>"{q}"</div>
      <div style={{ display: "flex", gap: 8, minHeight: 22, marginTop: "auto" }}>
        {tags >= 1 && <span className="ll-enter"><EmotionTag emotion="anger" /></span>}
        {tags >= 2 && <span className="ll-enter"><EmotionTag emotion="surprise" /></span>}
      </div>
    </div>
  )
}

export const LIVE_INTERVIEW_W = 460
export const LIVE_INTERVIEW_H = 300

export function FragmentLiveInterview({ active, onDone, runKey = 0, hold, playFrom, onTime }: SceneProps): JSX.Element {
  ensureCss()
  const [answer, setAnswer] = React.useState("")
  const a = "Honestly it was the shipping — I only found out about the extra $12 on the very last screen..."
  useScene(active, async (p) => {
    setAnswer("")
    await p.sleep(700)
    await p.type(setAnswer, a, 26)
    await p.sleep(2200)
  }, onDone, runKey, hold, playFrom, onTime)
  return (
    <div className="ll-card" style={{ width: LIVE_INTERVIEW_W, height: LIVE_INTERVIEW_H, padding: 20, display: "flex", flexDirection: "column", gap: 12, fontSize: 13, lineHeight: 1.55, borderRadius: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="ll-500">Interview in progress</span>
        <span style={{ flex: 1 }} />
        <Chip kind="live">Live</Chip>
      </div>
      <div style={{ background: T.fill, borderRadius: 8, padding: "10px 12px" }}>
        <div style={{ fontSize: 10, color: T.inkSoft, marginBottom: 3 }}>Listen moderator</div>
        Walk me through the moment you decided to stop.
      </div>
      <div style={{ border: `1px solid ${T.appBorder}`, borderRadius: 8, padding: "10px 12px", flex: 1 }}>
        <div style={{ fontSize: 10, color: T.inkSoft, marginBottom: 3 }}>Participant</div>
        {answer}{answer && answer.length < a.length && <Caret />}
      </div>
    </div>
  )
}

// ------------------------------------- emotional-intelligence fragments ----
// Live rebuilds of the three static feature images on
// listenlabs.ai/features/emotional-intelligence (refs: image examples/ei-*.png).
// The dot grid + canvas in those PNGs is the SceneCanvas container's job; each
// fragment here is just the white card.

/** header shared by the EI analysis cards: title · Compare ⌄ · … */
function EICardHeader({ title }: { title: string }): JSX.Element {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "18px 24px", borderBottom: "1px solid #EFEFEF" }}>
      <span className="ll-500" style={{ fontSize: 19 }}>{title}</span>
      <span style={{ flex: 1 }} />
      <span style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 34, padding: "0 13px", borderRadius: 10, border: `1px solid ${T.appBorder}`, fontSize: 14.5, color: T.body }}>
        Compare <I name="chevron-down" size={15} />
      </span>
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 17, border: `1px solid ${T.appBorder}`, color: T.body }}>
        <I name="ellipsis" size={15} />
      </span>
    </div>
  )
}

/** the outlined lowercase emotion pill from the EI Visual analysis card */
function EIOutlineTag({ emotion }: { emotion: keyof typeof EMOTIONS }): JSX.Element {
  const fg = EMOTIONS[emotion].fg
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 27, padding: "0 11px", borderRadius: 8, border: `1.5px solid ${fg}`, color: fg, fontSize: 13.5, whiteSpace: "nowrap" }}>
      <span style={{ display: "inline-flex", flexDirection: "column", gap: 2 }}>
        {[0, 1, 2].map((i) => <span key={i} style={{ width: 11, height: 2, borderRadius: 1, background: fg }} />)}
      </span>
      {emotion}
    </span>
  )
}

/** shared easing for the EI cards' scripted motion (matches the Donut's curve) */
const eiEase = (x: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3)

/** advance a ~60fps virtual-clock timeline; scrub/freeze stays frame-exact */
async function eiTimeline(p: { sleep: (ms: number) => Promise<void> }, total: number, set: (t: number) => void): Promise<void> {
  for (let e = 16; e < total; e += 16) { set(e); await p.sleep(16) }
  set(total)
}

// heights are DOM-measured at the settled beat (height:auto probe) so the
// cards carry no dead space and nothing clips
export const EI_SIGNALS_W = 620
export const EI_SIGNALS_H = 422

const EIV_QUOTE = "I used it to negotiate my first salary offer — I basically read its script on the call and it worked."
const EIV_OBS_1 = "The participant's eyes light up and she leans forward as she describes the script 'actually working'. Her vocal tone lifts and speeds up through this segment."
const EIV_OBS_2 = "Quick raise of the eyebrows and a short laugh as she recalls the recruiter agreeing on the spot."

/** EI feature 1 — multi-signal Visual analysis with traceable emotion tags */
export function FragmentEIFeatureSignals({ active, onDone, runKey = 0, hold, playFrom, onTime }: SceneProps): JSX.Element {
  ensureCss()
  const [obs1, setObs1] = React.useState("")
  const [obs2, setObs2] = React.useState("")
  const [tags, setTags] = React.useState(0)
  const [analyzing, setAnalyzing] = React.useState(false)
  useScene(active, async (p) => {
    setObs1(""); setObs2(""); setTags(0); setAnalyzing(false)
    await p.sleep(500)
    // the app's vocabulary: a shimmer beat, then the AI streams
    setAnalyzing(true)
    await p.sleep(1100)
    setAnalyzing(false)
    await p.type(setObs1, EIV_OBS_1, AI_CPS)
    await p.sleep(250)
    setTags(1)
    await p.sleep(650)
    await p.type(setObs2, EIV_OBS_2, AI_CPS)
    await p.sleep(250)
    setTags(2)
    await p.sleep(2600)
  }, onDone, runKey, hold, playFrom, onTime)
  return (
    <div className="ll-card" style={{ width: EI_SIGNALS_W, height: EI_SIGNALS_H, padding: 28, borderRadius: 12, fontSize: 14, lineHeight: 1.6 }}>
      <div style={{ fontSize: 16.5, lineHeight: 1.55, color: T.ink }}>{EIV_QUOTE}</div>
      <div style={{ display: "flex", marginTop: 14, fontSize: 12.5, color: T.inkSoft }}>
        <span>6 data points analyzed</span>
        <span style={{ flex: 1 }} />
        <span>Emotional Analysis</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 24, color: T.ink }}>
        <I name="scan-eye" size={19} />
        <span style={{ fontSize: 17 }}>Visual</span>
      </div>
      <div style={{ marginLeft: 31, marginTop: 12, color: T.inkSoft }}>
        <div style={{ minHeight: 67 }}>
          {analyzing
            ? <span className="ll-shimmer">Analyzing visual signals…</span>
            : <>{obs1}{obs1.length > 0 && obs1.length < EIV_OBS_1.length && <Caret />}</>}
        </div>
        <div style={{ marginTop: 12, minHeight: 27 }}>
          {tags >= 1 && <span className="ll-enter" style={{ display: "inline-flex" }}><EIOutlineTag emotion="happiness" /></span>}
        </div>
        <div style={{ marginTop: 14, minHeight: 45 }}>{obs2}{obs2.length > 0 && obs2.length < EIV_OBS_2.length && <Caret />}</div>
        <div style={{ marginTop: 12, minHeight: 27 }}>
          {tags >= 2 && <span className="ll-enter" style={{ display: "inline-flex" }}><EIOutlineTag emotion="surprise" /></span>}
        </div>
      </div>
    </div>
  )
}

export const EI_TRACEABLE_W = 640
export const EI_TRACEABLE_H = 406

const EIR_ROWS: Array<{ emotion: keyof typeof EMOTIONS; n: number }> = [
  { emotion: "anger", n: 3 },
  { emotion: "happiness", n: 121 },
  { emotion: "disgust", n: 2 },
  { emotion: "surprise", n: 84 },
  { emotion: "sadness", n: 11 },
]

// bar choreography: each row starts EIR_STAG after the previous and eases
// over EIR_GROW — the count ticks up in lockstep with its own bar
const EIR_GROW = 950
const EIR_STAG = 110

/** EI feature 2 — per-question Emotional Response bars with participant counts */
export function FragmentEIFeatureTraceable({ active, onDone, runKey = 0, hold, playFrom, onTime }: SceneProps): JSX.Element {
  ensureCss()
  const [gt, setGt] = React.useState(0) // ms into the growth timeline
  const max = Math.max(...EIR_ROWS.map((r) => r.n))
  useScene(active, async (p) => {
    setGt(0)
    await p.sleep(600)
    await eiTimeline(p, EIR_STAG * (EIR_ROWS.length - 1) + EIR_GROW, setGt)
    await p.sleep(2800)
  }, onDone, runKey, hold, playFrom, onTime)
  return (
    <div className="ll-card" style={{ width: EI_TRACEABLE_W, height: EI_TRACEABLE_H, borderRadius: 12 }}>
      <EICardHeader title="Emotional Response" />
      <div style={{ padding: "22px 24px" }}>
        {EIR_ROWS.map((r, i) => {
          const e = eiEase((gt - i * EIR_STAG) / EIR_GROW)
          const n = Math.round(r.n * e)
          return (
            <div key={r.emotion} style={{ marginTop: i === 0 ? 0 : 24 }}>
              <div style={{ display: "flex", alignItems: "center", fontSize: 16, color: T.ink }}>
                <span>{r.emotion[0].toUpperCase() + r.emotion.slice(1)}</span>
                <span style={{ flex: 1 }} />
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: T.body, fontVariantNumeric: "tabular-nums" }}>
                  {n < 10 ? `0${n}` : n} <I name="circle-user-round" size={16} />
                </span>
              </div>
              <div style={{ marginTop: 9, height: 10, borderRadius: 5, background: "#F1F1F1", overflow: "hidden" }}>
                <div style={{ width: `${Math.max((r.n / max) * 72, 2.6) * e}%`, height: "100%", borderRadius: 5, background: EMOTIONS[r.emotion].fg }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const EI_COMPARISON_W = 660
export const EI_COMPARISON_H = 431

type EISeg = { emotion: keyof typeof EMOTIONS; f: number }
// per row: fill = how much of the track the stacked bar occupies at rest;
// segs are fractions of that fill and sum to 1
const EIC_ROWS: Array<{ title: string; pct: number; n: number; fill: number; segs: EISeg[] }> = [
  { title: "Study Buddy", pct: 64, n: 41, fill: 0.98, segs: [{ emotion: "anger", f: 0.05 }, { emotion: "happiness", f: 0.43 }, { emotion: "disgust", f: 0.07 }, { emotion: "surprise", f: 0.45 }] },
  { title: "Late-Night Answers", pct: 58, n: 38, fill: 0.85, segs: [{ emotion: "happiness", f: 0.28 }, { emotion: "disgust", f: 0.23 }, { emotion: "surprise", f: 0.49 }] },
  { title: "First-Job Copilot", pct: 53, n: 34, fill: 0.9, segs: [{ emotion: "happiness", f: 0.4 }, { emotion: "disgust", f: 0.07 }, { emotion: "surprise", f: 0.18 }, { emotion: "sadness", f: 0.35 }] },
  { title: "Group Project Hero", pct: 49, n: 31, fill: 0.72, segs: [{ emotion: "anger", f: 0.11 }, { emotion: "happiness", f: 0.33 }, { emotion: "surprise", f: 0.56 }] },
]

// timeline: row i fades in at i·EIC_ROW_AT, its bar grows from i·EIC_ROW_AT +
// EIC_BAR_LAG over EIC_GROW — rows land while earlier bars are still easing
const EIC_ROW_AT = 160
const EIC_BAR_LAG = 220
const EIC_GROW = 900

/** EI feature 3 — Emotional Concept Comparison with stacked per-emotion bars */
export function FragmentEIFeatureComparison({ active, onDone, runKey = 0, hold, playFrom, onTime }: SceneProps): JSX.Element {
  ensureCss()
  const [gt, setGt] = React.useState(0)
  useScene(active, async (p) => {
    setGt(0)
    await p.sleep(500)
    await eiTimeline(p, (EIC_ROWS.length - 1) * EIC_ROW_AT + EIC_BAR_LAG + EIC_GROW, setGt)
    await p.sleep(2800)
  }, onDone, runKey, hold, playFrom, onTime)
  return (
    <div className="ll-card" style={{ width: EI_COMPARISON_W, height: EI_COMPARISON_H, borderRadius: 12 }}>
      <EICardHeader title="Emotional Concept Comparison" />
      <div style={{ padding: "22px 24px" }}>
        {EIC_ROWS.map((r, i) => {
          const on = gt > i * EIC_ROW_AT
          const e = eiEase((gt - (i * EIC_ROW_AT + EIC_BAR_LAG)) / EIC_GROW)
          return (
            <div key={r.title} className={on ? "ll-enter" : undefined} style={{ display: "flex", gap: 16, alignItems: "center", marginTop: i === 0 ? 0 : 22, opacity: on ? 1 : 0 }}>
              <span style={{ width: 62, height: 62, borderRadius: 14, background: "#F1F1F1", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", fontSize: 16, color: T.ink }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</span>
                  <span style={{ flex: 1 }} />
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 15, color: T.body, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                    {Math.round(r.pct * e)}% (T1)
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: T.inkSoft }}>{r.n} <I name="circle-user-round" size={15} /></span>
                  </span>
                </div>
                <div style={{ marginTop: 9, height: 12, borderRadius: 6, background: "#F1F1F1", overflow: "hidden", display: "flex", gap: 2 }}>
                  {r.segs.map((s, j) => (
                    <span key={j} style={{ width: `${s.f * r.fill * 100 * e}%`, height: "100%", borderRadius: 6, background: EMOTIONS[s.emotion].fg, flexShrink: 0 }} />
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------- EI report scene (full app) ---
// Live rebuild of the /features/emotional-intelligence page hero: the study's
// Details view with the per-question Emotional Intelligence Analysis chart and
// the Presentations rail. Session: chart builds staggered, the cursor flips
// "Show Emotions on responses" off and back on, then generates a deck.

type EIRCol = { q: string; segs: Array<[keyof typeof EMOTIONS, number]> }
const EIREP_COLS: EIRCol[] = [
  { q: "Q1", segs: [["anger", 0.13], ["happiness", 0.18], ["surprise", 0.12], ["sadness", 0.14], ["fear", 0.05]] },
  { q: "Q2", segs: [["anger", 0.05], ["happiness", 0.09], ["surprise", 0.07], ["sadness", 0.06]] },
  { q: "Q3", segs: [["happiness", 0.28], ["surprise", 0.05], ["sadness", 0.05]] },
  { q: "Q4", segs: [] },
  { q: "Q5", segs: [["anger", 0.03], ["happiness", 0.42], ["disgust", 0.04], ["sadness", 0.02]] },
  { q: "Q6", segs: [["happiness", 0.13], ["surprise", 0.1], ["sadness", 0.12], ["fear", 0.12]] },
  { q: "Q7", segs: [["happiness", 0.22], ["disgust", 0.13], ["surprise", 0.09], ["sadness", 0.05]] },
  { q: "Q8", segs: [["happiness", 0.22], ["surprise", 0.08], ["fear", 0.14]] },
  { q: "Q9", segs: [["happiness", 0.24], ["disgust", 0.12], ["surprise", 0.09], ["sadness", 0.03]] },
  { q: "Q10", segs: [] },
  { q: "Q11", segs: [] },
  { q: "Q12", segs: [["happiness", 0.03], ["sadness", 0.03]] },
  { q: "Q13", segs: [["happiness", 0.12], ["surprise", 0.08], ["sadness", 0.08]] },
  { q: "Q14", segs: [] },
  { q: "Q15", segs: [["happiness", 0.04], ["surprise", 0.02], ["sadness", 0.02]] },
  { q: "Q16", segs: [["happiness", 0.28], ["surprise", 0.16], ["sadness", 0.03]] },
  { q: "Q17", segs: [["happiness", 0.14], ["surprise", 0.07], ["fear", 0.1]] },
  { q: "Q18", segs: [["anger", 0.1], ["happiness", 0.22], ["surprise", 0.05], ["sadness", 0.09]] },
  { q: "Q19", segs: [["happiness", 0.18], ["disgust", 0.1], ["surprise", 0.07], ["fear", 0.08]] },
  { q: "Q20", segs: [["happiness", 0.3], ["surprise", 0.06], ["sadness", 0.04]] },
]
const EIREP_LEGEND: Array<keyof typeof EMOTIONS | "neutral"> =
  ["anger", "happiness", "disgust", "surprise", "sadness", "fear", "neutral"]

const CHART_H = 140
const COL_STAG = 45
const COL_GROW = 500

function EIToggle({ on }: { on: boolean }): JSX.Element {
  return (
    <span data-cursor="ei-toggle" style={{ width: 30, height: 17, borderRadius: 9, background: on ? T.brand : T.track, display: "inline-flex", alignItems: "center", padding: 2, boxSizing: "border-box", transition: "background .3s" }}>
      <span style={{ width: 13, height: 13, borderRadius: "50%", background: "#FFF", transform: on ? "translateX(13px)" : "none", transition: "transform .3s cubic-bezier(.22,1,.36,1)" }} />
    </span>
  )
}

function EIRepDeckCard({ title, flash }: { title: string; flash?: boolean }): JSX.Element {
  return (
    <div className={flash ? "ll-enter ll-highlight-fade" : undefined} style={{ flex: 1, border: `1px solid ${T.appBorder}`, borderRadius: 8, padding: 12, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: T.inkSoft }}>
        <span style={{ background: T.fill, borderRadius: 4, padding: "2px 6px" }}>.PPT</span>
        <span style={{ background: T.fill, borderRadius: 4, padding: "2px 6px" }}>Auto-generated</span>
        <span style={{ flex: 1 }} />
        <I name="ellipsis" size={13} />
      </div>
      <div className="ll-500" style={{ fontSize: 13, marginTop: 9, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
      <div style={{ fontSize: 11.5, color: T.inkSoft, marginTop: 3 }}>Based on <span className="ll-500" style={{ color: T.body }}>380</span> completed responses</div>
      <div style={{ marginTop: 10, height: 26, borderRadius: 6, background: T.fill, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>Download</div>
    </div>
  )
}

export function SceneEIHeroReport({ active, onDone, runKey = 0, hold, playFrom, onTime }: SceneProps): JSX.Element {
  ensureCss()
  const cur = useCursor({ x: APP_W / 2, y: 880 })
  const [gt, setGt] = React.useState(0)
  const [emotions, setEmotions] = React.useState(true)
  const [genHover, setGenHover] = React.useState(false)
  const [genBusy, setGenBusy] = React.useState(false)
  const [card3, setCard3] = React.useState(false)

  useScene(active, async (p) => {
    setGt(0); setEmotions(true); setGenHover(false); setGenBusy(false); setCard3(false); cur.hide()
    await p.sleep(600)
    await eiTimeline(p, (EIREP_COLS.length - 1) * COL_STAG + COL_GROW, setGt)
    await p.sleep(500)
    // the traceability beat: emotions off, beat, back on
    cur.show("ei-toggle", 0, 150); await p.sleep(300)
    cur.move("ei-toggle"); await p.sleep(550)
    cur.click(1); await p.sleep(150)
    setEmotions(false)
    await p.sleep(1000)
    cur.click(2); await p.sleep(150)
    setEmotions(true)
    await p.sleep(500)
    // generate a deck
    cur.move("ei-generate"); await p.sleep(600)
    setGenHover(true); await p.sleep(250)
    cur.click(3); await p.sleep(150)
    setGenHover(false); setGenBusy(true)
    await p.sleep(1100)
    setGenBusy(false); setCard3(true)
    await p.sleep(400)
    cur.hide()
    await p.sleep(2400)
  }, onDone, runKey, hold, playFrom, onTime)

  return (
    <AppShell cursor={cur.state} nav={studyNav("Details")}
      title="Gen Z ChatGPT Usage Study" crumb={["Details"]}
      actions={<span className="ll-tbtn">Share <I name="link" size={14} /></span>}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* overview bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 7, height: 38, padding: "0 14px", fontSize: 12.5, borderBottom: `1px solid ${T.appBorder}` }}>
          <I name="list" size={14} style={{ color: T.inkSoft }} />
          <span className="ll-500">Overview</span>
          <I name="chevron-down" size={13} style={{ color: T.inkSoft }} />
          <span style={{ flex: 1 }} />
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: T.inkSoft }}><I name="sliders-horizontal" size={13} /> View &amp; Filter</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: T.inkSoft, marginLeft: 14 }}><I name="layers" size={13} /> Segments</span>
        </div>
        {/* report body */}
        <div style={{ flex: 1, overflow: "hidden", padding: "18px 0" }}>
          <div style={{ width: 704, margin: "0 auto" }}>
            <span style={{ display: "inline-block", fontSize: 10.5, padding: "2px 7px", borderRadius: 5, background: T.positiveSoft, color: T.positive }}>Up to date</span>
            <div className="ll-500" style={{ fontSize: 24, lineHeight: "32px", marginTop: 6 }}>Study Report Details</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, marginTop: 4 }}>
              <span className="ll-500">380 complete</span>
              <span style={{ color: T.inkFaint }}>|</span>
              <span style={{ color: T.inkSoft }}>1 partial</span>
              <span style={{ color: T.inkFaint }}>|</span>
              <span style={{ color: T.inkSoft }}>0 hidden</span>
            </div>

            {/* EI analysis section */}
            <div style={{ display: "flex", alignItems: "center", marginTop: 16 }}>
              <I name="chevron-down" size={13} style={{ color: T.inkSoft, transform: "rotate(180deg)", marginRight: 8 }} />
              <span className="ll-500" style={{ fontSize: 15 }}>Emotional Intelligence Analysis</span>
              <span style={{ flex: 1 }} />
              <span style={{ fontSize: 11.5, color: T.inkSoft, marginRight: 8 }}>Show Emotions on responses</span>
              <EIToggle on={emotions} />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginTop: 12, height: CHART_H }}>
              {EIREP_COLS.map((c, i) => {
                const e = eiEase((gt - i * COL_STAG) / COL_GROW)
                return (
                  <React.Fragment key={c.q}>
                    {i === 7 && (
                      <span style={{ width: 14, alignSelf: "stretch", position: "relative", flexShrink: 0 }}>
                        <span style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%) rotate(-90deg)", fontSize: 9.5, color: T.inkSoft, whiteSpace: "nowrap" }}>4 Concepts ›</span>
                      </span>
                    )}
                    <span style={{ flex: 1, height: CHART_H, background: T.fill, borderRadius: 3, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 1.5, overflow: "hidden" }}>
                      {/* segs are authored bottom-up; render reversed so anger sits at the base */}
                      {[...c.segs].reverse().map(([emo, f], j) => (
                        <span key={j} style={{ height: f * CHART_H * e, borderRadius: 1.5, background: emotions ? EMOTIONS[emo].fg : T.navLine, transition: "background .4s" }} />
                      ))}
                    </span>
                  </React.Fragment>
                )
              })}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 5, fontSize: 10, color: T.inkSoft }}>
              {EIREP_COLS.map((c, i) => (
                <React.Fragment key={c.q}>
                  {i === 7 && <span style={{ width: 14, flexShrink: 0 }} />}
                  <span style={{ flex: 1, textAlign: "center" }}>{c.q}</span>
                </React.Fragment>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10, fontSize: 11, color: T.inkSoft }}>
              {EIREP_LEGEND.map((emo) => (
                <span key={emo} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2.5, background: emo === "neutral" ? T.navLine : EMOTIONS[emo].fg }} />
                  {emo[0].toUpperCase() + emo.slice(1)}
                </span>
              ))}
              <span style={{ flex: 1 }} />
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>Emotion logic <I name="info" size={12} /></span>
            </div>

            <div style={{ borderTop: `1px solid ${T.appBorder}`, marginTop: 16 }} />

            {/* presentations */}
            <div style={{ display: "flex", alignItems: "center", marginTop: 14 }}>
              <div style={{ flex: 1 }}>
                <div className="ll-500" style={{ fontSize: 15 }}>Presentations</div>
                <div style={{ fontSize: 11.5, color: T.inkSoft, marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                  <I name="chevron-down" size={12} style={{ transform: "rotate(180deg)" }} />
                  Create and download AI-generated slide decks based on your research data
                </div>
              </div>
              <button data-cursor="ei-generate" className="ll-btn ghost" style={{ height: 28, fontSize: 12, borderColor: genHover ? T.inkFaint : undefined }}>
                {genBusy ? <span className="ll-shimmer">Generating…</span> : <>Generate <I name="sparkles" size={13} /></>}
              </button>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
              <EIRepDeckCard title="Gen.Z Perception of ChatGPT" />
              <EIRepDeckCard title="Gen Z AI Usage Study [Case Study]" />
              {card3
                ? <EIRepDeckCard title="All Charts" flash />
                : <span style={{ flex: 1, border: `1px dashed ${T.appBorder}`, borderRadius: 8, minHeight: 96, opacity: genBusy ? 1 : 0.5, display: "flex", alignItems: "center", justifyContent: "center" }}>{genBusy && <DotSpinner />}</span>}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

// ----------------------------------------------- EI use-case cards --------
// The four "Use cases" cards at the bottom of /features/emotional-intelligence,
// rebuilt as live fragments. Same language and concepts as the site; content
// re-grounded in the Gen Z ChatGPT study. Media is stylized DOM (no photos).

export const EI_USECASE_W = 340
export const EI_USECASE_H = 300

/** moderator question bubble that types in */
function UCBubble({ text, full, oneLine }: { text: string; full: string; oneLine?: boolean }): JSX.Element {
  return (
    <div style={{ display: "inline-block", maxWidth: oneLine ? "none" : 250, whiteSpace: oneLine ? "nowrap" : undefined, background: "#FFF", border: `1px solid ${T.appBorder}`, borderRadius: 14, borderBottomLeftRadius: 4, padding: "9px 13px", fontSize: 12.5, lineHeight: 1.5, minHeight: oneLine ? 0 : 56, boxSizing: "border-box" }}>
      {text}{text.length > 0 && text.length < full.length && <Caret />}
    </div>
  )
}

/** stylized ad-concept tile (flat color + campaign headline) */
function UCAdTile({ bg, headline, caption, w, h }: { bg: string; headline: string; caption: string; w: number | string; h: number }): JSX.Element {
  return (
    <div style={{ width: w, height: h, borderRadius: 10, background: bg, color: "#FAF7F0", padding: 14, display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
      <div className="ll-500" style={{ fontSize: 16, lineHeight: 1.3, flex: 1 }}>{headline}</div>
      <div style={{ fontSize: 10.5, opacity: 0.8 }}>{caption}</div>
    </div>
  )
}

/** floating emotion annotation — white backing so the tag reads over any media */
function UCChip({ emotion }: { emotion: keyof typeof EMOTIONS }): JSX.Element {
  return (
    <span className="ll-enter" style={{ display: "inline-flex", background: "#FFF", border: `1px solid ${T.appBorder}`, borderRadius: 16, padding: 3 }}>
      <EmotionTag emotion={emotion} />
    </span>
  )
}

/** small labeled emotion bar (the "Surprise ▬▬" mini card motif) */
function UCBar({ label, emotion, f, e }: { label: string; emotion: keyof typeof EMOTIONS; f: number; e: number }): JSX.Element {
  return (
    <div style={{ background: "#FFF", border: `1px solid ${T.appBorder}`, borderRadius: 8, padding: "7px 10px" }}>
      <div style={{ fontSize: 10.5, color: T.inkSoft }}>{label}</div>
      <div style={{ marginTop: 5, height: 6, borderRadius: 3, background: "#F1F1F1", overflow: "hidden" }}>
        <div style={{ width: `${f * 100 * e}%`, height: "100%", borderRadius: 3, background: EMOTIONS[emotion].fg }} />
      </div>
    </div>
  )
}

const UC_AD_Q = "What comes to mind when you see this ad?"
// the creative under test: the "It's fine." Listen Labs ad (tested in the UK
// LED Truck Ad Copy Test). Relative to the site root; in Framer, upload
// media/ad-its-fine.jpg as an asset and paste its URL here.
const UC_AD_IMG = "media/ad-its-fine.jpg"
// verbatim, UK LED Truck Ad Copy Test, participant 463, on this line
// (https://listenlabs.ai/response/d75d9924-bef2-4997-97a5-03e53cf2f83f?message=20)
const UC_AD_WHO = "Participant 463"
const UC_AD_QUOTE = "I think people say it's fine when they don't mean it. So yeah, this is a little bit more true and real, if you wanna call it that."
const UC_AD_MOMENT = "true and real"             // the phrase the emotion lands on
const UC_AD_MOMENT_AT = UC_AD_QUOTE.indexOf(UC_AD_MOMENT)

/** Use case 1 — Creative/Ad Testing: a participant reviews the ad, their
 *  spoken feedback transcribes in, and the emotion is tracked to the exact
 *  phrase it rose on. */
export function FragmentEIUseCaseAdTesting({ active, onDone, runKey = 0, hold, playFrom, onTime }: SceneProps): JSX.Element {
  ensureCss()
  const [q, setQ] = React.useState("")
  const [ad, setAd] = React.useState(false)
  const [said, setSaid] = React.useState("")
  const [tag, setTag] = React.useState(false)
  useScene(active, async (p) => {
    setQ(""); setAd(false); setSaid(""); setTag(false)
    await p.sleep(400)
    setAd(true)
    await p.sleep(500)
    await p.type(setQ, UC_AD_Q, AI_CPS)
    await p.sleep(600)
    // the answer, transcribed as it's spoken; the emotion lands on the moment
    await p.type((t) => {
      setSaid(t)
      if (t.length >= UC_AD_MOMENT_AT + UC_AD_MOMENT.length) setTag(true)
    }, UC_AD_QUOTE, 60)
    await p.sleep(2200)
  }, onDone, runKey, hold, playFrom, onTime)

  const lit = tag && said.length >= UC_AD_MOMENT_AT + UC_AD_MOMENT.length
  // hairline pill shared by the timestamp and the emotion chip
  const pill: React.CSSProperties = { display: "inline-flex", alignItems: "center", background: "#FFF", border: `1px solid ${T.appBorder}`, borderRadius: 16 }
  return (
    <div style={{ width: EI_USECASE_W, height: EI_USECASE_H, position: "relative", fontFamily: T.font }}>
      {/* the creative, with the moderator's question overlapping its corner */}
      {ad && (
        <img className="ll-enter" src={UC_AD_IMG} alt="" draggable={false}
          style={{ position: "absolute", left: 60, top: 42, width: 264, height: 165, objectFit: "cover", borderRadius: 10, border: `1px solid ${T.appBorder}`, boxSizing: "border-box" }} />
      )}
      <div style={{ position: "absolute", left: 12, top: 12, zIndex: 1 }}>
        {/* one line, so it only clips the image's top edge, never the headline */}
        {q && <UCBubble text={q} full={UC_AD_Q} oneLine />}
      </div>
      {said && (
        <div className="ll-enter" style={{ position: "absolute", left: 16, right: 16, top: 214, background: "#FFF", border: `1px solid ${T.appBorder}`, borderRadius: 12, padding: "9px 12px", fontSize: 11.5, lineHeight: 1.5, color: T.body }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: T.inkSoft, marginBottom: 3 }}>
            <span className="ll-avatar" style={{ width: 16, height: 16, fontSize: 8 }}>P</span>
            {UC_AD_WHO}
          </div>
          {lit ? (
            <>
              {said.slice(0, UC_AD_MOMENT_AT)}
              <span style={{ background: EMOTIONS.happiness.bg, borderRadius: 3, padding: "0 1px" }}>{UC_AD_MOMENT}</span>
              {said.slice(UC_AD_MOMENT_AT + UC_AD_MOMENT.length)}
            </>
          ) : said}
          {said.length < UC_AD_QUOTE.length && <Caret />}
        </div>
      )}
      {/* the tracked emotion and when it happened, riding the card's top edge */}
      <div style={{ position: "absolute", right: 10, top: 200, display: "flex", alignItems: "center", gap: 6, minHeight: 28, zIndex: 1 }}>
        {tag && (
          <>
            <span className="ll-enter" style={{ ...pill, height: 30, padding: "0 10px", fontSize: 10.5, color: T.inkSoft, fontVariantNumeric: "tabular-nums" }}>0:14</span>
            <UCChip emotion="happiness" />
          </>
        )}
      </div>
    </div>
  )
}

const UC_CMP_Q = "Which of these ads was a bigger surprise for you?"

/** Use case 2 — Concept Comparison */
export function FragmentEIUseCaseConcepts({ active, onDone, runKey = 0, hold, playFrom, onTime }: SceneProps): JSX.Element {
  ensureCss()
  const [q, setQ] = React.useState("")
  const [tiles, setTiles] = React.useState(false)
  const [gt, setGt] = React.useState(0)
  useScene(active, async (p) => {
    setQ(""); setTiles(false); setGt(0)
    await p.sleep(500)
    await p.type(setQ, UC_CMP_Q, AI_CPS)
    await p.sleep(300)
    setTiles(true)
    await p.sleep(500)
    await eiTimeline(p, 900, setGt)
    await p.sleep(2600)
  }, onDone, runKey, hold, playFrom, onTime)
  return (
    <div style={{ width: EI_USECASE_W, height: EI_USECASE_H, position: "relative", fontFamily: T.font, paddingTop: 16, boxSizing: "border-box" }}>
      <UCBubble text={q} full={UC_CMP_Q} />
      {tiles && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 92, display: "flex", gap: 12 }}>
          {[
            { bg: T.brand, headline: "Your 2am study buddy.", caption: "Study Buddy", f: 0.38 },
            { bg: T.ink, headline: "Answers at 2:47am.", caption: "Late-Night Answers", f: 0.76 },
          ].map((t, i) => (
            // columns land staggered; each bar grows on its own offset ease
            <div key={t.caption} className="ll-enter" style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, animationDelay: `${i * 130}ms` }}>
              <UCAdTile bg={t.bg} headline={t.headline} caption={t.caption} w="100%" h={128} />
              <UCBar label="Surprise" emotion="surprise" f={t.f} e={eiEase((gt - i * 200) / 900)} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/** Use case 3 — Brand Research */
export function FragmentEIUseCaseBrand({ active, onDone, runKey = 0, hold, playFrom, onTime }: SceneProps): JSX.Element {
  ensureCss()
  const [panel, setPanel] = React.useState(false)
  const [gt, setGt] = React.useState(0)
  useScene(active, async (p) => {
    setPanel(false); setGt(0)
    await p.sleep(700)
    setPanel(true)
    await p.sleep(300)
    await eiTimeline(p, 1200, setGt)
    await p.sleep(2800)
  }, onDone, runKey, hold, playFrom, onTime)
  const rows: Array<{ label: string; emotion: keyof typeof EMOTIONS; f: number }> = [
    { label: "Happiness", emotion: "happiness", f: 0.72 },
    { label: "Surprise", emotion: "surprise", f: 0.44 },
    { label: "Fear", emotion: "fear", f: 0.16 },
  ]
  return (
    <div style={{ width: EI_USECASE_W, height: EI_USECASE_H, position: "relative", fontFamily: T.font }}>
      {/* the brand stimulus, as a stylized product tile — panel overlaps its
          corner only, never the label */}
      <div style={{ position: "absolute", left: 24, top: 30, width: 220, height: 220, borderRadius: 12, background: "#F5F5F5", border: `1px solid ${T.appBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
        <span style={{ width: 64, height: 64, borderRadius: 16, background: T.brand, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <I name="sparkles" size={30} />
        </span>
        <span className="ll-500" style={{ fontSize: 13 }}>Assistant A</span>
      </div>
      {panel && (
        <div className="ll-enter" style={{ position: "absolute", right: 2, top: 156, width: 148, background: "#FFF", border: `1px solid ${T.appBorder}`, borderRadius: 10, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 9 }}>
          {rows.map((r, i) => {
            const e = eiEase((gt - i * 140) / 800)
            return (
              <div key={r.label}>
                <div style={{ fontSize: 10.5, color: T.inkSoft }}>{r.label}</div>
                <div style={{ marginTop: 4, height: 6, borderRadius: 3, background: "#F1F1F1", overflow: "hidden" }}>
                  <div style={{ width: `${r.f * 100 * e}%`, height: "100%", borderRadius: 3, background: EMOTIONS[r.emotion].fg }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** Use case 4 — UX Research (task-based, on mobile). Framed like the live
 *  card: a flat iPhone screen capture ~75% of the card wide, bleeding off the
 *  bottom. The participant's task, from the Gen Z
 *  ChatGPT study: ask an AI assistant to plan a first-apartment budget. */
const UX_PROMPT = "Help me plan a budget for my first apartment"
const UX_ANSWER = "Here's a starting point for $2,400 a month after tax:"
// the screen crops after the third row, so the plan stops there
const UX_ROWS: Array<[string, number]> = [["Rent", 1150], ["Groceries", 320], ["Utilities", 140]]
const UX_SCREEN_W = 256

export function FragmentEIUseCaseUX({ active, onDone, runKey = 0, hold, playFrom, onTime }: SceneProps): JSX.Element {
  ensureCss()
  const [sent, setSent] = React.useState(false)
  const [thinking, setThinking] = React.useState(false)
  const [answer, setAnswer] = React.useState("")
  const [rows, setRows] = React.useState(0)
  const [tag, setTag] = React.useState(false)
  useScene(active, async (p) => {
    setSent(false); setThinking(false); setAnswer(""); setRows(0); setTag(false)
    await p.sleep(700)
    setSent(true)
    await p.sleep(450)
    setThinking(true)
    await p.sleep(900)
    setThinking(false)
    await p.type(setAnswer, UX_ANSWER, AI_CPS)
    for (let i = 1; i <= UX_ROWS.length; i++) { await p.sleep(180); setRows(i) }
    await p.sleep(450)
    setTag(true)
    await p.sleep(2400)
  }, onDone, runKey, hold, playFrom, onTime)

  const left = (EI_USECASE_W - UX_SCREEN_W) / 2
  const max = Math.max(...UX_ROWS.map((r) => r[1]))
  return (
    <div style={{ width: EI_USECASE_W, height: EI_USECASE_H, position: "relative", overflow: "hidden", fontFamily: T.font }}>
      <IPhoneScreen width={UX_SCREEN_W} time="2:47" radius={24} style={{ position: "absolute", left, top: 42 }}>
        {/* app content, in iOS points */}
        <div style={{ height: 44, display: "flex", alignItems: "center", padding: "0 16px", fontSize: 17 }}>
          <I name="chevron-left" size={24} stroke={2.2} />
          <span style={{ flex: 1, textAlign: "center", fontWeight: 600, letterSpacing: -0.4 }}>New chat</span>
          <I name="square-pen" size={21} stroke={2} />
        </div>
        <div style={{ padding: "12px 18px 0", display: "flex", flexDirection: "column", gap: 14, fontSize: 17, lineHeight: "23px", letterSpacing: -0.3 }}>
          {!sent && (
            <div style={{ marginTop: 90, textAlign: "center", fontSize: 24, fontWeight: 600, letterSpacing: -0.5 }}>What can I help with?</div>
          )}
          {sent && (
            <div className="ll-enter" style={{ alignSelf: "flex-end", maxWidth: 270, background: "#F0F0F0", borderRadius: 20, padding: "10px 16px" }}>{UX_PROMPT}</div>
          )}
          {thinking && <span className="ll-shimmer" style={{ fontSize: 16 }}>Thinking…</span>}
          {answer && <div>{answer}{answer.length < UX_ANSWER.length && <Caret />}</div>}
          {rows > 0 && (
            <div style={{ border: "1px solid #E5E5E5", borderRadius: 16, padding: "6px 16px" }}>
              {UX_ROWS.slice(0, rows).map(([label, n], i) => (
                <div key={label} className="ll-enter" style={{ padding: "10px 0", borderTop: i ? "1px solid #F0F0F0" : "none" }}>
                  <div style={{ display: "flex", fontSize: 16 }}>
                    <span>{label}</span>
                    <span style={{ marginLeft: "auto", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>${n.toLocaleString("en-US")}</span>
                  </div>
                  <div style={{ marginTop: 7, height: 6, borderRadius: 3, background: "#F0F0F0" }}>
                    <div className="ll-grow" style={{ width: `${(n / max) * 100}%`, height: "100%", borderRadius: 3, background: "#000" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </IPhoneScreen>
      {/* the moment Listen reads: delight as the plan appears — pinned in the
          open space above the screen so it never covers the task */}
      <div style={{ position: "absolute", left: 14, top: 10, minHeight: 28, zIndex: 1 }}>
        {tag && <UCChip emotion="happiness" />}
      </div>
    </div>
  )
}

// ------------------------------------------- Use case · Brand tracking -----
// Homepage refresh, Use Cases 02 "Brand Tracking & Health". The live
// "ChatGPT Monthly Brand Tracker" report (listenlabs.ai/p/hELJfWdR, analysis →
// report), at the September section: the default-use scalar, the wave
// summary, and the monthly frequent-use chart. Values are the report's own,
// read off the live chart (n≈50 a month, so every point is a 2% step) and
// matching the figures quoted in its text.
export const BT_MONTHS = ["Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026", "May 2026", "Jun 2026", "Jul 2026", "Aug 2026", "Sep 2026"]
const BT_SERIES: Array<{ name: string; color: string; v: number[] }> = [
  { name: "ChatGPT", color: "#2272B4", v: [98, 90, 86, 90, 88, 88, 88, 82, 90] },
  { name: "Claude", color: "#E3A01C", v: [10, 18, 14, 22, 34, 30, 34, 28, 24] },
  { name: "Gemini", color: "#14A07A", v: [56, 46, 48, 52, 48, 64, 62, 60, 61] },
  { name: "Microsoft Copilot", color: "#CF7FB0", v: [24, 40, 18, 28, 28, 32, 28, 22, 20] },
  { name: "Grok", color: "#5DB4E4", v: [12, 12, 14, 18, 20, 20, 14, 20, 12] },
]
const BT_REPORTS = [
  { title: "Early Signals Predictor", meta: "Jul 28 · Listen Labs" },
  { title: "Listen Labs Report", meta: "Sep 30 · Listen Labs" },
  { title: "Gemini Brand Tracker", meta: "Sep 25 · Listen Labs" },
  { title: "Early Signals from Users", meta: "Jul 28 · Listen Labs" },
]
// chart geometry (design px)
const BT_W = 720, BT_H = 330, BT_L = 44, BT_R = 12, BT_T = 10, BT_B = 34
const btX = (i: number) => BT_L + (i * (BT_W - BT_L - BT_R)) / (BT_MONTHS.length - 1)
const btY = (v: number) => BT_T + (1 - v / 100) * (BT_H - BT_T - BT_B)

/** a value in the summary that the chart hover points back to */
function BTStat(props: { on: boolean; children: React.ReactNode }): JSX.Element {
  return (
    <span style={{
      textDecoration: "underline", textUnderlineOffset: 4, textDecorationColor: props.on ? T.brand : T.inkFaint,
      background: props.on ? T.brandSoft : "transparent", borderRadius: 3, padding: "0 2px", margin: "0 -2px",
      transition: "background .3s, text-decoration-color .3s",
    }}>{props.children}</span>
  )
}

/** the report's section outline on the right edge; `at` is the current section */
function BTOutline({ at }: { at: number }): JSX.Element {
  return (
    <div style={{ position: "absolute", right: 12, top: 300, display: "flex", flexDirection: "column", gap: 9 }}>
      {Array.from({ length: 12 }, (_, i) => (
        <span key={i} style={{ width: i === at ? 14 : 10, height: 1.5, background: i === at ? T.ink : T.navLine, alignSelf: "flex-end" }} />
      ))}
    </div>
  )
}

export function SceneUCBrandTracking({ active, onDone, runKey = 0, hold, playFrom, onTime }: SceneProps): JSX.Element {
  ensureCss()
  const cur = useCursor(APP_CURSOR_START)
  const [donut, setDonut] = React.useState(false)
  const [summary, setSummary] = React.useState(false)
  const [chart, setChart] = React.useState(false)
  const [drawn, setDrawn] = React.useState(false)
  const [hover, setHover] = React.useState(-1)

  useScene(active, async (p) => {
    setDonut(false); setSummary(false); setChart(false); setDrawn(false); setHover(-1); cur.hide()
    await p.sleep(300)
    setDonut(true)
    await p.sleep(600)
    setSummary(true)
    await p.sleep(600)
    setChart(true)
    await p.sleep(200)
    setDrawn(true)
    await p.sleep(1900)
    // read the latest wave, then the August low the summary calls out, then June
    cur.show("bt-m8", 60, 120); await p.sleep(250)
    cur.move("bt-m8"); await p.sleep(700)
    setHover(8); await p.sleep(1700)
    cur.move("bt-m7"); await p.sleep(450)
    setHover(7); await p.sleep(1700)
    cur.move("bt-m5"); await p.sleep(600)
    setHover(5); await p.sleep(1700)
    cur.move("bt-m5", 80, 170); await p.sleep(350)
    setHover(-1); cur.hide()
    await p.sleep(1600)
  }, onDone, runKey, hold, playFrom, onTime)

  const tip = hover >= 0 ? [...BT_SERIES].sort((a, b) => b.v[hover] - a.v[hover]) : []
  const tipLeft = hover >= 6

  return (
    <AppShell cursor={cur.state} nav={studyNav("Report", BT_REPORTS)} activeSub="Listen Labs Report"
      title="ChatGPT Monthly Brand Tracker" crumb={["Report", "Listen Labs Report"]} actions={REPORT_ACTIONS}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, position: "relative" }}>
        <div style={{ display: "flex", gap: 14, padding: "12px 16px 0", color: T.inkSoft, justifyContent: "flex-end" }}>
          <I name="download" size={14} /><I name="ellipsis" size={14} />
        </div>
        <BTOutline at={5} />
        <div className="ll-doc-fade" style={{ flex: 1, position: "relative" }}>
          <div style={{ width: BT_W, margin: "0 auto", padding: "24px 0 0" }}>
            {/* scalar */}
            <div className="ll-card" style={{ display: "flex", alignItems: "center", gap: 22, padding: "18px 20px", borderRadius: 14, margin: "0 -24px" }}>
              <Donut pct={donut ? 89 : 0} size={84} stroke={9} label="89%" />
              <div>
                <div style={{ fontSize: 17, lineHeight: "24px", color: T.ink }}>ChatGPT holds the default</div>
                <div style={{ fontSize: 14, lineHeight: "20px", color: T.inkSoft, marginTop: 8 }}>89% use ChatGPT multiple times per month.</div>
              </div>
            </div>
            {/* wave summary */}
            <div className={summary ? "ll-enter" : undefined} style={{ opacity: summary ? 1 : 0, marginTop: 40, fontSize: 16, lineHeight: "28px", color: T.ink }}>
              The latest wave brought a meaningful recovery in ChatGPT activity: frequent use rose from the tracker
              low of <BTStat on={hover === 7}>82%</BTStat> in August to <BTStat on={hover === 8}>90%</BTStat> in
              September. In the latest wave, Gemini stood at <BTStat on={hover === 8}>61%</BTStat> and Claude
              at <BTStat on={hover === 8}>24%</BTStat>. The rebound confirms ChatGPT's reach advantage, but it should not
              be mistaken for a return to exclusive reliance.
            </div>
            {/* monthly frequent use */}
            <div className={chart ? "ll-enter" : undefined} style={{ opacity: chart ? 1 : 0, marginTop: 44 }}>
              <div style={{ fontSize: 15, lineHeight: "22px", color: T.ink }}>ChatGPT's habitual-use lead faces a moving field</div>
              <div style={{ fontSize: 13, lineHeight: "19px", color: T.inkSoft, marginTop: 6 }}>
                Share of respondents in each month who said they use each leading AI tool multiple times per month. The primary
                axis is Question 5 AI tool selection and the monthly Always On Cohort defines each comparison group.
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 14, fontSize: 12, color: T.inkSoft }}>
                {BT_SERIES.map((s) => (
                  <span key={s.name} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 9, height: 9, borderRadius: "50%", background: s.color }} />{s.name}
                  </span>
                ))}
              </div>
              <div style={{ position: "relative", marginTop: 12, width: BT_W, height: BT_H }}>
                <svg width={BT_W} height={BT_H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
                  {[0, 25, 50, 75, 100].map((v) => (
                    <g key={v}>
                      <line x1={BT_L} x2={BT_W - BT_R} y1={btY(v)} y2={btY(v)} style={{ stroke: T.appBorder }} />
                      <text x={BT_L - 10} y={btY(v)} textAnchor="end" dominantBaseline="central" fontSize={11.5} style={{ fill: T.inkSoft }}>{v}%</text>
                    </g>
                  ))}
                  {BT_MONTHS.map((m, i) => (
                    <text key={m} x={btX(i)} y={BT_H - 8} textAnchor={i === 0 ? "start" : i === BT_MONTHS.length - 1 ? "end" : "middle"}
                      fontSize={11.5} style={{ fill: T.inkSoft }}>{m}</text>
                  ))}
                  {hover >= 0 && (
                    <line x1={btX(hover)} x2={btX(hover)} y1={BT_T} y2={BT_H - BT_B} strokeDasharray="3 3" style={{ stroke: T.inkFaint }} />
                  )}
                  {BT_SERIES.map((s, si) => (
                    <g key={s.name}>
                      <polyline fill="none" strokeWidth={2} strokeLinejoin="round" pathLength={1}
                        points={s.v.map((v, i) => `${btX(i)},${btY(v)}`).join(" ")}
                        strokeDasharray={1} strokeDashoffset={drawn ? 0 : 1}
                        style={{ stroke: s.color, transition: `stroke-dashoffset 1.5s cubic-bezier(.45,0,.2,1) ${si * 0.12}s` }} />
                      {s.v.map((v, i) => (
                        <circle key={i} cx={btX(i)} cy={btY(v)} r={hover === i ? 4.5 : 3.2} strokeWidth={1.6}
                          style={{
                            fill: hover === i ? s.color : T.appBg, stroke: s.color,
                            opacity: drawn ? 1 : 0, transition: `opacity .3s ${0.25 + si * 0.12 + (i / 8) * 1.3}s, r .2s`,
                          }} />
                      ))}
                    </g>
                  ))}
                </svg>
                {/* cursor targets, one per month */}
                {BT_MONTHS.map((m, i) => (
                  <span key={m} data-cursor={"bt-m" + i} style={{ position: "absolute", left: btX(i) - 6, top: btY(70), width: 12, height: 12 }} />
                ))}
                {hover >= 0 && (
                  <div key={hover} className="ll-card ll-enter" style={{
                    position: "absolute", top: BT_T + 4, width: 176, padding: "10px 12px", boxShadow: "0 4px 16px rgba(0,0,0,.08)",
                    left: tipLeft ? btX(hover) - 176 - 14 : btX(hover) + 14,
                  }}>
                    <div className="ll-500" style={{ fontSize: 12, marginBottom: 6 }}>{BT_MONTHS[hover]}</div>
                    {tip.map((s) => (
                      <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, lineHeight: "20px" }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
                        <span style={{ color: T.body, flex: 1 }}>{s.name}</span>
                        <span className="ll-500" style={{ fontVariantNumeric: "tabular-nums" }}>{s.v[hover]}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 11.5, lineHeight: "17px", color: T.inkSoft, marginTop: 4 }}>
                Base size: N=449; Multi-select question, so monthly percentages do not sum to 100%. Tracks frequent use rather
                than trial in the past three months.
              </div>
              {/* the section this anchor opens; the page carries on below */}
              <div style={{ fontSize: 22, lineHeight: "30px", color: T.ink, marginTop: 56 }}>
                September held satisfaction but reliability pressure increased
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

// -------------------------------- Use case · Consumer attitudes & behaviors -
// Homepage refresh, Use Cases 01. The same ChatGPT Monthly Brand Tracker
// report, at "September held satisfaction, but reliability pressure
// increased": the section summary and the satisfaction-by-tool chart.
// Segment shares are the live chart's; each tool's very + somewhat equals
// the T2B the report prints, and the very-satisfied shares match the study
// data (Claude 66%, ChatGPT 53%, Gemini 51%).
const CA_LEVELS: Array<{ name: string; color: string }> = [
  { name: "Very satisfied", color: "#0021CC" },
  { name: "Somewhat satisfied", color: "#7D8EE6" },
  { name: "Neither satisfied nor dissatisfied", color: "#C3CBF3" },
  { name: "Somewhat dissatisfied", color: "#E88AA5" },
  { name: "Very dissatisfied", color: "#EE5A79" },
]
const CA_TOOLS: Array<{ name: string; v: number[] }> = [
  { name: "Claude", v: [66, 29, 3, 2, 0] },
  { name: "ChatGPT", v: [53, 36, 7, 3, 1] },
  { name: "Gemini", v: [51, 38, 9, 2, 0] },
  { name: "Perplexity", v: [36, 47, 17, 0, 0] },
  { name: "Grok", v: [44, 39, 10, 7, 0] },
  { name: "Microsoft Copilot", v: [34, 49, 10, 5, 2] },
  { name: "Meta AI", v: [23, 50, 20, 5, 2] },
]
const CA_ROW = 58

export function SceneUCConsumerAttitudes({ active, onDone, runKey = 0, hold, playFrom, onTime }: SceneProps): JSX.Element {
  ensureCss()
  const cur = useCursor(APP_CURSOR_START)
  const [grown, setGrown] = React.useState(false)
  const [hover, setHover] = React.useState(-1)
  const [scrolled, setScrolled] = React.useState(false)

  useScene(active, async (p) => {
    setGrown(false); setHover(-1); setScrolled(false); cur.hide()
    await p.sleep(500)
    setGrown(true)
    await p.sleep(2000)
    // read the leader, then the two the summary pairs up
    cur.show("ca-r0", 120, 140); await p.sleep(250)
    cur.move("ca-r0"); await p.sleep(700)
    setHover(0); await p.sleep(1700)
    cur.move("ca-r1"); await p.sleep(500)
    setHover(1); await p.sleep(1700)
    cur.move("ca-r2"); await p.sleep(500)
    setHover(2); await p.sleep(1700)
    cur.move("ca-r2", 60, 150); await p.sleep(350)
    setHover(-1); cur.hide()
    await p.sleep(1600)
  }, onDone, runKey, hold, playFrom, onTime)

  return (
    <AppShell cursor={cur.state} nav={studyNav("Report", BT_REPORTS)} activeSub="Listen Labs Report"
      title="ChatGPT Monthly Brand Tracker" crumb={["Report", "Listen Labs Report"]} actions={REPORT_ACTIONS}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, position: "relative" }}>
        <div style={{ display: "flex", gap: 14, padding: "12px 16px 0", color: T.inkSoft, justifyContent: "flex-end" }}>
          <I name="download" size={14} /><I name="ellipsis" size={14} />
        </div>
        <BTOutline at={6} />
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <div style={{ width: BT_W, margin: "0 auto", padding: "30px 0 0" }}>
            <div style={{ fontSize: 24, lineHeight: "32px", color: T.ink, letterSpacing: -0.3 }}>
              September held satisfaction, but reliability pressure increased
            </div>
            <div style={{ marginTop: 22, fontSize: 16, lineHeight: "28px", color: T.ink }}>
              ChatGPT users remain highly satisfied, but the competitive benchmark is already higher in select
              workflows. <BTStat on={hover === 1}>89%</BTStat> are satisfied with ChatGPT, almost identical to Gemini
              at <BTStat on={hover === 2}>89%</BTStat>. Claude reaches <BTStat on={hover === 0}>95%</BTStat> among its
              smaller, self-selected user base. Claude's result should not be generalized to the whole market, but it
              confirms that a specialist can create stronger advocacy inside a narrower role.
            </div>

            <div style={{ marginTop: 48, fontSize: 15, lineHeight: "22px", color: T.ink }}>Claude leads satisfaction among its users</div>
            <div style={{ fontSize: 13, lineHeight: "19px", color: T.inkSoft, marginTop: 6 }}>
              Responses to Question 9, How satisfied are you overall with each AI tool? Each pie reflects only respondents
              who said they frequently use that tool.
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginTop: 14, fontSize: 12, color: T.inkSoft }}>
              {CA_LEVELS.map((l) => (
                <span key={l.name} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />{l.name}
                </span>
              ))}
            </div>
            <div style={{ position: "relative", marginTop: 14 }}>
              {CA_TOOLS.map((t, r) => {
                const segs = t.v.map((v, i) => ({ v, i })).filter((s) => s.v > 0)
                return (
                  <div key={t.name} style={{
                    height: CA_ROW, paddingTop: 8, opacity: hover >= 0 && hover !== r ? 0.4 : 1, transition: "opacity .25s",
                  }}>
                    <div style={{ display: "flex", fontSize: 14, lineHeight: "20px", color: T.body }}>
                      <span style={{ flex: 1 }}>{t.name}</span>
                      <span style={{ fontSize: 12.5, color: T.inkSoft, letterSpacing: 0.4, fontVariantNumeric: "tabular-nums" }}>
                        {t.v[0] + t.v[1]} % (T2B)
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 4, marginTop: 6, height: 13, position: "relative" }}>
                      {segs.map((s, k) => (
                        <span key={s.i} style={{
                          flex: `${s.v} 1 0`, minWidth: 0, background: CA_LEVELS[s.i].color, borderRadius: 2,
                          transform: grown ? "none" : "scaleX(0)", transformOrigin: "left center",
                          transition: `transform .7s cubic-bezier(.22,1,.36,1) ${r * 0.09 + k * 0.06}s`,
                        }} />
                      ))}
                      {/* cursor target: inside the very-satisfied run */}
                      <span data-cursor={"ca-r" + r} style={{ position: "absolute", left: `${t.v[0] * 0.6}%`, top: 0, width: 10, height: 13 }} />
                    </div>
                  </div>
                )
              })}
              {hover >= 0 && (
                <div key={hover} className="ll-card ll-enter" style={{
                  position: "absolute", left: `${CA_TOOLS[hover].v[0] * 0.6 + 4}%`, top: hover * CA_ROW + 48, width: 250,
                  padding: "10px 12px", boxShadow: "0 4px 16px rgba(0,0,0,.08)", zIndex: 2,
                }}>
                  <div className="ll-500" style={{ fontSize: 12, marginBottom: 6 }}>{CA_TOOLS[hover].name}</div>
                  {CA_LEVELS.map((l, i) => (
                    <div key={l.name} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, lineHeight: "20px" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
                      <span style={{ color: T.body, flex: 1 }}>{l.name}</span>
                      <span className="ll-500" style={{ fontVariantNumeric: "tabular-nums" }}>{CA_TOOLS[hover].v[i]}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ fontSize: 11.5, color: T.inkSoft, marginTop: 4 }}>Base size: N=36-398</div>
            {/* the next paragraph, fading out as the page carries on */}
            <div style={{
              marginTop: 56, fontSize: 16, lineHeight: "28px", color: T.ink,
              WebkitMaskImage: "linear-gradient(#000, transparent 70%)", maskImage: "linear-gradient(#000, transparent 70%)",
            }}>
              ChatGPT earns praise for the same attribute that creates its greatest risk. <BTStat on={false}>49%</BTStat> of its
              frequent users
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

// ------------------------------ Use case · Product & feature prioritization -
// Homepage refresh, Use Cases 03. "Seltzer Water Flavor Preferences"
// (listenlabs.ai/p/kY1Nj2Jf), Details → Q12, the MaxDiff flavor ranking:
// index vs. average (100), 300 respondents. Values are the live chart's and
// match the study's analysis (Strawberry 148, Black Cherry 132, Mango 126,
// Watermelon 110, Cucumber 46.7). All 20 flavors. The live page's right-hand segments rail is a legacy
// layout and is left out.
const FP_FLAVORS: Array<[string, number]> = [
  ["Strawberry", 148], ["Raspberry", 142], ["Black Cherry", 132], ["Orange / Mandarin", 131],
  ["Mango", 126], ["Blackberry", 125], ["Peach", 123], ["Pomegranate", 112], ["Watermelon", 110],
  ["Passionfruit", 109], ["Lime", 107], ["Lemon", 103], ["Pineapple", 101], ["Cranberry", 78], ["Grapefruit", 69],
  ["Grape", 68], ["Coconut", 64], ["Apple", 56], ["Cola", 49], ["Cucumber", 47],
]
const FP_HALF = 53 // index points from the 100 line to either end of the track
const FP_ROW = 41
const FP_TRACK = 487
const FP_RED = "#A93224"
// px the page scrolls to bring last place into the 768 window
const FP_SCROLL = 300

export function SceneUCFeaturePriority({ active, onDone, runKey = 0, hold, playFrom, onTime }: SceneProps): JSX.Element {
  ensureCss()
  const cur = useCursor(APP_CURSOR_START)
  const [grown, setGrown] = React.useState(false)
  const [hover, setHover] = React.useState(-1)
  const [scrolled, setScrolled] = React.useState(false)

  useScene(active, async (p) => {
    setGrown(false); setHover(-1); setScrolled(false); cur.hide()
    await p.sleep(500)
    setGrown(true)
    await p.sleep(2100)
    // the leader, the pack anchor the study recommends, and the last place
    cur.show("fp-r0", 140, 120); await p.sleep(250)
    cur.move("fp-r0"); await p.sleep(700)
    setHover(0); await p.sleep(1600)
    cur.move("fp-r2"); await p.sleep(500)
    setHover(2); await p.sleep(1600)
    // the window runs off below Pineapple: scroll down to last place
    setHover(-1); cur.hide(); await p.sleep(150)
    setScrolled(true); await p.sleep(1000)
    cur.show("fp-r19", 120, -40); await p.sleep(250)
    cur.move("fp-r19"); await p.sleep(700)
    setHover(19); await p.sleep(1600)
    cur.move("fp-r19", 90, 60); await p.sleep(350)
    setHover(-1); cur.hide()
    await p.sleep(1500)
  }, onDone, runKey, hold, playFrom, onTime)

  const px = (pts: number) => (Math.min(FP_HALF, Math.abs(pts)) / FP_HALF) * (FP_TRACK / 2)

  return (
    <AppShell cursor={cur.state} nav={studyNav("Details", [{ title: "Listen Labs Report", meta: "Jun 29 · Listen Labs" }])}
      title="Seltzer Water Flavor Preferences" crumb={["Details"]}
      actions={<span className="ll-tbtn">Share <I name="link" size={14} /></span>}>
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 32, padding: "22px 0 0 38px", transform: `translateY(${scrolled ? -FP_SCROLL : 0}px)`, transition: "transform 1s cubic-bezier(.22,1,.36,1)" }}>
          {/* the question, pinned beside its chart */}
          <div style={{ width: 242, flexShrink: 0, alignSelf: "flex-start", background: T.fill, borderRadius: 10, padding: "16px 16px 18px", fontSize: 16, lineHeight: "24px", color: T.ink }}>
            <span style={{ color: T.inkSoft }}>Q12:</span> We'd like to understand your flavor preferences for flavored seltzer
            water. For each set of flavors, please select which one appeals to you most and which appeals to you least.
          </div>
          <div style={{ width: FP_TRACK + 50, flexShrink: 0 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ flex: 1, fontSize: 17, lineHeight: "25px", color: T.ink }}>
                We'd like to understand your flavor preferences for flavored seltzer water. For each set of flavors, please
                select which one appeals to you most and which appeals to you least.
              </div>
              <span style={{ width: 24, height: 28, borderRadius: 6, border: `1px solid ${T.appBorder}`, display: "flex", alignItems: "center", justifyContent: "center", color: T.ink, flexShrink: 0 }}>
                <I name="ellipsis-vertical" size={14} />
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 14, fontSize: 12, color: T.inkSoft }}>
              Index score vs. average (300 respondents). 100 = average. <I name="info" size={12} />
              <span style={{ flex: 1 }} />
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, padding: "2px 6px", borderRadius: 5, background: T.positiveSoft, color: T.positive }}>
                High confidence <I name="info" size={10} />
              </span>
            </div>
            <div style={{ position: "relative", marginTop: 6 }}>
              {FP_FLAVORS.map(([name, v], r) => {
                const up = v >= 100
                const w = px(v - 100)
                return (
                  <div key={name} style={{ height: FP_ROW, paddingTop: 4, opacity: hover >= 0 && hover !== r ? 0.4 : 1, transition: "opacity .25s" }}>
                    <div style={{ fontSize: 12.5, lineHeight: "17px", color: T.inkSoft }}>{name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 3 }}>
                      <span style={{ position: "relative", width: FP_TRACK, height: 11 }}>
                        {/* the track is two halves, split at the 100 line */}
                        <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: FP_TRACK / 2 - 1, background: T.fill, borderRadius: 3 }} />
                        <span style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: FP_TRACK / 2 - 1, background: T.fill, borderRadius: 3 }} />
                        <span style={{
                          position: "absolute", top: 0, bottom: 0, width: Math.max(3, w - 1),
                          left: up ? FP_TRACK / 2 + 1 : FP_TRACK / 2 - 1 - Math.max(3, w - 1),
                          background: up ? T.brand : FP_RED, borderRadius: 3,
                          transform: grown ? "none" : "scaleX(0)", transformOrigin: up ? "left center" : "right center",
                          transition: `transform .8s cubic-bezier(.22,1,.36,1) ${r * 0.06}s`,
                        }} />
                        <span data-cursor={"fp-r" + r} style={{
                          position: "absolute", top: 0, width: 10, height: 11,
                          left: up ? FP_TRACK / 2 + w * 0.6 : FP_TRACK / 2 - w * 0.6 - 10,
                        }} />
                      </span>
                      <span style={{ width: 34, textAlign: "right", fontSize: 13, color: T.inkSoft, fontVariantNumeric: "tabular-nums" }}>{v}</span>
                    </div>
                  </div>
                )
              })}
              {hover >= 0 && (() => {
                const v = FP_FLAVORS[hover][1]
                const x = v >= 100 ? FP_TRACK / 2 + px(v - 100) * 0.6 : FP_TRACK / 2 - px(v - 100) * 0.6
                const ratio = v / 100
                return (
                  <div key={hover} className="ll-card ll-enter" style={{
                    position: "absolute", top: hover >= 15 ? hover * FP_ROW - 72 : hover * FP_ROW + 36, left: v >= 100 ? x - 200 : x + 18, width: 196, zIndex: 2,
                    padding: "10px 12px", boxShadow: "0 4px 16px rgba(0,0,0,.08)", fontSize: 12, lineHeight: "18px",
                  }}>
                    <div className="ll-500" style={{ marginBottom: 4 }}>{FP_FLAVORS[hover][0]}</div>
                    <div style={{ display: "flex" }}><span style={{ color: T.inkSoft, flex: 1 }}>Index</span><span className="ll-500">{v}</span></div>
                    <div style={{ color: T.inkSoft, marginTop: 4 }}>
                      {v >= 100 ? `Picked best ${ratio.toFixed(1)}× as often as an average flavor` : `Picked best ${Math.round((1 - ratio) * 100)}% less often than average`}
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

// ------------------------------------------ Use case · Usability & UX testing -
// Homepage refresh, Use Cases 04, from the legacy concept shot: the
// participant shares their screen while using a customer's site in their own
// browser, and the Listen interviewer runs in a rail beside it. The beat is a
// say/do gap: they say they'd rather get help from a person, then pick the AI
// agent in the site's help widget, and the interviewer asks why. The browser
// and the site ("Omni", a made-up customer) are someone else's product, so
// they keep fixed light colors; only the rail follows the theme.
const UX_BAR_H = 52                  // browser toolbar
const UX_RAIL_W = 368                // interviewer rail
const UX_SITE_W = APP_W - UX_RAIL_W
const UX_PAD = 24                    // rail margins
const UX_CAM = 160                   // webcam tile
// webcam tile with the captioned answer. Off for now: the clip is a
// placeholder. Flip to true once there's a real participant recording.
const UX_SHOW_CAM = false
const UX_Q_FONT = { fontSize: 22, lineHeight: "30.8px", letterSpacing: -0.44 }
const UX_PROGRESS = 0.55
const UX_ORANGE = "#C4500B"
const UX_INK = "#161616"
const UX_SOFT = "#6B6B6B"
const UX_LINE = "#ECECEC"
const UX_REC_MS = 2400
const UX_SAY_Q = "Would you rather get help from a person or an AI agent?"
const UX_SAID = "A person, honestly. I'd rather talk to someone real.".split(" ")
const UX_TASK = "Now imagine you have a question about your latest invoice. Get help the way you normally would.".split(" ")
const UX_FOLLOWUP = "You said you'd rather talk to a person, but you chose the AI agent. What made you do that?".split(" ")
type UXPhase = "ask" | "rec" | "load1" | "task" | "load2" | "follow"

/** Omni's mark: two linked rings, then the wordmark */
function OmniLogo({ color, size = 22 }: { color: string; size?: number }): JSX.Element {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 1, color, fontSize: size, lineHeight: 1, letterSpacing: -0.5, fontWeight: 500 }}>
      <svg width={size * 1.15} height={size} viewBox="0 0 23 20" fill="none" stroke="currentColor" strokeWidth={2.2}>
        <ellipse cx="8" cy="10" rx="6.6" ry="8.4" /><ellipse cx="15" cy="10" rx="6.6" ry="8.4" />
      </svg>
      mni
    </span>
  )
}

/** browser toolbar, Safari-style */
function UXBrowserBar(): JSX.Element {
  const ic = { color: "#6E6E6E" }
  return (
    <div style={{ height: UX_BAR_H, flexShrink: 0, background: "#F2F2F2", borderBottom: "1px solid #DEDEDE", display: "flex", alignItems: "center", padding: "0 18px", position: "relative" }}>
      <div style={{ display: "flex", gap: 8 }}>
        {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => <span key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />)}
      </div>
      <span style={{ ...ic, marginLeft: 28, display: "inline-flex", gap: 2, alignItems: "center" }}><I name="panel-left" size={17} /><I name="chevron-down" size={12} /></span>
      <span style={{ ...ic, marginLeft: 22, display: "inline-flex", gap: 14 }}><I name="chevron-left" size={18} /><span style={{ opacity: 0.4 }}><I name="chevron-right" size={18} /></span></span>
      <div style={{ position: "absolute", left: "50%", top: 10, transform: "translateX(-50%)", width: 440, height: 32, borderRadius: 8, background: "#E6E6E6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13.5, color: "#262626" }}>
        <span style={{ position: "absolute", left: 12, ...ic }}><I name="monitor" size={14} /></span>
        omni.ai
        <span style={{ position: "absolute", right: 12, ...ic }}><I name="rotate-cw" size={13} /></span>
      </div>
      <span style={{ flex: 1 }} />
      <span style={{ ...ic, display: "inline-flex", gap: 18 }}>
        <I name="circle-arrow-down" size={17} /><I name="share-up" size={17} /><I name="plus" size={17} /><I name="copy" size={16} />
      </span>
    </div>
  )
}

function UXCard({ label, badge, children }: { label: string; badge?: React.ReactNode; children: React.ReactNode }): JSX.Element {
  return (
    <div style={{ flex: 1, border: `1px solid ${UX_LINE}`, borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", height: 200 }}>
      <div style={{ display: "flex", alignItems: "center", height: 20 }}>
        <span style={{ fontSize: 11, letterSpacing: 0.9, color: "#7A7A7A", fontWeight: 500 }}>{label}</span>
        <span style={{ flex: 1 }} />{badge}
      </div>
      {children}
    </div>
  )
}
const uxBtn: React.CSSProperties = { height: 32, border: `1px solid #E2E2E2`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontWeight: 500, color: UX_INK, marginTop: "auto", background: "#FFF" }

function UXMeter({ name, value, f, note, cursor }: { name: string; value: string; f: number; note: string; cursor?: string }): JSX.Element {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", fontSize: 12.5 }}>
        <span style={{ color: UX_INK, fontWeight: 500 }}>{name}</span><span style={{ flex: 1 }} /><span style={{ color: "#8A8A8A" }}>{value}</span>
      </div>
      <div data-cursor={cursor} style={{ height: 6, borderRadius: 3, background: "#F3EEE9", marginTop: 10, overflow: "hidden" }}>
        <div style={{ width: `${f * 100}%`, height: "100%", background: UX_ORANGE, borderRadius: 3 }} />
      </div>
      <div style={{ fontSize: 11, color: "#9A9A9A", marginTop: 8 }}>{note}</div>
    </div>
  )
}

/** the customer's billing page, with its help widget */
function UXSite({ open, hov, picked, agentSaid, usageHover }: { open: boolean; hov: "" | "ai" | "human"; picked: boolean; agentSaid: number; usageHover: boolean }): JSX.Element {
  const opt = (k: "ai" | "human", icon: string, title: string, sub: string, tag: string, tagC: [string, string]) => {
    const on = hov === k || (picked && k === "ai")
    return (
      <div data-cursor={"ux-" + k} style={{
        display: "flex", alignItems: "center", gap: 12, padding: "14px 14px", borderRadius: 12,
        background: on ? "#F8E9DC" : "#FBF4EE", border: `1px solid ${on ? "#E9C3A2" : "#F2E4D7"}`,
        transition: "background-color .2s ease, border-color .2s ease",
      }}>
        <span style={{ width: 34, height: 34, borderRadius: 9, background: "#FFF", border: "1px solid #EFE2D6", display: "flex", alignItems: "center", justifyContent: "center", color: UX_INK }}><I name={icon} size={16} /></span>
        <span style={{ flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: UX_INK }}>{title}</div>
          <div style={{ fontSize: 12, color: UX_SOFT, marginTop: 2, whiteSpace: "nowrap" }}>{sub}</div>
        </span>
        <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: 0.6, padding: "3px 7px", whiteSpace: "nowrap", borderRadius: 6, color: tagC[0], background: tagC[1] }}>{tag}</span>
      </div>
    )
  }
  const AGENT = "Hi! I'm Omni's AI agent. I can help with plans, payments and invoices. What do you need?".split(" ")
  return (
    <div style={{ width: UX_SITE_W, height: "100%", position: "relative", overflow: "hidden", background: "#FFF", color: UX_INK }}>
      {/* site header */}
      <div style={{ height: 56, background: UX_ORANGE, display: "flex", alignItems: "center", padding: "0 24px", gap: 30 }}>
        <OmniLogo color="#FFF" />
        <span style={{ display: "flex", gap: 26, fontSize: 13.5, fontWeight: 500, color: "rgba(255,255,255,.92)" }}><span>Dashboard</span><span>Projects</span><span>Settings</span></span>
        <span style={{ flex: 1 }} />
        <span style={{ height: 32, padding: "0 12px", borderRadius: 8, background: "rgba(255,255,255,.16)", border: "1px solid rgba(255,255,255,.22)", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, color: "#FFF" }}><I name="search" size={13} />Search</span>
        <span style={{ color: "#FFF", display: "flex" }}><I name="bell" size={17} /></span>
      </div>

      <div style={{ padding: "36px 40px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: "#8A8A8A" }}>Settings <span style={{ margin: "0 4px" }}>/</span> <span style={{ color: UX_INK }}>Billing</span></div>
            <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.5, marginTop: 6 }}>Billing</div>
            <div style={{ fontSize: 13.5, color: UX_SOFT, marginTop: 6 }}>Manage your plan, payment details and view past invoices.</div>
          </div>
          <span style={{ ...uxBtn, marginTop: 0, padding: "0 14px", gap: 8, height: 36 }}><I name="download" size={14} />Download statements</span>
        </div>

        <div style={{ display: "flex", gap: 16, marginTop: 26 }}>
          <UXCard label="CURRENT PLAN" badge={<span style={{ fontSize: 11, fontWeight: 500, color: "#15803D", background: "#E9F8EE", borderRadius: 10, padding: "2px 8px", display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: "#16A34A" }} />Active</span>}>
            <div style={{ fontSize: 19, fontWeight: 600, marginTop: 12 }}>Business</div>
            <div style={{ marginTop: 2 }}><span style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.6 }}>$100</span><span style={{ fontSize: 12.5, color: "#8A8A8A" }}> / month</span></div>
            <div style={{ fontSize: 12, lineHeight: "18px", color: UX_SOFT, marginTop: 8 }}>Billed monthly. Includes priority support, advanced analytics and unlimited projects.</div>
            <span style={uxBtn}>Change plan</span>
          </UXCard>
          <UXCard label="PAYMENT METHOD">
            <div style={{ fontSize: 16, fontWeight: 500, marginTop: 14, letterSpacing: 1 }}>•••• •••• •••• 5555</div>
            <div style={{ fontSize: 12, color: "#8A8A8A", marginTop: 6 }}>Expires 08 / 2027</div>
            <span style={uxBtn}>Update payment method</span>
          </UXCard>
          <UXCard label="UPCOMING INVOICE">
            <div style={{ marginTop: 12 }}><span style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.6 }}>$100</span><span style={{ fontSize: 13, color: "#8A8A8A" }}>.00</span></div>
            <div style={{ fontSize: 12, color: UX_SOFT, marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}><I name="calendar" size={13} />Scheduled for <span style={{ color: UX_INK, fontWeight: 600 }}>July 12, 2026</span></div>
            <div style={{ borderTop: `1px solid ${UX_LINE}`, marginTop: 12, paddingTop: 10, fontSize: 11.5, color: UX_SOFT, display: "grid", gridTemplateColumns: "1fr auto", rowGap: 4 }}>
              <span>Business plan</span><span style={{ color: UX_INK }}>$100.00</span><span>Tax</span><span style={{ color: UX_INK }}>$0.00</span>
            </div>
            <span style={uxBtn}>View invoice details</span>
          </UXCard>
        </div>

        <div style={{ border: `1px solid ${UX_LINE}`, borderRadius: 12, padding: 20, marginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>Usage this cycle</div>
              <div style={{ fontSize: 12, color: "#8A8A8A", marginTop: 3 }}>Jun 1 – Jul 1, 2026 · resets in 18 days</div>
            </div>
            <span style={{ fontSize: 12.5, fontWeight: 500, color: UX_ORANGE, textDecoration: usageHover ? "underline" : "none" }}>View detailed usage →</span>
          </div>
          <div style={{ display: "flex", gap: 40, marginTop: 18 }}>
            <UXMeter name="API Requests" value="842K / 1M" f={0.842} note="84% of monthly limit used" cursor="ux-api" />
            <UXMeter name="Team Members" value="18 / 25" f={0.72} note="7 seats remaining" />
          </div>
        </div>

        <div style={{ border: `1px solid ${UX_LINE}`, borderRadius: 12, marginTop: 16, overflow: "hidden" }}>
          <div style={{ fontSize: 16, fontWeight: 600, padding: "18px 20px" }}>Recent invoices</div>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", padding: "10px 20px", background: "#FBF5F0", fontSize: 10.5, letterSpacing: 0.8, color: "#8A8A8A", fontWeight: 500 }}>
            <span>INVOICE</span><span>DATE</span><span>AMOUNT</span>
          </div>
          {[["June Invoice", "Jun 12, 2026"], ["May Invoice", "May 12, 2026"]].map(([n, d]) => (
            <div key={n} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", alignItems: "center", padding: "14px 20px", borderTop: `1px solid ${UX_LINE}`, fontSize: 13 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 500 }}><span style={{ width: 26, height: 26, borderRadius: 6, background: "#FBEBDD", color: UX_ORANGE, display: "flex", alignItems: "center", justifyContent: "center" }}><I name="file" size={13} /></span>{n}</span>
              <span style={{ color: UX_SOFT }}>{d}</span><span style={{ fontWeight: 600 }}>$100.00</span>
            </div>
          ))}
        </div>
      </div>

      {/* help widget */}
      <div style={{
        position: "absolute", right: 24, bottom: 92, width: 384, height: 404, borderRadius: 16, background: "#FFF",
        border: "1px solid #E8E8E8", boxShadow: "0 12px 40px rgba(0,0,0,.14)", display: "flex", flexDirection: "column", overflow: "hidden",
        opacity: open ? 1 : 0, transform: open ? "none" : "translateY(12px) scale(.98)", transformOrigin: "bottom right",
        transition: "opacity .3s ease, transform .4s cubic-bezier(.22,1,.36,1)",
      }}>
        <div style={{ height: 60, display: "flex", alignItems: "center", padding: "0 18px", borderBottom: `1px solid ${UX_LINE}` }}>
          <OmniLogo color={UX_INK} size={20} /><span style={{ flex: 1 }} />
          <span style={{ width: 28, height: 28, borderRadius: 8, background: "#F4F4F4", display: "flex", alignItems: "center", justifyContent: "center", color: UX_SOFT }}><I name="x" size={14} /></span>
        </div>
        <div style={{ flex: 1, padding: 20, position: "relative" }}>
          <div style={{ opacity: agentSaid > 0 ? 0 : 1, transition: "opacity .25s ease" }}>
            <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: -0.3, marginBottom: 16 }}>How can we help?</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {opt("ai", "sparkles", "Talk to an AI agent now", "No waiting, answers in seconds", "INSTANT", ["#15803D", "#E2F6E8"])}
              {opt("human", "headphones", "Talk to a human", "Connect with a live specialist", "~6 MIN WAIT", ["#B45309", "#FCEFD9"])}
            </div>
          </div>
          {agentSaid > 0 && (
            <div className="ll-enter" style={{ position: "absolute", inset: 20 }}>
              <div style={{ fontSize: 11, color: "#9A9A9A", textAlign: "center", marginBottom: 14 }}>You're chatting with Omni AI</div>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ width: 26, height: 26, borderRadius: "50%", background: UX_ORANGE, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><I name="sparkles" size={13} /></span>
                <div style={{ background: "#F5F2EF", borderRadius: "4px 12px 12px 12px", padding: "10px 12px", fontSize: 13, lineHeight: "19px", maxWidth: 260 }}>
                  {agentSaid === 1
                    ? <span style={{ display: "inline-flex", gap: 4, padding: "4px 0" }}>{[0, 1, 2].map((i) => <span key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "#9A9A9A", animation: "ll-pulse 1s ease-in-out infinite", animationDelay: `${i * 0.18}s` }} />)}</span>
                    : AGENT.slice(0, agentSaid - 1).join(" ")}
                </div>
              </div>
            </div>
          )}
        </div>
        <div style={{ padding: "0 16px 10px" }}>
          <div style={{ height: 44, borderRadius: 10, border: "1px solid #E6E6E6", display: "flex", alignItems: "center", padding: "0 6px 0 14px", fontSize: 13, color: "#A0A0A0" }}>
            Reply to Omni Support…<span style={{ flex: 1 }} />
            <span style={{ width: 32, height: 32, borderRadius: 8, background: UX_ORANGE, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center" }}><I name="send" size={14} /></span>
          </div>
          <div style={{ fontSize: 10.5, color: "#C98A5E", textAlign: "center", marginTop: 8 }}>Powered by Omni AI</div>
        </div>
      </div>

      {/* help launcher */}
      <span data-cursor="ux-help" style={{
        position: "absolute", right: 24, bottom: 24, width: 52, height: 52, borderRadius: "50%", background: UX_ORANGE, color: "#FFF",
        display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 18px rgba(196,80,11,.35)",
      }}><I name={open ? "chevron-down" : "message-circle"} size={22} /></span>
    </div>
  )
}

export function SceneUCUsability({ active, onDone, runKey = 0, hold, playFrom, onTime }: SceneProps): JSX.Element {
  ensureCss()
  const cur = useCursor(APP_CURSOR_START)
  const [phase, setPhase] = React.useState<UXPhase>("ask")
  const [recT, setRecT] = React.useState(0)
  const [said, setSaid] = React.useState(0)      // caption words shown
  const [words, setWords] = React.useState(0)    // task / follow-up words streamed
  const [enabled, setEnabled] = React.useState(true)
  const [usageHover, setUsageHover] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const [hov, setHov] = React.useState<"" | "ai" | "human">("")
  const [picked, setPicked] = React.useState(false)
  const [agentSaid, setAgentSaid] = React.useState(0)
  const CARD_PAD = 8, CARD_GAP = 7, STRIP_H = 60, ROW_H = 32
  const CARD_H = CARD_PAD * 2 + STRIP_H + CARD_GAP + ROW_H
  const AGENT_WORDS = 17

  useScene(active, async (p) => {
    setPhase("ask"); setRecT(0); setSaid(0); setWords(0); setEnabled(true); setUsageHover(false)
    setOpen(false); setHov(""); setPicked(false); setAgentSaid(0); cur.hide()
    // the "say": they answer out loud
    await p.sleep(700)
    cur.show("ux-start", -200, -160); await p.sleep(300)
    cur.move("ux-start"); await p.sleep(750)
    cur.click(1); await p.sleep(250)
    setPhase("rec"); cur.hide()
    const perWord = Math.floor((UX_REC_MS - 600) / UX_SAID.length / 30) * 30
    for (let i = 1; i <= UX_REC_MS / IV_TICK; i++) {
      await p.sleep(IV_TICK); setRecT(i * IV_TICK)
      setSaid(Math.max(0, Math.min(UX_SAID.length, Math.floor((i * IV_TICK - 450) / perWord))))
    }
    cur.show("ux-submit", -140, -110); await p.sleep(300)
    cur.move("ux-submit"); await p.sleep(600)
    cur.click(2); await p.sleep(250)
    setPhase("load1"); cur.hide(); await p.sleep(1000)
    // the task
    setPhase("task"); setEnabled(false)
    for (let i = 1; i <= UX_TASK.length; i++) { await p.sleep(IV_WORD_MS); setWords(i) }
    await p.sleep(700)
    // the "do": they look around the page, then open help
    cur.show({ x: 520, y: 560 }); await p.sleep(250)
    cur.move("ux-api", 60, 0); await p.sleep(800)
    setUsageHover(true); await p.sleep(700)
    setUsageHover(false)
    cur.move("ux-help"); await p.sleep(900)
    cur.click(3); await p.sleep(200)
    setOpen(true); await p.sleep(800)
    cur.move("ux-human", 40, 0); await p.sleep(650)
    setHov("human"); await p.sleep(1000)
    cur.move("ux-ai", 40, 0); await p.sleep(450)
    setHov("ai"); await p.sleep(500)
    cur.click(4); await p.sleep(200)
    setPicked(true); setAgentSaid(1); setPhase("load2"); setWords(0)
    await p.sleep(400)
    cur.move("ux-ai", 140, 70); await p.sleep(300)
    cur.hide()
    await p.sleep(500)
    // the interviewer catches the gap
    setPhase("follow")
    for (let i = 1; i <= UX_FOLLOWUP.length; i++) {
      await p.sleep(IV_WORD_MS); setWords(i)
      if (i >= 3) setAgentSaid(Math.min(AGENT_WORDS + 1, 1 + (i - 2) * 2))
    }
    setAgentSaid(AGENT_WORDS + 1)
    await p.sleep(250)
    setEnabled(true)
    await p.sleep(1800)
  }, onDone, runKey, hold, playFrom, onTime)

  const mm = (ms: number) => `00:${String(Math.floor(ms / 1000)).padStart(2, "0")}`
  const recording = phase === "rec"
  const barBtn: React.CSSProperties = { height: 32, padding: "0 12px", borderRadius: 8, fontSize: 16, display: "inline-flex", alignItems: "center", gap: 7 }
  const stream = (ws: string[]) => (
    <div style={UX_Q_FONT}>
      {ws.map((w, i) => (
        <span key={i} style={{ color: i < words ? T.ink : "#E4E4E4", opacity: i < words ? 1 : 0, transition: "color .7s ease, opacity .25s ease" }}>{w}{i < ws.length - 1 ? " " : ""}</span>
      ))}
    </div>
  )
  const dots = (
    <div className="ll-enter" style={{ display: "flex", gap: 11, paddingTop: 13 }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: T.ink, animation: "ll-pulse 1s ease-in-out infinite", animationDelay: `${i * 0.18}s` }} />
      ))}
    </div>
  )

  return (
    <BareFrame cursor={cur.state}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <UXBrowserBar />
        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
          <UXSite open={open} hov={hov} picked={picked} agentSaid={agentSaid} usageHover={usageHover} />

          {/* interviewer rail */}
          <div style={{ width: UX_RAIL_W, flexShrink: 0, position: "relative", borderLeft: `1px solid ${T.appBorder}`, background: T.appBg }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "rgba(0, 0, 0, 0.1)" }}>
              <div style={{ width: `${UX_PROGRESS * 100}%`, height: "100%", background: T.brand }} />
            </div>
            <div style={{ position: "absolute", top: 40, left: UX_PAD, right: UX_PAD }}>
              {(phase === "ask" || recording) && <div style={{ ...UX_Q_FONT, color: T.ink }}>{UX_SAY_Q}</div>}
              {(phase === "load1" || phase === "load2") && dots}
              {phase === "task" && stream(UX_TASK)}
              {phase === "follow" && stream(UX_FOLLOWUP)}
            </div>

            {/* webcam tile, with the answer captioned while they speak (see UX_SHOW_CAM) */}
            {UX_SHOW_CAM && <div style={{ position: "absolute", right: UX_PAD, bottom: UX_PAD + CARD_H + 16, width: UX_CAM, height: UX_CAM, borderRadius: 10, overflow: "hidden", background: "linear-gradient(160deg, #E3DCCE 0%, #CFC7B6 55%, #B9AF9C 100%)" }}>
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 50% at 55% 60%, rgba(255,255,255,.4), transparent 70%)" }} />
              <span className="ll-avatar" style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: 48, height: 48, fontSize: 20 }}>M</span>
              <ClipVideo t={phase === "ask" ? 0 : recording ? recT : UX_REC_MS} playing={recording && hold == null && active} />
              <span style={{ position: "absolute", top: 9, left: 9, width: 8, height: 8, borderRadius: "50%", background: IV_RED }} />
              {recording && said > 0 && (
                <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "18px 9px 8px", background: "linear-gradient(transparent, rgba(0,0,0,.6))", color: "#FFF", fontSize: 12, lineHeight: "16px" }}>
                  {UX_SAID.slice(0, said).join(" ")}
                </div>
              )}
            </div>}

            {/* bottom control: Start Recording ⇄ Pause · timer · Submit */}
            <div style={{ position: "absolute", left: UX_PAD, right: UX_PAD, bottom: UX_PAD }}>
              {recording ? (
                <div className="ll-enter" style={{ height: CARD_H, borderRadius: 16, background: "#EEEEEE", padding: CARD_PAD, display: "flex", flexDirection: "column", gap: CARD_GAP }}>
                  <DotStrip t={recT} w={UX_RAIL_W - UX_PAD * 2 - CARD_PAD * 2} h={STRIP_H} />
                  <div style={{ height: ROW_H, display: "flex", alignItems: "center", gap: 11 }}>
                    <span style={{ ...barBtn, border: `1px solid ${IV_RED}`, color: IV_RED, background: T.appBg }}>Pause <I name="circle-pause" size={16} /></span>
                    <span style={{ flex: 1, textAlign: "center", color: IV_RED, fontSize: 17, fontVariantNumeric: "tabular-nums" }}>{mm(recT)}</span>
                    <span data-cursor="ux-submit" style={{ ...barBtn, background: T.brand, color: "#FAFAFA" }}>Submit <I name="circle-stop" size={16} /></span>
                  </div>
                </div>
              ) : (
                <button data-cursor="ux-start" className="ll-btn primary" style={{
                  width: "100%", height: IV_BTN_H, borderRadius: 8, justifyContent: "center", fontSize: 16, letterSpacing: -0.32,
                  background: enabled && phase !== "load1" && phase !== "load2" ? T.brand : "#ECEFFF",
                  color: enabled && phase !== "load1" && phase !== "load2" ? "#FAFAFA" : T.brandFaint,
                  transition: "background-color .35s ease, color .35s ease",
                }}>Start Recording</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </BareFrame>
  )
}

// ------------------------------------- Use case · Pricing & willingness-to-pay -
// Homepage refresh, Use Cases 07. "Airport Lounge Membership: Willingness to
// Pay" (listenlabs.ai/p/YfAwSg55), Report → "The concept appeals, but travelers
// still need a reason to pay": the Gabor-Granger chart for annual membership,
// 100 respondents. $150 / $250 / $350 demand comes from the analysis scalars
// (54% / 35% / 24%); $450 and up are read off the live chart and agree with its
// revenue curve. Revenue per respondent is price × demand. Prices are tested
// tiers, so the x-axis is evenly spaced, as live.
const PR_PRICES = [150, 250, 350, 450, 550, 750, 850]
const PR_DEMAND = [54, 35, 24, 13, 12, 8, 6]
const PR_REV = PR_PRICES.map((p, i) => (p * PR_DEMAND[i]) / 100)
const PR_PEAK = 1                    // $250, the revenue-maximizing price
const PR_COL = 760                   // report column
const PR_PLOT_L = 50, PR_PLOT_R = 86 // axis label gutters
const PR_PLOT_H = 236
const PR_RED = "#B3261E"
const PR_SENTENCES = [
  "Modeled annual revenue remains close to its peak across several tested prices.",
  "Both adjacent tested tiers retain most of peak modeled gross revenue, making acquisition value and service costs central to the final choice.",
  "Higher tested prices reduce both demand and modeled gross revenue relative to the recommended launch price.",
]
const PR_REPORTS = [{ title: "Listen Labs Report", meta: "Sep 18 · Listen Labs" }]
const money = (v: number) => `$${v.toFixed(2)}`

export function SceneUCPricing({ active, onDone, runKey = 0, hold, playFrom, onTime }: SceneProps): JSX.Element {
  ensureCss()
  const cur = useCursor(APP_CURSOR_START)
  const [drawn, setDrawn] = React.useState(false)
  const [hover, setHover] = React.useState(-1)
  const [mark, setMark] = React.useState(false)

  useScene(active, async (p) => {
    setDrawn(false); setHover(-1); setMark(false); cur.hide()
    await p.sleep(500)
    setDrawn(true)
    await p.sleep(2000)
    // the peak, then the two tiers either side of it
    cur.show("pr-p1", 160, 140); await p.sleep(250)
    cur.move("pr-p1"); await p.sleep(700)
    setHover(1); await p.sleep(1700)
    cur.move("pr-p0"); await p.sleep(500)
    setHover(0); await p.sleep(1400)
    cur.move("pr-p2"); await p.sleep(600)
    setHover(2); await p.sleep(1400)
    // ...which is what the report says next
    cur.move("pr-p2", 60, 150); await p.sleep(350)
    setHover(-1); cur.hide()
    await p.sleep(200)
    setMark(true)
    await p.sleep(2600)
  }, onDone, runKey, hold, playFrom, onTime)

  const plotW = PR_COL - PR_PLOT_L - PR_PLOT_R
  const inset = 24
  const xAt = (i: number) => inset + (i * (plotW - inset * 2)) / (PR_PRICES.length - 1)
  const yAt = (v: number) => PR_PLOT_H - (v / 100) * PR_PLOT_H
  const path = (vs: number[]) => vs.map((v, i) => `${i ? "L" : "M"}${xAt(i).toFixed(1)} ${yAt(v).toFixed(1)}`).join(" ")
  const line = (vs: number[], color: string, delay: number) => (
    <path d={path(vs)} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" pathLength={1}
      style={{ strokeDasharray: 1, strokeDashoffset: drawn ? 0 : 1, transition: `stroke-dashoffset 1.3s cubic-bezier(.45,0,.2,1) ${delay}s` }} />
  )
  const axis: React.CSSProperties = { position: "absolute", fontSize: 12, color: T.inkSoft, fontVariantNumeric: "tabular-nums" }

  return (
    <AppShell cursor={cur.state} nav={studyNav("Report", PR_REPORTS)} activeSub="Listen Labs Report"
      title="Airport Lounge Membership: Willingness to Pay" crumb={["Report", "Listen Labs Report"]} actions={REPORT_ACTIONS}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ display: "flex", gap: 14, padding: "12px 16px 0", color: T.inkSoft, justifyContent: "flex-end" }}>
          <I name="download" size={14} /><I name="ellipsis" size={14} />
        </div>
        <div className="ll-doc-fade" style={{ flex: 1, position: "relative" }}>
          <div style={{ width: PR_COL, margin: "0 auto", padding: "22px 0 0" }}>
            <div style={{ fontSize: 14.5, color: T.ink }}>Annual membership demand and revenue by price</div>
            <div style={{ fontSize: 13.5, lineHeight: "19px", color: T.inkSoft, marginTop: 8 }}>
              This exercise measured stated likelihood to buy unlimited annual access across a broad network of similar lounges.
              The demand curve shows the share who would buy at each tested annual price; the revenue curve multiplies price by
              stated demand and marks the best-performing tested price. Treat the result as directional because survey purchase
              intent can exceed real-world conversion.
            </div>
            <div style={{ fontSize: 13.5, color: T.inkSoft, marginTop: 16 }}>
              Revenue-maximizing price: <span className="ll-500" style={{ color: T.ink }}>{money(PR_PRICES[PR_PEAK])}</span> ({PR_DEMAND[PR_PEAK]}% would buy, 100 respondents)
            </div>
            <div style={{ display: "flex", gap: 18, marginTop: 14, fontSize: 12.5, color: T.inkSoft }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: T.brand }} />Demand (% who would buy)</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: PR_RED }} />Revenue / respondent</span>
            </div>

            {/* dual-axis line chart */}
            <div style={{ position: "relative", height: PR_PLOT_H + 56, marginTop: 26 }}>
              {[0, 25, 50, 75, 100].map((v) => (
                <React.Fragment key={v}>
                  <span style={{ ...axis, left: 0, width: PR_PLOT_L - 12, textAlign: "right", top: yAt(v) - 8 }}>{v}%</span>
                  <span style={{ ...axis, left: PR_PLOT_L + plotW + 10, top: yAt(v) - 8 }}>{money(v)}</span>
                  <span style={{ position: "absolute", left: PR_PLOT_L, width: plotW, top: yAt(v), height: 1, background: T.appBorder }} />
                </React.Fragment>
              ))}
              {PR_PRICES.map((p, i) => (
                <span key={p} style={{ ...axis, top: PR_PLOT_H + 26, left: PR_PLOT_L + xAt(i) - 30, width: 60, textAlign: "center" }}>{money(p)}</span>
              ))}
              <svg width={plotW} height={PR_PLOT_H} style={{ position: "absolute", left: PR_PLOT_L, top: 0, overflow: "visible" }}>
                {/* the revenue-maximizing price */}
                <line x1={xAt(PR_PEAK)} x2={xAt(PR_PEAK)} y1={0} y2={PR_PLOT_H} stroke={T.inkSoft} strokeWidth={1} strokeDasharray="4 3"
                  style={{ opacity: drawn ? 1 : 0, transition: "opacity .5s ease 1.4s" }} />
                {hover >= 0 && <line x1={xAt(hover)} x2={xAt(hover)} y1={0} y2={PR_PLOT_H} stroke={T.ink} strokeOpacity={0.18} strokeWidth={1} />}
                {line(PR_REV, PR_RED, 0.15)}
                {line(PR_DEMAND, T.brand, 0)}
                {hover >= 0 && (
                  <>
                    <circle cx={xAt(hover)} cy={yAt(PR_REV[hover])} r={4.5} fill={PR_RED} stroke={T.appBg} strokeWidth={2} />
                    <circle cx={xAt(hover)} cy={yAt(PR_DEMAND[hover])} r={4.5} fill={T.brand} stroke={T.appBg} strokeWidth={2} />
                  </>
                )}
              </svg>
              {/* cursor targets: one per tested price, between the two lines */}
              {PR_PRICES.map((p, i) => (
                <span key={p} data-cursor={"pr-p" + i} style={{ position: "absolute", left: PR_PLOT_L + xAt(i) - 4, top: (yAt(PR_REV[i]) + yAt(PR_DEMAND[i])) / 2 - 4, width: 8, height: 8 }} />
              ))}
              {hover >= 0 && (
                <div key={hover} className="ll-card ll-enter" style={{
                  position: "absolute", left: PR_PLOT_L + xAt(hover) + 16, top: yAt(PR_REV[hover]) + 8, width: 224, zIndex: 2,
                  padding: "10px 12px", boxShadow: "0 4px 16px rgba(0,0,0,.08)", fontSize: 12, lineHeight: "18px",
                }}>
                  <div className="ll-500" style={{ marginBottom: 4 }}>{money(PR_PRICES[hover])}{hover === PR_PEAK ? " · peak revenue" : ""}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: T.brand }} /><span style={{ color: T.inkSoft, flex: 1 }}>Would buy</span><span className="ll-500">{PR_DEMAND[hover]}%</span></div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: PR_RED }} /><span style={{ color: T.inkSoft, flex: 1 }}>Revenue / respondent</span><span className="ll-500">{money(PR_REV[hover])}</span></div>
                  {hover !== PR_PEAK && (
                    <div style={{ color: T.inkSoft, marginTop: 4 }}>{Math.round((PR_REV[hover] / PR_REV[PR_PEAK]) * 100)}% of peak revenue</div>
                  )}
                </div>
              )}
            </div>

            <div style={{ fontSize: 17, lineHeight: "29px", color: T.ink, marginTop: 30 }}>
              {PR_SENTENCES.map((s, i) => (
                <span key={i} style={{ background: i === 1 && mark ? T.brandSoft : "transparent", borderRadius: 3, transition: "background-color .6s ease" }}>{s}{i < PR_SENTENCES.length - 1 ? " " : ""}</span>
              ))}
            </div>

            <div style={{ fontSize: 14.5, color: T.ink, marginTop: 44 }}>Day-pass demand and revenue by price</div>
            <div style={{ fontSize: 13.5, lineHeight: "19px", color: T.inkSoft, marginTop: 8 }}>
              This exercise measured stated likelihood to buy one lounge visit at each tested price. The demand curve shows the
              share who would buy at each day-pass price; the revenue curve multiplies price by stated demand and marks the
              best-performing tested price.
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

// ---------------------------------- Use case · Churn, retention & activation -
// Homepage refresh, Use Cases 05. "How People Buy Snacks Online: Checkout
// Behavior & Channel Choice" (listenlabs.ai/p/8GHVaCAh), Report → "Snacks ride
// along with baskets already in motion": the intent-break drivers chart, N=31,
// and the paragraphs under it, verbatim. Counts are the live report's as of
// 2026-10-02 (the API's analysis is an older run with different counts).
const CH_DRIVERS: Array<[string, number]> = [
  ["Limited assortment", 24], ["Item price or weak value", 18], ["Out of stock or unavailable promise", 17],
  ["Shipping cost or threshold", 11], ["Interface or navigation friction", 11],
]
const CH_BASE = 31
const CH_ROW = 54
const CH_REPORTS = [{ title: "Listen Labs Report", meta: "Aug 7 · Listen Labs" }, { title: "Snack.com UX Insights", meta: "Aug 10 · Asad Tacy" }]

/** a numbered source chip, as the live report cites transcripts inline */
function CiteChip({ n }: { n: number }): JSX.Element {
  return <span style={{ display: "inline-block", fontSize: 10, lineHeight: "15px", padding: "0 5px", borderRadius: 7, background: T.fill, color: T.inkSoft, verticalAlign: 2, marginLeft: 4 }}>{n}</span>
}

export function SceneUCChurn({ active, onDone, runKey = 0, hold, playFrom, onTime }: SceneProps): JSX.Element {
  ensureCss()
  const cur = useCursor(APP_CURSOR_START)
  const [grown, setGrown] = React.useState(false)
  const [hover, setHover] = React.useState(-1)
  const [mark, setMark] = React.useState(false)

  useScene(active, async (p) => {
    setGrown(false); setHover(-1); setMark(false); cur.hide()
    await p.sleep(500)
    setGrown(true)
    await p.sleep(1800)
    // the top driver, then the out-of-stock promise that compounds it
    cur.show("ch-r0", 120, 130); await p.sleep(250)
    cur.move("ch-r0"); await p.sleep(700)
    setHover(0); await p.sleep(1700)
    cur.move("ch-r2"); await p.sleep(550)
    setHover(2); await p.sleep(1500)
    // ...and what the report makes of it
    cur.move("ch-r4", 80, 120); await p.sleep(350)
    setHover(-1); cur.hide()
    await p.sleep(200)
    setMark(true)
    await p.sleep(2800)
  }, onDone, runKey, hold, playFrom, onTime)

  const max = Math.max(...CH_DRIVERS.map((d) => d[1]))

  return (
    <AppShell cursor={cur.state} nav={studyNav("Report", CH_REPORTS)} activeSub="Listen Labs Report"
      title="How People Buy Snacks Online: Checkout Behavior & Channel Choice" crumb={["Report", "Listen Labs Report"]} actions={REPORT_ACTIONS}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ display: "flex", gap: 14, padding: "12px 16px 0", color: T.inkSoft, justifyContent: "flex-end" }}>
          <I name="download" size={14} /><I name="ellipsis" size={14} />
        </div>
        <div className="ll-doc-fade" style={{ flex: 1, position: "relative" }}>
          <div style={{ width: PR_COL, margin: "0 auto", padding: "30px 0 0" }}>
            <div style={{ fontSize: 14.5, color: T.ink }}>Assortment and value break Snacks.com intent</div>
            <div style={{ fontSize: 13.5, lineHeight: "19px", color: T.inkSoft, marginTop: 10 }}>
              Bars show how many participants experienced each major Snacks.com intent-break driver during the observed
              journey. The horizontal categories are the reason purchase momentum weakened; bar length is the number of
              participants.
            </div>

            <div style={{ position: "relative", marginTop: 14 }}>
              {CH_DRIVERS.map(([label, n], r) => (
                <div key={label} style={{ height: CH_ROW, paddingTop: 8, opacity: hover >= 0 && hover !== r ? 0.4 : 1, transition: "opacity .25s" }}>
                  <div style={{ display: "flex", alignItems: "center", fontSize: 12.5, color: T.inkSoft }}>
                    <span style={{ flex: 1 }}>{label}</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontVariantNumeric: "tabular-nums" }}>{n} <I name="circle-user-round" size={12} /></span>
                  </div>
                  <div style={{ position: "relative", height: 11, marginTop: 6, borderRadius: 2, background: T.fill, overflow: "hidden" }}>
                    <div style={{
                      position: "absolute", left: 0, top: 0, bottom: 0, width: `${(n / max) * 100}%`, background: T.brand, borderRadius: 2,
                      transform: grown ? "none" : "scaleX(0)", transformOrigin: "left center",
                      transition: `transform .9s cubic-bezier(.22,1,.36,1) ${r * 0.08}s`,
                    }} />
                    <span data-cursor={"ch-r" + r} style={{ position: "absolute", top: 0, width: 10, height: 11, left: `${(n / max) * 70}%` }} />
                  </div>
                </div>
              ))}
              {hover >= 0 && (
                <div key={hover} className="ll-card ll-enter" style={{
                  position: "absolute", top: hover * CH_ROW + 44, left: `${(CH_DRIVERS[hover][1] / max) * 70}%`, marginLeft: 18, width: 220, zIndex: 2,
                  padding: "10px 12px", boxShadow: "0 4px 16px rgba(0,0,0,.08)", fontSize: 12, lineHeight: "18px",
                }}>
                  <div className="ll-500" style={{ marginBottom: 4 }}>{CH_DRIVERS[hover][0]}</div>
                  <div style={{ display: "flex" }}><span style={{ color: T.inkSoft, flex: 1 }}>Participants</span><span className="ll-500">{CH_DRIVERS[hover][1]} of {CH_BASE}</span></div>
                  <div style={{ color: T.inkSoft, marginTop: 4 }}>{Math.round((CH_DRIVERS[hover][1] / CH_BASE) * 100)}% lost momentum here</div>
                </div>
              )}
            </div>
            <div style={{ fontSize: 12, lineHeight: "16px", color: T.inkSoft, marginTop: 10 }}>
              Base size: N={CH_BASE}; Themes are multi-select, so one participant can contribute to more than one driver. Only the
              five most decision-relevant drivers are shown.
            </div>

            <div style={{ fontSize: 17, lineHeight: "29px", color: T.ink, marginTop: 52 }}>
              <span style={{ background: mark ? T.brandSoft : "transparent", borderRadius: 3, transition: "background-color .6s ease" }}>
                The most damaging brand moment was the gap between the name <span className="ll-500">Snacks.com</span> and what shoppers found.
              </span>{" "}
              Non-chip categories felt token, familiar products lacked a direct-only advantage, and the prominent variety-pack
              route led to a <span className="ll-500">"VARIETY PACK UNAVAILABLE"</span> page immediately after the top-navigation click<CiteChip n={18} /> .
            </div>
            <div style={{ fontSize: 17, lineHeight: "29px", color: T.ink, marginTop: 20 }}>
              Price then made familiar products easy to reject. Shoppers compared individual bags and the final cart with grocery
              promotions they already knew. Free shipping could not rescue an order whose item economics already felt wrong, as one
              participant summarized: <span style={{ color: T.inkSoft }}>"I got the free shipping too, I guess. Thirty bucks for all this? It's just, that seems way overpriced."</span><CiteChip n={58} />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

// --------------------------------------- Use case · Ad & creative testing -----
// Homepage refresh, Use Cases 06. "HBO vs Netflix vs Paramount+ Concept Test"
// (listenlabs.ai/p/Pu0mgOLs), Details → Brand Evaluation: the emotional concept
// comparison and the Q9 brand rating, side by side per concept. Counts are
// measured off the live bars (2026-10-02) and sum to each concept's responses.
// The page's legacy right-hand question rail is left out, as in the newer
// Details layout.
type ADEmotion = "anger" | "disgust" | "fear" | "happiness" | "sadness" | "surprise" | "neutral"
const AD_EMO_ORDER: ADEmotion[] = ["anger", "disgust", "fear", "happiness", "sadness", "surprise", "neutral"]
const AD_NEUTRAL = "#E8E8E8"
const AD_RATINGS: Array<[string, string]> = [
  ["Poor", "#E5485D"], ["Fair", "#F7ACBA"], ["Good", "#B4B6B8"], ["Very Good", "#61AAFC"], ["Excellent", "#2463EB"],
]
type ADConcept = { name: string; n: number; emo: Partial<Record<ADEmotion, number>>; rate: number[]; hue: [string, string] }
const AD_CONCEPTS: ADConcept[] = [
  { name: "HBO", n: 71, emo: { anger: 2, disgust: 7, happiness: 40, surprise: 11, neutral: 11 }, rate: [0, 3, 14, 31, 23], hue: ["#3B2A8C", "#7B3FD6"] },
  { name: "Netflix", n: 95, emo: { anger: 8, disgust: 7, happiness: 63, sadness: 3, surprise: 5, neutral: 9 }, rate: [0, 9, 13, 33, 40], hue: ["#5A0F12", "#C8222B"] },
  { name: "Paramount", n: 77, emo: { anger: 4, disgust: 4, fear: 1, happiness: 46, sadness: 3, surprise: 4, neutral: 15 }, rate: [0, 11, 19, 33, 14], hue: ["#0B2A6B", "#2F6BE0"] },
]
const AD_ROW = 84
const AD_LEFT = 242
const cap = (s: string) => s[0].toUpperCase() + s.slice(1)
const emoColor = (e: ADEmotion) => (e === "neutral" ? AD_NEUTRAL : EMOTIONS[e].fg)

/** a concept's streaming-home thumbnail: a stylized dark UI in its own hue */
function ADThumb({ hue }: { hue: [string, string] }): JSX.Element {
  return (
    <span style={{ width: 58, height: 58, borderRadius: 4, flexShrink: 0, overflow: "hidden", background: "#0E0E12", position: "relative", display: "block" }}>
      <span style={{ position: "absolute", left: 4, right: 4, top: 4, height: 3, borderRadius: 1, background: "rgba(255,255,255,.18)" }} />
      <span style={{ position: "absolute", left: 4, right: 4, top: 10, height: 22, borderRadius: 2, background: `linear-gradient(120deg, ${hue[0]}, ${hue[1]})` }} />
      {[0, 1, 2, 3].map((i) => (
        <span key={i} style={{ position: "absolute", top: 36, left: 4 + i * 13, width: 11, height: 8, borderRadius: 1, background: i % 2 ? "rgba(255,255,255,.22)" : `${hue[1]}AA` }} />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <span key={i} style={{ position: "absolute", top: 47, left: 4 + i * 13, width: 11, height: 7, borderRadius: 1, background: "rgba(255,255,255,.14)" }} />
      ))}
    </span>
  )
}

function ADLegend({ items }: { items: Array<[string, string]> }): JSX.Element {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 11, paddingLeft: 18 }}>
      {items.map(([label, c]) => (
        <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: 9, fontSize: 14, color: T.inkSoft }}>
          <span style={{ width: 8, height: 8, borderRadius: 1, background: c }} />{label}
        </span>
      ))}
    </div>
  )
}

function ADCompare({ kebab }: { kebab?: boolean }): JSX.Element {
  return (
    <span style={{ display: "inline-flex", gap: 8 }}>
      <span className="ll-tbtn" style={{ height: 32 }}>Compare <I name="chevron-down" size={12} /></span>
      {kebab && <span className="ll-tbtn" style={{ height: 32, width: 32, padding: 0, justifyContent: "center" }}><I name="ellipsis-vertical" size={14} /></span>}
    </span>
  )
}

export function SceneUCAdTesting({ active, onDone, runKey = 0, hold, playFrom, onTime }: SceneProps): JSX.Element {
  ensureCss()
  const cur = useCursor(APP_CURSOR_START)
  const [grown, setGrown] = React.useState(false)
  // hovered segment: [chart 0 = emotion / 1 = rating, concept row, segment key]
  const [hover, setHover] = React.useState<[number, number, string] | null>(null)

  useScene(active, async (p) => {
    setGrown(false); setHover(null); cur.hide()
    await p.sleep(500)
    setGrown(true)
    await p.sleep(2000)
    // Netflix's concept lands the most joy...
    cur.show("ad-0-1-happiness", 120, 140); await p.sleep(250)
    cur.move("ad-0-1-happiness"); await p.sleep(700)
    setHover([0, 1, "happiness"]); await p.sleep(1700)
    // ...and the best ratings; Paramount's the fewest top marks
    cur.move("ad-1-1-Excellent"); await p.sleep(700)
    setHover([1, 1, "Excellent"]); await p.sleep(1600)
    cur.move("ad-1-2-Excellent"); await p.sleep(550)
    setHover([1, 2, "Excellent"]); await p.sleep(1600)
    cur.move("ad-1-2-Excellent", 60, 90); await p.sleep(350)
    setHover(null); cur.hide()
    await p.sleep(1500)
  }, onDone, runKey, hold, playFrom, onTime)

  const bar = (chart: number, row: number, segs: Array<[string, number, string]>, n: number, gap: number) => (
    <div style={{ position: "relative", height: 8, marginTop: 9, borderRadius: 2, background: T.fill, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", gap, clipPath: grown ? "inset(0 0 0 0)" : "inset(0 100% 0 0)", transition: `clip-path 1s cubic-bezier(.22,1,.36,1) ${(chart * 3 + row) * 0.1}s` }}>
        {segs.filter(([, v]) => v > 0).map(([k, v, c]) => {
          const dim = hover && (hover[0] !== chart || hover[1] !== row || hover[2] !== k)
          return (
            <span key={k} data-cursor={`ad-${chart}-${row}-${k}`} style={{ flexGrow: v, flexBasis: 0, background: c, borderRadius: 2, opacity: dim && hover![0] === chart ? 0.35 : 1, transition: "opacity .25s" }} />
          )
        })}
      </div>
    </div>
  )
  const tip = (chart: number) => {
    if (!hover || hover[0] !== chart) return null
    const [, row, k] = hover
    const c = AD_CONCEPTS[row]
    const v = chart === 0 ? c.emo[k as ADEmotion] ?? 0 : c.rate[AD_RATINGS.findIndex((r) => r[0] === k)]
    return (
      <div key={k + row} className="ll-card ll-enter" style={{
        // the last rating row sits on the fold, so its tip opens upward
        position: "absolute", top: chart === 1 && row === 2 ? row * AD_ROW - 62 : row * AD_ROW + 64, right: 0, width: 210, zIndex: 2,
        padding: "10px 12px", boxShadow: "0 4px 16px rgba(0,0,0,.08)", fontSize: 12, lineHeight: "18px",
      }}>
        <div className="ll-500" style={{ marginBottom: 4 }}>{c.name} · {chart === 0 ? cap(k) : k}</div>
        <div style={{ display: "flex" }}><span style={{ color: T.inkSoft, flex: 1 }}>Responses</span><span className="ll-500">{v} of {c.n}</span></div>
        <div style={{ color: T.inkSoft, marginTop: 4 }}>{Math.round((v / c.n) * 100)}% of {c.name} responses</div>
      </div>
    )
  }
  const rows = (chart: number) => (
    <div style={{ position: "relative", marginTop: 18 }}>
      {AD_CONCEPTS.map((c, r) => {
        const segs: Array<[string, number, string]> = chart === 0
          ? AD_EMO_ORDER.map((e) => [e, c.emo[e] ?? 0, emoColor(e)])
          : AD_RATINGS.map(([label, col], i) => [label, c.rate[i], col])
        return (
          <div key={c.name} style={{ height: AD_ROW, display: "flex", alignItems: "center", gap: 12 }}>
            <ADThumb hue={c.hue} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "baseline", fontSize: 15 }}>
                <span className="ll-500" style={{ color: T.ink }}>{c.name}</span><span style={{ flex: 1 }} />
                <span style={{ color: T.inkSoft }}>{chart === 0 ? `${c.n} responses` : `(${c.n} responses)`}</span>
              </div>
              {bar(chart, r, segs, c.n, chart === 0 ? 3 : 3)}
            </div>
          </div>
        )
      })}
      {tip(chart)}
    </div>
  )

  return (
    <AppShell cursor={cur.state} nav={studyNav("Details")} title="HBO vs Netflix vs Paramount+ Concept Test" crumb={["Details"]}
      actions={<span className="ll-tbtn">Share <I name="link" size={14} /></span>}>
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <div style={{ padding: "26px 38px 0" }}>
          <div style={{ fontSize: 20, color: T.ink, letterSpacing: -0.2 }}>Brand Evaluation</div>

          {/* emotional concept comparison */}
          <div style={{ display: "flex", gap: 34, marginTop: 30 }}>
            <div style={{ width: AD_LEFT, flexShrink: 0, paddingTop: 10 }}>
              <ADLegend items={[...AD_EMO_ORDER.map((e): [string, string] => [cap(e), emoColor(e)])]} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span className="ll-500" style={{ fontSize: 18, color: T.ink, flex: 1 }}>Emotional Concept Comparison</span><ADCompare />
              </div>
              {rows(0)}
            </div>
          </div>

          {/* Q9 brand rating */}
          <div style={{ display: "flex", gap: 34, marginTop: 36 }}>
            <div style={{ width: AD_LEFT, flexShrink: 0 }}>
              <div style={{ background: T.chromeBg, borderRadius: 10, padding: "16px 16px 18px", fontSize: 17, lineHeight: "25px", color: T.ink }}>
                <span style={{ color: T.inkSoft }}>Q9:</span> How would you rate{" "}
                <span style={{ fontSize: 12.5, padding: "2px 6px", borderRadius: 5, background: "rgba(149, 64, 191, 0.10)", color: "#9540BF", verticalAlign: 1 }}>concept title</span>{" "}
                as a streaming service brand?
              </div>
              <div style={{ marginTop: 22 }}><ADLegend items={AD_RATINGS} /></div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span className="ll-500" style={{ fontSize: 18, color: T.ink, flex: 1 }}>Concept Comparison</span><ADCompare kebab />
              </div>
              {rows(1)}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
