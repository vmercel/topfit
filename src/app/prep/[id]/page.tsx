import { Suspense } from "react";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import PackView from "@/components/PackView";
import type { PrepResult } from "@/lib/types";

async function PackLoader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = supabaseAdmin();
  if (!db) notFound();

  const { data: session } = await db
    .from("prep_sessions")
    .select("id, stage, interview_type, role_title, company")
    .eq("id", id)
    .single();
  if (!session) notFound();

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
      <header className="flex items-center justify-between pb-6 pt-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">TopFit</p>
        <a href="/" className="text-sm font-medium text-emerald-700 underline">
          Build a new prep pack
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
