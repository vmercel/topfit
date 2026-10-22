import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ error: "Database not configured." }, { status: 500 });

  const { data: session, error } = await db
    .from("prep_sessions")
    .select("id, stage, interview_type")
    .eq("id", id)
    .single();
  if (error || !session) {
    return NextResponse.json({ error: "Prep pack not found." }, { status: 404 });
  }

  const { data: packRow } = await db
    .from("prep_packs")
    .select("analysis, pack")
    .eq("session_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  if (!packRow) {
    return NextResponse.json({ error: "Prep pack not found." }, { status: 404 });
  }

  return NextResponse.json({
    id: session.id,
    stage: session.stage,
    interviewType: session.interview_type,
    analysis: packRow.analysis,
    pack: packRow.pack,
  });
}
