import { NextRequest, NextResponse } from "next/server";
import { generatePrepMaterial } from "@/lib/pipeline";
import { supabaseAdmin } from "@/lib/supabase";
import { currentUser } from "@/lib/supabase-server";

export const maxDuration = 300;

// Generate (or regenerate) the prep material tab for a saved pack and store it.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await currentUser().catch(() => null);
    if (!user) return NextResponse.json({ error: "Sign in to generate prep material." }, { status: 401 });
    const db = supabaseAdmin();
    if (!db) return NextResponse.json({ error: "Database not configured." }, { status: 500 });

    const { data: session } = await db
      .from("prep_sessions")
      .select("id, stage, interview_type, user_id, jd_text")
      .eq("id", id)
      .single();
    if (!session || session.user_id !== user.id) {
      return NextResponse.json({ error: "Prep pack not found." }, { status: 404 });
    }
    const { data: packRow } = await db
      .from("prep_packs")
      .select("id, analysis, pack, prompt_tokens, completion_tokens")
      .eq("session_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (!packRow) return NextResponse.json({ error: "Prep pack not found." }, { status: 404 });

    const g = await generatePrepMaterial(packRow.analysis, session.jd_text, session.stage, session.interview_type);
    const merged = { ...packRow.pack, ...g.pack, questions: packRow.pack?.questions };
    await db
      .from("prep_packs")
      .update({
        pack: merged,
        prompt_tokens: (packRow.prompt_tokens ?? 0) + g.promptTokens,
        completion_tokens: (packRow.completion_tokens ?? 0) + g.completionTokens,
      })
      .eq("id", packRow.id);

    return NextResponse.json({ pack: merged });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
