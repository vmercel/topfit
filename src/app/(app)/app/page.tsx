"use client";

import { useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  FileText,
  Loader2,
  Upload,
} from "lucide-react";
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

function StepHead({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-forest-900 text-sm font-bold text-white shadow-pop">
        {n}
      </span>
      <h3 className="text-[15px] font-semibold tracking-tight text-ink">{title}</h3>
    </div>
  );
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
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
    <div>
      <div className="pb-8">
        <p className="inline-flex items-center gap-2 rounded-full border border-forest-200 bg-forest-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-forest-800">
          <span className="h-1.5 w-1.5 rounded-full bg-copper-500" />
          New prep pack
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Build your prep pack
        </h1>
        <p className="mt-2.5 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
          Add your resume and the job description. TopFit builds the 4 questions this interview
          stage is most likely to ask, engineers brief answers from your own experience, and
          prepares you for the follow-ups.
        </p>
      </div>

      <section className="rounded-[28px] border border-line bg-white p-6 shadow-card sm:p-8">
        <div className="grid gap-10 md:grid-cols-2 md:gap-8">
          <div>
            <StepHead n={1} title="Your resume" />
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const dropped = e.dataTransfer.files?.[0];
                if (dropped) setFile(dropped);
              }}
              className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-9 text-center transition-all duration-200 ${
                dragging
                  ? "scale-[1.01] border-forest-500 bg-forest-50"
                  : file
                    ? "border-forest-400 bg-forest-50/70"
                    : "border-line-strong bg-cream hover:border-forest-400 hover:bg-forest-50/50"
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
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-forest-100 text-forest-700">
                    <FileText className="h-6 w-6" />
                  </span>
                  <span className="mt-3 text-sm font-semibold text-forest-900">{file.name}</span>
                  <span className="mt-1 inline-flex items-center gap-1 text-xs text-forest-700">
                    <Check className="h-3.5 w-3.5" />
                    {(file.size / 1024).toFixed(0)} KB. Tap to replace.
                  </span>
                </>
              ) : (
                <>
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-forest-100 text-forest-700">
                    <Upload className="h-6 w-6" />
                  </span>
                  <span className="mt-3 text-sm font-medium text-ink">
                    Drop or tap to upload a PDF or DOCX
                  </span>
                  <span className="mt-1 text-xs text-slate-500">Max 6 MB. Your pack is saved to a private link only you hold.</span>
                </>
              )}
            </label>
            <button
              onClick={() => setShowResumeText((s) => !s)}
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-forest-700 transition hover:text-forest-900"
            >
              {showResumeText ? "Hide the paste box" : "Or paste the resume text instead"}
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${showResumeText ? "rotate-180" : ""}`}
              />
            </button>
            {showResumeText && (
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                rows={8}
                placeholder="Paste your resume text here"
                className="mt-2 w-full rounded-xl border border-line-strong bg-white p-3.5 text-sm leading-relaxed text-ink placeholder:text-slate-400 transition focus:border-forest-500 focus:outline-none focus:ring-4 focus:ring-forest-500/10"
              />
            )}
          </div>

          <div>
            <StepHead n={2} title="The job description" />
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              rows={10}
              placeholder="Paste the full job description: responsibilities, requirements, skills, everything. The more complete it is, the sharper the questions."
              className="mt-4 w-full rounded-xl border border-line-strong bg-white p-3.5 text-sm leading-relaxed text-ink placeholder:text-slate-400 transition focus:border-forest-500 focus:outline-none focus:ring-4 focus:ring-forest-500/10"
            />
            <p className="mt-1.5 text-right text-xs tabular-nums text-slate-400">{jdText.trim().length} characters</p>
          </div>
        </div>

        <div className="mt-10">
          <StepHead n={3} title="Which interview is this?" />
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {STAGES.map((s) => {
              const selected = stage === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setStage(s.id)}
                  aria-pressed={selected}
                  className={`relative rounded-2xl border p-4 text-left transition-all duration-200 ${
                    selected
                      ? "border-forest-600 bg-forest-50 shadow-pop ring-1 ring-forest-600"
                      : "border-line bg-white hover:border-line-strong hover:shadow-card"
                  }`}
                >
                  {selected && (
                    <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-forest-600" />
                  )}
                  <span className="block pr-6 text-sm font-semibold text-ink">{s.label}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-slate-500">{s.blurb}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Format</span>
            {INTERVIEW_TYPES.map((t) => {
              const selected = interviewType === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setInterviewType(t.id)}
                  aria-pressed={selected}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                    selected
                      ? "border-forest-950 bg-forest-950 text-white"
                      : "border-line bg-white text-ink-soft hover:border-forest-300 hover:text-forest-800"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
            <input
              value={roundLabel}
              onChange={(e) => setRoundLabel(e.target.value)}
              placeholder="Round (optional, e.g. Round 2)"
              className="ml-auto w-48 rounded-full border border-line-strong bg-white px-3.5 py-1.5 text-xs text-ink placeholder:text-slate-400 transition focus:border-forest-500 focus:outline-none focus:ring-4 focus:ring-forest-500/10"
            />
          </div>
        </div>

        {error && (
          <p className="mt-6 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        <button
          onClick={generate}
          disabled={busy}
          className="group mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-forest-900 py-4 text-base font-semibold text-white shadow-lift transition hover:bg-forest-800 disabled:cursor-wait disabled:opacity-70"
        >
          {busy ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Building your prep pack...
            </>
          ) : (
            <>
              Build my prep pack
              <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </>
          )}
        </button>

        {busy && (
          <div className="mt-6 space-y-2.5 rounded-2xl border border-line bg-cream p-5">
            {PROGRESS_STEPS.map((s, i) => (
              <p
                key={s}
                className={`flex items-center gap-2.5 text-sm ${
                  i < stepIdx
                    ? "text-forest-800"
                    : i === stepIdx
                      ? "font-medium text-ink"
                      : "text-slate-400"
                }`}
              >
                {i < stepIdx ? (
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-forest-600 text-white">
                    <Check className="h-3 w-3" />
                  </span>
                ) : i === stepIdx ? (
                  <Loader2 className="h-5 w-5 shrink-0 animate-spin text-forest-700" />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-slate-300" />
                )}
                {s}
              </p>
            ))}
            <p className="pt-1 text-xs text-slate-400">This usually takes 40 to 90 seconds.</p>
          </div>
        )}
      </section>

      <div ref={resultRef} className="mt-10 scroll-mt-24">
        {result && <PackView result={result} />}
      </div>
    </div>
  );
}
