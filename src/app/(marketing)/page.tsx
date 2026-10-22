import Link from "next/link";
import {
  ArrowRight,
  Check,
  Gauge,
  Layers,
  ListChecks,
  MessagesSquare,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  Upload,
} from "lucide-react";
import { STAGES } from "@/lib/types";
import SamplePreview from "@/components/SamplePreview";

const STATS = [
  { icon: ListChecks, value: "4", label: "engineered answers per pack" },
  { icon: MessagesSquare, value: "12", label: "predicted follow-up questions" },
  { icon: Layers, value: "6", label: "interview stages covered" },
  { icon: Timer, value: "~30s", label: "from paste to ready pack" },
];

const STEPS = [
  {
    icon: Upload,
    title: "Add your resume and the job",
    body: "Upload or paste your resume, then paste the job description. TopFit reads both documents the way a hiring panel would.",
  },
  {
    icon: Target,
    title: "Pick your stage and format",
    body: "Recruiter screen, hiring manager, technical deep dive, system design, behavioral, or final round. Phone, video, panel, or on site.",
  },
  {
    icon: Sparkles,
    title: "Walk in ready",
    body: "You get the 4 questions that stage is most likely to ask, brief engineered answers drawn from your own experience, and the follow-ups they lead to.",
  },
];

const FEATURES = [
  {
    icon: ScanSearch,
    title: "Evidence bank",
    body: "Your resume is mined for concrete proof: projects, metrics, tools, and scope. Answers cite only what is really there.",
  },
  {
    icon: Target,
    title: "Requirement map",
    body: "The job description is decoded into its real requirements, each rated strong, partial, or gap against your experience.",
  },
  {
    icon: Gauge,
    title: "Coverage score",
    body: "One honest number for how much of the job your evidence actually covers, so you know where you stand before they do.",
  },
  {
    icon: MessagesSquare,
    title: "Follow-up prediction",
    body: "Every answer comes with the 3 follow-ups it is most likely to trigger, each with its own prepared answer.",
  },
  {
    icon: Timer,
    title: "Practice mode",
    body: "Hide the answers, rehearse against a 60 or 90 second timer, and reveal them when you are ready to check yourself.",
  },
  {
    icon: ShieldCheck,
    title: "No invented claims",
    body: "Where the job asks for something your resume does not show, you get an honest bridge answer, never a fabricated story.",
  },
];

const TEASER_TIERS = [
  {
    name: "Free",
    price: "$0",
    note: "2 prep packs a month, 1 interview stage",
  },
  {
    name: "Pro",
    price: "$12",
    note: "Unlimited packs, all stages, full follow-up chains",
    highlight: true,
  },
  {
    name: "Teams",
    price: "$29",
    note: "Per seat, shared workspace and admin controls",
  },
];

function SectionHead({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body?: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-copper-600">{eyebrow}</p>
      <h2 className="mt-2.5 text-3xl font-bold tracking-tight text-ink">{title}</h2>
      {body && <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{body}</p>}
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-105 bg-gradient-to-b from-forest-50 via-paper to-paper"
          aria-hidden="true"
        />
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-2 lg:pb-20 lg:pt-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-forest-200 bg-white px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-forest-800 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-copper-500" />
              Interview prep, engineered
            </p>
            <h1 className="mt-6 text-5xl font-bold leading-[1.04] tracking-tight text-ink sm:text-6xl">
              Walk into your next interview{" "}
              <span className="text-forest-700">already knowing the questions.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
              Drop in your resume and the job description. TopFit builds the 4 questions your next
              interview stage is most likely to ask, writes brief answers from your real
              experience, and prepares you for every follow-up.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-full bg-forest-900 px-6 py-3.5 text-[15px] font-semibold text-white shadow-pop transition hover:bg-forest-800"
              >
                Create a free account
                <ArrowRight className="h-4.5 w-4.5" />
              </Link>
              <Link
                href="/features"
                className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-6 py-3.5 text-[15px] font-semibold text-forest-900 shadow-sm transition hover:border-forest-300 hover:text-forest-700"
              >
                See how it works
              </Link>
            </div>
            <div className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-line pt-6">
              {[
                { value: "4", label: "engineered answers" },
                { value: "12", label: "predicted follow-ups" },
                { value: "~30s", label: "to a ready pack" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-bold tracking-tight text-forest-800">{s.value}</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <SamplePreview />
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
        <SectionHead
          eyebrow="How it works"
          title="From job post to prep pack in three steps"
        />
        <div className="mt-9 grid gap-5 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="relative rounded-3xl border border-line bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-forest-900 text-white shadow-pop">
                  <step.icon className="h-5 w-5" />
                </span>
                <span className="text-4xl font-bold tracking-tight text-forest-100">
                  0{i + 1}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="border-y border-line bg-cream">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
          <SectionHead
            eyebrow="What is inside"
            title="A prep pack is more than sample answers"
            body="Every pack is built from two documents only: your resume and their job description. That discipline is what makes the output trustworthy."
          />
          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-3xl border border-line bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-forest-50 text-forest-700 ring-1 ring-forest-100">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold tracking-tight text-ink">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{f.body}</p>
              </div>
            ))}
          </div>
          <Link
            href="/features"
            className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-forest-800 transition hover:text-forest-600"
          >
            Explore all features
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Stage coverage */}
      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
        <SectionHead
          eyebrow="Stage coverage"
          title="Every round asks different questions"
          body="A recruiter screen is not a system design round. TopFit tunes the question set, the answer shape, and the traps to the stage you are actually facing."
        />
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STAGES.map((s) => (
            <div key={s.id} className="rounded-3xl border border-line bg-white p-5 shadow-card">
              <h3 className="font-semibold tracking-tight text-ink">{s.label}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{s.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Inside a pack */}
      <section className="border-y border-line bg-forest-50">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-copper-600">
              Inside a prep pack
            </p>
            <h2 className="mt-2.5 text-3xl font-bold tracking-tight text-ink">
              Built like a briefing document, not a chatbot reply
            </h2>
            <ul className="mt-7 space-y-3.5">
              {[
                "A coverage score with the full requirement map behind it",
                "A positioning strategy for this specific role and panel",
                "4 questions with answers written to be spoken in about a minute",
                "The trap inside each question, named before you fall into it",
                "3 predicted follow-ups per question, each with its own answer",
                "Practice mode with timers, and copy as Markdown for your notes",
              ].map((item) => (
                <li key={item} className="flex gap-3 text-[15px] leading-relaxed text-ink-soft">
                  <span className="mt-0.5 grid h-5.5 w-5.5 shrink-0 place-items-center rounded-full bg-forest-900 text-white">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="mt-9 inline-flex items-center gap-2 rounded-full bg-forest-900 px-6 py-3.5 text-[15px] font-semibold text-white shadow-pop transition hover:bg-forest-800"
            >
              Build your first pack
              <ArrowRight className="h-4.5 w-4.5" />
            </Link>
          </div>
          <div className="rounded-[28px] border border-line bg-white p-6 shadow-lift" aria-hidden="true">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Requirement map
            </p>
            <div className="mt-4 space-y-2.5">
              {[
                { req: "Model monitoring and drift detection", level: "Strong", w: "86%", tone: "bg-forest-500", badge: "bg-forest-50 text-forest-800 ring-forest-200" },
                { req: "ML platform on Kubernetes", level: "Strong", w: "78%", tone: "bg-forest-500", badge: "bg-forest-50 text-forest-800 ring-forest-200" },
                { req: "Feature store design", level: "Partial", w: "52%", tone: "bg-copper-500", badge: "bg-copper-50 text-copper-700 ring-copper-100" },
                { req: "Real time inference at scale", level: "Gap", w: "24%", tone: "bg-red-400", badge: "bg-red-50 text-red-700 ring-red-200" },
              ].map((r) => (
                <div key={r.req} className="rounded-2xl bg-paper p-4 ring-1 ring-line">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-ink">{r.req}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${r.badge}`}>
                      {r.level}
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div className={`h-full rounded-full ${r.tone}`} style={{ width: r.w }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-5 text-[13px] leading-relaxed text-ink-soft">
              Gaps are not hidden. Each one comes with an honest bridge answer that connects what
              you have done to what they need.
            </p>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="flex items-center gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-forest-50 text-forest-700 ring-1 ring-forest-100">
                <s.icon className="h-5.5 w-5.5" />
              </span>
              <div>
                <p className="text-2xl font-bold tracking-tight text-ink">{s.value}</p>
                <p className="text-[13px] leading-snug text-slate-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="border-t border-line bg-cream">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
          <SectionHead
            eyebrow="Pricing"
            title="Start free. Upgrade when the interviews stack up."
          />
          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {TEASER_TIERS.map((t) => (
              <div
                key={t.name}
                className={`rounded-3xl border bg-white p-6 shadow-card ${
                  t.highlight ? "border-forest-300 ring-1 ring-forest-200" : "border-line"
                }`}
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="font-semibold tracking-tight text-ink">{t.name}</h3>
                  <p className="text-2xl font-bold tracking-tight text-forest-800">
                    {t.price}
                    <span className="text-sm font-medium text-slate-400"> /mo</span>
                  </p>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{t.note}</p>
              </div>
            ))}
          </div>
          <Link
            href="/pricing"
            className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-forest-800 transition hover:text-forest-600"
          >
            Compare plans in detail
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
        <div className="rounded-[32px] border border-forest-100 bg-forest-50 px-6 py-12 text-center shadow-card sm:px-12">
          <h2 className="mx-auto max-w-xl text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Your next interview is already scheduled. Be the candidate who is ready for it.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-ink-soft">
            Create a free account, paste a job description, and have your first prep pack in about
            30 seconds.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-forest-900 px-6 py-3.5 text-[15px] font-semibold text-white shadow-pop transition hover:bg-forest-800"
            >
              Create a free account
              <ArrowRight className="h-4.5 w-4.5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-6 py-3.5 text-[15px] font-semibold text-forest-900 shadow-sm transition hover:border-forest-300"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
