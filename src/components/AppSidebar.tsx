import Link from "next/link";
import { LogoMark } from "./Logo";
import SignOutButton from "./SignOutButton";
import { AppNavItems, SiteNavItems } from "./AppNav";

export default function AppSidebar({ email, name }: { email: string; name?: string }) {
  return (
    <aside className="border-b border-line bg-cream lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-72 lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-6 lg:px-6 lg:pt-6">
        <Link href="/app" className="inline-flex items-center gap-2.5" aria-label="TopFit app home">
          <LogoMark size={34} />
          <span className="text-[19px] font-bold tracking-tight text-ink">
            Top<span className="text-forest-700">Fit</span>
          </span>
        </Link>
        <div className="lg:hidden">
          <SignOutButton />
        </div>
      </div>

      <nav className="flex gap-1.5 overflow-x-auto px-4 py-3.5 sm:px-6 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-4 lg:py-6">
        <AppNavItems />
        <span className="mx-2 hidden h-px bg-line lg:my-3 lg:block" aria-hidden="true" />
        <span className="hidden px-3.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 lg:block">
          Product
        </span>
        <SiteNavItems />
      </nav>

      <div className="mt-auto hidden border-t border-line p-4 lg:block lg:px-5 lg:py-5">
        {name ? (
          <>
            <p className="truncate px-1 text-sm font-semibold text-ink" title={name}>
              {name}
            </p>
            <p className="truncate px-1 text-[13px] text-slate-500" title={email}>
              {email}
            </p>
          </>
        ) : (
          <p className="truncate px-1 text-sm font-medium text-ink-soft" title={email}>
            {email}
          </p>
        )}
        <div className="mt-3">
          <SignOutButton />
        </div>
      </div>
    </aside>
  );
}
