import type {
  Feedback,
  InterviewReport,
  InterviewSession,
  InterviewTurn,
} from "./contracts";

export function recordAnswer(
  session: InterviewSession,
  answer: string,
): InterviewSession {
  if (session.turns.length >= 10)
    throw new Error("Interview turn limit reached.");
  const turn: InterviewTurn = {
    ...session.current,
    answer: answer.trim(),
    mainIndex: session.mainIndex,
    followup: session.isFollowup,
  };
  return { ...session, turns: [...session.turns, turn] };
}
export function nextMain(session: InterviewSession): InterviewSession | null {
  const next = session.mainIndex + 1;
  return next >= session.plan.length
    ? null
    : {
        ...session,
        mainIndex: next,
        current: session.plan[next],
        isFollowup: false,
      };
}
export function buildReport(
  session: InterviewSession,
  feedback: Feedback,
  completed: boolean,
): InterviewReport {
  // Require exactly one evaluation for each turn, in order. Never accept a model-invented overall score.
  if (
    feedback.evaluations.length !== session.turns.length ||
    feedback.evaluations.some((e, i) => e.turnIndex !== i)
  )
    throw new Error(
      "The feedback was incomplete. Please retry the evaluation.",
    );
  const evaluations = feedback.evaluations.map((e, i) => ({
    ...e,
    evidenceQuote: session.turns[i].answer.includes(e.evidenceQuote)
      ? e.evidenceQuote
      : "",
    ...(session.turns[i].answer === "[Skipped]"
      ? {
          relevance: 0,
          depth: 0,
          evidence: 0,
          clarity: 0,
          strength: "This question was skipped.",
          improve: "Attempt an answer in your next practice round.",
        }
      : {}),
  }));
  const names = ["relevance", "depth", "evidence", "clarity"] as const;
  const dimensions = names.map((name) => ({
    name,
    score: Math.round(
      (evaluations.reduce((total, e) => total + e[name], 0) /
        evaluations.length) *
        20,
    ),
  }));
  const score = Math.round(
    (evaluations.reduce(
      (total, e) => total + names.reduce((sum, k) => sum + e[k], 0),
      0,
    ) /
      (evaluations.length * 20)) *
      100,
  );
  return {
    ...feedback,
    evaluations,
    score,
    dimensions,
    turns: session.turns,
    completed,
    answeredMain: new Set(
      session.turns
        .filter((t) => !t.followup && t.answer !== "[Skipped]")
        .map((t) => t.mainIndex),
    ).size,
    plannedMain: session.plan.length,
  };
}
