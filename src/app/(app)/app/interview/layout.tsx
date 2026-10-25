import { InterviewFeedbackProvider } from "@/components/InterviewFeedbackProvider";
export default function InterviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <InterviewFeedbackProvider>{children}</InterviewFeedbackProvider>;
}
