import { Suspense } from "react";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { currentUser } from "@/lib/supabase-server";
import PackView from "@/components/PackView";
import type { PrepResult } from "@/lib/types";

async function PackLoader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = supabaseAdmin();
  if (!db) notFound();

  const { data: session } = await db
    .from("prep_sessions")
    .select("id, stage, interview_type, role_title, company, user_id")
    .eq("id", id)
    .single();
  if (!session) notFound();

  if (session.user_id) {
    const user = await currentUser().catch(() => null);
    if (!user || user.id !== session.user_id) notFound();
  }

  const { data: packRow } = await db
    .from("prep_packs")
    .select("analysis, pack")
    .eq("session_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  if (!packRow) notFound();

  const result: PrepResult = {
    id: session.id,
    stage: session.stage,
    interviewType: session.interview_type,
    analysis: packRow.analysis,
    pack: packRow.pack,
  };

  return <PackView result={result} />;
}

export default function PrepPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-20 sm:px-6">
      <header className="flex items-center justify-end pb-6 pt-8">
        <a href="/dashboard" className="text-sm font-medium text-emerald-700 underline">
          Back to your dashboard
        </a>
      </header>
      <Suspense
        fallback={
          <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
            Loading your prep pack...
          </p>
        }
      >
        <PackLoader params={params} />
      </Suspense>
    </main>
  );
}
