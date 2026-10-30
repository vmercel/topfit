"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  Check,
  Loader2,
  Sparkles,
  ChevronDown,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  ListChecks,
  MessagesSquare,
  Quote,
  ShieldAlert,
  Target,
} from "lucide-react";
import { STAGES, INTERVIEW_TYPES, type PrepResult } from "@/lib/types";
import ScenarioPack from "./ScenarioPack";

function secondsLabel(s: number) {
  return `~${s}s spoken`;
}

function toMarkdown(result: PrepResult): string {
  const { analysis, pack } = result;
  const lines: string[] = [];
  lines.push(`# Interview prep: ${analysis.roleTitle} at ${analysis.company}`);
  lines.push(`Candidate: ${analysis.candidateName}. ${analysis.pitchLine}`);
  lines.push(
    `\nCoverage: ${pack.coveredCount} of ${pack.totalMustHaves} must-haves evidenced. ${pack.coverageNote}`,
  );
  lines.push(`\n## Strategy`);
  pack.strategy.forEach((s) => lines.push(`- ${s}`));
  if (pack.snapshot) {
    lines.push(`\n## Interview snapshot\n${pack.snapshot.summary}`);
    pack.snapshot.rows.forEach((r) => lines.push(`- ${r.label}: ${r.value}`));
    if (pack.snapshot.note) lines.push(pack.snapshot.note);
  }
  if (pack.pitch) lines.push(`\n## Your 60-second pitch\n${pack.pitch}`);
  if (pack.storyMap?.length) {
    lines.push(`\n## Your stories mapped to the JD`);
    pack.storyMap.forEach((s) =>
      lines.push(`- ${s.requirement}: ${s.story} (${s.proof})`),
    );
  }
  if (pack.technicalQA?.length) {
    lines.push(`\n## Technical questions with brief answers`);
    pack.technicalQA.forEach((q, i) =>
      lines.push(`\n**${i + 1}. ${q.question}**\n${q.answer}`),
    );
  }
  (pack.frameworks ?? []).forEach((f, i) => {
    lines.push(`\n## ${i + 1}. ${f.name}`);
    lines.push(`JD: ${f.requirement}`);
    lines.push(`\n**Scenario.** ${f.scenario}`);
    lines.push(`\n**How to read the screen.** ${f.howToRead}`);
    lines.push(`\n**What you do.** ${f.whatToDo}`);
    if (f.extraNote) lines.push(`\n${f.extraNote}`);
    lines.push(
      `\n| ${f.tradeoffs.columns.join(" | ")} |\n| ${f.tradeoffs.columns.map(() => "---").join(" | ")} |`,
    );
    f.tradeoffs.rows.forEach((r) => lines.push(`| ${r.join(" | ")} |`));
  });
  if (pack.behavioral?.length) {
    lines.push(`\n## Behavioural questions`);
    pack.behavioral.forEach((q) =>
      lines.push(`\n**${q.question}**\n${q.answer}`),
    );
  }
  if (pack.logistics?.length) {
    lines.push(`\n## Logistics`);
    pack.logistics.forEach((l) => lines.push(`- ${l}`));
  }
  if (pack.gaps?.length) {
    lines.push(`\n## Gaps and how to handle them`);
    pack.gaps.forEach((g) => lines.push(`- ${g.gap}: ${g.whatToSay}`));
  }
  (pack.questions ?? []).forEach((q, i) => {
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
  if (pack.checklist?.length) {
    lines.push(`\n## Day-of checklist`);
    pack.checklist.forEach((c) => lines.push(`- [ ] ${c}`));
  }
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
    <div className="flex items-center gap-2.5 rounded-full border border-line bg-white py-1.5 pl-3.5 pr-2 shadow-pop">
      <span className="flex items-center gap-1.5 font-mono text-sm tabular-nums text-ink">
        <Clock className="h-4 w-4 text-forest-600" />
        {mm}:{ss}
      </span>
      <button
        onClick={() => setRunning((r) => !r)}
        className="rounded-full bg-forest-900 px-3 py-1 text-xs font-semibold text-white transition hover:bg-forest-800"
      >
        {running ? "Pause" : secs > 0 ? "Resume" : "Time yourself"}
      </button>
      {secs > 0 && (
        <button
          onClick={() => {
            setSecs(0);
            setRunning(false);
          }}
          className="pr-1.5 text-xs font-medium text-slate-500 underline transition hover:text-ink"
        >
          Reset
        </button>
      )}
    </div>
  );
}

function CoverageRing({
  pct,
  covered,
  total,
}: {
  pct: number;
  covered: number;
  total: number;
}) {
  const size = 128;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-forest-100"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
          className="stroke-forest-600 transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[26px] font-bold leading-none tracking-tight text-forest-950">
          {covered}/{total}
        </span>
        <span className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-forest-700">
          {pct}% covered
        </span>
      </div>
    </div>
  );
}

function SectionLabel({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
      <span className="text-forest-600">{icon}</span>
      {children}
    </h3>
  );
}

export default function PackView({ result: initial }: { result: PrepResult }) {
  const [pack, setPack] = useState(initial.pack);
  const result = { ...initial, pack };
  const { analysis } = result;
  const hasMaterial = !!pack.frameworks?.length;
  const hasLegacy = !!pack.questions?.length;
  const [tab, setTab] = useState<"material" | "map" | "qa">("material");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");

  async function generateMaterial() {
    if (!result.id) return;
    setGenerating(true);
    setGenError("");
    try {
      const res = await fetch(`/api/prep/${result.id}/material`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed.");
      setPack(data.pack);
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setGenerating(false);
    }
  }
  const [practice, setPractice] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [openFollowUps, setOpenFollowUps] = useState<Record<string, boolean>>(
    {},
  );
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

  const stageLabel =
    STAGES.find((s) => s.id === result.stage)?.label || result.stage;
  const typeLabel =
    INTERVIEW_TYPES.find((t) => t.id === result.interviewType)?.label ||
    result.interviewType;

  async function copyPack() {
    try {
      await navigator.clipboard.writeText(toMarkdown(result));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const btnBase =
    "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition";
  const btnGhost = `${btnBase} border border-line-strong bg-white text-ink-soft hover:border-forest-300 hover:text-forest-800`;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] border border-line bg-white shadow-card">
        <div className="h-1.5 bg-gradient-to-r from-forest-800 via-forest-600 to-copper-500" />
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0 max-w-2xl flex-1">
              <p className="inline-flex items-center gap-2 rounded-full bg-forest-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-forest-800 ring-1 ring-forest-100">
                {analysis.domain} · {analysis.seniority}
              </p>
              <h2 className="mt-3.5 text-3xl font-bold leading-tight tracking-tight text-ink">
                {analysis.roleTitle} <span className="text-slate-400">at</span>{" "}
                {analysis.company}
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
                {pack.headline}
              </p>

              <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-5 sm:grid-cols-4">
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Candidate
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-ink">
                    {analysis.candidateName}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Current role
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-ink">
                    {analysis.currentTitle}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Experience
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-ink">
                    {analysis.yearsExperience}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Interview
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-ink">
                    {stageLabel} · {typeLabel}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 text-sm leading-relaxed text-slate-500">
                {analysis.pitchLine}
              </p>
            </div>

            <div className="flex flex-col items-center gap-3 rounded-3xl bg-forest-50/80 px-6 py-5 ring-1 ring-forest-100">
              <CoverageRing
                pct={coveragePct}
                covered={pack.coveredCount}
                total={pack.totalMustHaves}
              />
              <p className="text-xs font-semibold uppercase tracking-wider text-forest-800">
                Requirement coverage
              </p>
              <p className="max-w-48 text-center text-xs leading-relaxed text-forest-900">
                {pack.coverageNote}
              </p>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-2.5 border-t border-line pt-6">
            <button
              onClick={() => setPractice((p) => !p)}
              className={
                practice
                  ? `${btnBase} bg-forest-950 text-white shadow-pop hover:bg-forest-900`
                  : `${btnBase} bg-forest-700 text-white shadow-pop hover:bg-forest-800`
              }
            >
              {practice ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
              {practice
                ? "Exit practice mode"
                : "Practice mode: hide the answers"}
            </button>
            <button onClick={copyPack} className={btnGhost}>
              {copied ? (
                <Check className="h-4 w-4 text-forest-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Copied" : "Copy the whole pack"}
            </button>
            {result.id && (
              <a href={`/app/prep/${result.id}`} className={btnGhost}>
                <ExternalLink className="h-4 w-4" />
                Open the saved link
              </a>
            )}
          </div>

          <div className="mt-6">
            <SectionLabel icon={<Target className="h-4 w-4" />}>
              Your strategy
            </SectionLabel>
            <div className="mt-3.5 grid gap-2.5 md:grid-cols-2">
              {pack.strategy.map((s, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-2xl bg-paper px-4 py-3 text-sm leading-relaxed text-ink-soft ring-1 ring-line/70"
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-forest-900 text-[11px] font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div
        role="tablist"
        aria-label="Pack views"
        className="flex flex-wrap gap-2 rounded-full border border-line bg-white p-1.5 shadow-card"
      >
        {(
          [
            [
              "material",
              "Prep material",
              <BookOpen key="i" className="h-4 w-4" />,
            ],
            [
              "map",
              "Requirement map",
              <ListChecks key="i" className="h-4 w-4" />,
            ],
            ...(hasLegacy
              ? [
                  [
                    "qa",
                    "Practice Q&A",
                    <MessagesSquare key="i" className="h-4 w-4" />,
                  ],
                ]
              : []),
          ] as [typeof tab, string, React.ReactNode][]
        ).map(([id, label, icon]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === id
                ? "bg-forest-900 text-white shadow-pop"
                : "text-ink-soft hover:bg-forest-50 hover:text-forest-800"
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {tab === "material" &&
        (hasMaterial ? (
          <ScenarioPack pack={pack} practice={practice} />
        ) : (
          <section className="rounded-[28px] border border-line bg-white p-8 text-center shadow-card">
            <Sparkles className="mx-auto h-8 w-8 text-forest-600" />
            <h3 className="mt-3 text-xl font-bold text-ink">
              Generate the prep material for this pack
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-500">
              Snapshot, 60-second pitch, stories mapped to the JD, technical
              answers, and a client scenario with an illustrative screen, how to
              read it and trade-offs for every framework this job names. Takes
              about two minutes.
            </p>
            <button
              onClick={generateMaterial}
              disabled={generating || !result.id}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-forest-800 px-6 py-3 text-sm font-semibold text-white shadow-pop transition hover:bg-forest-900 disabled:opacity-60"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {generating
                ? "Building your prep material..."
                : "Generate prep material"}
            </button>
            {genError && (
              <p className="mt-3 text-sm text-rose-700">{genError}</p>
            )}
          </section>
        ))}

      {tab === "map" && analysis.requirements.length > 0 && (
        <section className="rounded-[28px] border border-line bg-white p-6 shadow-card sm:p-8">
          <SectionLabel icon={<ListChecks className="h-4 w-4" />}>
            How your resume maps to this job
          </SectionLabel>
          <ul className="mt-4 divide-y divide-line/70">
            {analysis.requirements.map((r) => (
              <li key={r.id} className="flex items-start gap-3.5 py-3.5">
                <span
                  className={`mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    r.match === "strong"
                      ? "bg-forest-100 text-forest-800"
                      : r.match === "partial"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {r.match === "strong" ? (
                    <Check className="h-3 w-3" />
                  ) : r.match === "partial" ? (
                    <AlertTriangle className="h-3 w-3" />
                  ) : (
                    <EyeOff className="h-3 w-3" />
                  )}
                  {r.match === "strong"
                    ? "Strong"
                    : r.match === "partial"
                      ? "Partial"
                      : "Gap"}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{r.text}</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-slate-500">
                    {r.note}
                  </p>
                </div>
                <span className="ml-auto shrink-0 rounded-full bg-paper px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 ring-1 ring-line">
                  {r.kind === "must" ? "Must have" : "Nice to have"}
                </span>
              </li>
            ))}
          </ul>
          {analysis.risks.length > 0 && (
            <div className="mt-5 rounded-2xl border border-amber-200/70 bg-amber-50 p-4.5 sm:p-5">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-amber-800">
                <ShieldAlert className="h-4 w-4" />
                Objections to pre-empt
              </p>
              <ul className="mt-2.5 space-y-2">
                {analysis.risks.map((r, i) => (
                  <li
                    key={i}
                    className="text-sm leading-relaxed text-amber-900"
                  >
                    <span className="font-semibold">{r.text}.</span>{" "}
                    {r.mitigation}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {(tab === "qa" ? (pack.questions ?? []) : []).map((q, qi) => {
        const key = `q${qi}`;
        const answerShown = !practice || revealed[key];
        const fuOpen = openFollowUps[key] || practice;
        return (
          <section
            key={key}
            className="rounded-[28px] border border-line bg-white p-6 shadow-card sm:p-8"
          >
            <div className="flex gap-5">
              <div
                className="hidden flex-col items-center sm:flex"
                aria-hidden="true"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-forest-900 text-[15px] font-bold text-white shadow-pop">
                  {String(qi + 1).padStart(2, "0")}
                </span>
                <span className="mt-3 w-px flex-1 bg-line" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-forest-900 px-2.5 py-0.5 text-xs font-semibold text-white sm:hidden">
                    Question {qi + 1}
                  </span>
                  <span className="rounded-full bg-paper px-2.5 py-0.5 text-xs font-semibold text-ink-soft ring-1 ring-line">
                    {q.category}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-paper px-2.5 py-0.5 text-xs font-medium text-slate-500 ring-1 ring-line">
                    <Clock className="h-3.5 w-3.5 text-forest-600" />
                    {secondsLabel(q.seconds)} target
                  </span>
                  <div className="ml-auto">
                    <Timer />
                  </div>
                </div>

                <h3 className="mt-4 text-[22px] font-bold leading-snug tracking-tight text-ink">
                  {q.question}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  <span className="font-semibold text-ink-soft">
                    Why they ask:
                  </span>{" "}
                  {q.intent}
                </p>

                {q.provesRequirements.length > 0 && (
                  <div className="mt-3.5 flex flex-wrap gap-1.5">
                    {q.provesRequirements.map((rid) => (
                      <span
                        key={rid}
                        className="inline-flex items-center gap-1 rounded-full bg-forest-50 px-2.5 py-1 text-[11px] font-semibold text-forest-800 ring-1 ring-forest-100"
                      >
                        <Check className="h-3 w-3" />
                        Proves: {reqById.get(rid) || rid}
                      </span>
                    ))}
                  </div>
                )}

                {answerShown ? (
                  <div className="mt-5">
                    <div className="rounded-2xl bg-paper p-5 ring-1 ring-line/70">
                      <p className="whitespace-pre-line text-[15px] leading-[1.75] text-ink">
                        {q.answer}
                      </p>
                    </div>
                    <div className="mt-3.5 flex flex-wrap gap-1.5">
                      {q.structure.map((s, i) => (
                        <span
                          key={i}
                          className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500 ring-1 ring-line"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                    {q.evidenceUsed.length > 0 && (
                      <p className="mt-3.5 flex items-start gap-1.5 text-xs leading-relaxed text-slate-500">
                        <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest-600" />
                        <span>
                          <span className="font-semibold text-ink-soft">
                            Built from your resume:
                          </span>{" "}
                          {q.evidenceUsed.join(" · ")}
                        </span>
                      </p>
                    )}
                    <p className="mt-4 flex items-start gap-2.5 rounded-2xl border border-rose-200/70 bg-rose-50 px-4 py-3 text-sm leading-relaxed text-rose-900">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        <span className="font-bold">Watch out:</span> {q.trap}
                      </span>
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => setRevealed((r) => ({ ...r, [key]: true }))}
                    className="mt-5 flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-line-strong py-9 text-sm font-medium text-slate-500 transition hover:border-forest-400 hover:bg-forest-50/50 hover:text-forest-800"
                  >
                    <EyeOff className="h-5 w-5" />
                    Say your answer out loud, timed. Then tap to compare with
                    the engineered answer.
                  </button>
                )}

                <div className="mt-6 border-t border-line pt-5">
                  <button
                    onClick={() =>
                      setOpenFollowUps((o) => ({ ...o, [key]: !fuOpen }))
                    }
                    aria-expanded={fuOpen}
                    className="flex w-full items-center gap-2 text-left text-sm font-bold text-forest-800 transition hover:text-forest-950"
                  >
                    <MessagesSquare className="h-4.5 w-4.5 text-forest-600" />
                    {fuOpen ? "Hide" : "Show"} the 3 follow-ups they will ask
                    next
                    <ChevronDown
                      className={`ml-auto h-4.5 w-4.5 transition-transform duration-200 ${fuOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {fuOpen && (
                    <div className="relative ml-2 mt-4 space-y-3 border-l-2 border-forest-100 pl-5">
                      {q.followUps.map((f, fi) => (
                        <div
                          key={fi}
                          className="relative rounded-2xl border border-line bg-cream p-4.5 sm:p-5"
                        >
                          <span
                            className="absolute -left-[27px] top-6 h-2.5 w-2.5 rounded-full bg-forest-400 ring-4 ring-white"
                            aria-hidden="true"
                          />
                          <div className="flex items-start gap-3">
                            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-forest-100 text-[11px] font-bold text-forest-800">
                              {fi + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="text-[15px] font-semibold leading-snug text-ink">
                                {f.question}
                              </p>
                              <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                                <span>Likely because: {f.whyLikely}</span>
                                <span aria-hidden="true">·</span>
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {secondsLabel(f.seconds)}
                                </span>
                              </p>
                            </div>
                          </div>
                          <p className="mt-3 whitespace-pre-line text-sm leading-[1.7] text-ink-soft">
                            {f.answer}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        );
      })}

      {tab !== "map" && (
        <section className="rounded-[28px] border border-line bg-white p-6 shadow-card sm:p-8">
          <SectionLabel icon={<MessagesSquare className="h-4 w-4" />}>
            Questions you ask them
          </SectionLabel>
          <ul className="mt-4 space-y-2.5">
            {pack.questionsToAsk.map((q, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-2xl bg-paper px-4 py-3 text-sm leading-relaxed text-ink-soft ring-1 ring-line/70"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-white text-[11px] font-bold text-forest-800 ring-1 ring-line">
                  {i + 1}
                </span>
                <span className="pt-0.5">{q}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex items-start gap-3.5 rounded-2xl border border-forest-100 bg-forest-50 px-5 py-4">
            <Quote className="mt-0.5 h-5 w-5 shrink-0 text-forest-600" />
            <p className="text-[15px] leading-relaxed text-ink">
              <span className="font-bold text-forest-900">Closing line:</span>{" "}
              {pack.closingLine}
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
