import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const TOPICS = ["General question", "Support", "Billing", "Teams and coaching", "Feedback"];

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const topic = typeof body.topic === "string" ? body.topic : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (name.length < 2 || name.length > 120) {
    return NextResponse.json({ error: "Please add your name." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
    return NextResponse.json({ error: "Please add a valid email address." }, { status: 400 });
  }
  if (!TOPICS.includes(topic)) {
    return NextResponse.json({ error: "Please choose a topic." }, { status: 400 });
  }
  if (message.length < 10 || message.length > 4000) {
    return NextResponse.json(
      { error: "Please write a message of at least 10 characters." },
      { status: 400 }
    );
  }

  const db = supabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: "Contact is unavailable right now." }, { status: 500 });
  }

  const { error } = await db.from("contact_messages").insert({ name, email, topic, message });
  if (error) {
    return NextResponse.json({ error: "Could not send your message. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
