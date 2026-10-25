import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import {
  SessionSchema,
  type InterviewSession,
  type InterviewView,
} from "./contracts";

function signingKey() {
  const key =
    process.env.INTERVIEW_SESSION_SECRET || process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Interview practice is not configured.");
  return key;
}
export function signSession(session: InterviewSession): string {
  const body = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${body}.${createHmac("sha256", signingKey()).update(body).digest("base64url")}`;
}
export function readSession(token: string, userId: string): InterviewSession {
  if (token.length > 180000) throw new Error("Invalid interview session.");
  const [body, signature, extra] = token.split(".");
  if (!body || !signature || extra)
    throw new Error("Invalid interview session.");
  const expected = createHmac("sha256", signingKey()).update(body).digest();
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
    throw new Error("Invalid interview session.");
  const session = SessionSchema.parse(
    JSON.parse(Buffer.from(body, "base64url").toString("utf8")),
  );
  if (session.userId !== userId)
    throw new Error("This interview belongs to another account.");
  if (session.expires < Date.now())
    throw new Error(
      "This interview has expired. Start a new practice session.",
    );
  if (session.mainIndex >= session.plan.length)
    throw new Error("Invalid interview session.");
  return session;
}
export function newSession(
  input: Omit<
    InterviewSession,
    | "version"
    | "id"
    | "expires"
    | "mainIndex"
    | "current"
    | "isFollowup"
    | "turns"
  >,
): InterviewSession {
  return {
    ...input,
    version: 1,
    id: randomUUID(),
    expires: Date.now() + 60 * 60 * 1000,
    mainIndex: 0,
    current: input.plan[0],
    isFollowup: false,
    turns: [],
  };
}
export function viewSession(session: InterviewSession): InterviewView {
  return {
    token: signSession(session),
    question: session.current,
    mainNumber: session.mainIndex + 1,
    mainTotal: session.plan.length,
    isFollowup: session.isFollowup,
    turns: session.turns,
  };
}
