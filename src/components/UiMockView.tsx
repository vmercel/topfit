import type { Tone, UiMock } from "@/lib/types";

const TONE: Record<Tone, { text: string; fill: string; soft: string }> = {
  good: { text: "text-emerald-700", fill: "#2e7d32", soft: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  bad: { text: "text-rose-700", fill: "#e5534b", soft: "bg-rose-50 text-rose-800 ring-rose-200" },
  warn: { text: "text-amber-700", fill: "#d99a1e", soft: "bg-amber-50 text-amber-900 ring-amber-200" },
  neutral: { text: "text-slate-700", fill: "#5b8def", soft: "bg-slate-50 text-slate-700 ring-slate-200" },
};
const tone = (t: Tone | undefined) => TONE[t ?? "neutral"] ?? TONE.neutral;

function Timeline({ t }: { t: NonNullable<UiMock["timeline"]> }) {
  const end = Math.max(1, ...t.spans.map((s) => s.start + s.duration));
  return (
    <div>
      <p className="mock-h">{t.title}</p>
      <div className="space-y-1.5">
        {t.spans.map((s, i) => (
          <div key={i} className="grid grid-cols-[minmax(0,10rem)_1fr_4.5rem] items-center gap-2 text-[11px]">
            <span className="truncate font-mono text-slate-600" title={s.name}>
              {s.name}
            </span>
            <div className="relative h-3 rounded bg-slate-100">
              <div
                className="absolute top-0 h-3 rounded"
                style={{
                  left: `${(s.start / end) * 100}%`,
                  width: `${Math.max(1.2, (s.duration / end) * 100)}%`,
                  background: tone(s.tone).fill,
                }}
              />
            </div>
            <span className={`text-right font-mono ${tone(s.tone).text}`}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Chart({ c }: { c: NonNullable<UiMock["chart"]> }) {
  const W = 560,
    H = 170,
    pad = 24;
  const all = c.series.flatMap((s) => s.points).concat(c.threshold !== null ? [c.threshold] : []);
  const min = Math.min(0, ...all),
    max = Math.max(1, ...all) * 1.08;
  const n = Math.max(2, ...c.series.map((s) => s.points.length));
  const x = (i: number) => pad + (i / (n - 1)) * (W - pad * 2);
  const y = (v: number) => H - pad - ((v - min) / (max - min || 1)) * (H - pad * 2);
  return (
    <div>
      <p className="mock-h">{c.title}</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={c.title}>
        <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="#d6dbe3" />
        {c.threshold !== null && (
          <g>
            <line x1={pad} y1={y(c.threshold)} x2={W - pad} y2={y(c.threshold)} stroke="#e5534b" strokeDasharray="5 4" />
            <text x={W - pad} y={y(c.threshold) - 5} textAnchor="end" fontSize="10" fill="#c62828">
              {c.thresholdLabel}
            </text>
          </g>
        )}
        {c.series.map((s, k) => (
          <polyline
            key={k}
            fill="none"
            stroke={tone(s.tone).fill}
            strokeWidth="2.2"
            points={s.points.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
          />
        ))}
        {c.xLabels.length > 0 && (
          <>
            <text x={pad} y={H - 6} fontSize="10" fill="#6b7588">
              {c.xLabels[0]}
            </text>
            <text x={W - pad} y={H - 6} fontSize="10" textAnchor="end" fill="#6b7588">
              {c.xLabels[c.xLabels.length - 1]}
            </text>
          </>
        )}
      </svg>
      <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-slate-600">
        {c.series.map((s, k) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className="h-2 w-3 rounded-sm" style={{ background: tone(s.tone).fill }} />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function Graph({ g }: { g: NonNullable<UiMock["graph"]> }) {
  // Layered layout: longest path from sources decides the row.
  const ids = g.nodes.map((n) => n.id);
  const depth = new Map<string, number>(ids.map((id) => [id, 0]));
  for (let pass = 0; pass < ids.length; pass++) {
    for (const e of g.edges) {
      if (e.from === e.to) continue;
      const d = (depth.get(e.from) ?? 0) + 1;
      if (depth.has(e.to) && d > (depth.get(e.to) ?? 0) && d < ids.length) depth.set(e.to, d);
    }
  }
  const rows = new Map<number, string[]>();
  ids.forEach((id) => rows.set(depth.get(id)!, [...(rows.get(depth.get(id)!) ?? []), id]));
  const rowCount = Math.max(1, ...[...rows.keys()].map((k) => k + 1));
  const W = 560,
    rowH = 64,
    H = rowCount * rowH + 10;
  const pos = new Map<string, { x: number; y: number }>();
  rows.forEach((list, r) =>
    list.forEach((id, i) => pos.set(id, { x: ((i + 1) / (list.length + 1)) * W, y: 26 + r * rowH }))
  );
  return (
    <div>
      <p className="mock-h">{g.title}</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={g.title}>
        <defs>
          <marker id="mock-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8z" fill="#8a94a6" />
          </marker>
        </defs>
        {g.edges.map((e, i) => {
          const a = pos.get(e.from),
            b = pos.get(e.to);
          if (!a || !b) return null;
          const self = e.from === e.to;
          if (self)
            return (
              <path key={i} d={`M${a.x + 70},${a.y - 4} c 40 -30 40 30 0 10`} fill="none" stroke="#e5534b" markerEnd="url(#mock-arrow)" />
            );
          return (
            <g key={i}>
              <line x1={a.x} y1={a.y + 15} x2={b.x} y2={b.y - 17} stroke="#8a94a6" markerEnd="url(#mock-arrow)" />
              {e.label && (
                <text x={(a.x + b.x) / 2 + 6} y={(a.y + b.y) / 2 + 3} fontSize="9" fill="#6b7588">
                  {e.label}
                </text>
              )}
            </g>
          );
        })}
        {g.nodes.map((n) => {
          const p = pos.get(n.id)!;
          const t = tone(n.tone);
          const w = Math.min(150, Math.max(90, n.label.length * 7 + 20));
          return (
            <g key={n.id}>
              <rect
                x={p.x - w / 2}
                y={p.y - 15}
                width={w}
                height={n.note ? 34 : 30}
                rx="7"
                fill={n.tone === "bad" ? "#fde7e7" : n.tone === "warn" ? "#fff3d6" : n.tone === "good" ? "#e3f4e5" : "#fff"}
                stroke={t.fill}
                strokeWidth={n.tone === "neutral" ? 1 : 2}
              />
              <text x={p.x} y={p.y + (n.note ? -1 : 4)} textAnchor="middle" fontSize="11" fill="#1d2433">
                {n.label}
              </text>
              {n.note && (
                <text x={p.x} y={p.y + 13} textAnchor="middle" fontSize="9" fill={t.fill}>
                  {n.note.length > 26 ? n.note.slice(0, 25) + "…" : n.note}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function UiMockView({ mock }: { mock: UiMock }) {
  const hasSide = mock.sidebar.length > 0;
  return (
    <figure className="overflow-hidden rounded-2xl border border-[#d6dbe3] bg-white shadow-card">
      <div className="flex items-center gap-3 bg-[#1f2a3c] px-4 py-2.5 text-[13px] text-white">
        <span className="font-semibold">{mock.tool}</span>
        <span className="truncate text-white/60">{mock.breadcrumb}</span>
        <span className="ml-auto shrink-0 rounded-full bg-[#f0b429] px-2.5 py-0.5 text-[10px] font-semibold text-[#222]">
          Illustrative mock-up
        </span>
      </div>
      <div className={hasSide ? "grid md:grid-cols-[13rem_1fr]" : ""}>
        {hasSide && (
          <aside className="border-b border-[#e3e7ee] bg-[#fafbfc] p-4 text-[12px] leading-relaxed text-slate-700 md:border-b-0 md:border-r">
            {mock.sidebar.map((g, i) => (
              <div key={i} className="mb-3 last:mb-0">
                <p className="mock-h">{g.heading}</p>
                {g.lines.map((l, j) => (
                  <p key={j} className="font-mono text-[11px]">
                    {l}
                  </p>
                ))}
              </div>
            ))}
          </aside>
        )}
        <div className="min-w-0 space-y-4 p-4">
          {mock.kpis.length > 0 && (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-[repeat(auto-fit,minmax(8rem,1fr))]">
              {mock.kpis.map((k, i) => (
                <div key={i} className="rounded-xl border border-[#e3e7ee] p-3">
                  <p className="mock-h">{k.label}</p>
                  <p className={`text-xl font-bold ${tone(k.tone).text}`}>{k.value}</p>
                  {k.note && <p className="text-[11px] text-slate-500">{k.note}</p>}
                </div>
              ))}
            </div>
          )}
          {mock.timeline && <Timeline t={mock.timeline} />}
          {mock.chart && <Chart c={mock.chart} />}
          {mock.graph && <Graph g={mock.graph} />}
          {mock.table && (
            <div className="overflow-x-auto">
              <p className="mock-h">{mock.table.title}</p>
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr>
                    {mock.table.columns.map((c, i) => (
                      <th key={i} className="border-b border-[#edf0f4] bg-[#fafbfc] px-2 py-1.5 text-left font-semibold text-slate-500">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mock.table.rows.map((r, i) => (
                    <tr key={i}>
                      {r.cells.map((c, j) => (
                        <td key={j} className={`border-b border-[#edf0f4] px-2 py-1.5 ${j === r.cells.length - 1 ? tone(r.tone).text : "text-slate-700"} ${r.tone !== "neutral" && j === r.cells.length - 1 ? "font-semibold" : ""}`}>
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {mock.code && (
            <div>
              <p className="mock-h">{mock.code.title}</p>
              <pre className="overflow-x-auto rounded-lg bg-[#f6f8fa] p-3 font-mono text-[11px] leading-relaxed text-slate-800">
                {mock.code.lines.join("\n")}
              </pre>
            </div>
          )}
          {mock.callout && (
            <p className={`rounded-xl px-3 py-2 text-[12px] ring-1 ${tone(mock.callout.tone).soft}`}>{mock.callout.text}</p>
          )}
        </div>
      </div>
    </figure>
  );
}
