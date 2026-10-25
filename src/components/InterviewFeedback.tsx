"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Sparkles,
  Clock,
  Trophy,
  MessageSquare,
} from "lucide-react";
import { useInterviewFeedback } from "./InterviewFeedbackProvider";
import "./interview-practice.css";
const labels: Record<string, string> = {
  relevance: "Relevance",
  depth: "Depth & reasoning",
  evidence: "Evidence & ownership",
  clarity: "Clarity & structure",
};
export default function InterviewFeedback() {
  const { result, setResult } = useInterviewFeedback();
  const router = useRouter();
  const [error, setError] = useState("");
  const [copyLabel, setCopyLabel] = useState("Copy feedback");
  const report = result?.report;
  const role = result?.role || "Interview practice";
  function reset() {
    setResult(null);
    router.replace("/app/interview");
  }
  async function copyFeedback() {
    if (!report) return;
    const text = `TopFit interview practice — ${role}\nScore: ${report.score}/100\n${report.completed ? "Completed" : "Partial"} interview: ${report.answeredMain}/${report.plannedMain} main questions answered\n\n${report.summary}\n\nNext steps:\n${report.nextSteps.map((s) => "- " + s).join("\n")}\n\n${report.evaluations.map((e, i) => `Question: ${report.turns[i].question}\nAnswer: ${report.turns[i].answer}\nStrength: ${e.strength}\nImprove: ${e.improve}\nBetter outline:\n${e.betterOutline.map((s) => "- " + s).join("\n")}`).join("\n\n")}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopyLabel("Copied");
    } catch {
      setError(
        "Clipboard unavailable. You can select and copy the feedback on this page.",
      );
    }
  }

  if (!report || !result)
    return (
      <main className="interview-studio iv-empty-feedback">
        <Trophy size={38} />
        <h1>Your next breakthrough starts with a conversation.</h1>
        <p>
          Finish an interview to unlock your scoreboard and personal feedback.
          Reports stay in memory in this tab; reloading clears them.
        </p>
        <Link href="/app/interview" className="iv-primary-button">
          Start an interview <ArrowRight size={16} />
        </Link>
      </main>
    );
  return (
    <main className="interview-studio iv-debrief">
      <header className="iv-page-heading">
        <p className="iv-eyebrow">THE DEBRIEF</p>
        <h1>
          A stronger answer <em>starts here.</em>
        </h1>
        <p>
          Your performance, the evidence behind it, and a concrete plan for next
          time.
        </p>
      </header>
      <div className="iv-result-meta">
        <span>
          <Check size={14} />{" "}
          {result.reason === "time"
            ? "Time completed"
            : result.reason === "manual"
              ? "Ended by you"
              : "Questions completed"}
        </span>
        <span>
          <Clock size={14} />
          {Math.floor(result.elapsed / 60)}m {result.elapsed % 60}s
        </span>
        <span>
          <MessageSquare size={14} />
          {report.turns.filter((t) => t.answer !== "[Skipped]").length} answers
        </span>
      </div>
      <div className="iv-report-top">
        <div
          className="iv-score"
          style={{ "--score": `${report.score}%` } as React.CSSProperties}
        >
          <span>COACHING SCORE</span>
          <div className="iv-score-orbit">
            <strong>
              {report.score}
              <small>/100</small>
            </strong>
          </div>
          <p>
            {report.turns.length === 0
              ? "No answers submitted"
              : report.completed
                ? "Full question set covered"
                : "Partial question coverage"}
          </p>
          <small>
            {report.answeredMain} / {report.plannedMain} main questions answered
          </small>
        </div>
        <section className="iv-report-summary">
          <h2>{role}</h2>
          <p>{report.summary}</p>
          <div className="iv-dimensions">
            {report.dimensions.map((d) => (
              <div key={d.name}>
                <label htmlFor={`score-${d.name}`}>
                  {labels[d.name]}
                  <span>{d.score}/100</span>
                </label>
                <progress id={`score-${d.name}`} value={d.score} max={100} />
              </div>
            ))}
          </div>
        </section>
      </div>
      <p className="iv-rubric">
        Each submitted answer is rated 0–5 on relevance, depth, evidence and
        clarity, with equal weight. The overall score averages these ratings
        across all submitted main and follow-up answers; skipped answers receive
        zero. Feedback uses the submitted transcript, not appearance, voice or
        accent. This is AI coaching, not a hiring prediction.
      </p>
      <div className="iv-feedback-grid">
        <section>
          <h2>
            <Check size={18} /> Keep doing this
          </h2>
          <ul>
            {report.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </section>
        <section>
          <h2>
            <Sparkles size={18} /> Your next practice plan
          </h2>
          <ol>
            {report.nextSteps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </section>
      </div>
      <section className="iv-answer-feedback">
        <div className="iv-section-heading">
          <h2>Question-by-question feedback</h2>
          <span>{report.turns.length} submitted answers</span>
        </div>
        {report.evaluations.map((evaluation, i) => (
          <details key={i} open={i === 0}>
            <summary>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <div>
                {report.turns[i].question}
                <small>
                  {report.turns[i].followup ? "Follow-up" : "Main question"}
                </small>
              </div>
              <strong>
                {Math.round(
                  ((evaluation.relevance +
                    evaluation.depth +
                    evaluation.evidence +
                    evaluation.clarity) /
                    20) *
                    100,
                )}
                <small>/100</small>
              </strong>
              <ChevronDown size={16} />
            </summary>
            <div className="iv-evaluation-body">
              <p className="iv-label">YOUR ANSWER</p>
              <p className="iv-original-answer">{report.turns[i].answer}</p>
              {evaluation.evidenceQuote && (
                <blockquote>“{evaluation.evidenceQuote}”</blockquote>
              )}
              <div className="iv-turn-scores">
                {(["relevance", "depth", "evidence", "clarity"] as const).map(
                  (k) => (
                    <span key={k}>
                      {labels[k]} <b>{evaluation[k]}/5</b>
                    </span>
                  ),
                )}
              </div>
              <h3>What worked</h3>
              <p>{evaluation.strength}</p>
              <h3>What to improve</h3>
              <p>{evaluation.improve}</p>
              <h3>A stronger answer outline</h3>
              <ol>
                {evaluation.betterOutline.map((s, j) => (
                  <li key={j}>{s}</li>
                ))}
              </ol>
            </div>
          </details>
        ))}
      </section>
      <div className="iv-report-actions">
        <button className="iv-primary-button" onClick={reset}>
          Practice again <ArrowRight size={16} />
        </button>
        <button className="iv-secondary-button" onClick={copyFeedback}>
          {copyLabel}
        </button>
      </div>
      {error && (
        <p role="alert" className="iv-error">
          {error}
        </p>
      )}
      <p className="iv-footnote">
        Copy your feedback before leaving or reloading. This report stays in
        memory in this tab and is not saved to your account.
      </p>
    </main>
  );
}
