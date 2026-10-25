import { z } from "zod";

export const QuestionSchema = z.object({
  question: z.string().min(8).max(600),
  focus: z.string().min(2).max(200),
});
export const PlanSchema = z.object({
  questions: z.array(QuestionSchema).min(3).max(5),
});
export const FollowupSchema = z.object({
  needed: z.boolean(),
  question: z.string().max(600),
  reason: z.string().max(200),
});
export const TurnSchema = z.object({
  question: z.string(),
  focus: z.string(),
  answer: z.string().max(5000),
  mainIndex: z.number().int().min(0).max(4),
  followup: z.boolean(),
});
export const SessionSchema = z.object({
  version: z.literal(1),
  userId: z.string(),
  id: z.string(),
  expires: z.number(),
  endsAt: z.number().optional(),
  questionsComplete: z.boolean().optional(),
  resume: z.string().max(26000),
  role: z.string().max(500),
  job: z.string().max(14000),
  stage: z.string().max(80),
  plan: z.array(QuestionSchema).min(3).max(5),
  mainIndex: z.number().int().min(0).max(4),
  current: QuestionSchema,
  isFollowup: z.boolean(),
  turns: z.array(TurnSchema).max(10),
});
const Score = z.number().int().min(0).max(5);
export const EvaluationSchema = z.object({
  turnIndex: z.number().int().min(0).max(9),
  relevance: Score,
  depth: Score,
  evidence: Score,
  clarity: Score,
  strength: z.string().max(600),
  improve: z.string().max(800),
  evidenceQuote: z.string().max(500),
  betterOutline: z.array(z.string().max(400)).min(2).max(5),
});
export const FeedbackSchema = z.object({
  summary: z.string().max(1200),
  strengths: z.array(z.string().max(400)).min(1).max(4),
  nextSteps: z.array(z.string().max(400)).min(2).max(5),
  evaluations: z.array(EvaluationSchema).min(1).max(10),
});
export type InterviewSession = z.infer<typeof SessionSchema>;
export type InterviewQuestion = z.infer<typeof QuestionSchema>;
export type InterviewTurn = z.infer<typeof TurnSchema>;
export type Feedback = z.infer<typeof FeedbackSchema>;
export type InterviewReport = Feedback & {
  score: number;
  dimensions: { name: string; score: number }[];
  turns: InterviewTurn[];
  completed: boolean;
  answeredMain: number;
  plannedMain: number;
};
export type InterviewView = {
  endsAt?: number;
  questionsComplete?: boolean;
  token: string;
  question: InterviewQuestion;
  mainNumber: number;
  mainTotal: number;
  isFollowup: boolean;
  turns: InterviewTurn[];
};
