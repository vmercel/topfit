import { Suspense } from "react";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/supabase-server";
import AppSidebar from "@/components/AppSidebar";

async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <AppSidebar
        email={user.email ?? ""}
        name={typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : ""}
      />
      <div className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-paper" />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
