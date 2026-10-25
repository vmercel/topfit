import { NextRequest } from "next/server";
import {
  interviewUser,
  interviewError,
  sessionBody,
} from "@/lib/interview/http";
import { interviewClient } from "@/lib/interview/ai";
export const maxDuration = 60;
export async function POST(req: NextRequest) {
  const auth = await interviewUser(req);
  if (auth.error) return auth.error;
  try {
    const { session } = await sessionBody(req, auth.user.id);
    const audio = await interviewClient().audio.speech.create(
      {
        model: process.env.INTERVIEW_TTS_MODEL || "gpt-4o-mini-tts",
        voice: "coral",
        input: session.current.question,
        response_format: "mp3",
        instructions:
          "Speak as a warm, professional job interviewer. Ask this question naturally at a measured pace. Do not add any words.",
      },
      { signal: req.signal },
    );
    return new Response(await audio.arrayBuffer(), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return interviewError(error);
  }
}
