import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { currentUser } from "@/lib/supabase-server";

async function loadOwnedSession(id: string) {
  const db = supabaseAdmin();
  if (!db) return { db: null, session: null, status: 500 as const };
  const { data: session } = await db
    .from("prep_sessions")
    .select("id, stage, interview_type, user_id")
    .eq("id", id)
    .single();
  if (!session) return { db, session: null, status: 404 as const };
  if (session.user_id) {
    const user = await currentUser().catch(() => null);
    if (!user || user.id !== session.user_id) {
      return { db, session: null, status: 404 as const };
    }
  }
  return { db, session, status: 200 as const };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { db, session, status } = await loadOwnedSession(id);
  if (!db) return NextResponse.json({ error: "Database not configured." }, { status: 500 });
  if (!session) {
    return NextResponse.json({ error: "Prep pack not found." }, { status });
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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { db, session, status } = await loadOwnedSession(id);
  if (!db) return NextResponse.json({ error: "Database not configured." }, { status: 500 });
  if (!session) {
    return NextResponse.json({ error: "Prep pack not found." }, { status });
  }
  const { error } = await db.from("prep_sessions").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
