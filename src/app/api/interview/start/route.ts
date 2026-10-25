import { NextRequest, NextResponse } from "next/server";
import { interviewUser, interviewError } from "@/lib/interview/http";
import { createPlan } from "@/lib/interview/ai";
import { newSession, viewSession } from "@/lib/interview/session";
import { extractResumeText, clampText } from "@/lib/parse";
import { supabaseAdmin } from "@/lib/supabase";
import { STAGES } from "@/lib/types";

export const maxDuration = 90;
export async function POST(req: NextRequest) {
  const auth = await interviewUser(req);
  if (auth.error) return auth.error;
  try {
    if (Number(req.headers.get("content-length") || 0) > 4 * 1024 * 1024)
      throw new Error("Resume request is too large (max 3 MB file).");
    const form = await req.formData();
    const role = String(form.get("role") || "").trim();
    const job = clampText(String(form.get("job") || ""), 14000);
    const stage = String(form.get("stage") || "technical");
    const count = Number(form.get("count") || 3);
    if (role.length < 3 || role.length > 500)
      throw new Error("Choose a target role (3–500 characters).");
    if (![3, 5].includes(count))
      throw new Error("Choose 3 or 5 main questions.");
    if (!STAGES.some((s) => s.id === stage))
      throw new Error("Choose a valid interview stage.");
    let resume = String(form.get("resumeText") || "").trim();
    const file = form.get("resumeFile");
    if (file instanceof File && file.size) {
      if (file.size > 3 * 1024 * 1024)
        throw new Error("Resume file is too large (max 3 MB).");
      resume = await extractResumeText(file);
    }
    const resumeId = String(form.get("resumeId") || "");
    if (!resume && resumeId) {
      const db = supabaseAdmin();
      const { data } = db
        ? await db
            .from("resumes")
            .select("raw_text")
            .eq("id", resumeId)
            .eq("user_id", auth.user.id)
            .single()
        : { data: null };
      if (!data)
        throw new Error(
          "Resume not found in your account. Paste or upload a resume instead.",
        );
      resume = String(data.raw_text || "");
    }
    resume = clampText(resume, 26000);
    if (resume.length < 200)
      throw new Error(
        "Paste or upload a resume with at least 200 characters of readable text.",
      );
    const plan = await createPlan(resume, role, job, stage, count, req.signal);
    return NextResponse.json(
      viewSession(
        newSession({ userId: auth.user.id, resume, role, job, stage, plan }),
      ),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return interviewError(error);
  }
}
