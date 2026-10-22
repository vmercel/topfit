import Link from "next/link";
import { ArrowRight, Check, Minus } from "lucide-react";

const TIERS = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    blurb: "For a first interview on the calendar and no budget to prep with.",
    cta: "Create a free account",
    highlight: false,
    features: [
      "2 prep packs a month",
      "1 interview stage of your choice",
      "4 engineered answers per pack",
      "Requirement map and coverage score",
      "Packs saved to your dashboard",
    ],
  },
  {
    name: "Pro",
    price: "$12",
    cadence: "per month",
    blurb: "For an active search with several panels running at once.",
    cta: "Start with Pro",
    highlight: true,
    features: [
      "Unlimited prep packs",
      "All 6 stages and every format",
      "Full follow-up chains, 3 per question",
      "Practice mode with spoken-answer timers",
      "Priority generation at peak times",
      "Copy packs as Markdown",
    ],
  },
  {
    name: "Teams",
    price: "$29",
    cadence: "per seat / month",
    blurb: "For career coaches, bootcamps, and outplacement programs.",
    cta: "Start with Teams",
    highlight: false,
    features: [
      "Everything in Pro, for every seat",
      "Shared workspace for coaches and candidates",
      "Admin controls and seat management",
      "Shared pack library across the team",
      "Priority support",
    ],
  },
];

const COMPARE: { label: string; values: (string | boolean)[] }[] = [
  { label: "Prep packs", values: ["2 a month", "Unlimited", "Unlimited"] },
  { label: "Interview stages", values: ["1 stage", "All 6 stages", "All 6 stages"] },
  { label: "Follow-up chains", values: [false, true, true] },
  { label: "Practice mode and timers", values: [false, true, true] },
  { label: "Priority generation", values: [false, true, true] },
  { label: "Shared workspace", values: [false, false, true] },
  { label: "Admin controls", values: [false, false, true] },
  { label: "Priority support", values: [false, false, true] },
];

const FAQS = [
  {
    q: "When does billing start?",
    a: "Billing launches soon. You can create an account today, use the free tier, and hold your place. Early accounts keep Pro pricing locked at $12 a month when paid plans open.",
  },
  {
    q: "What counts as one prep pack?",
    a: "One pack is one interview: a resume, a job description, a stage, and a format. It includes the strategy, the requirement map, 4 engineered answers, and their follow-up chains. Regenerating for a different stage of the same job counts as a new pack.",
  },
  {
    q: "Can I prep for several stages of the same job?",
    a: "Yes, and you should. Each stage asks different questions, so most candidates build one pack per round. Pro and Teams include every stage, from recruiter screen to final executive round.",
  },
  {
    q: "Does TopFit write answers I can read word for word?",
    a: "The answers are written to be spoken in about a minute, in your own voice, from your own experience. They are a rehearsal script, not a teleprompter. Practice mode exists so the words become yours before the interview, not during it.",
  },
  {
    q: "What happens to my resume?",
    a: "Your resume is used to build your packs and is stored with your account so your history is there when you come back. Your packs are private to your account and are not shared with employers.",
  },
];

export default function PricingPage() {
  return (
    <main className="flex-1">
      <section className="mx-auto w-full max-w-6xl px-4 pt-14 sm:px-6 lg:pt-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-forest-200 bg-forest-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-forest-800">
            <span className="h-1.5 w-1.5 rounded-full bg-copper-500" />
            Pricing
          </p>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            Honest pricing for an honest prep tool
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-ink-soft">
            Start free. Pay when the interview calendar fills up.
          </p>
          <p className="mt-4 inline-block rounded-full bg-copper-50 px-4 py-1.5 text-sm font-medium text-copper-700 ring-1 ring-copper-100">
            Billing launches soon. Early accounts keep Pro pricing locked.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid items-stretch gap-5 lg:grid-cols-3">
          {TIERS.map((t) => (
            <article
              key={t.name}
              className={`relative flex flex-col rounded-[28px] border bg-white p-7 shadow-card ${
                t.highlight
                  ? "border-forest-300 shadow-lift ring-1 ring-forest-200 lg:-my-3 lg:py-10"
                  : "border-line"
              }`}
            >
              {t.highlight && (
                <span className="absolute -top-3.5 left-7 rounded-full bg-copper-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-pop">
                  Most popular
                </span>
              )}
              <h2 className="text-lg font-semibold tracking-tight text-ink">{t.name}</h2>
              <p className="mt-4 flex items-baseline gap-2">
                <span className="text-5xl font-bold tracking-tight text-ink">{t.price}</span>
                <span className="text-sm font-medium text-slate-500">{t.cadence}</span>
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{t.blurb}</p>
              <ul className="mt-6 flex-1 space-y-3 border-t border-line pt-6">
                {t.features.map((f) => (
                  <li key={f} className="flex gap-2.5 text-sm leading-relaxed text-ink-soft">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-forest-50 text-forest-700 ring-1 ring-forest-100">
                      <Check className="h-3 w-3" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`mt-8 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition ${
                  t.highlight
                    ? "bg-forest-900 text-white shadow-pop hover:bg-forest-800"
                    : "border border-line bg-white text-forest-900 shadow-sm hover:border-forest-300 hover:text-forest-700"
                }`}
              >
                {t.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-4 pb-6 sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight text-ink">Compare plans</h2>
        <div className="mt-6 overflow-x-auto rounded-3xl border border-line bg-white shadow-card">
          <table className="w-full min-w-130 text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-cream text-ink">
                <th className="px-5 py-4 font-semibold">Feature</th>
                <th className="px-5 py-4 font-semibold">Free</th>
                <th className="px-5 py-4 font-semibold">Pro</th>
                <th className="px-5 py-4 font-semibold">Teams</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((row, i) => (
                <tr key={row.label} className={i % 2 ? "bg-paper/60" : "bg-white"}>
                  <td className="px-5 py-3.5 font-medium text-ink">{row.label}</td>
                  {row.values.map((v, j) => (
                    <td key={j} className="px-5 py-3.5 text-ink-soft">
                      {v === true ? (
                        <Check className="h-4.5 w-4.5 text-forest-600" aria-label="Included" />
                      ) : v === false ? (
                        <Minus className="h-4.5 w-4.5 text-slate-300" aria-label="Not included" />
                      ) : (
                        v
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
        <h2 className="text-2xl font-bold tracking-tight text-ink">Questions</h2>
        <div className="mt-6 space-y-3">
          {FAQS.map((f) => (
            <details
              key={f.q}
              className="group rounded-3xl border border-line bg-white px-6 py-5 shadow-card open:shadow-lift"
            >
              <summary className="cursor-pointer list-none font-semibold tracking-tight text-ink marker:hidden">
                <span className="flex items-center justify-between gap-4">
                  {f.q}
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-forest-50 text-forest-700 ring-1 ring-forest-100 transition group-open:rotate-45">
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{f.a}</p>
            </details>
          ))}
        </div>
        <p className="mt-10 text-center text-sm text-ink-soft">
          Still deciding?{" "}
          <Link href="/contact" className="font-semibold text-forest-800 underline underline-offset-2 hover:text-forest-600">
            Ask us directly
          </Link>{" "}
          or{" "}
          <Link href="/signup" className="font-semibold text-forest-800 underline underline-offset-2 hover:text-forest-600">
            start with the free tier
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
