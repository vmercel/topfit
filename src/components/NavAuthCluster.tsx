"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";

const linkClass =
  "inline-flex items-center gap-1.5 px-2 py-2 text-sm font-medium text-ink-soft transition hover:text-forest-800";

// Context-aware auth cluster for the marketing nav:
// signed in shows Open app only; signed out shows Sign in and Create
// account, except Sign in hides on /login and Create account hides on
// /signup.
export default function NavAuthCluster({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();

  if (signedIn) {
    return (
      <Link
        href="/app"
        className="inline-flex items-center gap-1.5 rounded-full bg-forest-900 px-4 py-2 text-sm font-semibold text-white shadow-pop transition hover:bg-forest-800"
      >
        Open app
        <ArrowRight className="h-4 w-4" />
      </Link>
    );
  }

  return (
    <>
      {pathname !== "/login" && (
        <Link href="/login" className={linkClass}>
          Sign in
        </Link>
      )}
      {pathname !== "/signup" && (
        <Link
          href="/signup"
          className="inline-flex items-center gap-1.5 rounded-full bg-forest-900 px-4 py-2 text-sm font-semibold text-white shadow-pop transition hover:bg-forest-800"
        >
          Create account
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </>
  );
}
