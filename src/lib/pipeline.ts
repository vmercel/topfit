import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { AnalysisSchema, FrameworkScenarioSchema, ScenarioCoreSchema } from "./schemas";
import { SCENARIO_RULES, STAGE_BRIEFS, TYPE_BRIEFS } from "./knowledge";
import type { Analysis, FrameworkScenario, PrepPack } from "./types";

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

function evidenceBlock(analysis: Analysis) {
  return `CANDIDATE: ${analysis.candidateName}, ${analysis.currentTitle} (${analysis.yearsExperience})
ROLE: ${analysis.roleTitle} at ${analysis.company} (${analysis.domain}, ${analysis.seniority})

EVIDENCE BANK (the only facts you may use about the candidate):
${analysis.evidenceBank.map((e) => `- [${e.id}] ${e.text}`).join("\n")}

REQUIREMENTS:
${analysis.requirements.map((r) => `- [${r.id}] (${r.kind}, ${r.match}) ${r.text} :: ${r.note}`).join("\n")}

RISKS:
${analysis.risks.map((r) => `- ${r.text} :: ${r.mitigation}`).join("\n")}`;
}

type ScenarioCore = Omit<PrepPack, "frameworks"> & {
  frameworkTopics: { name: string; requirement: string; screenIdea: string }[];
};

async function generateScenarioCore(
  analysis: Analysis,
  jdText: string,
  stage: string,
  interviewType: string
): Promise<{ core: ScenarioCore } & Usage> {
  const client = openai();
  const completion = await client.chat.completions.parse({
    model: MODEL,
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content: `You are an elite interview coach who builds a complete, ready-to-use prep pack for one specific interview. The pack reads like a senior engineer's private briefing: specific, scannable, honest.

${STAGE_BRIEFS[stage] || ""}
${TYPE_BRIEFS[interviewType] || ""}

${SCENARIO_RULES}

FIELDS:
- headline: one sentence on how this candidate wins this interview.
- coveredCount / totalMustHaves / coverageNote: honest count of must-have requirements the evidence bank proves.
- strategy: 3-5 bullets specific to this candidate, role and stage.
- snapshot: summary = one sentence naming the role, company and interview stage. rows = 4-6 label/value facts an interviewee needs at a glance, taken from the JD (team or business unit, location and work model, pay range if stated, employment type, likely interview format for this stage). note = one sentence on what this employer's interviewers will weigh most. Never invent a fact the JD does not state; write "Not stated" instead.
- pitch: the 60-second "tell me about yourself" answer, 120-170 words, first person, built only from the evidence bank, ending with why this role.
- storyMap: one row per major JD requirement (6-10 rows). requirement = the JD requirement in its words; story = which experience to tell and how, in one or two sentences; proof = the single metric or artefact to land (from the evidence bank; if none, the concrete outcome in words).
- technicalQA: 8-11 technical questions this interviewer is most likely to ask about the JD's named skills, each with a one-paragraph answer (70-130 words) that leads with the decision, then the method and specific techniques, and where it fits, one line of the candidate's own evidence. The final item is the coding or hands-on exercise list to practise if the role involves coding.
- frameworkTopics: 6-9 frameworks, platforms or practices named or clearly implied by the JD that an interviewer will probe (for example an orchestration library, a cloud platform, an evaluation tool, a deployment stack). requirement = the JD wording it maps to. screenIdea = one sentence describing a realistic client scenario and the product screen that would show the problem (a trace view, a dashboard, a pipeline run, a training curve, an inspector, a console).
- behavioral: 4-5 behavioural questions with STAR answers of 60-110 words from the evidence bank (failure, disagreement, explaining to non-technical people, why this company).
- logistics: 3-5 short answer lines for practical questions (work authorization only if the resume states it, location or onsite, notice period, compensation deflection).
- gaps: 3-6 honest gaps against the JD, each with what to say: the adjacent experience and how fast they would close it. Never claim the missing skill.
- questionsToAsk: 3-5 sharp questions for this interviewer.
- checklist: 5-7 day-of preparation items.
- closingLine: one sentence to end the interview on.`,
      },
      {
        role: "user",
        content: `${evidenceBlock(analysis)}\n\nJOB DESCRIPTION:\n${jdText}`,
      },
    ],
    response_format: zodResponseFormat(ScenarioCoreSchema, "scenario_core"),
  });
  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) throw new Error("Pack generation failed. Please try again.");
  return {
    core: parsed as ScenarioCore,
    promptTokens: completion.usage?.prompt_tokens ?? 0,
    completionTokens: completion.usage?.completion_tokens ?? 0,
  };
}

async function generateFrameworkScenario(
  analysis: Analysis,
  topic: { name: string; requirement: string; screenIdea: string },
  index: number
): Promise<{ scenario: FrameworkScenario } & Usage> {
  const client = openai();
  const completion = await client.chat.completions.parse({
    model: MODEL,
    temperature: 0.5,
    messages: [
      {
        role: "system",
        content: `You write one section of an interview prep pack: a realistic client scenario for a framework or practice the job requires, the product screen an engineer would look at, how to read that screen, what to do about it, and the trade-offs against alternatives. The candidate will use this as a ready-made story when asked "how would you..." questions.

${SCENARIO_RULES}

SECTION RULES:
- name: the framework heading, e.g. "RAG orchestration: LangChain / LlamaIndex, traced in LangSmith".
- requirement: the JD requirement it maps to.
- scenario: 1-2 sentences. A concrete client situation in the employer's likely domain with a visible symptom (slow answers, wrong answers, throttling, cost spike, failing pipeline, overfitting, a stalled agent).
- screen: a believable product screen that shows the symptom with real-looking numbers. This is an illustrative mock-up drawn by the app, so make the numbers internally consistent (spans add up, a threshold is breached, a metric drops below a gate). Fill ONLY the parts that fit; set the rest to null or empty arrays. Use 'timeline' for traces and latency breakdowns (start and duration in the same unit), 'chart' for a metric over time or training curves (8-14 points per series, threshold for a quota, SLO or gate), 'graph' for agent graphs, pipelines and dependencies (4-8 nodes, mark the failing node with tone "bad" and a short note), 'table' for evaluation results, query results, comparisons or logs (3-7 rows, tone per row), 'code' for CLI or CI logs, schemas or state JSON (4-12 short lines), 'kpis' for 2-5 headline numbers, 'sidebar' for 1-3 short config groups. tool = a generic screen name (e.g. "LLM trace explorer", "Evaluation report", "CI pipeline run") and never a vendor logo or trademark claim; breadcrumb = project / view path. callout = one sentence pointing at the anomaly.
- howToRead: 3-5 sentences that interpret the screen the way a senior engineer would: what each region shows, which number is the problem and why, and what the numbers rule out.
- whatToDo: 2-4 sentences of concrete fixes in priority order, ending with how to verify the fix.
- extraNote: one sentence of extra context worth saying in the interview (a metric definition, a common misconception, or a link to the candidate's own evidence). Empty string if nothing useful.
- tradeoffs: columns = exactly 3 headers (e.g. "Option", "Strength", "Weakness" or "Choice", "Use when", "Cost"). rows = 3-5 alternatives compared honestly.`,
      },
      {
        role: "user",
        content: `${evidenceBlock(analysis)}\n\nSECTION ${index + 1}\nFRAMEWORK: ${topic.name}\nJD REQUIREMENT: ${topic.requirement}\nSCENARIO IDEA: ${topic.screenIdea}`,
      },
    ],
    response_format: zodResponseFormat(FrameworkScenarioSchema, "framework_scenario"),
  });
  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) throw new Error("Framework scenario generation failed. Please try again.");
  return {
    scenario: parsed as FrameworkScenario,
    promptTokens: completion.usage?.prompt_tokens ?? 0,
    completionTokens: completion.usage?.completion_tokens ?? 0,
  };
}

// Orchestration: analysis -> pack core -> one framework scenario per topic, in parallel.
export async function generatePack(
  analysis: Analysis,
  jdText: string,
  stage: string,
  interviewType: string
): Promise<{ pack: PrepPack } & Usage> {
  const core = await generateScenarioCore(analysis, jdText, stage, interviewType);
  const topics = core.core.frameworkTopics.slice(0, 9);
  const settled = await Promise.allSettled(
    topics.map((t, i) => generateFrameworkScenario(analysis, t, i))
  );
  const scenarios = settled.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
  if (topics.length && !scenarios.length) {
    throw new Error("Framework scenarios could not be generated. Please try again.");
  }

  const { frameworkTopics: _topics, ...rest } = core.core;
  void _topics;
  const pack: PrepPack = {
    ...rest,
    frameworks: scenarios.map((s) => s.scenario),
  };

  return {
    pack,
    promptTokens: core.promptTokens + scenarios.reduce((s, r) => s + r.promptTokens, 0),
    completionTokens: core.completionTokens + scenarios.reduce((s, r) => s + r.completionTokens, 0),
  };
}
