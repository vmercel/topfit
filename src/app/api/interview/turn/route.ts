import { NextRequest, NextResponse } from "next/server";
import {
  interviewUser,
  interviewError,
  sessionBody,
} from "@/lib/interview/http";
import { chooseFollowup, evaluateInterview } from "@/lib/interview/ai";
import { recordAnswer, nextMain } from "@/lib/interview/engine";
import { viewSession } from "@/lib/interview/session";
export const maxDuration = 120;
export async function POST(req: NextRequest) {
  const auth = await interviewUser(req);
  if (auth.error) return auth.error;
  try {
    const { body, session } = await sessionBody(req, auth.user.id);
    if (!["answer", "finish", "skip"].includes(String(body.action)))
      throw new Error("Invalid interview action.");
    let answer = typeof body.answer === "string" ? body.answer.trim() : "";
    if (answer.length > 5000)
      throw new Error("Answer is too long (max 5,000 characters).");
    if (body.action === "skip") answer = "[Skipped]";
    if (body.action === "answer" && answer.length < 2)
      throw new Error("Answer the question before continuing.");
    const updated = answer ? recordAnswer(session, answer) : session;
    if (body.action === "finish") {
      if (!updated.turns.length)
        throw new Error(
          "Submit at least one answer before requesting feedback.",
        );
      return NextResponse.json(
        { report: await evaluateInterview(updated, false, req.signal) },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    if (!session.isFollowup && body.action !== "skip") {
      const follow = await chooseFollowup(updated, req.signal);
      if (follow.needed && follow.question.trim().length >= 8) {
        return NextResponse.json(
          viewSession({
            ...updated,
            isFollowup: true,
            current: {
              question: follow.question,
              focus:
                follow.reason.trim().length >= 2
                  ? follow.reason.trim().slice(0, 200)
                  : session.current.focus,
            },
          }),
          { headers: { "Cache-Control": "no-store" } },
        );
      }
    }
    const next = nextMain(updated);
    return NextResponse.json(
      next
        ? viewSession(next)
        : { report: await evaluateInterview(updated, true, req.signal) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return interviewError(error);
  }
}
