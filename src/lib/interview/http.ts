import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/supabase-server";
import { readSession } from "./session";

export async function interviewUser(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin && origin !== req.nextUrl.origin)
    return {
      error: NextResponse.json(
        { error: "This request must come from TopFit." },
        { status: 403 },
      ),
    } as const;
  const user = await currentUser().catch(() => null);
  if (!user)
    return {
      error: NextResponse.json(
        { error: "Sign in to practice an interview." },
        { status: 401 },
      ),
    } as const;
  if (!process.env.OPENAI_API_KEY)
    return {
      error: NextResponse.json(
        { error: "Interview practice is not configured on the server yet." },
        { status: 503 },
      ),
    } as const;
  return { user } as const;
}
export async function sessionBody(req: NextRequest, userId: string) {
  const text = await req.text();
  if (text.length > 200000)
    throw new Error("The interview request is too large.");
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error("Invalid interview request.");
  }
  if (!body || typeof body !== "object")
    throw new Error("Invalid interview request.");
  if (typeof body.token !== "string")
    throw new Error("Missing interview session.");
  return { body, session: readSession(body.token, userId) };
}
export function interviewError(error: unknown) {
  // Do not return provider responses, prompts, stack traces or credentials.
  const message = error instanceof Error ? error.message : "";
  const expected =
    /^(Invalid interview|All questions|This interview|Interview turn|The feedback|Could not|Missing interview|The interview request|Answer |Submit |Unsupported audio|Audio |Resume |Choose |Paste )/.test(
      message,
    );
  return NextResponse.json(
    {
      error: expected
        ? message
        : "The interviewer could not respond. Please retry; your submitted text is still in this tab.",
    },
    { status: expected ? 400 : 502, headers: { "Cache-Control": "no-store" } },
  );
}
