"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PrepResult } from "@/lib/types";

function secondsLabel(s: number) {
  return `~${s}s spoken`;
}

function toMarkdown(result: PrepResult): string {
  const { analysis, pack } = result;
  const lines: string[] = [];
  lines.push(`# Interview prep: ${analysis.roleTitle} at ${analysis.company}`);
  lines.push(`Candidate: ${analysis.candidateName}. ${analysis.pitchLine}`);
  lines.push(`\nCoverage: ${pack.coveredCount} of ${pack.totalMustHaves} must-haves evidenced. ${pack.coverageNote}`);
  lines.push(`\n## Strategy`);
  pack.strategy.forEach((s) => lines.push(`- ${s}`));
  pack.questions.forEach((q, i) => {
    lines.push(`\n## Q${i + 1}. ${q.question}`);
    lines.push(`Why they ask: ${q.intent}`);
    lines.push(`\n**Answer** (${secondsLabel(q.seconds)}):\n${q.answer}`);
    lines.push(`\nWatch out: ${q.trap}`);
    q.followUps.forEach((f, j) => {
      lines.push(`\n### Follow-up ${j + 1}: ${f.question}`);
      lines.push(`Likely because: ${f.whyLikely}`);
      lines.push(`Answer: ${f.answer}`);
    });
  });
  lines.push(`\n## Questions to ask them`);
  pack.questionsToAsk.forEach((q) => lines.push(`- ${q}`));
  lines.push(`\nClosing line: ${pack.closingLine}`);
  return lines.join("\n");
}

function Timer() {
  const [secs, setSecs] = useState(0);
  const [running, setRunning] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => setSecs((s) => s + 1), 1000);
    } else if (ref.current) {
      clearInterval(ref.current);
    }
    return () => {
      if (ref.current) clearInterval(ref.current);
    };
  }, [running]);
  const mm = String(Math.floor(secs / 60)).padStart(1, "0");
  const ss = String(secs % 60).padStart(2, "0");
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="font-mono text-base tabular-nums text-slate-800">
        {mm}:{ss}
      </span>
      <button
        onClick={() => setRunning((r) => !r)}
        className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
      >
        {running ? "Pause" : secs > 0 ? "Resume" : "Time yourself"}
      </button>
      {secs > 0 && (
        <button
          onClick={() => {
            setSecs(0);
            setRunning(false);
          }}
          className="text-xs text-slate-500 underline"
        >
          Reset
        </button>
      )}
    </div>
  );
}

export default function PackView({ result }: { result: PrepResult }) {
  const { analysis, pack } = result;
  const [practice, setPractice] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [openFollowUps, setOpenFollowUps] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  const coveragePct = useMemo(() => {
    if (!pack.totalMustHaves) return 0;
    return Math.round((pack.coveredCount / pack.totalMustHaves) * 100);
  }, [pack]);

  const reqById = useMemo(() => {
    const m = new Map<string, string>();
    analysis.requirements.forEach((r) => m.set(r.id, r.text));
    return m;
  }, [analysis]);

  async function copyPack() {
    try {
      await navigator.clipboard.writeText(toMarkdown(result));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              {analysis.domain} · {analysis.seniority}
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              {analysis.roleTitle} at {analysis.company}
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-slate-700">{pack.headline}</p>
            <p className="mt-2 text-sm text-slate-500">
              Prepared for {analysis.candidateName} · {analysis.pitchLine}
            </p>
          </div>
          <div className="min-w-44 rounded-xl bg-emerald-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
              Requirement coverage
            </p>
            <p className="mt-1 text-3xl font-bold text-emerald-900">
              {pack.coveredCount}/{pack.totalMustHaves}
            </p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-emerald-100">
              <div className="h-full bg-emerald-600" style={{ width: `${coveragePct}%` }} />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-emerald-900">{pack.coverageNote}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setPractice((p) => !p)}
            className={`rounded-lg px-3.5 py-2 text-sm font-semibold ${
              practice
                ? "bg-slate-900 text-white"
                : "bg-emerald-700 text-white hover:bg-emerald-800"
            }`}
          >
            {practice ? "Exit practice mode" : "Practice mode: hide the answers"}
          </button>
          <button
            onClick={copyPack}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {copied ? "Copied" : "Copy the whole pack"}
          </button>
          {result.id && (
            <a
              href={`/prep/${result.id}`}
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Open the saved link
            </a>
          )}
        </div>

        <div className="mt-5 grid gap-2 md:grid-cols-2">
          {pack.strategy.map((s, i) => (
            <div key={i} className="rounded-lg bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700">
              {s}
            </div>
          ))}
        </div>
      </section>

      {analysis.requirements.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            How your resume maps to this job
          </h3>
          <ul className="mt-3 divide-y divide-slate-100">
            {analysis.requirements.map((r) => (
              <li key={r.id} className="flex items-start gap-3 py-2.5">
                <span
                  className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    r.match === "strong"
                      ? "bg-emerald-100 text-emerald-800"
                      : r.match === "partial"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {r.match === "strong" ? "Strong" : r.match === "partial" ? "Partial" : "Gap"}
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-800">{r.text}</p>
                  <p className="text-xs text-slate-500">{r.note}</p>
                </div>
                <span className="ml-auto shrink-0 text-[11px] font-medium uppercase text-slate-400">
                  {r.kind === "must" ? "Must have" : "Nice to have"}
                </span>
              </li>
            ))}
          </ul>
          {analysis.risks.length > 0 && (
            <div className="mt-4 rounded-lg bg-amber-50 p-3.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                Objections to pre-empt
              </p>
              <ul className="mt-1.5 space-y-1.5">
                {analysis.risks.map((r, i) => (
                  <li key={i} className="text-sm text-amber-900">
                    <span className="font-medium">{r.text}.</span> {r.mitigation}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {pack.questions.map((q, qi) => {
        const key = `q${qi}`;
        const answerShown = !practice || revealed[key];
        const fuOpen = openFollowUps[key] || practice;
        return (
          <section key={key} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-semibold text-white">
                Question {qi + 1}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                {q.category}
              </span>
              <span className="text-xs text-slate-500">{secondsLabel(q.seconds)} target</span>
              <div className="ml-auto">
                <Timer />
              </div>
            </div>

            <h3 className="mt-3 text-xl font-semibold leading-snug text-slate-900">{q.question}</h3>
            <p className="mt-1.5 text-sm text-slate-500">
              <span className="font-medium text-slate-600">Why they ask:</span> {q.intent}
            </p>

            {q.provesRequirements.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {q.provesRequirements.map((rid) => (
                  <span
                    key={rid}
                    className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800 ring-1 ring-emerald-100"
                  >
                    Proves: {reqById.get(rid) || rid}
                  </span>
                ))}
              </div>
            )}

            {answerShown ? (
              <div className="mt-4">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="whitespace-pre-line text-[15px] leading-relaxed text-slate-800">
                    {q.answer}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {q.structure.map((s, i) => (
                    <span key={i} className="rounded-md bg-white px-2 py-1 text-[11px] text-slate-500 ring-1 ring-slate-200">
                      {s}
                    </span>
                  ))}
                </div>
                {q.evidenceUsed.length > 0 && (
                  <p className="mt-3 text-xs leading-relaxed text-slate-500">
                    <span className="font-medium text-slate-600">Built from your resume:</span>{" "}
                    {q.evidenceUsed.join(" · ")}
                  </p>
                )}
                <p className="mt-3 rounded-lg bg-rose-50 px-3.5 py-2.5 text-sm text-rose-900">
                  <span className="font-semibold">Watch out:</span> {q.trap}
                </p>
              </div>
            ) : (
              <button
                onClick={() => setRevealed((r) => ({ ...r, [key]: true }))}
                className="mt-4 w-full rounded-xl border-2 border-dashed border-slate-300 py-8 text-sm font-medium text-slate-500 hover:border-emerald-500 hover:text-emerald-700"
              >
                Say your answer out loud, timed. Then tap to compare with the engineered answer.
              </button>
            )}

            <div className="mt-5 border-t border-slate-100 pt-4">
              <button
                onClick={() => setOpenFollowUps((o) => ({ ...o, [key]: !fuOpen }))}
                className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
              >
                {fuOpen ? "Hide" : "Show"} the 3 follow-ups they will ask next
              </button>
              {fuOpen && (
                <div className="mt-3 space-y-3">
                  {q.followUps.map((f, fi) => (
                    <div key={fi} className="rounded-xl border border-slate-200 p-4">
                      <p className="text-[15px] font-medium text-slate-900">
                        {fi + 1}. {f.question}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Likely because: {f.whyLikely} · {secondsLabel(f.seconds)}
                      </p>
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                        {f.answer}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      })}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Questions you ask them
        </h3>
        <ul className="mt-3 space-y-2">
          {pack.questionsToAsk.map((q, i) => (
            <li key={i} className="rounded-lg bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700">
              {q}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[15px] text-slate-800">
          <span className="font-semibold">Closing line:</span> {pack.closingLine}
        </p>
      </section>
    </div>
  );
}
