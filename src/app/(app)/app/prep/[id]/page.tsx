import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
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
    <div>
      <header className="flex items-center justify-start pb-6">
        <Link
          href="/app/dashboard"
          className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-white px-4 py-2 text-sm font-semibold text-ink-soft shadow-pop transition hover:border-forest-300 hover:text-forest-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to your dashboard
        </Link>
      </header>
      <Suspense
        fallback={
          <p className="inline-flex items-center gap-2 rounded-2xl border border-line bg-white px-5 py-4 text-sm text-slate-500 shadow-card">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading your prep pack...
          </p>
        }
      >
        <PackLoader params={params} />
      </Suspense>
    </div>
  );
}
