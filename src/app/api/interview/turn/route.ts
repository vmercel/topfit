import { NextRequest, NextResponse } from "next/server";
import {
  interviewUser,
  interviewError,
  sessionBody,
} from "@/lib/interview/http";
import { chooseFollowup, evaluateInterview } from "@/lib/interview/ai";
import { recordAnswer, nextMain, emptyReport } from "@/lib/interview/engine";
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
    const timedOut = !!session.endsAt && Date.now() >= session.endsAt;
    const finishing = body.action === "finish" || timedOut;
    if (session.questionsComplete && !finishing)
      throw new Error(
        "All questions are complete. End the interview to see feedback.",
      );
    const updated =
      answer && !session.questionsComplete
        ? recordAnswer(session, answer)
        : session;
    if (finishing) {
      return NextResponse.json(
        {
          report: updated.turns.length
            ? await evaluateInterview(
                updated,
                !!session.questionsComplete,
                req.signal,
              )
            : emptyReport(session),
        },
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
        : viewSession({ ...updated, questionsComplete: true }),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return interviewError(error);
  }
}
