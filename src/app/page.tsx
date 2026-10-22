"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  FileCheck2,
  FileText,
  Loader2,
  MessagesSquare,
  Timer,
  Upload,
  UserPlus,
} from "lucide-react";
import { STAGES, INTERVIEW_TYPES, type PrepResult } from "@/lib/types";
import PackView from "@/components/PackView";
import { LogoMark } from "@/components/Logo";
import { supabaseBrowser } from "@/lib/supabase-browser";

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

function MiniRing({ pct }: { pct: number }) {
  const size = 52;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-forest-100" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
          className="stroke-forest-600"
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[11px] font-bold text-forest-800">
        {pct}%
      </span>
    </div>
  );
}

function SamplePreview() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none" aria-hidden="true">
      <div className="absolute -inset-3 -rotate-2 rounded-[32px] bg-forest-100/80" />
      <div className="absolute -inset-3 rotate-1 rounded-[32px] bg-copper-100/50" />
      <div className="relative rounded-[28px] border border-line bg-white p-6 shadow-lift">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <LogoMark size={30} />
            <div>
              <p className="text-sm font-semibold text-ink">Prep pack</p>
              <p className="text-xs text-slate-500">Hiring manager round · Video call</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <MiniRing pct={77} />
            <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
              Coverage
            </span>
          </div>
        </div>

        <h3 className="mt-5 text-lg font-bold leading-snug tracking-tight text-ink">
          Senior Machine Learning Engineer
        </h3>
        <p className="text-sm text-slate-500">Platform team · Fintech</p>

        <div className="my-5 border-t border-line" />

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-forest-900 px-2.5 py-0.5 text-[11px] font-semibold text-white">
            Question 1
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            <Clock className="h-3.5 w-3.5" /> ~60s spoken target
          </span>
        </div>
        <p className="mt-2.5 font-medium leading-snug text-ink">
          Tell me about a model you took from experiment to production.
        </p>
        <div className="mt-3 space-y-2 rounded-xl bg-paper p-4">
          <div className="h-2 w-full rounded-full bg-slate-300/80" />
          <div className="h-2 w-11/12 rounded-full bg-slate-300/70" />
          <div className="h-2 w-4/5 rounded-full bg-slate-300/60" />
          <div className="h-2 w-3/5 rounded-full bg-forest-300" />
        </div>

        <div className="mt-5">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <MessagesSquare className="h-4 w-4 text-forest-600" />
            Follow-ups they will ask next
          </p>
          <div className="mt-2.5 space-y-2">
            {["How did you measure whether it worked?", "What broke first at production scale?"].map(
              (t, i) => (
                <div key={t} className="flex items-center gap-2.5 rounded-lg border border-line bg-cream px-3 py-2">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-forest-100 text-[11px] font-bold text-forest-800">
                    {i + 1}
                  </span>
                  <span className="text-[13px] font-medium text-ink-soft">{t}</span>
                </div>
              )
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-forest-50 px-2 py-0.5 text-[11px] font-medium text-forest-800 ring-1 ring-forest-100">
            Proves: model monitoring
          </span>
          <span className="rounded-full bg-forest-50 px-2 py-0.5 text-[11px] font-medium text-forest-800 ring-1 ring-forest-100">
            Proves: production ownership
          </span>
        </div>
      </div>
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
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabaseBrowser()
      .auth.getUser()
      .then(({ data }) => setSignedIn(!!data.user))
      .catch(() => setSignedIn(false));
  }, []);

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
    <main className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">
      <header className="grid items-center gap-14 pb-16 pt-12 lg:grid-cols-[1.02fr_0.98fr] lg:pt-16">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-forest-200 bg-forest-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-forest-800">
            <span className="h-1.5 w-1.5 rounded-full bg-copper-500" />
            Stage-aware interview prep
          </p>
          <h1 className="mt-6 text-[42px] font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl">
            Walk in ready. Answer like the <span className="text-forest-700">top 3 percent</span>.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
            Add your resume and the job description. TopFit decodes what this employer is really
            testing at your interview stage, builds the 4 questions they are most likely to ask,
            engineers brief answers from your own experience, and prepares you for the follow-ups.
          </p>
          <div className="mt-10 flex flex-wrap gap-x-10 gap-y-5 border-t border-line pt-7">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-forest-100 text-forest-700">
                <FileCheck2 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-lg font-bold leading-none text-ink">4</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Engineered answers
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-forest-100 text-forest-700">
                <MessagesSquare className="h-5 w-5" />
              </span>
              <div>
                <p className="text-lg font-bold leading-none text-ink">12</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Predicted follow-ups
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-forest-100 text-forest-700">
                <Timer className="h-5 w-5" />
              </span>
              <div>
                <p className="text-lg font-bold leading-none text-ink">~30s</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                  To a full prep pack
                </p>
              </div>
            </div>
          </div>
        </div>
        <SamplePreview />
      </header>

      {signedIn === true && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-forest-200/80 bg-forest-50 px-5 py-3.5">
          <p className="flex items-center gap-2 text-sm text-forest-900">
            <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-forest-700" />
            Signed in. Every pack you build is saved to your dashboard automatically.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-sm font-semibold text-forest-800 transition hover:text-forest-950"
          >
            View your history
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {signedIn === false ? (
        <section className="rounded-[28px] border border-line bg-white p-10 text-center shadow-card sm:p-14">
          <div className="flex justify-center">
            <LogoMark size={46} />
          </div>
          <h2 className="mt-5 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Sign in to build your prep pack
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-ink-soft">
            TopFit accounts are free. Your resume, your job descriptions and every prep pack stay
            in your own dashboard, ready whenever you come back.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-forest-900 px-6 py-3 text-sm font-semibold text-white shadow-pop transition hover:bg-forest-800"
            >
              <UserPlus className="h-4 w-4" />
              Create a free account
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:border-forest-300 hover:text-forest-800"
            >
              Sign in
            </Link>
          </div>
        </section>
      ) : signedIn === null ? (
        <section className="rounded-[28px] border border-line bg-white p-10 text-center shadow-card">
          <p className="inline-flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking your session...
          </p>
        </section>
      ) : (
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
      )}

      <div ref={resultRef} className="mt-10 scroll-mt-24">
        {result && <PackView result={result} />}
      </div>
    </main>
  );
}
