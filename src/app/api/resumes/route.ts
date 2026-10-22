import { NextRequest, NextResponse } from "next/server";
import { extractResumeText } from "@/lib/parse";
import { parseResumeStructure, type ResumeProfile } from "@/lib/resume";
import { supabaseAdmin } from "@/lib/supabase";
import { currentUser } from "@/lib/supabase-server";

export const maxDuration = 120;

interface ResumeRow {
  id: string;
  label: string | null;
  source_filename: string | null;
  is_primary: boolean;
  created_at: string;
  parsed: ResumeProfile | null;
}

// List the signed-in user's resumes. No raw text in this payload.
export async function GET() {
  const user = await currentUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ error: "Resume storage is unavailable." }, { status: 500 });

  const { data, error } = await db
    .from("resumes")
    .select("id, label, source_filename, is_primary, created_at, parsed")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Could not load your resumes." }, { status: 500 });

  const resumes = ((data ?? []) as ResumeRow[]).map((r) => ({
    id: r.id,
    label: r.label,
    sourceFilename: r.source_filename,
    isPrimary: r.is_primary,
    createdAt: r.created_at,
    fullName: r.parsed?.fullName ?? "",
    headline: r.parsed?.headline ?? "",
  }));
  return NextResponse.json({ resumes });
}

// Add a resume: multipart file upload or JSON { resumeText, label }.
// The resume is structured by the parser and stored. If the user has no
// primary yet, this one becomes primary.
export async function POST(req: NextRequest) {
  const user = await currentUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ error: "Resume storage is unavailable." }, { status: 500 });

  try {
    let rawText = "";
    let sourceFilename: string | null = null;
    let label = "";

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      label = String(form.get("label") || "").trim();
      const file = form.get("resumeFile");
      if (file && file instanceof File && file.size > 0) {
        if (file.size > 6 * 1024 * 1024) {
          return NextResponse.json({ error: "Resume file is too large (max 6 MB)." }, { status: 400 });
        }
        sourceFilename = file.name;
        rawText = await extractResumeText(file);
      } else {
        rawText = String(form.get("resumeText") || "").trim();
      }
    } else {
      const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
      rawText = typeof body.resumeText === "string" ? body.resumeText.trim() : "";
      label = typeof body.label === "string" ? body.label.trim() : "";
    }

    if (rawText.length < 200) {
      return NextResponse.json(
        { error: "We could not read enough text from that resume. Try the other format, or paste the resume text." },
        { status: 400 }
      );
    }

    const parsed = await parseResumeStructure(rawText);

    const { data: existing } = await db
      .from("resumes")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_primary", true)
      .limit(1);
    const becomesPrimary = !existing || existing.length === 0;

    const { data, error } = await db
      .from("resumes")
      .insert({
        user_id: user.id,
        label: label || sourceFilename || "Pasted resume",
        source_filename: sourceFilename,
        raw_text: rawText,
        parsed,
        is_primary: becomesPrimary,
      })
      .select("id, label, source_filename, is_primary, created_at, parsed")
      .single();
    if (error || !data) {
      return NextResponse.json({ error: "Could not save that resume." }, { status: 500 });
    }

    const row = data as ResumeRow;
    return NextResponse.json({
      resume: {
        id: row.id,
        label: row.label,
        sourceFilename: row.source_filename,
        isPrimary: row.is_primary,
        createdAt: row.created_at,
        parsed: row.parsed,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
