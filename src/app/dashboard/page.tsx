import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Calendar,
  Gauge,
  Inbox,
  LayoutDashboard,
  Loader2,
  Plus,
} from "lucide-react";
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
  const initial = (user.email || "?").trim().charAt(0).toUpperCase();

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-forest-700">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </p>
          <h1 className="mt-2.5 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Your interview prep history
          </h1>
          <p className="mt-2.5 flex items-center gap-2 text-sm text-ink-soft">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-forest-900 text-[11px] font-bold text-white">
              {initial}
            </span>
            {user.email}
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-forest-900 px-5 py-3 text-sm font-semibold text-white shadow-pop transition hover:bg-forest-800"
        >
          <Plus className="h-4 w-4" />
          New prep pack
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="mt-9 rounded-[28px] border-2 border-dashed border-line-strong bg-white px-8 py-14 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-forest-50 text-forest-600 ring-1 ring-forest-100">
            <Inbox className="h-7 w-7" />
          </span>
          <p className="mt-5 text-lg font-semibold text-ink">No prep packs yet.</p>
          <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-slate-500">
            Build your first pack from a resume and a job description. It will be saved here so you
            can come back to it any time.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-forest-900 px-5 py-3 text-sm font-semibold text-white shadow-pop transition hover:bg-forest-800"
          >
            <Plus className="h-4 w-4" />
            Build a prep pack
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-3.5">
          {rows.map((r) => {
            const pct =
              r.covered !== null && r.total ? Math.round((r.covered / r.total) * 100) : null;
            return (
              <div
                key={r.id}
                className="group flex flex-wrap items-center gap-4 rounded-3xl border border-line bg-white p-5 shadow-card transition-all duration-200 hover:border-forest-200 hover:shadow-lift sm:px-6"
              >
                <div className="min-w-56 flex-1">
                  <p className="text-base font-bold tracking-tight text-ink">
                    {r.role}
                    {r.company ? <span className="font-semibold text-slate-400"> at {r.company}</span> : null}
                  </p>
                  <p className="mt-1 line-clamp-1 text-sm text-slate-500">{r.headline}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-forest-50 px-2.5 py-1 text-[11px] font-semibold text-forest-800 ring-1 ring-forest-100">
                      {stageLabel(r.stage)}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-paper px-2.5 py-1 text-[11px] font-medium text-slate-500 ring-1 ring-line">
                      <Calendar className="h-3 w-3" />
                      {r.date}
                    </span>
                    {r.covered !== null && r.total !== null && (
                      <span className="inline-flex items-center gap-2 rounded-full bg-forest-50 py-1 pl-2.5 pr-3 text-[11px] font-semibold text-forest-800 ring-1 ring-forest-100">
                        <Gauge className="h-3 w-3" />
                        Coverage {r.covered}/{r.total}
                        {pct !== null && (
                          <span className="h-1.5 w-12 overflow-hidden rounded-full bg-forest-100">
                            <span className="block h-full rounded-full bg-forest-600" style={{ width: `${pct}%` }} />
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/prep/${r.id}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-forest-950 px-4.5 py-2.5 text-sm font-semibold text-white transition hover:bg-forest-800"
                  >
                    Open pack
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                  <DeletePackButton id={r.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-10 sm:px-6">
      <Suspense
        fallback={
          <p className="inline-flex items-center gap-2 rounded-2xl border border-line bg-white px-5 py-4 text-sm text-slate-500 shadow-card">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading your dashboard...
          </p>
        }
      >
        <DashboardLoader />
      </Suspense>
    </main>
  );
}
