"use client";

import { useRef, useState } from "react";
import { STAGES, INTERVIEW_TYPES, type PrepResult } from "@/lib/types";
import PackView from "@/components/PackView";

const PROGRESS_STEPS = [
  "Reading your resume",
  "Decoding the job description",
  "Building your evidence bank",
  "Mapping your experience to their requirements",
  "Selecting the 4 highest-probability questions for this stage",
  "Engineering your answers",
  "Predicting the follow-ups",
];

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [showResumeText, setShowResumeText] = useState(false);
  const [jdText, setJdText] = useState("");
  const [stage, setStage] = useState<string>("hiring_manager");
  const [interviewType, setInterviewType] = useState<string>("video");
  const [roundLabel, setRoundLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PrepResult | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  async function generate() {
    setError("");
    if (!file && resumeText.trim().length < 200) {
      setError("Add your resume first: upload the PDF or DOCX, or paste the text.");
      return;
    }
    if (jdText.trim().length < 120) {
      setError("Paste the full job description so the questions match this exact role.");
      return;
    }
    setBusy(true);
    setStepIdx(0);
    timerRef.current = setInterval(
      () => setStepIdx((i) => Math.min(i + 1, PROGRESS_STEPS.length - 1)),
      4500
    );
    try {
      const form = new FormData();
      if (file) form.append("resumeFile", file);
      if (resumeText.trim()) form.append("resumeText", resumeText.trim());
      form.append("jdText", jdText);
      form.append("stage", stage);
      form.append("interviewType", interviewType);
      form.append("roundLabel", roundLabel);

      const res = await fetch("/api/prep", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed.");
      setResult(data as PrepResult);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed. Please try again.");
    } finally {
      if (timerRef.current) clearInterval(timerRef.current);
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-20 sm:px-6">
      <header className="pb-8 pt-10 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">TopFit</p>
        <h1 className="mx-auto mt-2 max-w-2xl text-4xl font-bold leading-tight text-slate-900">
          Walk in ready. Answer like the top 3 percent.
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-600">
          Add your resume and the job description. TopFit decodes what this employer is really
          testing at your interview stage, builds the 4 questions they are most likely to ask,
          engineers brief answers from your own experience, and prepares you for the follow-ups.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-slate-800">1. Your resume</label>
            <label
              className={`mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
                file ? "border-emerald-500 bg-emerald-50" : "border-slate-300 hover:border-emerald-500"
              }`}
            >
              <input
                type="file"
                accept=".pdf,.docx,.txt,.md"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              {file ? (
                <>
                  <span className="text-sm font-semibold text-emerald-800">{file.name}</span>
                  <span className="mt-1 text-xs text-emerald-700">
                    {(file.size / 1024).toFixed(0)} KB. Tap to replace.
                  </span>
                </>
              ) : (
                <>
                  <span className="text-sm font-medium text-slate-700">
                    Drop or tap to upload a PDF or DOCX
                  </span>
                  <span className="mt-1 text-xs text-slate-500">Max 6 MB. Your pack is saved to a private link only you hold.</span>
                </>
              )}
            </label>
            <button
              onClick={() => setShowResumeText((s) => !s)}
              className="mt-2 text-xs font-medium text-emerald-700 underline"
            >
              {showResumeText ? "Hide the paste box" : "Or paste the resume text instead"}
            </button>
            {showResumeText && (
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                rows={8}
                placeholder="Paste your resume text here"
                className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-800 focus:border-emerald-600 focus:outline-none"
              />
            )}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-800">2. The job description</label>
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              rows={10}
              placeholder="Paste the full job description: responsibilities, requirements, skills, everything. The more complete it is, the sharper the questions."
              className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-800 focus:border-emerald-600 focus:outline-none"
            />
            <p className="mt-1 text-right text-xs text-slate-400">{jdText.trim().length} characters</p>
          </div>
        </div>

        <div className="mt-6">
          <label className="text-sm font-semibold text-slate-800">3. Which interview is this?</label>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {STAGES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStage(s.id)}
                className={`rounded-xl border p-3 text-left transition ${
                  stage === s.id
                    ? "border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <span className="block text-sm font-semibold text-slate-800">{s.label}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{s.blurb}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Format</span>
            {INTERVIEW_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => setInterviewType(t.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  interviewType === t.id
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t.label}
              </button>
            ))}
            <input
              value={roundLabel}
              onChange={(e) => setRoundLabel(e.target.value)}
              placeholder="Round (optional, e.g. Round 2)"
              className="ml-auto w-44 rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 focus:border-emerald-600 focus:outline-none"
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">{error}</p>
        )}

        <button
          onClick={generate}
          disabled={busy}
          className="mt-6 w-full rounded-xl bg-emerald-700 py-3.5 text-base font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-70"
        >
          {busy ? "Building your prep pack..." : "Build my prep pack"}
        </button>

        {busy && (
          <div className="mt-5 space-y-1.5">
            {PROGRESS_STEPS.map((s, i) => (
              <p
                key={s}
                className={`flex items-center gap-2 text-sm ${
                  i < stepIdx ? "text-emerald-700" : i === stepIdx ? "font-medium text-slate-800" : "text-slate-400"
                }`}
              >
                <span>{i < stepIdx ? "✓" : i === stepIdx ? "▸" : "·"}</span> {s}
              </p>
            ))}
            <p className="pt-1 text-xs text-slate-400">This usually takes 40 to 90 seconds.</p>
          </div>
        )}
      </section>

      <div ref={resultRef} className="mt-8 scroll-mt-6">
        {result && <PackView result={result} />}
      </div>

      <footer className="mt-14 text-center text-xs leading-relaxed text-slate-400">
        Answers are built only from what your resume actually says. Where the job asks for something
        your resume does not show, TopFit gives you an honest bridge, never an invented claim.
      </footer>
    </main>
  );
}
