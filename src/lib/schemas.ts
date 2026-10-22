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

// Full pack schema (core + follow-ups), used as the stored shape.
export const PackSchema = CorePackSchema.extend({
  questions: z.array(
    CoreQuestionSchema.extend({ followUps: z.array(FollowUpSchema) })
  ),
});
