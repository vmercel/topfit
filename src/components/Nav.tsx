import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { currentUser } from "@/lib/supabase-server";
import SignOutButton from "./SignOutButton";
import Logo from "./Logo";

const linkClass =
  "inline-flex items-center gap-1.5 px-2 py-2 text-sm font-medium text-ink-soft transition hover:text-forest-800";

const SITE_LINKS = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
];

async function NavInner() {
  const user = await currentUser();
  return (
    <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
      <Logo />
      <nav className="flex items-center gap-1.5 sm:gap-3">
        <span className="hidden items-center gap-1 md:flex">
          {SITE_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={linkClass}>
              {l.label}
            </Link>
          ))}
        </span>
        {user ? (
          <>
            <span className="mx-1 hidden h-5 w-px bg-line md:block" aria-hidden="true" />
            <span className="hidden max-w-52 truncate text-sm text-slate-500 lg:inline">
              {user.email}
            </span>
            <Link
              href="/app"
              className="inline-flex items-center gap-1.5 rounded-full bg-forest-900 px-4 py-2 text-sm font-semibold text-white shadow-pop transition hover:bg-forest-800"
            >
              Open app
              <ArrowRight className="h-4 w-4" />
            </Link>
            <SignOutButton />
          </>
        ) : (
          <>
            <Link href="/login" className={linkClass}>
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 rounded-full bg-forest-900 px-4 py-2 text-sm font-semibold text-white shadow-pop transition hover:bg-forest-800"
            >
              Create account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        )}
      </nav>
    </div>
  );
}

export default function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/85 backdrop-blur-md">
      <Suspense fallback={<div className="h-16" />}>
        <NavInner />
      </Suspense>
    </header>
  );
}
