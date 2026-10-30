export type CodingTest = { input: unknown[]; expected: unknown };
export type SQLTest = {
  label: string;
  setup: string;
  expected: { columns: string[]; values: unknown[][] };
};
export type Lesson = {
  id: string;
  title: string;
  track: "python" | "sql";
  pattern: string;
  difficulty: string;
  args: string;
  prompt: string;
  idea: string;
  steps: string[];
  complexity: string;
  solution: string;
  tests: (CodingTest | SQLTest)[];
  verifyQuery?: string | null;
  mustReject?: string[];
  trace?: TraceFrame[];
};
type Cell = string | number | boolean | null;
export type TracePanel =
  | { type: "array"; values: Cell[]; hl: number[]; label: string; ptr?: Record<string, number>; win?: number[]; done?: number[]; labels?: string[] }
  | { type: "grid"; cells: Cell[][]; hl: number[][]; marks: number[][]; label: string; rows?: string[]; cols?: string[] }
  | { type: "tree"; values: (number | string | null)[]; hl: number[]; done: number[]; label: string }
  | { type: "graph"; n: number; edges: number[][]; directed: boolean; hl: number[]; visited: number[]; label: string; hledges: number[][]; labels?: string[] }
  | { type: "intervals"; items: number[][]; hl: number[]; label: string; result?: number[][] }
  | { type: "list"; values: Cell[]; hl: number[]; label: string; ptr?: Record<string, number>; cycle?: number }
  | { type: "kv"; entries: string[][]; label: string; hl: string[] }
  | { type: "stack"; items: string[]; label: string; hl: number[] }
  | { type: "bits"; bits: string; hl: number[]; label: string };
export type TraceFrame = { note: string; panels: TracePanel[]; vars: Record<string, string> };
export type RunResult = {
  passed: boolean;
  expected: unknown;
  actual?: unknown;
  error?: string;
  label: string;
};
