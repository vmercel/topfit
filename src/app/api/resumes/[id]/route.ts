import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { currentUser } from "@/lib/supabase-server";

// Full record for one of the signed-in user's resumes, raw text included.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ error: "Resume storage is unavailable." }, { status: 500 });

  const { id } = await params;
  const { data, error } = await db
    .from("resumes")
    .select("id, label, source_filename, is_primary, created_at, parsed, raw_text")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (error || !data) return NextResponse.json({ error: "Resume not found." }, { status: 404 });

  return NextResponse.json({
    resume: {
      id: data.id,
      label: data.label,
      sourceFilename: data.source_filename,
      isPrimary: data.is_primary,
      createdAt: data.created_at,
      parsed: data.parsed,
      rawText: data.raw_text,
    },
  });
}

// Delete one of the user's resumes. If it was the primary and others remain,
// the most recently created remaining resume becomes primary.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ error: "Resume storage is unavailable." }, { status: 500 });

  const { id } = await params;
  const { data: target } = await db
    .from("resumes")
    .select("id, is_primary")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!target) return NextResponse.json({ error: "Resume not found." }, { status: 404 });

  const { error } = await db.from("resumes").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "Could not delete that resume." }, { status: 500 });

  if (target.is_primary) {
    const { data: remaining } = await db
      .from("resumes")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);
    if (remaining && remaining.length > 0) {
      await db.from("resumes").update({ is_primary: true }).eq("id", remaining[0].id);
    }
  }

  return NextResponse.json({ ok: true });
}
