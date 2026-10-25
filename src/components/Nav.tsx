import { Suspense } from "react";
import Link from "next/link";
import { currentUser } from "@/lib/supabase-server";
import Logo from "./Logo";
import NavAuthCluster from "./NavAuthCluster";

const linkClass =
  "inline-flex items-center gap-1.5 px-2 py-2 text-sm font-medium text-ink-soft transition hover:text-forest-800";

const SITE_LINKS = [
  { href: "/app/interview", label: "Interview practice" },
  { href: "/practice", label: "Coding practice" },
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
        <span className="mx-1 hidden h-5 w-px bg-line md:block" aria-hidden="true" />
        <NavAuthCluster signedIn={!!user} />
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
