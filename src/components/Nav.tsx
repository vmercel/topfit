import { Suspense } from "react";
import Link from "next/link";
import { currentUser } from "@/lib/supabase-server";
import SignOutButton from "./SignOutButton";

async function NavInner() {
  const user = await currentUser();
  return (
    <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
      <Link
        href="/"
        className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700"
      >
        TopFit
      </Link>
      <nav className="flex items-center gap-5">
        <Link href="/" className="text-sm font-medium text-slate-600 hover:text-slate-900">
          New prep
        </Link>
        {user ? (
          <>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Dashboard
            </Link>
            <span className="hidden text-sm text-slate-400 sm:inline">{user.email}</span>
            <SignOutButton />
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Create account
            </Link>
          </>
        )}
      </nav>
    </div>
  );
}

export default function Nav() {
  return (
    <header className="border-b border-slate-200 bg-white/80">
      <Suspense fallback={<div className="h-14" />}>
        <NavInner />
      </Suspense>
    </header>
  );
}
