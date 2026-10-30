"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import type { TraceFrame, TracePanel } from "@/lib/coding/types";

const C = {
  ink: "#31503b",
  faint: "#8aa37f",
  line: "#bacdb0",
  paper: "#fbfff6",
  hot: "#24523d",
  hotText: "#e0efce",
  done: "#dfead3",
  accent: "#be8957",
};

const show = (v: unknown) =>
  v === null || v === undefined ? "∅" : typeof v === "string" ? v : JSON.stringify(v);
const short = (s: string, n = 6) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

function ArrayPanel({ p }: { p: Extract<TracePanel, { type: "array" }> }) {
  const ptrs = Object.entries(p.ptr ?? {});
  const many = p.values.length > 12;
  return (
    <div className="trace-array" style={{ ["--cells" as string]: p.values.length }}>
      {p.values.map((v, i) => {
        const hot = p.hl.includes(i);
        const inWin = p.win && i >= p.win[0] && i <= p.win[1];
        const done = p.done?.includes(i);
        const marks = ptrs.filter(([, at]) => at === i).map(([k]) => k);
        return (
          <div key={i} className={`trace-cell ${hot ? "hot" : ""} ${inWin ? "win" : ""} ${done ? "done" : ""}`}>
            <span className="trace-val">{short(show(v), many ? 4 : 6)}</span>
            <span className="trace-idx">{p.labels?.[i] ?? i}</span>
            {marks.length > 0 && <span className="trace-ptr">{marks.join(" · ")}</span>}
          </div>
        );
      })}
      {p.values.length === 0 && <span className="trace-empty">empty</span>}
    </div>
  );
}

function GridPanel({ p }: { p: Extract<TracePanel, { type: "grid" }> }) {
  const key = (r: number, c: number) => `${r},${c}`;
  const hl = new Set(p.hl.map(([r, c]) => key(r, c)));
  const marks = new Set(p.marks.map(([r, c]) => key(r, c)));
  return (
    <table className="trace-grid">
      {p.cols && (
        <thead>
          <tr>
            {p.rows && <th />}
            {p.cols.map((c, i) => (
              <th key={i}>{c}</th>
            ))}
          </tr>
        </thead>
      )}
      <tbody>
        {p.cells.map((row, r) => (
          <tr key={r}>
            {p.rows && <th>{p.rows[r]}</th>}
            {row.map((v, c) => (
              <td key={c} className={hl.has(key(r, c)) ? "hot" : marks.has(key(r, c)) ? "done" : ""}>
                {short(show(v), 5)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function treeLayout(values: (number | string | null)[]) {
  const nodes: { i: number; x: number; y: number; depth: number }[] = [];
  const edges: [number, number][] = [];
  if (!values.length || values[0] === null) return { nodes, edges, depth: 0 };
  const queue = [{ i: 0, lo: 0, hi: 1, depth: 0 }];
  let next = 1;
  let maxDepth = 0;
  while (queue.length) {
    const cur = queue.shift()!;
    nodes.push({ i: cur.i, x: (cur.lo + cur.hi) / 2, y: cur.depth, depth: cur.depth });
    maxDepth = Math.max(maxDepth, cur.depth);
    const mid = (cur.lo + cur.hi) / 2;
    for (const [lo, hi] of [
      [cur.lo, mid],
      [mid, cur.hi],
    ]) {
      if (next >= values.length) break;
      const idx = next++;
      if (values[idx] !== null && values[idx] !== undefined) {
        edges.push([cur.i, idx]);
        queue.push({ i: idx, lo, hi, depth: cur.depth + 1 });
      }
    }
  }
  return { nodes, edges, depth: maxDepth };
}

function TreePanel({ p }: { p: Extract<TracePanel, { type: "tree" }> }) {
  const { nodes, edges, depth } = treeLayout(p.values);
  const W = 320;
  const H = 34 + depth * 52 + 24;
  const pos = new Map(nodes.map((n) => [n.i, { x: 14 + n.x * (W - 28), y: 22 + n.y * 52 }]));
  if (!nodes.length) return <span className="trace-empty">empty tree</span>;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="trace-svg" role="img" aria-label="tree">
      {edges.map(([a, b]) => {
        const pa = pos.get(a)!,
          pb = pos.get(b)!;
        return <line key={`${a}-${b}`} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke={C.line} strokeWidth="1.5" />;
      })}
      {nodes.map((n) => {
        const pt = pos.get(n.i)!;
        const hot = p.hl.includes(n.i);
        const done = p.done.includes(n.i);
        return (
          <g key={n.i}>
            <circle cx={pt.x} cy={pt.y} r="15" fill={hot ? C.hot : done ? C.done : C.paper} stroke={hot ? C.hot : C.line} />
            <text x={pt.x} y={pt.y + 4} textAnchor="middle" fontSize="10" fontFamily="monospace" fill={hot ? C.hotText : C.ink}>
              {short(show(p.values[n.i]), 4)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function GraphPanel({ p }: { p: Extract<TracePanel, { type: "graph" }> }) {
  const n = Math.max(p.n, 1);
  const W = 320,
    H = 190;
  const pts = Array.from({ length: n }, (_, i) => ({
    x: W / 2 + 115 * Math.cos((2 * Math.PI * i) / n - Math.PI / 2),
    y: H / 2 + 72 * Math.sin((2 * Math.PI * i) / n - Math.PI / 2),
  }));
  const isHot = (a: number, b: number) =>
    p.hledges.some(([x, y]) => (x === a && y === b) || (!p.directed && x === b && y === a));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="trace-svg" role="img" aria-label="graph">
      <defs>
        <marker id="trace-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8z" fill={C.faint} />
        </marker>
      </defs>
      {p.edges.map(([a, b], i) => {
        const A = pts[a],
          B = pts[b];
        if (!A || !B) return null;
        const dx = B.x - A.x,
          dy = B.y - A.y,
          len = Math.hypot(dx, dy) || 1;
        const hot = isHot(a, b);
        return (
          <line
            key={i}
            x1={A.x + (dx / len) * 16}
            y1={A.y + (dy / len) * 16}
            x2={B.x - (dx / len) * 18}
            y2={B.y - (dy / len) * 18}
            stroke={hot ? C.accent : C.line}
            strokeWidth={hot ? 2.5 : 1.5}
            markerEnd={p.directed ? "url(#trace-arrow)" : undefined}
          />
        );
      })}
      {pts.map((pt, i) => {
        const hot = p.hl.includes(i);
        const done = p.visited.includes(i);
        return (
          <g key={i}>
            <circle cx={pt.x} cy={pt.y} r="15" fill={hot ? C.hot : done ? C.done : C.paper} stroke={hot ? C.hot : C.line} />
            <text x={pt.x} y={pt.y + 4} textAnchor="middle" fontSize="11" fontFamily="monospace" fill={hot ? C.hotText : C.ink}>
              {p.labels?.[i] ?? i}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function IntervalsPanel({ p }: { p: Extract<TracePanel, { type: "intervals" }> }) {
  const all = [...p.items, ...(p.result ?? [])].flat();
  const lo = Math.min(0, ...all),
    hi = Math.max(1, ...all);
  const W = 320;
  const x = (v: number) => 14 + ((v - lo) / (hi - lo)) * (W - 28);
  const rows = p.items.length + (p.result ? p.result.length + 1 : 0);
  const H = 24 + rows * 22;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="trace-svg" role="img" aria-label="intervals timeline">
      {p.items.map(([a, b], i) => (
        <g key={i}>
          <rect x={x(a)} y={8 + i * 22} width={Math.max(4, x(b) - x(a))} height="16" rx="4" fill={p.hl.includes(i) ? C.hot : "#c3d8b4"} />
          <text x={x(a) + 4} y={20 + i * 22} fontSize="9" fill={p.hl.includes(i) ? C.hotText : C.ink}>
            [{a},{b}]
          </text>
        </g>
      ))}
      {p.result && (
        <>
          <text x="14" y={20 + p.items.length * 22} fontSize="9" fill={C.faint}>
            result
          </text>
          {p.result.map(([a, b], i) => (
            <g key={`r${i}`}>
              <rect x={x(a)} y={8 + (p.items.length + 1 + i) * 22} width={Math.max(4, x(b) - x(a))} height="16" rx="4" fill={C.accent} />
              <text x={x(a) + 4} y={20 + (p.items.length + 1 + i) * 22} fontSize="9" fill="#fff">
                [{a},{b}]
              </text>
            </g>
          ))}
        </>
      )}
    </svg>
  );
}

function ListPanel({ p }: { p: Extract<TracePanel, { type: "list" }> }) {
  const ptrs = Object.entries(p.ptr ?? {});
  return (
    <div className="trace-list">
      {p.values.length === 0 && <span className="trace-empty">None</span>}
      {p.values.map((v, i) => {
        const marks = ptrs.filter(([, at]) => at === i).map(([k]) => k);
        return (
          <div key={i} className="trace-node-wrap">
            <div className={`trace-node ${p.hl.includes(i) ? "hot" : ""} ${p.cycle === i ? "cycle" : ""}`}>
              {short(show(v), 6)}
              {marks.length > 0 && <span className="trace-ptr">{marks.join(" · ")}</span>}
            </div>
            <span className="trace-arrowtxt">{i === p.values.length - 1 ? (p.cycle !== undefined ? `↩ ${show(p.values[p.cycle])}` : "∅") : "→"}</span>
          </div>
        );
      })}
    </div>
  );
}

function PanelView({ p }: { p: TracePanel }) {
  let body: React.ReactNode = null;
  switch (p.type) {
    case "array":
      body = <ArrayPanel p={p} />;
      break;
    case "grid":
      body = <GridPanel p={p} />;
      break;
    case "tree":
      body = <TreePanel p={p} />;
      break;
    case "graph":
      body = <GraphPanel p={p} />;
      break;
    case "intervals":
      body = <IntervalsPanel p={p} />;
      break;
    case "list":
      body = <ListPanel p={p} />;
      break;
    case "kv":
      body = (
        <div className="trace-kv">
          {p.entries.length === 0 && <span className="trace-empty">empty</span>}
          {p.entries.map(([k, v]) => (
            <span key={k} className={p.hl.includes(k) ? "hot" : ""}>
              <b>{k}</b> → {v}
            </span>
          ))}
        </div>
      );
      break;
    case "stack":
      body = (
        <div className="trace-kv">
          {p.items.length === 0 && <span className="trace-empty">empty</span>}
          {p.items.map((v, i) => (
            <span key={i} className={p.hl.includes(i) ? "hot" : ""}>
              {v}
            </span>
          ))}
        </div>
      );
      break;
    case "bits":
      body = (
        <div className="trace-bits">
          {[...p.bits].map((b, i) => (
            <span key={i} className={`${b === "1" ? "one" : ""} ${p.hl.includes(i) ? "hot" : ""}`}>
              {b}
            </span>
          ))}
        </div>
      );
      break;
  }
  return (
    <div className="trace-panel">
      {p.label && <p className="trace-label">{p.label}</p>}
      {body}
    </div>
  );
}

export default function TraceDiagram({ frames, result }: { frames: TraceFrame[]; result: unknown }) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const frame = frames[Math.min(i, frames.length - 1)];

  const active = playing && i < frames.length - 1;

  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setI((x) => x + 1), 1800);
    return () => clearTimeout(t);
  }, [active, i]);

  return (
    <figure className="solution-diagram trace-diagram">
      <div className="diagram-label">
        <span>THE ALGORITHM, STEP BY STEP</span>
        <span>
          STEP {i + 1} / {frames.length}
        </span>
      </div>
      <div className="trace-stage" aria-live="polite">
        {frame.panels.map((p, k) => (
          <PanelView key={k} p={p} />
        ))}
        {Object.keys(frame.vars).length > 0 && (
          <div className="trace-vars">
            {Object.entries(frame.vars).map(([k, v]) => (
              <span key={k}>
                {k} = <b>{v}</b>
              </span>
            ))}
          </div>
        )}
      </div>
      <figcaption>{frame.note}</figcaption>
      <div className="trace-controls">
        <button onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0} aria-label="Previous step">
          <ArrowLeft size={15} />
        </button>
        <button
          onClick={() => {
            if (i >= frames.length - 1) {
              setI(0);
              setPlaying(true);
            } else setPlaying(!active);
          }}
          className="trace-play"
          aria-label={active ? "Pause" : "Play"}
        >
          {active ? <Pause size={14} /> : <Play size={14} />}
          {active ? "Pause" : i >= frames.length - 1 ? "Replay" : "Play"}
        </button>
        <div className="trace-dots">
          {frames.map((_, k) => (
            <button key={k} className={k === i ? "current" : k < i ? "visited" : ""} onClick={() => setI(k)} aria-label={`Step ${k + 1}`} />
          ))}
        </div>
        <button onClick={() => setI((x) => Math.min(frames.length - 1, x + 1))} disabled={i === frames.length - 1} aria-label="Next step">
          <ArrowRight size={15} />
        </button>
      </div>
      <div className="diagram-answer">
        <span>EXAMPLE RESULT</span>
        <code>{show(result)}</code>
      </div>
    </figure>
  );
}
