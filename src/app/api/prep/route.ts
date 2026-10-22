import { NextRequest, NextResponse } from "next/server";
import { extractResumeText, cleanJd } from "@/lib/parse";
import { analyzeResumeAndJd, generatePack } from "@/lib/pipeline";
import { supabaseAdmin } from "@/lib/supabase";
import { currentUser } from "@/lib/supabase-server";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser().catch(() => null);
    if (!user) {
      return NextResponse.json(
        { error: "Sign in to build a prep pack." },
        { status: 401 }
      );
    }

    const form = await req.formData();
    const jdRaw = String(form.get("jdText") || "");
    const stage = String(form.get("stage") || "hiring_manager");
    const interviewType = String(form.get("interviewType") || "video");
    const roundLabel = String(form.get("roundLabel") || "");

    if (jdRaw.trim().length < 120) {
      return NextResponse.json(
        { error: "Paste the full job description (at least a few paragraphs)." },
        { status: 400 }
      );
    }

    let resumeText = String(form.get("resumeText") || "").trim();
    const file = form.get("resumeFile");
    if (file && file instanceof File && file.size > 0) {
      if (file.size > 6 * 1024 * 1024) {
        return NextResponse.json({ error: "Resume file is too large (max 6 MB)." }, { status: 400 });
      }
      resumeText = await extractResumeText(file);
    }
    if (resumeText.length < 200) {
      return NextResponse.json(
        { error: "We could not read enough text from that resume. Try the other format, or paste the resume text." },
        { status: 400 }
      );
    }

    const jdText = cleanJd(jdRaw);

    const a = await analyzeResumeAndJd(resumeText, jdText);
    const g = await generatePack(a.analysis, jdText, stage, interviewType);

    let sessionId: string | null = null;
    const db = supabaseAdmin();
    if (db) {
      const { data: session, error: sErr } = await db
        .from("prep_sessions")
        .insert({
          user_id: user?.id ?? null,
          candidate_name: a.analysis.candidateName,
          role_title: a.analysis.roleTitle,
          company: a.analysis.company,
          domain: a.analysis.domain,
          seniority: a.analysis.seniority,
          stage,
          interview_type: interviewType,
          round_label: roundLabel || null,
          jd_text: jdText,
          resume_text: resumeText,
        })
        .select("id")
        .single();
      if (!sErr && session) {
        sessionId = session.id as string;
        await db.from("prep_packs").insert({
          session_id: sessionId,
          analysis: a.analysis,
          pack: g.pack,
          model: process.env.OPENAI_MODEL || "gpt-4o",
          prompt_tokens: a.promptTokens + g.promptTokens,
          completion_tokens: a.completionTokens + g.completionTokens,
        });
      }
    }

    return NextResponse.json({
      id: sessionId,
      stage,
      interviewType,
      analysis: a.analysis,
      pack: g.pack,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
