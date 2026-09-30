// ListenScenes — live recreations of real Listen Labs product surfaces.
// Scenes 1–2 mirror the actual study-creation flow, rebuilt frame-by-frame
// from a screen recording of the product (2026-08-28): chip questions in
// chat, "Thinking…" shimmer beats, status-marker streams, and the doc
// filling in sync. Timing constants are measured from the recording.
// All full scenes are authored in the fixed 1120x640 design space.
import * as React from "react"
import {
  T, BareFrame, Chip, Caret, Donut, Waveform, DotSpinner, EmotionTag,
  EMOTIONS, Cursor, useScene, useCursor, ensureCss,
  BrowserWindow, PhoneShell, FRAME_W, FRAME_H, APP_W,
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
// Real page is ~1511px wide; the scene scales it by ~0.74 into 1120x640.
// live px × 0.74 (1512 → 1120)
const IV_COL_W = 408                 // 552px column
const IV_COL_X = (FRAME_W - IV_COL_W) / 2
const IV_INSET = 9                   // question text sits 12px inside the column
const IV_BTN_H = 30                  // 40px button
const IV_EDGE = 18                   // 24px bottom / right margins
const IV_CAM = 89                    // 120px webcam tile on question screens
const IV_Q_FONT = { fontSize: 17.8, lineHeight: "24.9px", letterSpacing: -0.36 } // 24/33.6, -0.48
const IV_PROGRESS = 0.3              // progress bar fill, this far into the study
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
  const cur = useCursor()
  const CARD_PAD = 6, STRIP_H = 44, ROW_H = 24
  const CARD_H = CARD_PAD * 2 + STRIP_H + 5 + ROW_H

  useScene(active, async (p) => {
    setPhase("idle"); setRecT(0); setWords(0); setEnabled(false); cur.hide()
    await p.sleep(700)
    cur.show("iv-start", -180, -110)
    await p.sleep(350)
    cur.move("iv-start")
    await p.sleep(750)
    cur.click(1); await p.sleep(250)
    setPhase("recording"); cur.hide()
    for (let i = 1; i <= IV_REC_MS / IV_TICK; i++) { await p.sleep(IV_TICK); setRecT(i * IV_TICK) }
    cur.show("iv-submit", -120, -90)
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
  const barBtn: React.CSSProperties = { height: 24, padding: "0 9px", borderRadius: 6, fontSize: 12, display: "inline-flex", alignItems: "center", gap: 5 }

  return (
    <BareFrame cursor={cur.state}>
      <div style={{ flex: 1, position: "relative" }}>
        {/* progress bar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "rgba(0, 0, 0, 0.1)" }}>
          <div style={{ width: `${IV_PROGRESS * 100}%`, height: "100%", background: T.brand }} />
        </div>
        {/* header: settings (Skip is admin-only, so participants don't see it) */}
        <div style={{ position: "absolute", top: 14, right: IV_EDGE, color: T.ink }}>
          <I name="settings" size={15} />
        </div>

        {/* question column */}
        <div style={{ position: "absolute", left: IV_COL_X + IV_INSET, top: 65, width: IV_COL_W - IV_INSET * 2 }}>
          <div style={{ ...IV_Q_FONT, color: T.ink, opacity: phase === "idle" || recording ? 1 : 0, transition: "opacity .3s ease" }}>
            {IV_QUESTION}
          </div>
          {phase === "loading" && (
            <div className="ll-enter" style={{ position: "absolute", top: 12, left: 0, display: "flex", gap: 8 }}>
              {[0, 1, 2].map((i) => (
                <span key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: T.ink, animation: "ll-pulse 1s ease-in-out infinite", animationDelay: `${i * 0.18}s` }} />
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
            <div className="ll-enter" style={{ height: CARD_H, borderRadius: 12, background: "#EEEEEE", padding: CARD_PAD, display: "flex", flexDirection: "column", gap: 5 }}>
              <DotStrip t={recT} w={IV_COL_W - CARD_PAD * 2} h={STRIP_H} />
              <div style={{ height: ROW_H, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ ...barBtn, border: `1px solid ${IV_RED}`, color: IV_RED, background: T.appBg }}>Pause <I name="circle-pause" size={12} /></span>
                <span style={{ flex: 1, textAlign: "center", color: IV_RED, fontSize: 12.5, fontVariantNumeric: "tabular-nums" }}>{mm(recT)}</span>
                <span data-cursor="iv-submit" style={{ ...barBtn, background: T.brand, color: "#FAFAFA" }}>Submit <I name="circle-stop" size={12} /></span>
              </div>
            </div>
          ) : (
            <button data-cursor="iv-start" className="ll-btn primary" style={{
              width: "100%", height: IV_BTN_H, borderRadius: 6, justifyContent: "center", fontSize: 11.8, letterSpacing: -0.24,
              background: phase === "idle" || enabled ? T.brand : "#ECEFFF", color: phase === "idle" || enabled ? "#FAFAFA" : T.brandFaint,
              transition: "background-color .35s ease, color .35s ease",
            }}>Start Recording</button>
          )}
        </div>

        {/* webcam tile */}
        <div style={{ position: "absolute", right: IV_EDGE, bottom: IV_EDGE, width: IV_CAM, height: IV_CAM, borderRadius: 6, overflow: "hidden", background: "linear-gradient(160deg, #E3DCCE 0%, #CFC7B6 55%, #B9AF9C 100%)" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 50% at 55% 60%, rgba(255,255,255,.4), transparent 70%)" }} />
          <span className="ll-avatar" style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: 30, height: 30, fontSize: 13 }}>M</span>
          {/* the participant: the clip covers the fallback avatar once it loads */}
          <ClipVideo t={phase === "idle" ? 0 : recording ? recT : IV_REC_MS} playing={recording && hold == null && active} />
          {recording && <span style={{ position: "absolute", top: 7, right: 7, width: 6, height: 6, borderRadius: "50%", background: IV_RED }} />}
        </div>

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

// ------------------------------------------- AI moderator scene (2 devices) --
// Live rebuild of the /features/ai-moderator page hero: a desktop Safari
// window on the participant question view, side by side with one iPhone (true
// device aspect) running the same interview. Session: questions stream on both
// surfaces, the recording timer ticks, the cursor advances the desktop
// question, and the phone starts recording.

const AIM_Q1 = "Tell me about the first time you used ChatGPT. What prompted you to try it and what was that experience like?"
const AIM_Q2 = "When do you reach for ChatGPT first instead of Google? Walk me through the last time that happened."
const AIM_P2 = "That's interesting that you were surprised by how well it worked. What specifically impressed you about the result?"

const AIM_NEXTQ = { x: 388, y: 586 }
const AIM_TIMER_BASE = 9 // the recording chip starts at 0:09 and ticks live

const fmtRec = (s: number) => `0:${String(s).padStart(2, "0")}`

export function SceneAIModerator({ active, onDone, runKey = 0, hold, playFrom, onTime }: SceneProps): JSX.Element {
  ensureCss()
  const cur = useCursor()
  const [vt, setVt] = React.useState(0) // master clock (ms) — drives both timers
  const [q, setQ] = React.useState("")
  const [qKey, setQKey] = React.useState(0)
  const [p2, setP2] = React.useState("")
  const [nextHover, setNextHover] = React.useState(false)
  const [recStart, setRecStart] = React.useState<number | null>(null)
  const [pressed, setPressed] = React.useState(false)

  useScene(active, async (p) => {
    setVt(0); setQ(""); setQKey(0); setP2(""); setNextHover(false); setRecStart(null); setPressed(false); cur.hide()
    let t = 0
    // sleeps advance the master clock so the recording chip ticks through
    // the whole session; typing advances it by its known duration after
    const slp = async (ms: number) => {
      const end = t + ms
      while (t < end) { const step = Math.min(250, end - t); await p.sleep(step); t += step; setVt(t) }
    }
    const stream = async (set: (s: string) => void, text: string) => {
      await p.type(set, text, AI_CPS)
      t += (text.length * 1000) / AI_CPS
      setVt(t)
    }
    await slp(400)
    await stream(setQ, AIM_Q1)
    await slp(500)
    await stream(setP2, AIM_P2)
    await slp(700)
    // advance the desktop question
    cur.show(AIM_NEXTQ.x, AIM_NEXTQ.y - 160); await slp(300)
    cur.move(AIM_NEXTQ.x, AIM_NEXTQ.y); await slp(550)
    setNextHover(true); await slp(200)
    cur.click(1); await slp(180)
    setNextHover(false); setQ(""); setQKey(1)
    await slp(350)
    await stream(setQ, AIM_Q2)
    await slp(500)
    cur.hide()
    // the second phone starts recording
    setPressed(true); await slp(180)
    setPressed(false); setRecStart(t)
    await slp(2800)
  }, onDone, runKey, hold, playFrom, onTime)

  const sec = AIM_TIMER_BASE + Math.floor(vt / 1000)
  const recSec = recStart != null ? Math.floor((vt - recStart) / 1000) : null

  const phoneQ = (text: string, full: string) => (
    <div style={{ padding: "0 18px", marginTop: 104, fontSize: 13.5, lineHeight: 1.55, color: T.ink }}>
      {text}{text.length > 0 && text.length < full.length && <Caret />}
    </div>
  )
  const readAloudPill = (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: T.body }}>
      <span style={{ width: 12, height: 12, border: `1.5px solid ${T.appBorder}`, borderRadius: 3 }} />
      Read aloud <I name="audio-lines" size={11} style={{ color: T.inkSoft }} />
    </span>
  )

  return (
    // transparent root — the devices float directly on the canvas fill,
    // flat with borders (no legacy image shadows/background)
    <div className="ll" style={{ position: "relative", width: FRAME_W, height: FRAME_H, overflow: "hidden", fontFamily: T.font }}>
      {/* desktop participant view */}
      <BrowserWindow progress={0.28} style={{ position: "absolute", left: 8, top: 14, width: 780, height: 660 }}>
        <div style={{ position: "absolute", inset: 0, padding: "14px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 30, padding: "0 12px", border: `1px solid ${T.appBorder}`, borderRadius: 8, fontSize: 12.5 }}>
              English <I name="chevron-down" size={12} style={{ color: T.inkSoft }} />
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", height: 30, padding: "0 12px", border: `1px solid ${T.appBorder}`, borderRadius: 8 }}>
              {readAloudPill}
            </span>
            <span style={{ flex: 1 }} />
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontVariantNumeric: "tabular-nums", marginRight: 96 }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#E5484D" }} className="ll-dim-pulse" />
              {fmtRec(sec)}
            </span>
          </div>
          <div key={qKey} className="ll-scene-fade" style={{ margin: "96px auto 0", width: 560, fontSize: 23, lineHeight: 1.45, color: T.ink }}>
            {q}{q.length > 0 && q.length < (qKey === 0 ? AIM_Q1 : AIM_Q2).length && <Caret />}
          </div>
          <div style={{ position: "absolute", left: 110, right: 110, bottom: 26 }}>
            <div style={{ textAlign: "center", fontSize: 14, color: T.inkSoft, marginBottom: 16 }}>Skip question</div>
            <div style={{ height: 44, borderRadius: 6, background: nextHover ? "#000" : T.ink, color: "#FAFAFA", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, transition: "background .2s" }}>
              Next question
            </div>
          </div>
        </div>
      </BrowserWindow>

      {/* the same interview, on mobile — true device aspect (height derives
          from width inside PhoneShell) */}
      <PhoneShell width={258} progress={0.3} statusIcons moreButton style={{ position: "absolute", left: 838, top: 40 }}>
        <div style={{ padding: "12px 18px 0" }}>{readAloudPill}</div>
        {phoneQ(p2, AIM_P2)}
        <div style={{ position: "absolute", left: 12, right: 12, bottom: 12, height: 40, borderRadius: 8, background: recSec != null ? "#FFF" : T.ink, border: recSec != null ? "1.5px solid #E5484D" : "1.5px solid transparent", color: recSec != null ? "#E5484D" : "#FAFAFA", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, fontSize: 12.5, transform: pressed ? "scale(.96)" : "none", transition: "transform .15s, background .25s, color .25s, border .25s", fontVariantNumeric: "tabular-nums" }}>
          {recSec != null ? (
            <><span className="ll-dim-pulse" style={{ width: 8, height: 8, borderRadius: "50%", background: "#E5484D" }} />Recording {fmtRec(recSec)}</>
          ) : "Start recording"}
        </div>
      </PhoneShell>

      <Cursor {...cur.state} />
    </div>
  )
}

// ----------------------------------------------- EI use-case cards --------
// The four "Use cases" cards at the bottom of /features/emotional-intelligence,
// rebuilt as live fragments. Same language and concepts as the site; content
// re-grounded in the Gen Z ChatGPT study. Media is stylized DOM (no photos).

export const EI_USECASE_W = 340
export const EI_USECASE_H = 300

/** moderator question bubble that types in */
function UCBubble({ text, full }: { text: string; full: string }): JSX.Element {
  return (
    <div style={{ display: "inline-block", maxWidth: 250, background: "#FFF", border: `1px solid ${T.appBorder}`, borderRadius: 14, borderBottomLeftRadius: 4, padding: "9px 13px", fontSize: 12.5, lineHeight: 1.5, minHeight: 56, boxSizing: "border-box" }}>
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

/** Use case 1 — Creative/Ad Testing */
export function FragmentEIUseCaseAdTesting({ active, onDone, runKey = 0, hold, playFrom, onTime }: SceneProps): JSX.Element {
  ensureCss()
  const [q, setQ] = React.useState("")
  const [stage, setStage] = React.useState(0)
  useScene(active, async (p) => {
    setQ(""); setStage(0)
    await p.sleep(500)
    await p.type(setQ, UC_AD_Q, AI_CPS)
    await p.sleep(350)
    setStage(1)
    await p.sleep(800)
    setStage(2)
    await p.sleep(2600)
  }, onDone, runKey, hold, playFrom, onTime)
  return (
    <div style={{ width: EI_USECASE_W, height: EI_USECASE_H, position: "relative", fontFamily: T.font, paddingTop: 20, boxSizing: "border-box" }}>
      <UCBubble text={q} full={UC_AD_Q} />
      {stage >= 1 && (
        <div className="ll-enter" style={{ position: "absolute", left: 72, top: 96 }}>
          <UCAdTile bg={T.brand} headline="Your 2am study buddy." caption="Concept A · Study Buddy" w={196} h={172} />
        </div>
      )}
      <div style={{ position: "absolute", left: 48, top: 252, minHeight: 28 }}>
        {stage >= 2 && <UCChip emotion="happiness" />}
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

/** Use case 4 — UX Research (task-based, on mobile) */
export function FragmentEIUseCaseUX({ active, onDone, runKey = 0, hold, playFrom, onTime }: SceneProps): JSX.Element {
  ensureCss()
  const [typed, setTyped] = React.useState("")
  const [tag, setTag] = React.useState(false)
  const PROMPT = "help me plan a budget for my first apartment"
  useScene(active, async (p) => {
    setTyped(""); setTag(false)
    await p.sleep(700)
    await p.type(setTyped, PROMPT, USER_CPS)
    await p.sleep(400)
    setTag(true)
    await p.sleep(2600)
  }, onDone, runKey, hold, playFrom, onTime)
  return (
    <div style={{ width: EI_USECASE_W, height: EI_USECASE_H, position: "relative", overflow: "hidden", fontFamily: T.font }}>
      {/* the task, mid-flight on a phone that bleeds off the card */}
      <PhoneShell width={172} time="2:47" statusIcons style={{ position: "absolute", left: 84, top: 12 }}>
        <div style={{ padding: "18px 14px 0" }}>
          <div className="ll-500" style={{ fontSize: 14, lineHeight: 1.35 }}>What do you want to get done?</div>
          <div style={{ marginTop: 12, position: "relative", border: `1px solid ${T.appBorder}`, borderRadius: 10, padding: "8px 26px 8px 10px", fontSize: 11, lineHeight: 1.45, minHeight: 46, color: typed ? T.ink : T.inkFaint, boxSizing: "border-box" }}>
            {typed || "Ask anything…"}{typed.length > 0 && typed.length < PROMPT.length && <Caret />}
            <span style={{ position: "absolute", right: 6, bottom: 6, width: 18, height: 18, borderRadius: 9, background: typed ? T.brand : T.fill, color: typed ? "#FFF" : T.inkSoft, display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "background .3s" }}>
              <I name="arrow-up" size={11} />
            </span>
          </div>
          <div style={{ display: "flex", gap: 5, marginTop: 8, flexWrap: "wrap" }}>
            {["Budget", "Study plan", "Email draft"].map((c) => (
              <span key={c} style={{ fontSize: 9.5, border: `1px solid ${T.appBorder}`, borderRadius: 10, padding: "3px 8px", color: T.inkSoft }}>{c}</span>
            ))}
          </div>
        </div>
      </PhoneShell>
      <div style={{ position: "absolute", left: 16, top: 210, minHeight: 28 }}>
        {tag && <UCChip emotion="surprise" />}
      </div>
    </div>
  )
}
