import { NextRequest, NextResponse } from "next/server";
import { interviewUser, interviewError } from "@/lib/interview/http";
import { readSession } from "@/lib/interview/session";
import { interviewClient } from "@/lib/interview/ai";
export const maxDuration = 90;
export async function POST(req: NextRequest) {
  const auth = await interviewUser(req);
  if (auth.error) return auth.error;
  try {
    if (Number(req.headers.get("content-length") || 0) > 4 * 1024 * 1024)
      throw new Error("Audio upload is too large (max 3 MB).");
    const form = await req.formData();
    readSession(String(form.get("token") || ""), auth.user.id);
    const file = form.get("audio");
    if (!(file instanceof File) || file.size < 100)
      throw new Error("Audio is empty. Record an answer or type it instead.");
    if (file.size > 3 * 1024 * 1024)
      throw new Error(
        "Audio is too large (max 3 MB). Use a shorter answer or type it.",
      );
    if (
      ![
        "audio/webm",
        "audio/mp4",
        "audio/ogg",
        "audio/wav",
        "audio/mpeg",
      ].includes(file.type.split(";")[0])
    )
      throw new Error(
        "Unsupported audio format. Try another browser or type your answer.",
      );
    const transcript = await interviewClient().audio.transcriptions.create(
      {
        file,
        model:
          process.env.INTERVIEW_TRANSCRIPTION_MODEL || "gpt-4o-mini-transcribe",
        response_format: "json",
      },
      { signal: req.signal },
    );
    return NextResponse.json(
      { text: transcript.text.slice(0, 5000) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return interviewError(error);
  }
}
