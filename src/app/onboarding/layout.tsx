import { Suspense } from "react";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/supabase-server";
import Logo from "@/components/Logo";
import SignOutButton from "@/components/SignOutButton";

// Minimal shell for onboarding: logo and sign out only. The whole route
// requires a session.
async function OnboardingShell({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line/80 bg-paper/85">
        <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <SignOutButton />
        </div>
      </header>
      <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">{children}</div>
    </div>
  );
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-paper" />}>
      <OnboardingShell>{children}</OnboardingShell>
    </Suspense>
  );
}
