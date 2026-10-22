// Shared domain model for TopFit.

export const STAGES = [
  {
    id: "recruiter_screen",
    label: "Recruiter screen",
    blurb: "Motivation, fit and communication. They are deciding whether to put you forward.",
  },
  {
    id: "hiring_manager",
    label: "Hiring manager",
    blurb: "Depth, impact and judgement. They are deciding whether you can do the job.",
  },
  {
    id: "technical",
    label: "Technical / domain deep dive",
    blurb: "Hard skills against the job description. They are testing how you think, not just what you know.",
  },
  {
    id: "system_design",
    label: "System design / case",
    blurb: "Structured problem solving on an open-ended problem drawn from the role.",
  },
  {
    id: "behavioral",
    label: "Behavioural / values",
    blurb: "Past behaviour as evidence: conflict, failure, ambiguity, influence.",
  },
  {
    id: "final_executive",
    label: "Final / executive",
    blurb: "Vision, culture add and why you, why now. Short answers, high signal.",
  },
] as const;

export type StageId = (typeof STAGES)[number]["id"];

export const INTERVIEW_TYPES = [
  { id: "phone_screen", label: "Phone screen" },
  { id: "video", label: "Video call" },
  { id: "panel", label: "Panel" },
  { id: "coding", label: "Live coding / practical" },
  { id: "case_study", label: "Case study" },
  { id: "presentation", label: "Presentation" },
  { id: "portfolio_review", label: "Portfolio / work review" },
  { id: "values", label: "Values / competency based" },
] as const;

export type InterviewTypeId = (typeof INTERVIEW_TYPES)[number]["id"];

export interface EvidenceItem {
  id: string;
  kind: "achievement" | "project" | "skill" | "leadership" | "metric" | "education";
  text: string;
}

export interface RequirementMatch {
  id: string;
  text: string;
  kind: "must" | "nice";
  match: "strong" | "partial" | "gap";
  evidenceIds: string[];
  note: string;
}

export interface Analysis {
  candidateName: string;
  currentTitle: string;
  yearsExperience: string;
  domain: string;
  roleTitle: string;
  company: string;
  seniority: string;
  pitchLine: string;
  evidenceBank: EvidenceItem[];
  requirements: RequirementMatch[];
  risks: { text: string; mitigation: string }[];
  keywords: string[];
}

export interface FollowUp {
  question: string;
  whyLikely: string;
  answer: string;
  seconds: number;
}

export interface CoreQuestion {
  question: string;
  category: string;
  intent: string;
  provesRequirements: string[];
  answer: string;
  seconds: number;
  structure: string[];
  evidenceUsed: string[];
  trap: string;
  followUps: FollowUp[];
}

export interface PrepPack {
  headline: string;
  coverageNote: string;
  coveredCount: number;
  totalMustHaves: number;
  strategy: string[];
  questions: CoreQuestion[];
  questionsToAsk: string[];
  closingLine: string;
}

export interface PrepResult {
  id: string;
  stage: string;
  interviewType: string;
  analysis: Analysis;
  pack: PrepPack;
}
