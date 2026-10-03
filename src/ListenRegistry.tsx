// ListenRegistry — the canonical catalog of product shots and multi-step
// sequences. Register content once here; SceneCanvas, the workbench, and the
// demo pages all read from it.
//   REGISTRY  — every shot: full scenes (1120×640 app frames) and fragments
//               (standalone cards authored at their own design size)
//   SEQUENCES — ordered lists of shots, each step with the caption shown
//               under the frame in a multi-step layout
import {
  SceneDesignStudy, SceneReachPeople, SceneInterviewScale,
  SceneDeliverResults, SceneCompound, SceneEIHeroReport,
  FragmentTopAnswer, TOP_ANSWER_W, TOP_ANSWER_H,
  FragmentLiveInterview, LIVE_INTERVIEW_W, LIVE_INTERVIEW_H,
  FragmentEmotionQuote, EMOTION_QUOTE_W, EMOTION_QUOTE_H,
  FragmentEIFeatureSignals, EI_SIGNALS_W, EI_SIGNALS_H,
  FragmentEIFeatureTraceable, EI_TRACEABLE_W, EI_TRACEABLE_H,
  FragmentEIFeatureComparison, EI_COMPARISON_W, EI_COMPARISON_H,
  FragmentEIUseCaseAdTesting, FragmentEIUseCaseConcepts, FragmentEIUseCaseBrand, FragmentEIUseCaseUX,
  EI_USECASE_W, EI_USECASE_H,
  SceneUCBrandTracking, SceneUCConsumerAttitudes, SceneUCFeaturePriority,
  SceneUCUsability,
  SceneUCPricing,
  SceneUCChurn,
  SceneUCAdTesting,
  SceneUCPositioning,
  SceneProps,
} from "./ListenScenes"
import { APP_W, APP_H } from "./ListenKit"

/** picker sections, in menu order — one per page or module a shot belongs to */
export const GROUPS = ["How it works", "Use cases", "Emotional intelligence", "Cards"] as const
export type Group = (typeof GROUPS)[number]

export type RegistryEntry = {
  key: string
  /** short name within its group — `label()` adds the group in front */
  title: string
  group: Group
  /** position on its page, shown as "01" in menus; leave off when the group
   *  has no page order (Cards) */
  n?: number
  Scene: (p: SceneProps) => JSX.Element
  w: number
  h: number
  kind: "scene" | "fragment"
  /** in a bleed card (the Use Cases list), how many design px show across;
   *  set it when the shot's subject sits further right than the default */
  bleedShow?: number
}

export const REGISTRY: RegistryEntry[] = [
  // --- How it works (homepage) ----------------------------------------------
  { key: "design-study", title: "Design the study", group: "How it works", n: 1, Scene: SceneDesignStudy, w: APP_W, h: APP_H, kind: "scene" },
  { key: "reach-people", title: "Reach the right people", group: "How it works", n: 2, Scene: SceneReachPeople, w: APP_W, h: APP_H, kind: "scene" },
  { key: "interview-scale", title: "Interview at scale", group: "How it works", n: 3, Scene: SceneInterviewScale, w: APP_W, h: APP_H, kind: "scene" },
  { key: "deliver-results", title: "Deliver meaningful results", group: "How it works", n: 4, Scene: SceneDeliverResults, w: APP_W, h: APP_H, kind: "scene" },
  { key: "compound", title: "Compound your learnings", group: "How it works", n: 5, Scene: SceneCompound, w: APP_W, h: APP_H, kind: "scene" },

  // --- homepage Use Cases — one app scene per use case, in list order ---------
  { key: "uc-consumer-attitudes", title: "Consumer attitudes & behaviors", group: "Use cases", n: 1, Scene: SceneUCConsumerAttitudes, w: APP_W, h: APP_H, kind: "scene" },
  { key: "uc-brand-tracking", title: "Brand tracking & health", group: "Use cases", n: 2, Scene: SceneUCBrandTracking, w: APP_W, h: APP_H, kind: "scene" },
  { key: "uc-feature-priority", title: "Product & feature prioritization", group: "Use cases", n: 3, Scene: SceneUCFeaturePriority, w: APP_W, h: APP_H, kind: "scene" },
  { key: "uc-usability", title: "Usability & UX testing", group: "Use cases", n: 4, Scene: SceneUCUsability, w: APP_W, h: APP_H, kind: "scene" },
  { key: "uc-churn", title: "Churn, retention & activation", group: "Use cases", n: 5, Scene: SceneUCChurn, w: APP_W, h: APP_H, kind: "scene" },
  { key: "uc-ad-testing", title: "Ad & creative testing", group: "Use cases", n: 6, Scene: SceneUCAdTesting, w: APP_W, h: APP_H, kind: "scene" },
  { key: "uc-pricing", title: "Pricing & willingness-to-pay", group: "Use cases", n: 7, Scene: SceneUCPricing, w: APP_W, h: APP_H, kind: "scene" },
  { key: "uc-positioning", title: "Positioning & messaging", group: "Use cases", n: 8, Scene: SceneUCPositioning, w: APP_W, h: APP_H, kind: "scene" },

  // --- /features/emotional-intelligence — the page's 8 product shots, in
  // page order: hero, the three Features cards, the four Use-case cards
  { key: "ei-hero-report", title: "Hero · Study report", group: "Emotional intelligence", n: 1, Scene: SceneEIHeroReport, w: APP_W, h: APP_H, kind: "scene" },
  { key: "ei-feature-signals", title: "Feature · Multi-signal detection", group: "Emotional intelligence", n: 2, Scene: FragmentEIFeatureSignals, w: EI_SIGNALS_W, h: EI_SIGNALS_H, kind: "fragment" },
  { key: "ei-feature-traceable", title: "Feature · Research-grounded + traceable", group: "Emotional intelligence", n: 3, Scene: FragmentEIFeatureTraceable, w: EI_TRACEABLE_W, h: EI_TRACEABLE_H, kind: "fragment" },
  { key: "ei-feature-comparison", title: "Feature · Structured for comparison", group: "Emotional intelligence", n: 4, Scene: FragmentEIFeatureComparison, w: EI_COMPARISON_W, h: EI_COMPARISON_H, kind: "fragment" },
  { key: "ei-usecase-ad-testing", title: "Use case · Creative/Ad testing", group: "Emotional intelligence", n: 5, Scene: FragmentEIUseCaseAdTesting, w: EI_USECASE_W, h: EI_USECASE_H, kind: "fragment" },
  { key: "ei-usecase-concepts", title: "Use case · Concept comparison", group: "Emotional intelligence", n: 6, Scene: FragmentEIUseCaseConcepts, w: EI_USECASE_W, h: EI_USECASE_H, kind: "fragment" },
  { key: "ei-usecase-brand", title: "Use case · Brand research", group: "Emotional intelligence", n: 7, Scene: FragmentEIUseCaseBrand, w: EI_USECASE_W, h: EI_USECASE_H, kind: "fragment" },
  { key: "ei-usecase-ux", title: "Use case · UX research", group: "Emotional intelligence", n: 8, Scene: FragmentEIUseCaseUX, w: EI_USECASE_W, h: EI_USECASE_H, kind: "fragment" },

  // --- cards — small UI pieces, not full pages -------------------------------
  { key: "top-answer-card", title: "Top answer", group: "Cards", Scene: FragmentTopAnswer, w: TOP_ANSWER_W, h: TOP_ANSWER_H, kind: "fragment" },
  { key: "live-interview-card", title: "Live interview", group: "Cards", Scene: FragmentLiveInterview, w: LIVE_INTERVIEW_W, h: LIVE_INTERVIEW_H, kind: "fragment" },
  { key: "emotion-quote-card", title: "Emotion quote", group: "Cards", Scene: FragmentEmotionQuote, w: EMOTION_QUOTE_W, h: EMOTION_QUOTE_H, kind: "fragment" },
]

/** shots a page needs that aren't built yet — listed greyed out in the
 *  workbench menu so the gaps show; move one into REGISTRY when it lands */
export type PlannedShot = { group: Group; n: number; title: string }
export const PLANNED: PlannedShot[] = [
]

/** "01 Title" — the page-order number in front, when the shot has one */
export const shortLabel = (e: { n?: number; title: string }): string =>
  e.n ? `${String(e.n).padStart(2, "0")} ${e.title}` : e.title

/** "Group · 01 Title" — for flat lists that can't show section headers (Framer) */
export const label = (e: RegistryEntry): string => `${e.group} · ${shortLabel(e)}`

export type MenuItem = { entry: RegistryEntry; planned?: false } | { entry: PlannedShot; planned: true }

/** built and planned shots bucketed by group, in GROUPS order and page order */
export const grouped = (): Array<[Group, MenuItem[]]> =>
  GROUPS.map((g) => {
    const items: MenuItem[] = [
      ...REGISTRY.filter((e) => e.group === g).map((entry) => ({ entry })),
      ...PLANNED.filter((e) => e.group === g).map((entry) => ({ entry, planned: true as const })),
    ]
    // keeps registry order for shots without a number
    items.sort((a, b) => (a.entry.n ?? 0) - (b.entry.n ?? 0))
    return [g, items] as [Group, MenuItem[]]
  }).filter(([, items]) => items.length > 0)

export const byKey = (key: string): RegistryEntry =>
  REGISTRY.find((e) => e.key === key) ?? REGISTRY[0]

// ------------------------------------------------------------- sequences ----
/** one step of a multi-step layout: which shot plays, and its caption.
 *  `ms` is the shot's approximate length, a first guess for the list style's
 *  progress line until the real length is measured on the first play. */
export type Step = { content: string; title: string; body: string; ms?: number }

/** how a multi-step lays out its steps:
 *   captions — the shot on top, a row of captions under it (How it works)
 *   list     — numbered rows beside a cropped shot; stacks on mobile (Use Cases) */
export type StepStyle = "captions" | "list" | "stage"

export type Sequence = { key: string; title: string; style: StepStyle; steps: Step[] }

export const SEQUENCES: Sequence[] = [
  {
    key: "how-it-works",
    title: "How it works",
    style: "captions",
    steps: [
      {
        content: "design-study",
        title: "Design the study",
        body: "Listen Labs drafts objectives, questions, and probing context in seconds based on your goal. Or upload your own interview guide.",
      },
      {
        content: "reach-people",
        title: "Reach the right people",
        body: "Qualified from a global network of 50M+ participants, including hard to reach audiences. Or use your list of contacts.",
      },
      {
        content: "interview-scale",
        title: "Interview at scale",
        body: "The AI moderator holds a real conversation with smart follow-ups to drive deeper answers. Runs globally, 24/7, across 120+ languages.",
      },
      {
        content: "deliver-results",
        title: "Deliver meaningful results",
        body: "Listen builds your deliverables, from highlight reels to boardroom-ready slides. Every claim traces back to a real interview.",
      },
      {
        content: "compound",
        title: "Compound your learnings",
        body: "The more you run, the richer your workspace gets. Search and build on past studies, themes, and reports, so your team keeps getting sharper.",
      },
    ],
  },
  {
    // homepage refresh (Figma "Homepage Refresh" 897:4407). Each use case
    // gets its own uc-* scene; until it lands, an existing scene stands in
    key: "use-cases",
    title: "Use Cases",
    style: "list",
    steps: [
      {
        content: "uc-consumer-attitudes",
        title: "Consumer Attitudes & Behaviors",
        body: "Learn how people think, feel, and behave in a particular segment.",
      },
      {
        content: "uc-brand-tracking",
        title: "Brand Tracking & Health",
        body: "Track how people see your brand month over month, and what's driving the change.",
      },
      {
        content: "uc-feature-priority",
        title: "Product & Feature Prioritization",
        body: "Hear which features matter most to customers, and why, before you build.",
      },
      {
        content: "uc-usability",
        title: "Usability & UX Testing",
        body: "Watch people use your product, hear what they're thinking, and see where they get stuck.",
      },
      {
        content: "uc-churn",
        title: "Churn, Retention & Activation",
        body: "Find out why customers stay, leave, or never get started.",
      },
      {
        content: "uc-ad-testing",
        title: "Ad & Creative Testing",
        body: "See how people react to your ads, moment by moment, before you launch.",
      },
      {
        content: "uc-pricing",
        title: "Pricing & Willingness-to-Pay",
        body: "Learn what people will pay, and the value that justifies the price.",
      },
      {
        content: "uc-positioning",
        title: "Positioning & Messaging",
        body: "Find the words that land with your audience and the claims they believe.",
      },
    ],
  },
]

export const sequenceByKey = (key: string): Sequence =>
  SEQUENCES.find((s) => s.key === key) ?? SEQUENCES[0]
