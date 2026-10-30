import Link from "next/link";
import {
  ArrowRight,
  FileSearch,
  Gauge,
  Lock,
  MessagesSquare,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
} from "lucide-react";

const FEATURES = [
  { icon: MessagesSquare, title: "Live AI interview practice", body: "Rehearse with a spoken AI interviewer and an optional live camera preview. Get resume-based questions, targeted follow-ups based on your actual answers, and a final score with question-by-question feedback. Answer by microphone or keyboard, and review transcripts before submitting." },
  {
    icon: FileSearch,
    title: "Coding practice: Python 75 & SQL",
    body: "Build coding fluency with 75 curated algorithm problems and 40 SQL patterns. Study the key idea and a step-by-step walkthrough, reveal a reference solution, then write and run your own code against practice tests. Your drafts and progress stay saved on this browser.",
  },
  {
    icon: ScanSearch,
    title: "Evidence bank",
    body: "Before a single question is written, TopFit reads your resume and extracts the proof: the projects you shipped, the metrics you moved, the tools you used, and the scope you owned. Every answer in your pack is assembled from this bank. If a fact is not in your resume, it does not appear in your answers.",
  },
  {
    icon: Target,
    title: "Requirement map",
    body: "Job descriptions are written in hiring language, not plain English. TopFit decodes the posting into its real requirements and rates each one against your evidence as strong, partial, or gap. You see exactly what the panel will probe and where they will push.",
  },
  {
    icon: Sparkles,
    title: "Stage-aware question engine",
    body: "A recruiter screen checks motivation and range. A hiring manager checks ownership. A technical round checks depth, and a final round checks judgment. The engine selects the technical and behavioural questions that stage is most likely to ask, weighted toward what the job description emphasizes.",
  },
  {
    icon: MessagesSquare,
    title: "Framework scenarios",
    body: "Interviewers ask how you would handle real problems with the tools they use. Every framework in the job description gets a client scenario, an illustrative screen with realistic numbers, how to read it, what you would do, and a trade-off table against the alternatives.",
  },
  {
    icon: Timer,
    title: "Practice mode",
    body: "Strong content delivered badly still fails. Practice mode hides the model answers so you can rehearse out loud against a 60 or 90 second timer, the length a spoken answer should actually run. Reveal the answer when you want to compare, then go again.",
  },
  {
    icon: Gauge,
    title: "Coverage scoring",
    body: "Each pack opens with an honest coverage score: how much of the requirement map your evidence genuinely supports. A high score tells you to be confident. A lower one tells you exactly which gaps to prepare bridge answers for, instead of finding out live.",
  },
  {
    icon: ShieldCheck,
    title: "Honest gaps, never invented claims",
    body: "Where the job asks for something your resume does not show, TopFit writes a bridge answer: it connects adjacent experience you really have to the requirement and frames the gap plainly. Recruiters spot fabricated stories fast. A credible bridge protects you and still competes.",
  },
  {
    icon: Lock,
    title: "Privacy and ownership",
    body: "Your packs are tied to your account. A pack you own returns a 404 to everyone else, including signed-out visitors, and your history lives behind your sign-in. Your resume is used to build your prep, and your prep stays yours.",
  },
  {
    icon: FileSearch,
    title: "Traps, named in advance",
    body: "Most interview questions carry a hidden test: the salary deflection, the weakness probe, the why-are-you-leaving check. Every question in your pack names its trap in plain language, so you hear the real question underneath the polite one.",
  },
];

export default function FeaturesPage() {
  return (
    <main className="flex-1">
      <section className="mx-auto w-full max-w-6xl px-4 pb-6 pt-14 sm:px-6 lg:pt-20">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-forest-200 bg-forest-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-forest-800">
            <span className="h-1.5 w-1.5 rounded-full bg-copper-500" />
            Features
          </p>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            Built from your resume and their job description. Nothing else.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-ink-soft">
            Generic question lists prepare you for an average interview that does not exist.
            TopFit reads the two documents that decide your interview and builds the pack around
            them.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <article
              key={f.title}
              className="flex flex-col rounded-3xl border border-line bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift"
            >
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-forest-900 text-white shadow-pop">
                <f.icon className="h-5 w-5" />
              </span>
              <h2 className="mt-5 text-lg font-semibold tracking-tight text-ink">{f.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:pb-24">
        <div className="rounded-[32px] border border-forest-100 bg-forest-50 px-6 py-10 text-center shadow-card sm:px-12">
          <h2 className="mx-auto max-w-xl text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            See what your next interview actually looks like
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-ink-soft">
            Your first packs are free. All you need is a resume and a job description.
          </p>
          <Link
            href="/signup"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-forest-900 px-6 py-3.5 text-[15px] font-semibold text-white shadow-pop transition hover:bg-forest-800"
          >
            Create a free account
            <ArrowRight className="h-4.5 w-4.5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
