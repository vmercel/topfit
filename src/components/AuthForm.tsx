"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const supabase = supabaseBrowser();
    const { error: authError } =
      mode === "signup"
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 pb-20 pt-14">
      <p className="text-center text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
        TopFit
      </p>
      <h1 className="mt-2 text-center text-3xl font-bold text-slate-900">
        {mode === "signup" ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-2 text-center text-sm text-slate-600">
        {mode === "signup"
          ? "Your prep packs and interview history live in your dashboard."
          : "Sign in to see your prep packs and interview history."}
      </p>

      <form
        onSubmit={submit}
        className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label className="text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 focus:border-emerald-600 focus:outline-none"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 focus:border-emerald-600 focus:outline-none"
            placeholder="At least 6 characters"
          />
        </div>
        {error && (
          <p className="rounded-lg bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-800">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-emerald-700 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-70"
        >
          {busy ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-600">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-emerald-700 underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New to TopFit?{" "}
            <Link href="/signup" className="font-medium text-emerald-700 underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </main>
  );
}
