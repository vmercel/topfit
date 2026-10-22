"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Loader2, Plus, Sparkles } from "lucide-react";
import type { ResumeProfile } from "@/lib/resume";
import ResumeView from "@/components/ResumeView";
import ResumeUploadForm, { type CreatedResume } from "@/components/ResumeUploadForm";

interface ResumeListItem {
  id: string;
  label: string | null;
  isPrimary: boolean;
  fullName: string;
  headline: string;
}

type Phase =
  | { kind: "loading" }
  | { kind: "welcome" }
  | { kind: "upload" }
  | { kind: "review"; resume: CreatedResume }
  | { kind: "existing"; primary: { id: string; parsed: ResumeProfile } };

export default function OnboardingPage() {
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [adding, setAdding] = useState(false);

  const loadExisting = useCallback(async () => {
    try {
      const res = await fetch("/api/resumes");
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { resumes: ResumeListItem[] };
      const primary = data.resumes.find((r) => r.isPrimary) ?? data.resumes[0];
      if (!primary) {
        setPhase({ kind: "welcome" });
        return;
      }
      const full = await fetch(`/api/resumes/${primary.id}`);
      if (!full.ok) throw new Error();
      const fullData = (await full.json()) as { resume: { id: string; parsed: ResumeProfile } };
      setPhase({ kind: "existing", primary: { id: fullData.resume.id, parsed: fullData.resume.parsed } });
    } catch {
      setPhase({ kind: "welcome" });
    }
  }, []);

  useEffect(() => {
    void loadExisting();
  }, [loadExisting]);

  if (phase.kind === "loading") {
    return (
      <p className="flex items-center gap-2.5 text-sm font-medium text-ink-soft">
        <Loader2 className="h-4.5 w-4.5 animate-spin text-forest-700" />
        Setting up your workspace
      </p>
    );
  }

  if (phase.kind === "existing") {
    return (
      <div>
        <p className="inline-flex items-center gap-2 rounded-full border border-forest-200 bg-forest-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-forest-800">
          <CheckCircle2 className="h-4 w-4" />
          Your digital resume
        </p>
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-ink">
          This is the resume TopFit preps you from
        </h1>
        <p className="mt-2.5 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
          Your primary resume is already saved. Every prep pack starts from it, and you can switch
          or add resumes any time on the My resumes page.
        </p>
        <div className="mt-8">
          <ResumeView parsed={phase.primary.parsed} />
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/app"
            className="inline-flex items-center gap-2 rounded-full bg-forest-900 px-6 py-3.5 text-[15px] font-semibold text-white shadow-pop transition hover:bg-forest-800"
          >
            Continue to the app
            <ArrowRight className="h-4.5 w-4.5" />
          </Link>
          <button
            onClick={() => setAdding((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-6 py-3.5 text-[15px] font-semibold text-forest-900 shadow-sm transition hover:border-forest-300"
          >
            <Plus className="h-4.5 w-4.5" />
            Add another resume
          </button>
          <Link
            href="/app/resumes"
            className="text-sm font-semibold text-forest-800 underline underline-offset-2 hover:text-forest-600"
          >
            Manage my resumes
          </Link>
        </div>
        {adding && (
          <div className="mt-8 rounded-[28px] border border-line bg-white p-6 shadow-card sm:p-8">
            <h2 className="font-semibold tracking-tight text-ink">Add another resume</h2>
            <p className="mb-5 mt-1 text-sm text-ink-soft">
              Useful when you apply with different versions for different roles.
            </p>
            <ResumeUploadForm
              submitLabel="Add this resume"
              onAdded={() => {
                setAdding(false);
                void loadExisting();
              }}
            />
          </div>
        )}
      </div>
    );
  }

  if (phase.kind === "review") {
    return (
      <div>
        <p className="inline-flex items-center gap-2 rounded-full border border-forest-200 bg-forest-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-forest-800">
          <Sparkles className="h-4 w-4" />
          Step 3 of 3 · Review
        </p>
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-ink">Your digital resume</h1>
        <p className="mt-2.5 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
          TopFit read your resume and rebuilt it in structured form. This is the version your prep
          packs are built from. It is saved as your primary resume.
        </p>
        <div className="mt-8">
          {phase.resume.parsed && <ResumeView parsed={phase.resume.parsed} />}
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/app"
            className="inline-flex items-center gap-2 rounded-full bg-forest-900 px-6 py-3.5 text-[15px] font-semibold text-white shadow-pop transition hover:bg-forest-800"
          >
            Save and start preparing
            <ArrowRight className="h-4.5 w-4.5" />
          </Link>
          <Link
            href="/app/resumes"
            className="text-sm font-semibold text-forest-800 underline underline-offset-2 hover:text-forest-600"
          >
            Manage my resumes
          </Link>
        </div>
      </div>
    );
  }

  if (phase.kind === "upload") {
    return (
      <div>
        <p className="inline-flex items-center gap-2 rounded-full border border-forest-200 bg-forest-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-forest-800">
          <span className="h-1.5 w-1.5 rounded-full bg-copper-500" />
          Step 2 of 3 · Your resume
        </p>
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-ink">Add your resume</h1>
        <p className="mt-2.5 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
          Upload the file or paste the text. TopFit reads it once and turns it into your digital
          resume, which becomes your primary. You will review it before anything is saved as
          final.
        </p>
        <div className="mt-8 rounded-[28px] border border-line bg-white p-6 shadow-card sm:p-8">
          <ResumeUploadForm onAdded={(resume) => setPhase({ kind: "review", resume })} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="inline-flex items-center gap-2 rounded-full border border-forest-200 bg-forest-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-forest-800">
        <span className="h-1.5 w-1.5 rounded-full bg-copper-500" />
        Step 1 of 3 · Welcome
      </p>
      <h1 className="mt-5 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        First, your resume becomes digital
      </h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
        TopFit preps you from your real experience, so it starts by reading your resume and
        rebuilding it in structured form. From then on, every prep pack starts from your digital
        resume. No re-uploading, no re-pasting.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { n: "1", t: "Upload", d: "PDF, DOCX, or pasted text." },
          { n: "2", t: "Review", d: "See your digital resume and check it." },
          { n: "3", t: "Prep", d: "Build packs for any job in about 30 seconds." },
        ].map((s) => (
          <div key={s.n} className="rounded-3xl border border-line bg-white p-5 shadow-card">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-forest-900 text-sm font-bold text-white shadow-pop">
              {s.n}
            </span>
            <p className="mt-3.5 font-semibold tracking-tight text-ink">{s.t}</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">{s.d}</p>
          </div>
        ))}
      </div>
      <button
        onClick={() => setPhase({ kind: "upload" })}
        className="mt-9 inline-flex items-center gap-2 rounded-full bg-forest-900 px-6 py-3.5 text-[15px] font-semibold text-white shadow-pop transition hover:bg-forest-800"
      >
        Add my resume
        <ArrowRight className="h-4.5 w-4.5" />
      </button>
    </div>
  );
}
