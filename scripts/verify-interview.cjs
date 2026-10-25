// Integration tests execute the real TypeScript routes and engine, replacing only
// external identity, storage and model I/O with deterministic test fixtures.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
require.extensions[".ts"] = (module, filename) => {
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText,
    filename,
  );
};
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  return resolve.call(
    this,
    request.startsWith("@/")
      ? path.join(root, "src", request.slice(2))
      : request,
    ...args,
  );
};
process.env.OPENAI_API_KEY = "synthetic-provider-key-for-tests-only";
process.env.INTERVIEW_SESSION_SECRET = "synthetic-signing-key-for-tests-only";
let user = { id: "user-a" };
let unavailable = false;
let captured = [];
let followReason = "Clarify the measurement context and tradeoffs. ".repeat(4);
let ownerFilter;
const resume =
  "Alex Example, software engineer. Built Python and SQL pipelines, monitored production failures, wrote tests and deployed services. Led a migration from batch processing to incremental ingestion. Improved reliability through validation and documented rollback procedures.";
const load = Module._load;
class MockOpenAI {
  constructor() {
    this.chat = {
      completions: {
        parse: async (request) => {
          if (unavailable)
            throw new Error(
              "Provider unavailable; a private secret must not appear in the response.",
            );
          captured.push(request);
          const name = request.response_format.json_schema.name;
          const input = JSON.parse(request.messages[1].content);
          let parsed;
          if (name === "interview_plan") {
            const count = Number(
              request.messages[0].content.match(/exactly (\d+)/)[1],
            );
            parsed = {
              questions: Array.from({ length: count }, (_, i) => ({
                question: `Describe the decision and result in your pipeline project, part ${i + 1}?`,
                focus: "Ownership and reasoning",
              })),
            };
          } else if (name === "interview_followup") {
            parsed = {
              needed: input.answer.includes("latency"),
              question: "How did you measure that latency change?",
              reason: followReason,
            };
          } else {
            parsed = {
              summary: "A useful practice round.",
              strengths: ["Clear ownership"],
              nextSteps: ["Explain a tradeoff", "Add observed outcomes"],
              evaluations: input.turns.map((turn, turnIndex) => ({
                turnIndex,
                relevance: 4,
                depth: 3,
                evidence: 4,
                clarity: 3,
                strength: "A specific action",
                improve: "State an outcome",
                evidenceQuote: turn.answer.slice(0, 12),
                betterOutline: [
                  "Frame the problem",
                  "Explain your action and result",
                ],
              })),
            };
          }
          return { choices: [{ message: { parsed } }] };
        },
      },
    };
    this.audio = {
      speech: {
        create: async () =>
          new Response(new Uint8Array([1, 2, 3]), {
            headers: { "Content-Type": "audio/mpeg" },
          }),
      },
      transcriptions: {
        create: async () => ({
          text: "I measured the change with a controlled benchmark.",
        }),
      },
    };
  }
}
Module._load = function (request, parent, ...rest) {
  if (request === "openai") return MockOpenAI;
  if (request === "@/lib/supabase-server")
    return { currentUser: async () => user };
  if (request === "@/lib/supabase")
    return {
      supabaseAdmin: () => ({
        from: () => ({
          select() {
            return this;
          },
          eq(key, value) {
            if (key === "user_id") ownerFilter = value;
            if (key === "id") this.id = value;
            return this;
          },
          async single() {
            return {
              data:
                this.id === "owned-resume" && ownerFilter === user?.id
                  ? { raw_text: resume }
                  : null,
            };
          },
        }),
      }),
    };
  return load.call(this, request, parent, ...rest);
};
const { NextRequest } = require("next/server");
const {
  signSession,
  readSession,
  newSession,
} = require("../src/lib/interview/session.ts");
const { recordAnswer, buildReport } = require("../src/lib/interview/engine.ts");
const {
  FeedbackSchema,
  SessionSchema,
} = require("../src/lib/interview/contracts.ts");
const routes = Object.fromEntries(
  ["start", "turn", "speech", "transcribe"].map((name) => [
    name,
    require(`../src/app/api/interview/${name}/route.ts`),
  ]),
);
const origin = "https://topfit.test";
let checks = 0;
const check = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  checks++;
};
async function post(name, body, extra = {}) {
  const form = body instanceof FormData;
  const req = new NextRequest(`${origin}/api/interview/${name}`, {
    method: "POST",
    headers: {
      origin,
      ...(form ? {} : { "Content-Type": "application/json" }),
      ...extra,
    },
    body: form ? body : JSON.stringify(body),
  });
  const res = await routes[name].POST(req);
  return {
    status: res.status,
    body: res.headers.get("content-type")?.includes("application/json")
      ? await res.json()
      : await res.arrayBuffer(),
  };
}
function startForm() {
  const form = new FormData();
  form.set("role", "Software Engineer");
  form.set("resumeText", resume);
  form.set("stage", "technical");
  form.set("count", "3");
  return form;
}
(async () => {
  user = null;
  check(
    (await post("start", startForm())).status,
    401,
    "Signed-out callers are blocked",
  );
  user = { id: "user-a" };
  check(
    (await post("start", startForm(), { origin: "https://other.test" })).status,
    403,
    "Cross-origin requests are blocked",
  );
  const invalid = startForm();
  invalid.set("count", "9");
  check((await post("start", invalid)).status, 400);
  const short = startForm();
  short.set("resumeText", "short");
  check((await post("start", short)).status, 400);
  const saved = startForm();
  saved.delete("resumeText");
  saved.set("resumeId", "owned-resume");
  const savedResult = await post("start", saved);
  check(savedResult.status, 200);
  check(ownerFilter, "user-a", "Saved resume lookup enforces ownership");
  saved.set("resumeId", "someone-elses-resume");
  check((await post("start", saved)).status, 400);
  const start = await post("start", startForm());
  check(start.status, 200);
  check(start.body.mainTotal, 3);
  const token = start.body.token;
  const session = readSession(token, user.id);
  check(session.plan.length, 3);
  assert.throws(() => readSession(token, "user-b"), /another account/);
  checks++;
  const [body, signature] = token.split(".");
  const tampered = JSON.parse(Buffer.from(body, "base64url"));
  tampered.resume = "modified";
  assert.throws(
    () =>
      readSession(
        Buffer.from(JSON.stringify(tampered)).toString("base64url") +
          "." +
          signature,
        user.id,
      ),
    /Invalid/,
  );
  checks++;
  assert.throws(
    () =>
      readSession(
        signSession({ ...session, expires: Date.now() - 100 }),
        user.id,
      ),
    /expired/,
  );
  checks++;
  check(
    (await post("turn", { token, action: "answer", answer: "" })).status,
    400,
  );
  check(
    (await post("turn", { token, action: "answer", answer: "a".repeat(5001) }))
      .status,
    400,
  );
  check((await post("turn", { token, action: "finish" })).status, 400);
  const follow = await post("turn", {
    token,
    action: "answer",
    answer: "I improved latency by changing the query plan.",
  });
  check(follow.status, 200);
  check(follow.body.isFollowup, true);
  check(follow.body.mainNumber, 1);
  check(
    readSession(follow.body.token, user.id).current.focus.length > 120,
    true,
    "Long follow-up context remains valid in a signed session",
  );
  check(
    (await post("speech", { token: follow.body.token })).status,
    200,
    "Follow-up speech uses the same valid question contract",
  );
  check(
    captured.at(-1).messages[1].content.includes("I improved latency"),
    true,
    "Follow-ups receive the actual user answer",
  );
  followReason = "x";
  const shortFollow = await post("turn", {
    token,
    action: "answer",
    answer: "I improved latency.",
  });
  check(
    readSession(shortFollow.body.token, user.id).current.focus,
    session.current.focus,
    "A too-short follow-up reason uses the valid main focus",
  );
  const second = await post("turn", {
    token: follow.body.token,
    action: "answer",
    answer: "I measured latency with a benchmark.",
  });
  check(second.body.mainNumber, 2, "At most one follow-up per main question");
  check(second.body.isFollowup, false);
  const third = await post("turn", {
    token: second.body.token,
    action: "skip",
  });
  check(third.body.mainNumber, 3);
  const final = await post("turn", {
    token: third.body.token,
    action: "answer",
    answer: "I documented validation failures and rehearsed rollback.",
  });
  check(final.status, 200);
  check(final.body.report.completed, true);
  check(final.body.report.turns.length, 4);
  check(final.body.report.answeredMain, 2);
  check(final.body.report.plannedMain, 3);
  check(
    final.body.report.evaluations[2].relevance,
    0,
    "Skipped answers must score zero",
  );
  check(
    final.body.report.score,
    53,
    "Overall score is computed from rubric, not invented by the model",
  );
  const partial = await post("turn", {
    token,
    action: "finish",
    answer: "I wrote reproducible tests for the migration.",
  });
  check(partial.body.report.completed, false);
  check(partial.body.report.turns.length, 1);
  const assessment = FeedbackSchema.parse({
    summary: "Summary",
    strengths: ["Strength"],
    nextSteps: ["One", "Two"],
    evaluations: [
      {
        turnIndex: 0,
        relevance: 5,
        depth: 5,
        evidence: 5,
        clarity: 5,
        strength: "Strength",
        improve: "Improve",
        evidenceQuote: "invented quote",
        betterOutline: ["One", "Two"],
      },
    ],
  });
  const one = recordAnswer(session, "My actual answer.");
  check(
    buildReport(one, assessment, false).evaluations[0].evidenceQuote,
    "",
    "Unverifiable quotes are removed",
  );
  assert.throws(
    () => buildReport(one, { ...assessment, evaluations: [] }, false),
    /incomplete/,
  );
  checks++;
  assert.throws(
    () =>
      recordAnswer(
        { ...session, turns: Array(10).fill(one.turns[0]) },
        "extra",
      ),
    /limit/,
  );
  checks++;
  check(SessionSchema.safeParse({ ...session, mainIndex: 9 }).success, false);
  check((await post("speech", { token })).status, 200);
  check((await post("speech", { token: "invalid" })).status, 400);
  const recording = new FormData();
  recording.set("token", token);
  recording.set(
    "audio",
    new File([new Uint8Array(200)], "answer.webm", { type: "audio/webm" }),
  );
  const transcription = await post("transcribe", recording);
  check(transcription.status, 200);
  check(transcription.body.text.includes("controlled benchmark"), true);
  const wrongAudio = new FormData();
  wrongAudio.set("token", token);
  wrongAudio.set(
    "audio",
    new File([new Uint8Array(200)], "image.png", { type: "image/png" }),
  );
  check((await post("transcribe", wrongAudio)).status, 400);
  unavailable = true;
  const failure = await post("start", startForm());
  check(failure.status, 502);
  check(
    JSON.stringify(failure.body).includes("private secret"),
    false,
    "Provider error content is not exposed",
  );
  console.log(
    `PASS: ${checks} interview API, state, ownership, adaptive follow-up, grading and audio contract checks (external I/O mocked).`,
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
