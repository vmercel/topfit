import { z } from "zod";

// Analysis schema: JD decoded + resume turned into a grounded evidence bank.
export const AnalysisSchema = z.object({
  candidateName: z.string(),
  currentTitle: z.string(),
  yearsExperience: z.string(),
  domain: z.string(),
  roleTitle: z.string(),
  company: z.string(),
  seniority: z.string(),
  pitchLine: z.string(),
  evidenceBank: z.array(
    z.object({
      id: z.string(),
      kind: z.enum(["achievement", "project", "skill", "leadership", "metric", "education"]),
      text: z.string(),
    })
  ),
  requirements: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      kind: z.enum(["must", "nice"]),
      match: z.enum(["strong", "partial", "gap"]),
      evidenceIds: z.array(z.string()),
      note: z.string(),
    })
  ),
  risks: z.array(z.object({ text: z.string(), mitigation: z.string() })),
  keywords: z.array(z.string()),
});

const FollowUpSchema = z.object({
  question: z.string(),
  whyLikely: z.string(),
  answer: z.string(),
  seconds: z.number(),
});

const CoreQuestionSchema = z.object({
  question: z.string(),
  category: z.string(),
  intent: z.string(),
  provesRequirements: z.array(z.string()),
  answer: z.string(),
  seconds: z.number(),
  structure: z.array(z.string()),
  evidenceUsed: z.array(z.string()),
  trap: z.string(),
});

// Core pack: the 4 engineered questions and answers, before follow-ups.
export const CorePackSchema = z.object({
  headline: z.string(),
  coverageNote: z.string(),
  coveredCount: z.number(),
  totalMustHaves: z.number(),
  strategy: z.array(z.string()),
  questions: z.array(CoreQuestionSchema),
  questionsToAsk: z.array(z.string()),
  closingLine: z.string(),
});

// Follow-ups for a single core question (generated in parallel, one call each).
export const FollowUpsSchema = z.object({
  followUps: z.array(FollowUpSchema),
});

// Single rewritten answer (constraint-repair pass).
export const ExpandedAnswerSchema = z.object({
  answer: z.string(),
});

// ---------- Framework-scenario packs ----------
const Tone = z.enum(["good", "bad", "warn", "neutral"]);
const QA = z.object({ question: z.string(), answer: z.string() });

// Everything except the per-framework deep dives, plus the list of frameworks to cover.
export const ScenarioCoreSchema = z.object({
  headline: z.string(),
  coverageNote: z.string(),
  coveredCount: z.number(),
  totalMustHaves: z.number(),
  strategy: z.array(z.string()),
  snapshot: z.object({
    summary: z.string(),
    rows: z.array(z.object({ label: z.string(), value: z.string() })),
    note: z.string(),
  }),
  pitch: z.string(),
  storyMap: z.array(z.object({ requirement: z.string(), story: z.string(), proof: z.string() })),
  technicalQA: z.array(QA),
  frameworkTopics: z.array(
    z.object({
      name: z.string(),
      requirement: z.string(),
      screenIdea: z.string(),
    })
  ),
  behavioral: z.array(QA),
  logistics: z.array(z.string()),
  gaps: z.array(z.object({ gap: z.string(), whatToSay: z.string() })),
  questionsToAsk: z.array(z.string()),
  checklist: z.array(z.string()),
  closingLine: z.string(),
});

export const UiMockSchema = z.object({
  tool: z.string(),
  breadcrumb: z.string(),
  sidebar: z.array(z.object({ heading: z.string(), lines: z.array(z.string()) })),
  kpis: z.array(z.object({ label: z.string(), value: z.string(), note: z.string(), tone: Tone })),
  timeline: z
    .object({
      title: z.string(),
      spans: z.array(
        z.object({ name: z.string(), start: z.number(), duration: z.number(), label: z.string(), tone: Tone })
      ),
    })
    .nullable(),
  chart: z
    .object({
      title: z.string(),
      xLabels: z.array(z.string()),
      series: z.array(z.object({ name: z.string(), points: z.array(z.number()), tone: Tone })),
      threshold: z.number().nullable(),
      thresholdLabel: z.string(),
    })
    .nullable(),
  graph: z
    .object({
      title: z.string(),
      nodes: z.array(z.object({ id: z.string(), label: z.string(), note: z.string(), tone: Tone })),
      edges: z.array(z.object({ from: z.string(), to: z.string(), label: z.string() })),
    })
    .nullable(),
  table: z
    .object({
      title: z.string(),
      columns: z.array(z.string()),
      rows: z.array(z.object({ cells: z.array(z.string()), tone: Tone })),
    })
    .nullable(),
  code: z.object({ title: z.string(), lines: z.array(z.string()) }).nullable(),
  callout: z.object({ tone: Tone, text: z.string() }).nullable(),
});

export const FrameworkScenarioSchema = z.object({
  name: z.string(),
  requirement: z.string(),
  scenario: z.string(),
  screen: UiMockSchema,
  howToRead: z.string(),
  whatToDo: z.string(),
  extraNote: z.string(),
  tradeoffs: z.object({ columns: z.array(z.string()), rows: z.array(z.array(z.string())) }),
});

// Full pack schema (core + follow-ups), used as the stored shape.
export const PackSchema = CorePackSchema.extend({
  questions: z.array(
    CoreQuestionSchema.extend({ followUps: z.array(FollowUpSchema) })
  ),
});
