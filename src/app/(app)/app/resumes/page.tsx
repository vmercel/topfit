"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronDown,
  FileText,
  Loader2,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import type { ResumeProfile } from "@/lib/resume";
import ResumeView from "@/components/ResumeView";
import ResumeUploadForm from "@/components/ResumeUploadForm";

interface ResumeListItem {
  id: string;
  label: string | null;
  sourceFilename: string | null;
  isPrimary: boolean;
  createdAt: string;
  fullName: string;
  headline: string;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function ResumeCard({
  item,
  onChanged,
}: {
  item: ResumeListItem;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [parsed, setParsed] = useState<ResumeProfile | null>(null);
  const [loadingFull, setLoadingFull] = useState(false);
  const [busy, setBusy] = useState<"primary" | "delete" | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function toggle() {
    if (!open && !parsed) {
      setLoadingFull(true);
      try {
        const res = await fetch(`/api/resumes/${item.id}`);
        if (res.ok) {
          const data = (await res.json()) as { resume: { parsed: ResumeProfile } };
          setParsed(data.resume.parsed);
        }
      } finally {
        setLoadingFull(false);
      }
    }
    setOpen((v) => !v);
  }

  async function setPrimary() {
    setBusy("primary");
    try {
      await fetch(`/api/resumes/${item.id}/primary`, { method: "POST" });
      onChanged();
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    setBusy("delete");
    try {
      await fetch(`/api/resumes/${item.id}`, { method: "DELETE" });
      onChanged();
    } finally {
      setBusy(null);
      setConfirmingDelete(false);
    }
  }

  return (
    <article
      className={`rounded-[28px] border bg-white p-6 shadow-card ${
        item.isPrimary ? "border-forest-300 ring-1 ring-forest-200" : "border-line"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-forest-900 text-white shadow-pop">
            <FileText className="h-5.5 w-5.5" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight text-ink">
                {item.fullName || item.label || "Resume"}
              </h2>
              {item.isPrimary && (
                <span className="inline-flex items-center gap-1 rounded-full bg-copper-500 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                  <Star className="h-3 w-3" />
                  Primary
                </span>
              )}
            </div>
            {item.headline && (
              <p className="mt-0.5 text-sm font-medium text-forest-700">{item.headline}</p>
            )}
            <p className="mt-1 text-[13px] text-slate-500">
              {item.sourceFilename || item.label || "Pasted resume"} · Added {fmtDate(item.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {confirmingDelete ? (
            <>
              <button
                onClick={remove}
                disabled={busy === "delete"}
                className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {busy === "delete" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Confirm delete
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink-soft transition hover:border-forest-300"
              >
                Keep it
              </button>
            </>
          ) : (
            <>
              {!item.isPrimary && (
                <button
                  onClick={setPrimary}
                  disabled={busy === "primary"}
                  className="inline-flex items-center gap-1.5 rounded-full bg-forest-900 px-4 py-2 text-sm font-semibold text-white shadow-pop transition hover:bg-forest-800 disabled:opacity-60"
                >
                  {busy === "primary" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
                  Set as primary
                </button>
              )}
              <button
                onClick={() => setConfirmingDelete(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:border-red-200 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </>
          )}
          <button
            onClick={toggle}
            aria-expanded={open}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-forest-900 transition hover:border-forest-300"
          >
            {open ? "Hide resume" : "View resume"}
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-6">
          {loadingFull ? (
            <p className="flex items-center gap-2 text-sm font-medium text-ink-soft">
              <Loader2 className="h-4 w-4 animate-spin text-forest-700" />
              Loading your digital resume
            </p>
          ) : parsed ? (
            <ResumeView parsed={parsed} />
          ) : (
            <p className="text-sm text-ink-soft">Could not load this resume.</p>
          )}
        </div>
      )}
    </article>
  );
}

export default function ResumesPage() {
  const [items, setItems] = useState<ResumeListItem[] | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/resumes");
      if (res.ok) {
        const data = (await res.json()) as { resumes: ResumeListItem[] };
        setItems(data.resumes);
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const primary = items?.find((r) => r.isPrimary);
  const others = items?.filter((r) => !r.isPrimary) ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 pb-8">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-forest-200 bg-forest-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-forest-800">
            <span className="h-1.5 w-1.5 rounded-full bg-copper-500" />
            My resumes
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Your resume library
          </h1>
          <p className="mt-2.5 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
            Prep packs start from your primary resume. Keep a version per role type and switch the
            primary as your target changes.
          </p>
        </div>
        <button
          onClick={() => setShowUpload((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full bg-forest-900 px-5 py-3 text-sm font-semibold text-white shadow-pop transition hover:bg-forest-800"
        >
          <Plus className="h-4.5 w-4.5" />
          Add a resume
        </button>
      </div>

      {showUpload && (
        <div className="mb-8 rounded-[28px] border border-line bg-white p-6 shadow-card sm:p-8">
          <h2 className="font-semibold tracking-tight text-ink">Add a resume</h2>
          <p className="mb-5 mt-1 text-sm text-ink-soft">
            It is read, structured, and saved to your library. Your current primary does not
            change unless this is your first resume.
          </p>
          <ResumeUploadForm
            submitLabel="Add to my library"
            onAdded={() => {
              setShowUpload(false);
              void load();
            }}
          />
        </div>
      )}

      {items === null ? (
        <p className="flex items-center gap-2.5 text-sm font-medium text-ink-soft">
          <Loader2 className="h-4.5 w-4.5 animate-spin text-forest-700" />
          Loading your resumes
        </p>
      ) : items.length === 0 ? (
        <div className="rounded-[28px] border-2 border-dashed border-line-strong bg-white px-8 py-14 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-forest-50 text-forest-600 ring-1 ring-forest-100">
            <FileText className="h-7 w-7" />
          </span>
          <p className="mt-5 text-lg font-semibold text-ink">No resumes saved yet.</p>
          <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-slate-500">
            Add one and it becomes your primary. Every prep pack will start from it, with no
            re-uploading.
          </p>
          <button
            onClick={() => setShowUpload(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-forest-900 px-5 py-3 text-sm font-semibold text-white shadow-pop transition hover:bg-forest-800"
          >
            <Plus className="h-4 w-4" />
            Add your first resume
          </button>
        </div>
      ) : (
        <div className="grid gap-5">
          {primary && <ResumeCard item={primary} onChanged={load} />}
          {others.map((r) => (
            <ResumeCard key={r.id} item={r} onChanged={load} />
          ))}
        </div>
      )}
    </div>
  );
}
