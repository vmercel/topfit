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
npm run lint
npm run build
```

The curriculum verifier runs every Python reference against its examples and every SQL reference against independent fixtures, including persistent-state checks for engineering exercises.
