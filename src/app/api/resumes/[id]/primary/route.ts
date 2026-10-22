import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { currentUser } from "@/lib/supabase-server";

// Make one of the signed-in user's resumes the primary, and all others not.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ error: "Resume storage is unavailable." }, { status: 500 });

  const { id } = await params;
  const { data: target } = await db
    .from("resumes")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!target) return NextResponse.json({ error: "Resume not found." }, { status: 404 });

  await db.from("resumes").update({ is_primary: false }).eq("user_id", user.id).eq("is_primary", true);
  const { error } = await db
    .from("resumes")
    .update({ is_primary: true })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "Could not set the primary resume." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
