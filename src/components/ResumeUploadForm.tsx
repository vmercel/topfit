"use client";

import { useRef, useState } from "react";
import { AlertTriangle, FileText, Loader2, Upload } from "lucide-react";
import type { ResumeProfile } from "@/lib/resume";

export interface CreatedResume {
  id: string;
  label: string | null;
  sourceFilename: string | null;
  isPrimary: boolean;
  createdAt: string;
  parsed: ResumeProfile | null;
}

// Upload (PDF/DOCX) or paste a resume; structures and saves it through
// POST /api/resumes, then hands the created record back to the parent.
export default function ResumeUploadForm({
  onAdded,
  submitLabel = "Digitalize my resume",
}: {
  onAdded: (resume: CreatedResume) => void;
  submitLabel?: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function submit() {
    setError(null);
    if (!file && text.trim().length < 200) {
      setError("Add a resume file, or paste at least a few paragraphs of resume text.");
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      if (file) form.append("resumeFile", file);
      if (!file && text.trim()) form.append("resumeText", text.trim());
      const res = await fetch("/api/resumes", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save that resume.");
      onAdded(data.resume as CreatedResume);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that resume.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload a resume file"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) setFile(f);
        }}
        className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed bg-white px-5 py-5 transition ${
          dragging
            ? "border-forest-500 bg-forest-50"
            : "border-line-strong hover:border-forest-400 hover:bg-forest-50/50"
        }`}
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-forest-900 text-white shadow-pop">
          {file ? <FileText className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-ink">
            {file ? file.name : "Drop your resume here, or click to choose a file"}
          </span>
          <span className="block text-[13px] text-slate-500">
            {file ? "Ready. You can still replace it before saving." : "PDF or DOCX, up to 6 MB"}
          </span>
        </span>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className="mt-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
        <span className="h-px flex-1 bg-line" /> or paste the text <span className="h-px flex-1 bg-line" />
      </div>

      <textarea
        rows={6}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your resume text here if you do not have the file handy."
        className="mt-4 w-full resize-y rounded-2xl border border-line bg-white px-4 py-3 text-sm leading-relaxed text-ink shadow-sm outline-none transition placeholder:text-slate-400 focus:border-forest-400 focus:ring-4 focus:ring-forest-100"
      />

      {error && (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800 ring-1 ring-red-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <button
        onClick={submit}
        disabled={busy}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-forest-900 px-6 py-3.5 text-[15px] font-semibold text-white shadow-pop transition hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Upload className="h-4.5 w-4.5" />}
        {busy ? "Reading and structuring your resume" : submitLabel}
      </button>
    </div>
  );
}
