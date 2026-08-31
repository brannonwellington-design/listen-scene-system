// ListenScenes — live recreations of real Listen Labs product surfaces.
// Scenes 1–2 mirror the actual study-creation flow, rebuilt frame-by-frame
// from a screen recording of the product (2026-08-28): chip questions in
// chat, "Thinking…" shimmer beats, status-marker streams, and the doc
// filling in sync. Timing constants are measured from the recording.
// All full scenes are authored in the fixed 1120x640 design space.
import * as React from "react"
import {
  T, ProductFrame, Chip, Caret, Donut, Waveform, DotSpinner, EmotionTag,
  EMOTIONS, Logo, Cursor, useScene, useCursor, ensureCss,
} from "./ListenKit"
import { I } from "./ListenIcons"

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
            <span style={{ width: 24, height: 24, borderRadius: 7, background: T.dark, color: "#FAFAFA", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><I name="square" size={9} style={{ fill: "currentColor" } as React.CSSProperties} /></span>
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
          <div key={o} style={{
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

/** the chat bubble's resting rect in design space — flight target while the
 *  layout is still settling; a runtime measure corrects the landing */
const BUBBLE_TO: Rect = { x: 106, y: 91, w: 236, h: 56 }

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
const GOAL_TEXT = "I want to know how Gen Z uses ChatGPT in their daily lives"
const STUDY_TITLE = "Gen Z (Early-Career) Daily ChatGPT Use"
const GOAL_PARA = "Build a grounded picture of how Gen Z early-career professionals actually use ChatGPT day to day, to inform general market/trend understanding."
const KEY_QS = [
  "What specific tasks do they use ChatGPT for at work and in personal life?",
  "How often and at what moments does it come up in their day?",
  "Where do they trust it, where do they not, and how do they verify?",
]
const RECAP = "I've set the study up around how Gen Z early-career professionals actually use ChatGPT day to day. Does that cover what you want to learn?"

const TEMPLATES: Array<[string, string, string, boolean?]> = [
  ["MARKET RESEARCH", "What makes AI research feel trustworthy to enterprise buyers?", "Understand the proof points that turn interest into purchase confidence."],
  ["PRODUCT RESEARCH", "How do research teams adopt continuous customer discovery?", "Find the workflows and triggers that drive repeat research usage."],
  ["BRAND RESEARCH", "What messaging clarifies Listen Labs' value for broader buyers?", "Identify language that makes the product easier to understand.", true],
  ["PRODUCT FEEDBACK", "How can AI interviews preserve depth while scaling research?", "Explore what makes automated interviews feel genuinely insightful."],
]

const SIDEBAR_NAV: Array<[string, string, boolean?]> = [
  ["notepad-text", "Studies"],
  ["sparkles", "Research Library", true],
  ["layers", "Workspace"],
  ["chart-column", "Usage & Billing"],
  ["user", "Account"],
  ["mail", "Emails"],
  ["shield", "Admin"],
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
    const s = rb.width / 1120
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
  const cur = useCursor()
  const OPT = (i: number) => ({ x: 184, y: 346 + i * 31 }) // bottom-anchored chip-question rows

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
      // fly into the rail in the same breath as the sidebar collapse,
      // targeting the bubble's known design-space rect
      setPhase("editor")
      setMorph((m) => m && { ...m, to: BUBBLE_TO })
      await p.sleep(700)
      // pixel-perfect handoff: correct onto the real bubble, then reveal it
      const exact = measure(bubbleRef.current)
      if (exact) { setMorph((m) => m && { ...m, to: exact }); await p.sleep(160) }
      setMorph(null)
    } else {
      setPhase("editor")
    }
    await p.sleep(500)
    setThinking(true)
    await p.sleep(1100)
    setThinking(false)
    setQuestion(1)
    // cursor picks option 3 ("General market/trend understanding")
    cur.show(OPT(2).x, OPT(2).y + 160); await p.sleep(300)
    cur.move(OPT(2).x, OPT(2).y); await p.sleep(550)
    setHovered(2); await p.sleep(250)
    cur.click(1); await p.sleep(200); setHovered(-1); setPicked(2)
    await p.sleep(500)
    setQuestion(2); setPicked(-1)
    // option 2 ("Early-career professionals")
    cur.move(OPT(1).x, OPT(1).y); await p.sleep(550)
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

  // -- unified scaffold: the off-white surround, top bar, and white card all
  // persist across entry → editor, so the morph never blanks or "reloads".
  const isEditor = phase === "editor"
  const settle = "cubic-bezier(.22, 1, .36, 1)"
  const collapse = `.68s ${settle}` // matched to the morph flight
  return (
    <div ref={rootRef} className="ll" style={{ position: "relative", width: "100%", height: "100%" }}>
      <div className="ll-frame">
        {/* persistent top bar: entry breadcrumb ⇄ editor chrome, crossfaded */}
        <div className="ll-topbar" style={{ position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", padding: "0 16px", opacity: isEditor ? 0 : 1, transition: "opacity .35s ease" }}>
            <span style={{ width: 204, flexShrink: 0 }} />
            <I name="panel-left-close" size={15} style={{ color: T.inkSoft }} />
            <span style={{ position: "absolute", left: 0, right: 0, textAlign: "center", fontSize: 13 }}>
              <span style={{ color: T.inkSoft }}>Brannon's Personal / </span><span className="ll-500">Create</span>
            </span>
          </div>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", gap: 12, padding: "0 16px", opacity: isEditor ? 1 : 0, transition: "opacity .35s ease" }}>
            <Logo />
            <span style={{ color: T.inkFaint }}>/</span>
            <span style={{ fontSize: 14 }}>{docTitle}</span>
            <I name="chevrons-up-down" size={13} style={{ color: T.inkSoft }} />
            <span style={{ position: "absolute", left: 0, right: 0, textAlign: "center", fontSize: 14 }}>
              <span className="ll-500">Create</span>
              <span style={{ color: T.inkFaint }}>  ›  </span>
              <span style={{ color: T.inkFaint }}>Review</span>
            </span>
            <span style={{ flex: 1 }} />
            <span style={{ color: T.inkSoft, fontSize: 13 }}>Just saved</span>
          </div>
        </div>
        <div className="ll-body">
          {/* entry workspace sidebar collapses as the editor takes over */}
          <div style={{ width: isEditor ? 0 : 212, opacity: isEditor ? 0 : 1, overflow: "hidden", flexShrink: 0, transition: `width ${collapse}, opacity .35s ease` }}>
          <div style={{ width: 212, height: "100%", boxSizing: "border-box", padding: "4px 10px 12px", fontSize: 12.5, color: T.inkSoft, display: "flex", flexDirection: "column", gap: 1 }}>
            <div className="ll-500" style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 6px 10px", color: T.ink, fontSize: 13 }}>
              <svg width="15" height="15" viewBox="0 0 16 16"><g stroke={T.ink} strokeWidth="1.6" strokeLinecap="round"><path d="M8 2v12" /><path d="M2.8 5l10.4 6" /><path d="M13.2 5L2.8 11" /></g></svg>
              Brannon's Personal
              <span style={{ flex: 1 }} />
              <I name="chevrons-up-down" size={11} style={{ color: T.inkFaint }} />
            </div>
            <div style={{ fontSize: 10.5, color: T.inkFaint, padding: "0 6px 6px" }}>Brannon's Personal Workspace</div>
            {SIDEBAR_NAV.map(([icon, n, isNew]) => (
              <div key={n} style={{ padding: "5px 6px", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
                <I name={icon} size={13} />
                {n}
                {isNew && <span className="ll-chip blue" style={{ height: 16, fontSize: 9, padding: "0 6px" }}>New</span>}
                {isNew && <I name="chevron-down" size={10} style={{ marginLeft: "auto", transform: "rotate(-90deg)" }} />}
              </div>
            ))}
            <span style={{ flex: 1 }} />
            <div style={{ padding: "5px 6px", display: "flex", alignItems: "center", gap: 8 }}><I name="users" size={13} /> Listen Twins</div>
            <div style={{ borderTop: `1px solid ${T.appBorder}`, marginTop: 8, paddingTop: 10, display: "flex", alignItems: "center", gap: 8, padding: "10px 6px 2px" }}>
              <span className="ll-avatar" style={{ background: T.fill, color: T.inkSoft, width: 24, height: 24, fontSize: 10 }}>BW</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: T.ink, fontSize: 12 }}>Brannon Wellington</div>
                <div style={{ fontSize: 10, color: T.inkFaint }}>brannon@listenlabs.ai</div>
              </div>
              <I name="log-out" size={12} style={{ marginLeft: "auto", flexShrink: 0 }} />
            </div>
          </div>
          </div>
          {/* persistent white content card: entry content ⇄ editor content */}
          <div className="ll-content-card" style={{ marginLeft: isEditor ? 8 : 0, transition: `margin-left ${collapse}` }}>
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
            <div style={{ color: T.body }}>Welcome! Great topic — Gen Z and ChatGPT in everyday life. Let me ask one thing to sharpen the focus.</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: T.inkSoft }}>
              <I name="sparkles" size={12} /> Waiting for selection...
            </div>
          </>
        )}
        {question === 1 && (
          <ChipQuestion title="What decision should this study inform?" footer="1 of 2"
            options={["Build a product/feature for Gen Z", "Shape marketing or positioning", "General market/trend understanding", "Content or thought-leadership report", "Something else..."]}
            hovered={hovered} picked={picked} />
        )}
        {question === 2 && (
          <ChipQuestion title="Which slice of Gen Z matters most?" footer="2 of 2"
            options={["Students (high school/university)", "Early-career professionals", "Both", "Any Gen Z (18–27)", "Something else..."]}
            hovered={hovered} picked={picked} />
        )}
        {question === 3 && (
          <AnsweredCard qa={[["What decision should this study inform?", "General market/trend understanding"], ["Which slice of Gen Z matters most?", "Early-career professionals"]]} />
        )}
        {thinking && question >= 1 && <Thinking />}
        {markers.map(([icon, text, act]) => <Marker key={text} icon={icon} text={text} active={act} />)}
        {markers.some((m) => m[2]) && <DotSpinner size={18} />}
        {recap && <div style={{ color: T.body }}>{recap}{recap.length < RECAP.length && <Caret />}</div>}
        {nextBtn && <button className="ll-btn primary ll-enter" style={{ alignSelf: "flex-end", height: 28, fontSize: 13 }}>Next step →</button>}
      </ChatShell>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <DocStrip />
        <div style={{ flex: 1, padding: "16px 105px 0" }}>
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
          </div>
        </div>
        <Cursor {...cur.state} />
      </div>
      {morph && <MorphCard {...morph} />}
    </div>
  )
}

// ================================================ 2. Reach the right people =
const SETUP_TEXT = "Setting up US recruitment (ages 18–27) and a screener that narrows to early-career professionals who actually use ChatGPT."

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
  const cur = useCursor()
  const SRC_BTN = { x: 184, y: 262 }
  const COPT = (i: number) => ({ x: 184, y: 357 + i * 31 })
  const ADJUST = "Happy with this, or want to adjust anything (e.g. include part-time workers, different sample size)?"

  const MSG = "Great! Now let's determine how you'll find participants for your research. Which option do you want to go for?"

  useScene(active, async (p) => {
    setStep(2); setAiMsg(""); setSrcHover(-1); setSrcPicked(false); setThinking(false)
    setCountry(0); setCHover(-1); setCPicked(-1); setSetupText(""); setMarkers([])
    setAudStage(0); setScreener(false); setAdjust(""); setSuggestions(false); cur.hide()
    await p.sleep(700)
    await p.type(setAiMsg, MSG, AI_CPS)
    await p.sleep(400)
    cur.show(SRC_BTN.x, SRC_BTN.y + 180); await p.sleep(300)
    cur.move(SRC_BTN.x, SRC_BTN.y); await p.sleep(550)
    setSrcHover(0); await p.sleep(250)
    cur.click(1); await p.sleep(200)
    setSrcHover(-1); setSrcPicked(true); setAudStage(1)
    await p.sleep(500)
    setThinking(true); await p.sleep(800); setThinking(false)
    setMarkers([["history", "Updated participant source"]])
    await p.sleep(600)
    setStep(3); setMarkers([]); setCountry(1)
    cur.move(COPT(0).x, COPT(0).y); await p.sleep(550)
    setCHover(0); await p.sleep(250)
    cur.click(2); await p.sleep(200); setCHover(-1); setCPicked(0)
    await p.sleep(450)
    cur.hide(); setCountry(2)
    await p.type(setSetupText, SETUP_TEXT, AI_CPS)
    setMarkers([["users", "Updating audience", true]])
    await p.sleep(900)
    setMarkers([["users", "Added audience"]]); setAudStage(2)
    await p.sleep(MARKER_MS)
    setMarkers((m) => [...m, ["user-round-plus", "Added recruitment group"]])
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

  const srcBtn = (icon: string, label: string, sub: string, hovered: boolean): JSX.Element => (
    <div style={{
      background: hovered ? "#E7E7E7" : T.fill, borderRadius: 10, padding: "9px 12px", fontSize: 12.5,
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
    <ProductFrame title={STUDY_TITLE} variant="builder" cursor={cur.state}>
      <ChatShell
        step={step === 2 ? "Step 2 / 5 · Choose participant source" : "Step 3 / 5 · Find your audience"}
        placeholder={step === 2 ? "Choose participant source" : "Suggest changes to the screening questions..."}
        busy={thinking || markers.some((m) => m[2])}
      >
        {aiMsg && !srcPicked && <div style={{ color: T.body }}>{aiMsg}{aiMsg.length < MSG.length && <Caret />}</div>}
        {aiMsg.length >= MSG.length && !srcPicked && (
          <>
            {srcBtn("users", "Listen finds participants for me", "Use our network of 50M+ global participants", srcHover === 0)}
            {srcBtn("link", "I'll bring my own participants", "Share a link via Email or in-app message", srcHover === 1)}
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
            options={["United States", "United Kingdom", "United States + United Kingdom", "Something else..."]}
            hovered={cHover} picked={cPicked} />
        )}
        {country === 2 && <AnsweredCard qa={[["Which country should participants live in?", "United States"]]} />}
        {setupText && <div style={{ color: T.body }}>{setupText}{setupText.length < SETUP_TEXT.length && <Caret />}</div>}
        {markers.map(([icon, text, act]) => <Marker key={text} icon={icon} text={text} active={act} />)}
        {markers.some((m) => m[2]) && <DotSpinner size={18} />}
        {screener && (
          <div className="ll-enter" style={{ color: T.body, fontSize: 12.5, lineHeight: 1.45 }}>
            <div className="ll-500">Screener (4 questions):</div>
            <ul style={{ paddingLeft: 18, marginTop: 3, display: "flex", flexDirection: "column", gap: 2 }}>
              <li>Apps used in past month — ChatGPT hidden among Spotify, Venmo, Notion</li>
              <li>Years in the workforce → 5 years or less (early-career)</li>
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
            {["Narrow the workforce screener to 3 years or less", "Increase sample size from 100 to 200 participants", "Also allow part-time workers to qualify"].map((s) => (
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
              <div className="ll-enter" style={{ marginTop: 12, borderLeft: `2px solid ${T.brandFaint}`, paddingLeft: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5 }}>
                  <span className="ll-500">US General Audience</span>
                  <Chip>Draft</Chip>
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <span className="ll-chip" style={{ height: 26, fontSize: 12, color: T.ink }}><I name="users" size={12} /> 100</span>
                  <span style={{ color: T.inkFaint, fontSize: 11 }}>×</span>
                  {["United States", "Ages 18–27", "General Population"].map((c) => (
                    <span key={c} className="ll-chip" style={{ height: 26, fontSize: 12, color: T.ink }}>{c} <I name="chevron-down" size={10} style={{ color: T.inkSoft }} /></span>
                  ))}
                </div>
                <div style={{ marginTop: 14, fontSize: 12, color: T.inkSoft, display: "flex", justifyContent: "center", alignItems: "center", gap: 6 }}>
                  <I name="plus" size={11} /> New recruitment
                </div>
              </div>
            </>
          ) : (
            <div style={{ marginTop: 10, fontSize: 13, color: T.inkFaint }}>Your target audience will be displayed here</div>
          )}
          <Divider />
          <div className="ll-enter" style={audStage >= 2 ? { borderLeft: `2px solid ${T.brandFaint}`, paddingLeft: 14 } : undefined}>
            <Chip>{<I name="message-circle" size={12} />} Welcome Message</Chip>
            {audStage >= 2 && <div className="ll-500" style={{ marginTop: 10, fontSize: 15 }}>Welcome</div>}
            <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.55, color: T.body }}>
              {audStage >= 2
                ? "Thanks for your interest. We'll start with a few quick questions to see if you're a fit for this study, and then move into a short conversation about your everyday experiences."
                : "Welcome! I would like to ask you a couple of questions."}
            </div>
            <div style={{ marginTop: 12, border: `1px solid ${T.appBorder}`, borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13 }}>Consent checkbox <I name="info" size={11} style={{ color: T.inkFaint, verticalAlign: -1 }} /></div>
                <div style={{ fontSize: 11.5, color: T.inkSoft, marginTop: 2 }}>Optionally require users consent before beginning the study.</div>
              </div>
              <span style={{ width: 34, height: 19, borderRadius: 10, background: "#DDDDDD", position: "relative", flexShrink: 0 }}>
                <span style={{ position: "absolute", left: 2, top: 2, width: 15, height: 15, borderRadius: "50%", background: "#FFF", boxShadow: T.shadow }} />
              </span>
            </div>
          </div>
          {audStage >= 3 && (
            <div className="ll-enter">
              <Divider />
              <div style={{ display: "flex", gap: 8 }}>
                <Chip>Screening Section</Chip>
                <span style={{ fontSize: 12, color: T.inkSoft, alignSelf: "center" }}>4 Questions</span>
              </div>
              <div style={{ marginTop: 12, borderLeft: `2px solid ${T.brandFaint}`, paddingLeft: 14 }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <Chip>{<I name="circle-help" size={11} />} Q1</Chip>
                  <Chip>Multiple choice <I name="chevron-down" size={10} /></Chip>
                </div>
                <div style={{ marginTop: 8, fontSize: 14 }}>Which of these apps have you used in the past month?</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProductFrame>
  )
}

// ================================================== 3. Interview at scale ===
export function SceneInterviewScale({ active, onDone, runKey = 0, hold, playFrom, onTime }: SceneProps): JSX.Element {
  ensureCss()
  const [recording, setRecording] = React.useState(false)
  const [timer, setTimer] = React.useState(0)
  const [answer, setAnswer] = React.useState("")
  const cur = useCursor()
  const REC = { x: 560, y: 574 } // Start Recording button, design coords
  const ANSWER = "Honestly, it's become my first tab of the day. I use it to draft emails, break down readings for class, and sanity-check my code before I push it..."

  useScene(active, async (p) => {
    setRecording(false); setTimer(0); setAnswer(""); cur.hide()
    await p.sleep(700)
    cur.show(REC.x - 200, REC.y - 120)
    await p.sleep(350)
    cur.move(REC.x, REC.y)
    await p.sleep(750)
    cur.click(1); await p.sleep(250)
    setRecording(true)
    cur.hide()
    await p.sleep(600)
    // type in ~1s chunks, advancing the timer on the same virtual clock so
    // scrub mode shows the correct elapsed time at any position
    const CPS3 = 24
    for (let i = 0; i < ANSWER.length; i += CPS3) {
      await p.type((s) => setAnswer(ANSWER.slice(0, i) + s), ANSWER.slice(i, i + CPS3), CPS3)
      setTimer(Math.floor(i / CPS3) + 1)
    }
    await p.sleep(2200)
  }, onDone, runKey, hold, playFrom, onTime)

  const mm = (s: number) => `0:${String(s).padStart(2, "0")}`
  return (
    <ProductFrame variant="bare" cursor={cur.state}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 0 24px", position: "relative" }}>
        <div style={{ fontSize: 12 }}>
          <span style={{ color: T.inkSoft }}>Section 1 / </span>
          <span>Question 5</span>
        </div>
        <div style={{ marginTop: 28, fontSize: 24, lineHeight: 1.4, textAlign: "center", maxWidth: 560, color: T.body }}>
          Can you tell me more about how you're using ChatGPT in your day-to-day work?
        </div>
        <div style={{ marginTop: 32, maxWidth: 560, minHeight: 120, fontSize: 15, lineHeight: 1.65, textAlign: "center", color: T.inkSoft, display: "flex", flexDirection: "column", alignItems: "center" }}>
          {!recording && <span style={{ marginTop: 36 }}><DotSpinner size={30} /></span>}
          <span>{answer}{recording && answer.length < ANSWER.length && <Caret />}</span>
        </div>
        <span style={{ flex: 1 }} />
        <button className="ll-btn dark" style={{ width: 420, height: 40, borderRadius: 8, justifyContent: "center", fontSize: 14 }}>
          {recording ? (
            <>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#E5484D" }} className="ll-enter" />
              <Waveform />
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{mm(timer)}</span>
            </>
          ) : (
            "Start Recording"
          )}
        </button>
        {/* participant video bubble */}
        <div style={{ position: "absolute", right: 24, bottom: 24, width: 104, height: 78, borderRadius: 8, background: "linear-gradient(135deg, #DCD6C9, #C9C2B2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span className="ll-avatar" style={{ width: 30, height: 30, fontSize: 13 }}>M</span>
          {recording && <span style={{ position: "absolute", top: 6, left: 8, width: 7, height: 7, borderRadius: "50%", background: "#E5484D" }} />}
        </div>
        {/* scale strip */}
        <div style={{ position: "absolute", left: 24, bottom: 24, fontSize: 12, color: T.inkSoft, display: "flex", alignItems: "center", gap: 8 }}>
          <Chip kind="live">127 interviews live</Chip>
          <span>24/7 · 120+ languages</span>
        </div>
      </div>
    </ProductFrame>
  )
}

// ============================================ 4. Deliver meaningful results =
const BULLETS: Array<Array<string | { stat: string }>> = [
  [{ stat: "89%" }, " use AI at least weekly, while ", { stat: "85%" }, " used it to extend their own thinking rather than hand over the task."],
  ["ChatGPT owns the default; rivals need a specific job to win: ", { stat: "96%" }, " used ChatGPT in the past month."],
  [{ stat: "77%" }, " worry about dependency or overuse, and ", { stat: "65%" }, " fear erosion of critical thinking. Users want better assistance, not less agency."],
]

export function SceneDeliverResults({ active, onDone, runKey = 0, hold, playFrom, onTime }: SceneProps): JSX.Element {
  ensureCss()
  const [title, setTitle] = React.useState("")
  const [showH2, setShowH2] = React.useState(false)
  const [bullets, setBullets] = React.useState(0)
  const TITLE = "Gen Z wants AI to make them stronger, not smaller"

  useScene(active, async (p) => {
    setTitle(""); setShowH2(false); setBullets(0)
    await p.sleep(700)
    await p.type(setTitle, TITLE, 40)
    await p.sleep(400)
    setShowH2(true)
    await p.sleep(600)
    for (let i = 1; i <= BULLETS.length; i++) { setBullets(i); await p.sleep(750) }
    await p.sleep(2600)
  }, onDone, runKey, hold, playFrom, onTime)

  return (
    <ProductFrame title="Gen Z ChatGPT Usage Study" variant="analysis" activeTab="Report">
      {/* reports sidebar */}
      <div style={{ width: 252, borderRight: `1px solid ${T.appBorder}`, padding: "16px 12px", fontSize: 13, display: "flex", flexDirection: "column", gap: 2 }}>
        <div className="ll-500" style={{ padding: "0 8px 10px", fontSize: 13, display: "flex", alignItems: "center" }}>Reports <span style={{ flex: 1 }} /><I name="panel-left-close" size={14} style={{ color: T.inkSoft }} /></div>
        <div style={{ padding: "6px 8px", display: "flex", alignItems: "flex-start", gap: 0 }}>
          <div style={{ flex: 1 }}>
            Create new report
            <div style={{ fontSize: 11, color: T.inkSoft, marginTop: 2 }}>Start with a blank report</div>
          </div>
          <I name="plus" size={14} style={{ color: T.inkSoft, marginTop: 2 }} />
        </div>
        <div style={{ padding: "6px 8px", display: "flex", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            Ask AI to make a report
            <div style={{ fontSize: 11, color: T.inkSoft, marginTop: 2 }}>Creates a new AI report from your prompt</div>
          </div>
          <I name="sparkles" size={14} style={{ color: T.inkSoft, marginTop: 2 }} />
        </div>
        <div style={{ padding: "14px 8px 4px", fontSize: 11, color: T.inkSoft }}>Autogenerated</div>
        <div style={{ padding: "6px 8px", background: T.fill, borderRadius: 8 }}>
          Listen Labs Report
          <div style={{ fontSize: 11, color: T.inkSoft, marginTop: 2 }}>Aug 24 · Generated by Listen Labs</div>
        </div>
      </div>
      {/* report document */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ display: "flex", gap: 16, padding: "12px 32px", fontSize: 13, color: T.inkSoft, justifyContent: "flex-end", alignItems: "center" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>Share <I name="link" size={13} /></span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>Edit <I name="square-pen" size={13} /></span>
          <Chip kind="blue">New</Chip>
          <I name="download" size={14} /><I name="ellipsis" size={14} />
        </div>
        <div style={{ flex: 1, padding: "16px 88px 0", overflow: "hidden" }}>
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
        </div>
      </div>
    </ProductFrame>
  )
}

// ============================================== 5. Compound your learnings ==
const SUGGESTIONS = [
  ["lightbulb", "Brainstorm topics for further research"],
  ["presentation", "Create slides that summarize the main findings"],
  ["circle-alert", "Show me unexpected findings and outlier opinions"],
  ["chart-column", "What is the fastest growing tool being used by Gen Z?"],
  ["circle-help", "What bothers Gen Z the most about AI tools?"],
  ["table", "Create a table of quotes about ChatGPT saving time"],
]

export function SceneCompound({ active, onDone, runKey = 0, hold, playFrom, onTime }: SceneProps): JSX.Element {
  ensureCss()
  const [loading, setLoading] = React.useState(true)
  const [picked, setPicked] = React.useState(-1)
  const [hovered, setHovered] = React.useState(-1)
  const [query, setQuery] = React.useState("")
  const [thinking, setThinking] = React.useState(false)
  const [answer, setAnswer] = React.useState("")
  const cur = useCursor()
  const CARD4 = { x: 380, y: 424 } // suggestion card row 2, col 1
  const ANSWER = "Across 380 interviews, Gemini is the fastest growing — up 18 points since your March study — while ChatGPT still owns daily habits."

  useScene(active, async (p) => {
    setLoading(true); setPicked(-1); setHovered(-1); setQuery(""); setThinking(false); setAnswer(""); cur.hide()
    await p.sleep(1100)
    setLoading(false)
    await p.sleep(700)
    cur.show(CARD4.x + 300, CARD4.y + 120)
    await p.sleep(350)
    cur.move(CARD4.x, CARD4.y)
    await p.sleep(550)
    setHovered(3)
    await p.sleep(300)
    cur.click(1); await p.sleep(250)
    setHovered(-1); setPicked(3)
    await p.sleep(400)
    cur.hide()
    setQuery(SUGGESTIONS[3][1])
    await p.sleep(500)
    setThinking(true)
    await p.sleep(1400)
    setThinking(false)
    await p.type(setAnswer, ANSWER, 65)
    await p.sleep(2400)
  }, onDone, runKey, hold, playFrom, onTime)

  return (
    <ProductFrame title="Gen Z ChatGPT Usage Study" variant="analysis" activeTab="Chat" cursor={cur.state}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 0 24px" }}>
        <Chip kind="brand">New Feature</Chip>
        <div style={{ marginTop: 12, fontSize: 36, lineHeight: "44px", color: T.brand }}>I'm your Listen Research Agent</div>
        <div style={{ marginTop: 2, fontSize: 21, color: "rgba(0, 33, 204, 0.55)" }}>What can I help you discover?</div>
        {(thinking || answer) && (
          <div className="ll-card ll-enter" style={{ marginTop: 22, width: 566, padding: "12px 16px", fontSize: 13.5, lineHeight: 1.6, color: T.body }}>
            <div style={{ fontSize: 11, color: T.brand, marginBottom: 5, display: "flex", alignItems: "center", gap: 5 }}><I name="sparkles" size={12} /> Research Agent</div>
            {thinking
              ? <span className="ll-shimmer">Reading interviews…</span>
              : <>{answer}{answer.length < ANSWER.length && <Caret />}</>}
          </div>
        )}
        {loading && <span style={{ marginTop: 56 }}><DotSpinner size={30} /></span>}
        <span style={{ flex: 1 }} />
        {!loading && (
          <>
            <div className="ll-enter" style={{ fontSize: 12, color: T.inkSoft, alignSelf: "flex-start", marginLeft: 277, display: "flex", alignItems: "center", gap: 6 }}><I name="sparkles" size={12} /> Research suggestions</div>
            <div className="ll-enter" style={{ marginTop: 8, display: "grid", gridTemplateColumns: "repeat(3, 180px)", gap: 12 }}>
              {SUGGESTIONS.map(([icon, label], i) => (
                <div key={label} className={i === picked ? "ll-ring" : undefined} style={{
                  minHeight: 66, padding: "8px 11px", fontSize: 11.5, lineHeight: 1.4, color: T.body,
                  background: T.appPanelAlt, borderRadius: 8, transition: "border-color .15s ease",
                  border: `1px solid ${i === picked ? T.brand : i === hovered ? "rgba(26, 26, 26, 0.3)" : T.appBorder}`,
                }}>
                  <I name={icon} size={13} style={{ color: T.inkSoft, marginBottom: 3, display: "block" }} />
                  {label}
                </div>
              ))}
            </div>
          </>
        )}
        <div style={{ marginTop: 12, width: 564, background: "#FFF", border: `1px solid ${T.appBorder}`, borderRadius: 8, boxShadow: T.shadow }}>
          <div style={{ padding: "10px 12px", fontSize: 13, color: query ? T.ink : T.inkFaint }}>
            {query || "Ask a question..."}
          </div>
          <div style={{ display: "flex", padding: "0 8px 8px" }}>
            <span style={{ width: 24, height: 24, borderRadius: 6, border: `1px solid ${T.appBorder}`, display: "inline-flex", alignItems: "center", justifyContent: "center", color: T.inkSoft }}><I name="plus" size={13} /></span>
            <span style={{ flex: 1 }} />
            <span style={{ width: 24, height: 24, borderRadius: 12, background: query ? T.brand : T.fill, color: query ? "#FAFAFA" : T.inkSoft, display: "inline-flex", alignItems: "center", justifyContent: "center" }}><I name="arrow-up" size={13} /></span>
          </div>
        </div>
      </div>
    </ProductFrame>
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
export const EI_VISUAL_W = 620
export const EI_VISUAL_H = 422

const EIV_QUOTE = "I used it to negotiate my first salary offer — I basically read its script on the call and it worked."
const EIV_OBS_1 = "The participant's eyes light up and she leans forward as she describes the script 'actually working'. Her vocal tone lifts and speeds up through this segment."
const EIV_OBS_2 = "Quick raise of the eyebrows and a short laugh as she recalls the recruiter agreeing on the spot."

/** EI feature 1 — multi-signal Visual analysis with traceable emotion tags */
export function FragmentEIVisual({ active, onDone, runKey = 0, hold, playFrom, onTime }: SceneProps): JSX.Element {
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
    <div className="ll-card" style={{ width: EI_VISUAL_W, height: EI_VISUAL_H, padding: 28, borderRadius: 12, fontSize: 14, lineHeight: 1.6 }}>
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

export const EI_RESPONSE_W = 640
export const EI_RESPONSE_H = 406

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
export function FragmentEIResponse({ active, onDone, runKey = 0, hold, playFrom, onTime }: SceneProps): JSX.Element {
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
    <div className="ll-card" style={{ width: EI_RESPONSE_W, height: EI_RESPONSE_H, borderRadius: 12 }}>
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
export function FragmentEIComparison({ active, onDone, runKey = 0, hold, playFrom, onTime }: SceneProps): JSX.Element {
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

// cursor targets (design-space px, verified against the rendered frame)
const EIREP_TOGGLE = { x: 904, y: 239 }
const EIREP_GEN = { x: 862, y: 492 }

function EIToggle({ on }: { on: boolean }): JSX.Element {
  return (
    <span style={{ width: 30, height: 17, borderRadius: 9, background: on ? T.brand : "#D4D4D4", display: "inline-flex", alignItems: "center", padding: 2, boxSizing: "border-box", transition: "background .3s" }}>
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

export function SceneEIReport({ active, onDone, runKey = 0, hold, playFrom, onTime }: SceneProps): JSX.Element {
  ensureCss()
  const cur = useCursor()
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
    cur.show(EIREP_TOGGLE.x, EIREP_TOGGLE.y + 150); await p.sleep(300)
    cur.move(EIREP_TOGGLE.x, EIREP_TOGGLE.y); await p.sleep(550)
    cur.click(1); await p.sleep(150)
    setEmotions(false)
    await p.sleep(1000)
    cur.click(2); await p.sleep(150)
    setEmotions(true)
    await p.sleep(500)
    // generate a deck
    cur.move(EIREP_GEN.x, EIREP_GEN.y); await p.sleep(600)
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
    <ProductFrame title="Gen Z ChatGPT Usage Study" variant="analysis" activeTab="Details" cursor={cur.state}>
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
            <span style={{ display: "inline-block", fontSize: 10.5, padding: "2px 7px", borderRadius: 5, background: "#DCFCE7", color: "#16A34A" }}>Up to date</span>
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
                    <span style={{ flex: 1, height: CHART_H, background: "#EFEFEF", borderRadius: 3, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 1.5, overflow: "hidden" }}>
                      {/* segs are authored bottom-up; render reversed so anger sits at the base */}
                      {[...c.segs].reverse().map(([emo, f], j) => (
                        <span key={j} style={{ height: f * CHART_H * e, borderRadius: 1.5, background: emotions ? EMOTIONS[emo].fg : "#E0E0E0", transition: "background .4s" }} />
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
                  <span style={{ width: 8, height: 8, borderRadius: 2.5, background: emo === "neutral" ? "#E0E0E0" : EMOTIONS[emo].fg }} />
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
              <button className="ll-btn ghost" style={{ height: 28, fontSize: 12, borderColor: genHover ? "rgba(26,26,26,.3)" : undefined }}>
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
    </ProductFrame>
  )
}
