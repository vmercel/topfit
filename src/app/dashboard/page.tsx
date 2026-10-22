import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";
import { STAGES } from "@/lib/types";
import DeletePackButton from "@/components/DeletePackButton";

interface Row {
  id: string;
  role: string;
  company: string;
  stage: string;
  interviewType: string;
  date: string;
  covered: number | null;
  total: number | null;
  headline: string;
}

async function DashboardLoader() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const db = supabaseAdmin();
  let rows: Row[] = [];
  if (db) {
    const { data: sessions } = await db
      .from("prep_sessions")
      .select("id, role_title, company, stage, interview_type, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(60);
    if (sessions && sessions.length > 0) {
      const ids = sessions.map((s) => s.id);
      const { data: packs } = await db
        .from("prep_packs")
        .select("session_id, pack, created_at")
        .in("session_id", ids)
        .order("created_at", { ascending: false });
      const latest = new Map<string, { covered: number; total: number; headline: string }>();
      (packs || []).forEach((p) => {
        if (!latest.has(p.session_id)) {
          latest.set(p.session_id, {
            covered: p.pack?.coveredCount ?? null,
            total: p.pack?.totalMustHaves ?? null,
            headline: p.pack?.headline ?? "",
          });
        }
      });
      rows = sessions.map((s) => {
        const p = latest.get(s.id);
        return {
          id: s.id,
          role: s.role_title || "Untitled role",
          company: s.company || "",
          stage: s.stage,
          interviewType: s.interview_type,
          date: new Date(s.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          covered: p?.covered ?? null,
          total: p?.total ?? null,
          headline: p?.headline ?? "",
        };
      });
    }
  }

  const stageLabel = (id: string) => STAGES.find((s) => s.id === id)?.label || id;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Your interview prep history</h1>
          <p className="mt-1 text-sm text-slate-600">{user.email}</p>
        </div>
        <Link
          href="/"
          className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          New prep pack
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-[15px] font-medium text-slate-800">No prep packs yet.</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            Build your first pack from a resume and a job description. It will be saved here so you
            can come back to it any time.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Build a prep pack
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-3">
          {rows.map((r) => (
            <div
              key={r.id}
              className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="min-w-56 flex-1">
                <p className="text-base font-semibold text-slate-900">
                  {r.role}
                  {r.company ? <span className="text-slate-500"> at {r.company}</span> : null}
                </p>
                <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">{r.headline}</p>
                <p className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] font-medium">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                    {stageLabel(r.stage)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                    {r.date}
                  </span>
                  {r.covered !== null && r.total !== null && (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-800 ring-1 ring-emerald-100">
                      Coverage {r.covered}/{r.total}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/prep/${r.id}`}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                >
                  Open pack
                </Link>
                <DeletePackButton id={r.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-20 pt-10 sm:px-6">
      <Suspense
        fallback={<p className="text-sm text-slate-500">Loading your dashboard...</p>}
      >
        <DashboardLoader />
      </Suspense>
    </main>
  );
}
