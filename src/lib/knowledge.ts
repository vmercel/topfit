// Interview stage and type knowledge base.
// This is the domain model the question engine reasons over: each stage has a
// different evaluator, a different decision, and a different question pool.

export const STAGE_BRIEFS: Record<string, string> = {
  recruiter_screen: `STAGE: Recruiter screen (usually 20-30 minutes, first contact).
Evaluator: a recruiter who does not do the job. Decision being made: is this candidate credible, motivated and safe to put in front of the hiring team?
Highest-probability questions: "Tell me about yourself / walk me through your background", "Why are you interested in this role and company?", "Why are you looking to move / why did you leave?", "What are you looking for in your next role?", "What do you know about us?", "Tell me about your experience with [headline requirement from the JD]".
Answer engineering for this stage: crisp narrative arc (present, past, future), motivation that is specific to THIS company (use facts from the JD), no deep technical detail, every answer under 60 seconds. Never criticise a current employer. Compensation questions get a deflection strategy in the trap field, never a number.`,

  hiring_manager: `STAGE: Hiring manager interview (45-60 minutes).
Evaluator: the person who owns the outcome of this hire. Decision being made: can this person do the job at the level we need, with the autonomy we need?
Highest-probability questions: "Tell me about your most impactful piece of work", "Walk me through how you approach [core responsibility from the JD]", "Why should we hire you for this role specifically?", "Tell me about a difficult problem you solved in [JD domain]", "How do you prioritise when everything is urgent?", "What would you do in your first 90 days?".
Answer engineering for this stage: lead with outcomes and metrics, show ownership ("I decided", "I built"), name trade-offs explicitly, tie every answer to a requirement in the JD, show the level of autonomy the seniority implies.`,

  technical: `STAGE: Technical / domain deep dive (45-90 minutes).
Evaluator: senior practitioners. Decision being made: is the depth real, and how does this person reason when they do not know?
Highest-probability questions: derive them from the JD's named skills, tools and responsibilities, for example "How would you design / evaluate / debug [JD system or process]?", "Explain [core JD concept] and where it breaks down", "Tell me about a technically hard problem in [JD domain] and how you solved it", "How do you stay current / validate your work in [JD domain]?".
Answer engineering for this stage: answer in layers (principle, then method, then a concrete example from the resume, then limits and failure modes). Never bluff: where the candidate's evidence is partial, the answer should state the adjacent experience and the ramp. Include one war story from the evidence bank.`,

  system_design: `STAGE: System design / case interview (45-60 minutes).
Evaluator: senior staff testing structured thinking under ambiguity. Decision being made: can this person scope, decompose and make trade-offs out loud?
Highest-probability questions: build them from the product and scale signals in the JD, for example "Design [the core system the role works on]", "How would you improve [existing process or system named in the JD]?", plus "How do you clarify requirements when the problem is ambiguous?".
Answer engineering for this stage: the answer is a spoken framework with a concrete worked thread: clarify scope, state constraints, sketch components or steps, name the two or three real trade-offs, define how success is measured. Keep it to about 90 seconds as an opening, because follow-ups will drive the depth.`,

  behavioral: `STAGE: Behavioural / values interview (45 minutes, usually a panel).
Evaluator: trained interviewers scoring against company values or competencies. Decision being made: how does this person behave when it is hard?
Highest-probability questions: "Tell me about a time you disagreed with a colleague or manager", "Tell me about a failure or a mistake and what you changed", "Tell me about a time you influenced someone without authority", "Tell me about working under ambiguity or a tight deadline", mapped to any values or competencies named in the JD.
Answer engineering for this stage: strict STAR with the candidate's own actions in the middle 60 percent, a quantified result where the resume supports one, and a genuine reflection at the end. One story per question, no recycling the same project twice across the pack unless nothing else exists.`,

  final_executive: `STAGE: Final / executive interview (30-45 minutes).
Evaluator: a senior leader. Decision being made: do I want this person representing the company, and is the trajectory right?
Highest-probability questions: "Why you, why now?", "What is your view on [market, product or field direction from the JD]?", "What would you do in your first 30/60/90 days?", "What questions do you have for me?" (handled in questionsToAsk), "Where do you want to be in three years?".
Answer engineering for this stage: short, confident, forward-looking. Connect the candidate's trajectory to the company's direction using JD language. Show culture add, not culture fit. End answers with a forward statement, not a summary.`,
};

export const TYPE_BRIEFS: Record<string, string> = {
  phone_screen: "FORMAT: phone, no visual cues. Answers must be 10 percent crisper, signpost structure out loud ('two things stand out').",
  video: "FORMAT: video call. Normal conversational answers; eye-line and energy matter, keep answers tight.",
  panel: "FORMAT: panel. Different panellists score different competencies; make each answer self-contained and address the person who asked.",
  coding: "FORMAT: includes a live practical or coding element. At least one core question should be about how the candidate approaches hands-on problem solving and verifies their work; answers should narrate process (clarify, plan, test, edge cases).",
  case_study: "FORMAT: case based. Weight questions toward structured problem solving on realistic scenarios from the JD.",
  presentation: "FORMAT: the candidate presents work. Include a question about the presented work and how they chose what to show; answers should reference structure, audience and decisions.",
  portfolio_review: "FORMAT: portfolio or work-sample review. Questions probe specific past work: choices, constraints, alternatives rejected.",
  values: "FORMAT: values or competency based scoring. Use STAR answers mapped to the values or competencies named in the JD.",
};

export const UNIVERSAL_RULES = `ANSWER RULES (non-negotiable):
1. Grounding: answers may only use facts present in the evidence bank. Never invent employers, projects, metrics, tools or outcomes. If a metric is not in the bank, describe the outcome qualitatively.
2. Brevity with substance: core answers MUST be 90-140 words (about 40-60 seconds spoken), built as five moves: a hook sentence that answers directly, evidence point one with a specific metric or artefact, evidence point two, one method or trade-off detail, and a tie-back sentence. An answer under 90 words is unfinished. Follow-up answers MUST be 45-80 words (about 20-35 seconds, 3-4 sentences each). Cut every sentence that does not add evidence or fit.
3. Structure: hook line that answers the question directly, then two or three evidence points from the bank, then a tie-back sentence that names the JD requirement this proves. No rambling chronology.
4. Voice: first person, plain confident English, no buzzword stuffing, no "I am passionate about synergy". Specific beats generic everywhere.
5. Gaps: where the requirement map marks a gap or partial, use the honest bridge: adjacent evidence plus a concrete ramp (what they have done that is close, and how they close the rest). Never claim the missing thing.
6. Traps: the trap field names the specific way candidates lose this question (rambling, criticising an employer, naming a salary figure, bluffing depth, taking credit for team work without owning a part).
7. Requirements coverage: across the 4 questions, cover as many must-have requirements as possible. provesRequirements must list the requirement ids each answer actually evidences.`;

export const SCENARIO_RULES = `PREP PACK RULES (non-negotiable):
1. Grounding: statements about the candidate use only the evidence bank. Never invent employers, projects, metrics, tools, certifications or outcomes. Scenarios and screens are illustrative teaching material and must read as hypothetical client situations, never as the candidate's past work.
2. Spoken answers describe past employers generically ("a large US bank", "a university AI institute") and never name internal tools, codenames or confidential systems.
3. Gaps are named honestly with adjacent evidence and a ramp; never claim a missing skill.
4. Specific beats generic: numbers with units, named techniques, named alternatives. Plain English, short sentences, no buzzwords, no em dashes.
5. Every technical claim must be correct for current industry practice.`;
