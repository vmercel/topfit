"use client";

import { useState } from "react";
import {
  AlertTriangle,
  BookOpenCheck,
  Boxes,
  CalendarCheck,
  ClipboardList,
  EyeOff,
  Mic,
  MonitorPlay,
  Scale,
  Wrench,
} from "lucide-react";
import type { PrepPack } from "@/lib/types";
import UiMockView from "./UiMockView";

function Card({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="scroll-mt-6 rounded-[28px] border border-line bg-white p-6 shadow-card sm:p-8">
      {children}
    </section>
  );
}

function Heading({ icon, title, lead }: { icon: React.ReactNode; title: string; lead?: string }) {
  return (
    <div className="mb-4">
      <h3 className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-ink">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-forest-50 text-forest-700 ring-1 ring-forest-100">
          {icon}
        </span>
        {title}
      </h3>
      {lead && <p className="mt-2 text-sm leading-relaxed text-slate-500">{lead}</p>}
    </div>
  );
}

function Table({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-2xl ring-1 ring-line">
      <table className="w-full border-collapse text-left text-[13px] leading-relaxed">
        <thead className="bg-paper">
          <tr>
            {columns.map((c, i) => (
              <th key={i} className="border-b border-line px-3.5 py-2.5 font-semibold text-ink-soft">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="align-top">
              {r.map((c, j) => (
                <td key={j} className={`border-b border-line/70 px-3.5 py-2.5 ${j === 0 ? "font-semibold text-ink" : "text-ink-soft"}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Hidden({ shown, onReveal, children }: { shown: boolean; onReveal: () => void; children: React.ReactNode }) {
  if (shown) return <>{children}</>;
  return (
    <button
      onClick={onReveal}
      className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line-strong py-5 text-sm font-medium text-slate-500 transition hover:border-forest-400 hover:bg-forest-50/50 hover:text-forest-800"
    >
      <EyeOff className="h-4 w-4" />
      Answer out loud first, then tap to compare
    </button>
  );
}

export default function ScenarioPack({ pack, practice }: { pack: PrepPack; practice: boolean }) {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const shown = (k: string) => !practice || !!revealed[k];
  const reveal = (k: string) => () => setRevealed((r) => ({ ...r, [k]: true }));
  const frameworks = pack.frameworks ?? [];

  const toc = [
    pack.snapshot && ["snapshot", "Snapshot"],
    pack.pitch && ["pitch", "Pitch"],
    pack.storyMap?.length && ["stories", "Stories"],
    pack.technicalQA?.length && ["technical", "Technical Q&A"],
    frameworks.length && ["frameworks", "Framework scenarios"],
    pack.behavioral?.length && ["behavioral", "Behavioural"],
    pack.gaps?.length && ["gaps", "Gaps"],
    pack.checklist?.length && ["checklist", "Checklist"],
  ].filter(Boolean) as [string, string][];

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-2" aria-label="Pack sections">
        {toc.map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-semibold text-ink-soft shadow-pop transition hover:border-forest-300 hover:text-forest-800"
          >
            {label}
          </a>
        ))}
      </nav>

      {pack.snapshot && (
        <Card id="snapshot">
          <Heading icon={<CalendarCheck className="h-4 w-4" />} title="Interview snapshot" lead={pack.snapshot.summary} />
          <Table columns={["Item", "Detail"]} rows={pack.snapshot.rows.map((r) => [r.label, r.value])} />
          {pack.snapshot.note && <p className="mt-3.5 text-sm leading-relaxed text-ink-soft">{pack.snapshot.note}</p>}
        </Card>
      )}

      {pack.pitch && (
        <Card id="pitch">
          <Heading icon={<Mic className="h-4 w-4" />} title="Your 60-second pitch" lead="Say this when they ask you to introduce yourself." />
          <Hidden shown={shown("pitch")} onReveal={reveal("pitch")}>
            <blockquote className="rounded-2xl border-l-4 border-forest-600 bg-paper px-5 py-4 text-[15px] leading-[1.75] text-ink">
              {pack.pitch}
            </blockquote>
          </Hidden>
        </Card>
      )}

      {!!pack.storyMap?.length && (
        <Card id="stories">
          <Heading
            icon={<BookOpenCheck className="h-4 w-4" />}
            title="Your stories mapped to the JD"
            lead="One story per requirement: situation, what you built, result."
          />
          <Table columns={["JD requirement", "Your story", "Number to land"]} rows={pack.storyMap.map((s) => [s.requirement, s.story, s.proof])} />
        </Card>
      )}

      {!!pack.technicalQA?.length && (
        <Card id="technical">
          <Heading icon={<Wrench className="h-4 w-4" />} title="Technical questions with brief answers" lead="Lead with the decision, then the technical detail." />
          <ol className="space-y-5">
            {pack.technicalQA.map((q, i) => (
              <li key={i}>
                <p className="text-[15px] font-semibold leading-snug text-ink">
                  {i + 1}. {q.question}
                </p>
                <Hidden shown={shown(`t${i}`)} onReveal={reveal(`t${i}`)}>
                  <p className="mt-1.5 text-sm leading-[1.75] text-ink-soft">{q.answer}</p>
                </Hidden>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {frameworks.length > 0 && (
        <Card id="frameworks">
          <Heading
            icon={<Boxes className="h-4 w-4" />}
            title="Framework scenarios, screens and trade-offs"
            lead="Each framework in the JD gets a client scenario, an illustrative screen (drawn for this prep, not a vendor screenshot), how to read it, what you would do, and the trade-offs. Use these as ready-made stories when they ask how you would handle something."
          />
          <div className="space-y-10">
            {frameworks.map((f, i) => (
              <article key={i} className="border-t border-line pt-7 first:border-t-0 first:pt-0">
                <h4 className="text-lg font-bold leading-snug tracking-tight text-ink">
                  {i + 1}. {f.name}
                </h4>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-forest-700">JD: {f.requirement}</p>
                <p className="mt-3 text-sm leading-relaxed text-ink">
                  <span className="font-bold">Scenario.</span> {f.scenario}
                </p>
                <div className="mt-4">
                  <UiMockView mock={f.screen} />
                </div>
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <div className="rounded-2xl bg-paper p-4 ring-1 ring-line/70">
                    <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                      <MonitorPlay className="h-3.5 w-3.5 text-forest-600" /> How to read it
                    </p>
                    <p className="mt-2 text-sm leading-[1.7] text-ink-soft">{f.howToRead}</p>
                  </div>
                  <div className="rounded-2xl bg-forest-50 p-4 ring-1 ring-forest-100">
                    <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-forest-800">
                      <Wrench className="h-3.5 w-3.5" /> What you do
                    </p>
                    <p className="mt-2 text-sm leading-[1.7] text-forest-950">{f.whatToDo}</p>
                  </div>
                </div>
                {f.extraNote && <p className="mt-3 text-sm leading-relaxed text-slate-500">{f.extraNote}</p>}
                <div className="mt-4">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                    <Scale className="h-3.5 w-3.5 text-forest-600" /> Trade-offs
                  </p>
                  <Table columns={f.tradeoffs.columns} rows={f.tradeoffs.rows} />
                </div>
              </article>
            ))}
          </div>
        </Card>
      )}

      {(!!pack.behavioral?.length || !!pack.logistics?.length) && (
        <Card id="behavioral">
          <Heading icon={<Mic className="h-4 w-4" />} title="Behavioural and logistics questions" />
          <div className="space-y-5">
            {(pack.behavioral ?? []).map((q, i) => (
              <div key={i}>
                <p className="text-[15px] font-semibold leading-snug text-ink">{q.question}</p>
                <Hidden shown={shown(`b${i}`)} onReveal={reveal(`b${i}`)}>
                  <p className="mt-1.5 text-sm leading-[1.75] text-ink-soft">{q.answer}</p>
                </Hidden>
              </div>
            ))}
          </div>
          {!!pack.logistics?.length && (
            <div className="mt-6 rounded-2xl bg-paper p-4 ring-1 ring-line/70">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Logistics answers (keep them short)</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink-soft">
                {pack.logistics.map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {!!pack.gaps?.length && (
        <Card id="gaps">
          <Heading
            icon={<AlertTriangle className="h-4 w-4" />}
            title="Gaps and how to handle them"
            lead="Name the gap honestly, bridge to adjacent experience, and say how fast you would close it."
          />
          <Table columns={["Gap vs JD", "What to say"]} rows={pack.gaps.map((g) => [g.gap, g.whatToSay])} />
        </Card>
      )}

      {!!pack.checklist?.length && (
        <Card id="checklist">
          <Heading icon={<ClipboardList className="h-4 w-4" />} title="Day-of checklist" />
          <ul className="space-y-2">
            {pack.checklist.map((c, i) => (
              <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-ink-soft">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-forest-700" aria-label={c} />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
