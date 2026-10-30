"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  FileCheck2,
  LayoutDashboard,
  Loader2,
  Lock,
  Mail,
  MessagesSquare,
  Phone,
  User,
} from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import Logo, { LogoMark } from "./Logo";

const PANEL_POINTS = [
  {
    icon: FileCheck2,
    title: "Framework scenarios",
    text: "A client scenario, screen and trade-offs for every framework in the job."
  },
  {
    icon: MessagesSquare,
    title: "Technical answers",
    text: "The questions they will ask, with brief answers from your own experience.",
  },
  {
    icon: LayoutDashboard,
    title: "Your history, kept",
    text: "Every pack is saved to your dashboard, ready when you come back.",
  },
];

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function routeAfterAuth() {
    // Users without a saved primary resume go through onboarding first.
    let hasResume = false;
    try {
      const res = await fetch("/api/resumes");
      if (res.ok) {
        const data = (await res.json()) as { resumes?: { isPrimary?: boolean }[] };
        hasResume = (data.resumes ?? []).some((r) => r.isPrimary);
      }
    } catch {
      hasResume = false;
    }
    router.push(hasResume ? "/app" : "/onboarding");
    router.refresh();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const supabase = supabaseBrowser();
    if (mode === "signup") {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName.trim(), phone: phone.trim() } },
      });
      if (authError) {
        setBusy(false);
        setError(authError.message);
        return;
      }
      // Save the profile row before routing on. Non-fatal: onboarding and the
      // app still work if this write fails.
      try {
        await fetch("/api/profile", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ fullName: fullName.trim(), phone: phone.trim() }),
        });
      } catch {
        // Profile can be completed later; do not block account entry.
      }
    } else {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setBusy(false);
        setError(authError.message);
        return;
      }
    }
    setBusy(false);
    await routeAfterAuth();
  }

  const inputClass =
    "w-full rounded-xl border border-line-strong bg-white py-3 pl-11 pr-3.5 text-sm text-ink placeholder:text-slate-400 transition focus:border-forest-500 focus:outline-none focus:ring-4 focus:ring-forest-500/10";

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:py-12">
      <div className="grid w-full overflow-hidden rounded-[28px] border border-line bg-white shadow-card lg:grid-cols-2">
        <aside className="relative border-b border-line bg-forest-50 p-8 sm:p-10 lg:border-b-0 lg:border-r lg:p-12">
          <div className="hidden lg:block">
            <Logo />
          </div>
          <div className="flex items-center gap-3 lg:hidden">
            <LogoMark size={34} />
            <p className="text-lg font-bold tracking-tight text-ink">
              Top<span className="text-forest-700">Fit</span>
            </p>
          </div>
          <h2 className="mt-6 hidden max-w-sm text-[28px] font-bold leading-tight tracking-tight text-ink lg:block">
            Walk in ready. Answer like the top 3 percent.
          </h2>
          <div className="mt-8 hidden space-y-6 lg:block">
            {PANEL_POINTS.map((p) => (
              <div key={p.title} className="flex items-start gap-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-forest-700 shadow-pop ring-1 ring-forest-100">
                  <p.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-ink">{p.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-ink-soft">{p.text}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-10 hidden text-xs leading-relaxed text-slate-500 lg:block">
            Answers are built only from what your resume actually says. Nothing is invented.
          </p>
        </aside>

        <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-12">
          <div className="mx-auto w-full max-w-sm">
            <h1 className="text-[28px] font-bold tracking-tight text-ink">
              {mode === "signup" ? "Create your account" : "Welcome back"}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {mode === "signup"
                ? "Your prep packs and interview history live in your dashboard."
                : "Sign in to see your prep packs and interview history."}
            </p>

            <form onSubmit={submit} className="mt-8 space-y-4">
              {mode === "signup" && (
                <>
                  <div>
                    <label className="text-sm font-semibold text-ink" htmlFor="auth-name">
                      Full name
                    </label>
                    <div className="relative mt-1.5">
                      <User className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                      <input
                        id="auth-name"
                        type="text"
                        required
                        autoComplete="name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className={inputClass}
                        placeholder="Your full name"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-ink" htmlFor="auth-phone">
                      Phone
                    </label>
                    <div className="relative mt-1.5">
                      <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                      <input
                        id="auth-phone"
                        type="tel"
                        required
                        autoComplete="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={inputClass}
                        placeholder="+1 555 000 1234"
                      />
                    </div>
                  </div>
                </>
              )}
              <div>
                <label className="text-sm font-semibold text-ink" htmlFor="auth-email">
                  Email
                </label>
                <div className="relative mt-1.5">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="auth-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-ink" htmlFor="auth-password">
                  Password
                </label>
                <div className="relative mt-1.5">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="auth-password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                    placeholder="At least 6 characters"
                  />
                </div>
              </div>
              {error && (
                <p className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={busy}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-forest-900 py-3.5 text-sm font-semibold text-white shadow-pop transition hover:bg-forest-800 disabled:opacity-70"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Please wait...
                  </>
                ) : (
                  <>
                    {mode === "signup" ? "Create account" : "Sign in"}
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 border-t border-line pt-5 text-center text-sm text-ink-soft">
              {mode === "signup" ? (
                <>
                  Already have an account?{" "}
                  <Link href="/login" className="font-semibold text-forest-700 transition hover:text-forest-900">
                    Sign in
                  </Link>
                </>
              ) : (
                <>
                  New to TopFit?{" "}
                  <Link href="/signup" className="font-semibold text-forest-700 transition hover:text-forest-900">
                    Create an account
                  </Link>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
