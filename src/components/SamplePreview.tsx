import { Clock, MessagesSquare } from "lucide-react";
import { LogoMark } from "./Logo";

export function MiniRing({ pct, size = 52 }: { pct: number; size?: number }) {
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-forest-100" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
          className="stroke-forest-600"
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[11px] font-bold text-forest-800">
        {pct}%
      </span>
    </div>
  );
}

export default function SamplePreview() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none" aria-hidden="true">
      <div className="absolute -inset-3 -rotate-2 rounded-[32px] bg-forest-100/80" />
      <div className="absolute -inset-3 rotate-1 rounded-[32px] bg-copper-100/50" />
      <div className="relative rounded-[28px] border border-line bg-white p-6 shadow-lift">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <LogoMark size={30} />
            <div>
              <p className="text-sm font-semibold text-ink">Prep pack</p>
              <p className="text-xs text-slate-500">Hiring manager round · Video call</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <MiniRing pct={77} />
            <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
              Coverage
            </span>
          </div>
        </div>

        <h3 className="mt-5 text-lg font-bold leading-snug tracking-tight text-ink">
          Senior Machine Learning Engineer
        </h3>
        <p className="text-sm text-slate-500">Platform team · Fintech</p>

        <div className="my-5 border-t border-line" />

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-forest-900 px-2.5 py-0.5 text-[11px] font-semibold text-white">
            Question 1
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            <Clock className="h-3.5 w-3.5" /> ~60s spoken target
          </span>
        </div>
        <p className="mt-2.5 font-medium leading-snug text-ink">
          Tell me about a model you took from experiment to production.
        </p>
        <div className="mt-3 space-y-2 rounded-xl bg-paper p-4">
          <div className="h-2 w-full rounded-full bg-slate-300/80" />
          <div className="h-2 w-11/12 rounded-full bg-slate-300/70" />
          <div className="h-2 w-4/5 rounded-full bg-slate-300/60" />
          <div className="h-2 w-3/5 rounded-full bg-forest-300" />
        </div>

        <div className="mt-5">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <MessagesSquare className="h-4 w-4 text-forest-600" />
            Follow-ups they will ask next
          </p>
          <div className="mt-2.5 space-y-2">
            {["How did you measure whether it worked?", "What broke first at production scale?"].map(
              (t, i) => (
                <div key={t} className="flex items-center gap-2.5 rounded-lg border border-line bg-cream px-3 py-2">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-forest-100 text-[11px] font-bold text-forest-800">
                    {i + 1}
                  </span>
                  <span className="text-[13px] font-medium text-ink-soft">{t}</span>
                </div>
              )
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-forest-50 px-2 py-0.5 text-[11px] font-medium text-forest-800 ring-1 ring-forest-100">
            Proves: model monitoring
          </span>
          <span className="rounded-full bg-forest-50 px-2 py-0.5 text-[11px] font-medium text-forest-800 ring-1 ring-forest-100">
            Proves: production ownership
          </span>
        </div>
      </div>
    </div>
  );
}
