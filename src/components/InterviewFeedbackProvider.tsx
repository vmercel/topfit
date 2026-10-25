"use client";
import { createContext, useContext, useState } from "react";
import type { InterviewReport } from "@/lib/interview/contracts";
type Result = {
  report: InterviewReport;
  role: string;
  reason: "time" | "manual" | "completed";
  elapsed: number;
};
const FeedbackContext = createContext<{
  round: number;
  restart: () => void;
  result: Result | null;
  setResult: (value: Result | null) => void;
} | null>(null);
export function InterviewFeedbackProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [round, setRound] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  return (
    <FeedbackContext
      value={{
        result,
        setResult,
        round,
        restart: () => {
          setResult(null);
          setRound((n) => n + 1);
        },
      }}
    >
      {children}
    </FeedbackContext>
  );
}
export function useInterviewFeedback() {
  const value = useContext(FeedbackContext);
  if (!value) throw new Error("Interview feedback provider missing.");
  return value;
}
