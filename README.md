# TopFit

Interview preparation that puts a candidate in the top 3 percent for the specific role and the specific room.

## How it works

1. The candidate uploads a resume (PDF or DOCX) and pastes the job description.
2. They pick the interview stage (recruiter screen, hiring manager, technical deep dive, system design / case, behavioural, final / executive) and the format (video, panel, live coding, case study, and more).
3. TopFit runs a two-stage pipeline:
   - Analysis: the JD is decoded into a requirement map and the resume is turned into a grounded evidence bank. Every requirement is rated strong, partial, or gap against actual resume evidence.
   - Generation: the 4 highest-probability questions for that stage and domain are selected, one brief engineered answer is written per question using only evidence-bank facts, and the 3 most likely follow-ups per question are predicted and answered in parallel.
4. The prep pack shows requirement coverage, a requirement map with honest gaps and pre-empted objections, per-answer structure and timing, traps to avoid, questions to ask, and a practice mode with hidden answers and a per-question timer.

Answers are built only from what the resume actually says. Where the job asks for something the resume does not show, TopFit writes an honest bridge, never an invented claim.

## Stack

- Next.js (App Router) on Vercel, auto-deployed from the `main` branch
- Supabase (Postgres) for saved prep sessions and packs
- OpenAI structured outputs for analysis and generation

## Environment variables

- `OPENAI_API_KEY` (required)
- `OPENAI_MODEL` (optional, defaults to `gpt-4o`)
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (optional; without them packs are generated but not saved)

## Develop

```bash
npm install
npm run dev
```

## Coding practice

Open `/practice` (public) or `/app/coding` (signed in). Both expose the same two-part Theory and Practice workspace: 75 independently curated, commonly taught interview problems and 40 SQL patterns. This is an original educational collection, not a measured LeetCode frequency ranking or an official LeetCode product.

- Python lessons include a function contract, examples, walkthrough, complexity analysis, reference implementation and three visible practice checks. JSON adapters represent linked lists and trees; the task text explains each adapter.
- SQL lessons include schema, fixture data, expected result, SQL solution, engineering notes and two fixture checks. The engine is SQLite; date/JSON/catalog syntax and concurrency behavior differ from PostgreSQL/MySQL. Forty exercises cover core querying, windows, CTEs, time series, indexes, transactions, constraints, views and data quality; they are a foundation, not an exhaustive database engineering certification.
- Python uses Pyodide 0.27.7 and SQL uses sql.js 1.13.0, downloaded from cdn.jsdelivr.net in client Web Workers. No submitted code executes on Vercel. Loading has a 90-second timeout; execution has a 12-second timeout and Stop terminates the worker. Internet/CDN access is needed for runtime downloads.
- Drafts and completion are stored in browser localStorage, without account sync. Only a full practice-test pass marks a problem complete. Custom Python inputs return output without marking completion. Checks are learning feedback, not exhaustive grading.

### Curriculum verification

```bash
python3 scripts/verify-curriculum.py
npm run lint:coding
npm run test:worker
npm run build
```

The curriculum verifier runs every Python reference against its examples and every SQL reference against independent fixtures, including persistent-state checks for engineering exercises.

### CI/CD

`.github/workflows/ci.yml` runs on pull requests targeting main and pushes to main. It installs locked dependencies, lints the coding feature, verifies all 311 curriculum checks, executes all 305 fixtures through the actual worker runtimes (plus error cases) and builds Next.js using Node 24. The existing Vercel Git integration deploys feature branches as previews and main as production, preserving the project’s existing environment configuration. No new deployment token is needed. Merge only after CI succeeds.

`npm run lint:coding` is scoped because the pre-existing resume and onboarding pages currently have unrelated hook lint violations. `npm run lint` continues to report those baseline issues.

## Live AI interview practice

Open `/app/interview` after signing in. Select a saved resume, paste text, or upload a PDF/DOCX/text file (3 MB maximum). Choose a role, stage, optional job description and 3 or 5 main questions. The existing Vercel Git integration deploys this feature from main.

- A clearly labeled illustrated AI interviewer speaks generated questions using OpenAI speech synthesis. The candidate can enable a live local camera preview and answer by recording audio or typing. This is a turn-based voice conversation with a camera preview, not a generated photorealistic video participant or a human video call.
- Recorded answers are capped at 90 seconds and 3 MB, transcribed with OpenAI, then shown for correction before submission. Video is never sent to the server. Microphone/camera tracks are stopped when the session ends or the page unmounts. Browsers must allow microphone/camera access; text works when devices are unavailable. If automatic audio playback is blocked, use Play question.
- Main questions are grounded in the resume; up to one adaptive follow-up per main question is generated from the actual submitted answer. Users can skip questions or finish early.
- Feedback scores each submitted turn 0–5 for relevance, depth, evidence and clarity, weighted equally. The server computes the overall 0–100 score and category averages. Skipped turns receive zero. Early finishes are labeled partial and show main-question coverage. Only exact answer substrings are displayed as evidence quotes. Scores are coaching feedback, not validated hiring predictions; video, voice characteristics and accent are not assessed.
- Session state is authenticated, HMAC signed, bound to the signed-in user and expires after one hour. Saved-resume access is scoped by user_id. Resume text and transcripts stay in the tab/session token and are sent to OpenAI for processing; this feature does not write recordings, transcripts or reports to account storage or localStorage. Refreshing the page loses the session. Copy feedback before closing the report. Provider retention policies still apply.
- Required existing environment variable: `OPENAI_API_KEY`. Optional: `INTERVIEW_MODEL` (defaults to existing `OPENAI_MODEL`, then `gpt-4o`), `INTERVIEW_TTS_MODEL` (`gpt-4o-mini-tts`), `INTERVIEW_TRANSCRIPTION_MODEL` (`gpt-4o-mini-transcribe`), and `INTERVIEW_SESSION_SECRET` (otherwise server-side signing uses the OpenAI key). The speech and transcription models must be enabled for the project. No provider key is exposed to the browser.

`npm run test:interview` runs the real routes and state/scoring code with mocked external auth, storage and model I/O. It covers signed-out and cross-origin rejection, resume ownership, tampered/expired sessions, adaptive follow-ups, turn limits, skipped/partial grades, score computation, verified evidence quotes, speech/transcription contracts and sanitized provider failures. `npm run lint:interview` and these tests run in GitHub Actions alongside the coding checks and production build.
