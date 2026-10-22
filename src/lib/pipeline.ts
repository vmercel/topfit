import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { AnalysisSchema, CorePackSchema, ExpandedAnswerSchema, FollowUpsSchema } from "./schemas";
import { STAGE_BRIEFS, TYPE_BRIEFS, UNIVERSAL_RULES } from "./knowledge";
import type { Analysis, CoreQuestion, FollowUp, PrepPack } from "./types";

const MODEL = process.env.OPENAI_MODEL || "gpt-4o";

function openai() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not configured on the server.");
  return new OpenAI({ apiKey: key });
}

interface Usage {
  promptTokens: number;
  completionTokens: number;
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).length;
}

// Constraint repair: if a core answer comes back under the 90-word floor, one
// expansion pass rewrites it at full length using only the same evidence.
async function expandAnswer(
  analysis: Analysis,
  question: CoreQuestion
): Promise<{ answer: string } & Usage> {
  const client = openai();
  const completion = await client.chat.completions.parse({
    model: MODEL,
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content: `You rewrite interview answers to full length. Take the draft answer below and expand it to 110-130 words by adding the missing moves: more specific evidence from the evidence bank, one method or trade-off detail, and a clear tie-back to the role. Use ONLY facts from the evidence bank. Never invent metrics, tools, employers or outcomes. Keep the first person, confident and plain. Return only the rewritten answer text in the "answer" field.`,
      },
      {
        role: "user",
        content: `ROLE: ${analysis.roleTitle} at ${analysis.company}
QUESTION: ${question.question}
DRAFT ANSWER (${wordCount(question.answer)} words): ${question.answer}

EVIDENCE BANK:
${analysis.evidenceBank.map((e) => `- ${e.text}`).join("\n")}`,
      },
    ],
    response_format: zodResponseFormat(ExpandedAnswerSchema, "expanded_answer"),
  });
  const parsed = completion.choices[0]?.message.parsed;
  return {
    answer: parsed?.answer || question.answer,
    promptTokens: completion.usage?.prompt_tokens ?? 0,
    completionTokens: completion.usage?.completion_tokens ?? 0,
  };
}

export async function analyzeResumeAndJd(
  resumeText: string,
  jdText: string
): Promise<{ analysis: Analysis } & Usage> {
  const client = openai();
  const completion = await client.chat.completions.parse({
    model: MODEL,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: `You are a senior hiring analyst. You decode a job description and a candidate resume into a structured, strictly factual analysis. Two rules govern everything: (1) the evidence bank contains ONLY facts stated in the resume, lightly compressed, never embellished, never inferred beyond what the text supports; keep every metric exactly as written. (2) requirement matching is honest: strong means the resume directly evidences it, partial means adjacent evidence, gap means nothing in the resume supports it. Give evidence items short ids (e1, e2, ...) and requirements ids (r1, r2, ...). Extract 8-14 must/nice requirements from the JD, prioritising the ones an interviewer would test. The pitchLine is one sentence positioning the candidate for THIS role. Risks are the objections a sharp interviewer will raise (gaps, short tenure, domain switch) each with an honest mitigation.`,
      },
      {
        role: "user",
        content: `JOB DESCRIPTION:\n${jdText}\n\nRESUME:\n${resumeText}`,
      },
    ],
    response_format: zodResponseFormat(AnalysisSchema, "analysis"),
  });

  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) throw new Error("Analysis failed. Please try again.");
  return {
    analysis: parsed as Analysis,
    promptTokens: completion.usage?.prompt_tokens ?? 0,
    completionTokens: completion.usage?.completion_tokens ?? 0,
  };
}

async function generateCorePack(
  analysis: Analysis,
  jdText: string,
  stage: string,
  interviewType: string
): Promise<{ core: Omit<PrepPack, "questions"> & { questions: CoreQuestion[] } } & Usage> {
  const client = openai();
  const stageBrief = STAGE_BRIEFS[stage] || "";
  const typeBrief = TYPE_BRIEFS[interviewType] || "";

  const completion = await client.chat.completions.parse({
    model: MODEL,
    temperature: 0.45,
    messages: [
      {
        role: "system",
        content: `You are an elite interview coach. Your candidates land in the top 3 percent because their answers are brief, evidenced and built for the exact room they are walking into. You are given a decoded analysis (evidence bank + requirement map) of a candidate against a job description. Select the 4 highest-probability questions for the stage below and engineer one answer per question. At least 3 of the 4 must be derived from this JD's named skills, tools and responsibilities; at most 1 may be a generic classic (and only if the stage brief ranks it highest).

${stageBrief}
${typeBrief}

${UNIVERSAL_RULES}

Additional fields: intent = what the interviewer is really deciding with this question, in one sentence. structure = 3-4 short labels showing the answer's skeleton (for example: "Hook: current role and scope", "Evidence: Databricks monitoring, 7 models", "Tie-back: matches their MLOps requirement"). evidenceUsed = the exact evidence bank texts the answer relies on. coverageNote = one honest sentence about how much of the must-have list this pack proves. strategy = 3-5 short bullets specific to this candidate, this role and this stage (positioning, what to emphasise, what to pre-empt). questionsToAsk = 3 sharp questions the candidate should ask this interviewer at this stage. closingLine = one sentence the candidate can end the interview on. Exactly 4 questions.`,
      },
      {
        role: "user",
        content: `ANALYSIS (JSON):\n${JSON.stringify(analysis)}\n\nJOB DESCRIPTION (for company specifics and language):\n${jdText}`,
      },
    ],
    response_format: zodResponseFormat(CorePackSchema, "core_pack"),
  });

  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) throw new Error("Pack generation failed. Please try again.");
  return {
    core: parsed as Omit<PrepPack, "questions"> & { questions: CoreQuestion[] },
    promptTokens: completion.usage?.prompt_tokens ?? 0,
    completionTokens: completion.usage?.completion_tokens ?? 0,
  };
}

async function generateFollowUps(
  analysis: Analysis,
  question: CoreQuestion,
  stage: string
): Promise<{ followUps: FollowUp[] } & Usage> {
  const client = openai();
  const stageBrief = STAGE_BRIEFS[stage] || "";

  const completion = await client.chat.completions.parse({
    model: MODEL,
    temperature: 0.45,
    messages: [
      {
        role: "system",
        content: `You are an elite interview coach predicting follow-up questions. A candidate will give the engineered answer below to a core interview question. Predict the 3 follow-ups a sharp interviewer at this stage will ask next: probes on metrics, on the candidate's personal contribution versus the team's, on trade-offs and alternatives rejected, on gaps or partial matches, and "what would you do differently". Write a tight answer for each: MUST be 45-80 words (3-4 sentences of substance, about 20-35 seconds spoken), first person, grounded ONLY in the evidence bank below, honest bridges where evidence is partial, never an invented fact.

Stage context: ${stageBrief.split("\n")[0]}`,
      },
      {
        role: "user",
        content: `ROLE: ${analysis.roleTitle} at ${analysis.company} (${analysis.domain}, ${analysis.seniority})
CANDIDATE: ${analysis.candidateName}, ${analysis.currentTitle}

EVIDENCE BANK:
${analysis.evidenceBank.map((e) => `- [${e.id}] ${e.text}`).join("\n")}

REQUIREMENTS:
${analysis.requirements.map((r) => `- [${r.id}] (${r.kind}, ${r.match}) ${r.text}`).join("\n")}

CORE QUESTION: ${question.question}
ENGINEERED ANSWER: ${question.answer}`,
      },
    ],
    response_format: zodResponseFormat(FollowUpsSchema, "follow_ups"),
  });

  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) throw new Error("Follow-up generation failed. Please try again.");
  return {
    followUps: parsed.followUps as FollowUp[],
    promptTokens: completion.usage?.prompt_tokens ?? 0,
    completionTokens: completion.usage?.completion_tokens ?? 0,
  };
}

// Orchestration: analysis -> core pack -> length repair -> follow-ups in parallel.
export async function generatePack(
  analysis: Analysis,
  jdText: string,
  stage: string,
  interviewType: string
): Promise<{ pack: PrepPack } & Usage> {
  const core = await generateCorePack(analysis, jdText, stage, interviewType);

  let repairPrompt = 0;
  let repairCompletion = 0;
  const repairedQuestions = await Promise.all(
    core.core.questions.map(async (q) => {
      if (wordCount(q.answer) >= 90) return q;
      const r = await expandAnswer(analysis, q);
      repairPrompt += r.promptTokens;
      repairCompletion += r.completionTokens;
      return wordCount(r.answer) > wordCount(q.answer) ? { ...q, answer: r.answer } : q;
    })
  );

  const followResults = await Promise.all(
    repairedQuestions.map((q) => generateFollowUps(analysis, q, stage))
  );

  const pack: PrepPack = {
    ...core.core,
    questions: repairedQuestions.map((q, i) => ({
      ...q,
      followUps: followResults[i].followUps.slice(0, 3),
    })),
  };

  return {
    pack,
    promptTokens:
      core.promptTokens + repairPrompt + followResults.reduce((s, r) => s + r.promptTokens, 0),
    completionTokens:
      core.completionTokens +
      repairCompletion +
      followResults.reduce((s, r) => s + r.completionTokens, 0),
  };
}
