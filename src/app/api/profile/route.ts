import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { currentUser } from "@/lib/supabase-server";

// Saves the display name and phone from signup into the profiles table.
// Identity comes from the session; the email is taken from the user record.
export async function POST(req: Request) {
  const user = await currentUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const fullName = typeof body.fullName === "string" ? body.fullName.trim().slice(0, 120) : "";
  const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 40) : "";

  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ error: "Profiles are unavailable." }, { status: 500 });

  const { error } = await db.from("profiles").upsert(
    { id: user.id, full_name: fullName || null, email: user.email ?? null, phone: phone || null },
    { onConflict: "id" }
  );
  if (error) {
    return NextResponse.json({ error: "Could not save your profile." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
