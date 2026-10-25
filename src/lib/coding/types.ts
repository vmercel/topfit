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
};
export type RunResult = {
  passed: boolean;
  expected: unknown;
  actual?: unknown;
  error?: string;
  label: string;
};
