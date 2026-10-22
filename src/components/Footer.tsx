import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-cream">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-md">
            <Logo size={30} wordmarkClassName="text-[17px]" />
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">
              Answers are built only from what your resume actually says. Where the job asks for
              something your resume does not show, TopFit gives you an honest bridge, never an
              invented claim.
            </p>
          </div>
          <nav className="flex gap-14 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Product
              </p>
              <ul className="mt-3 space-y-2.5">
                <li>
                  <Link href="/" className="font-medium text-ink-soft transition hover:text-forest-700">
                    New prep
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard"
                    className="font-medium text-ink-soft transition hover:text-forest-700"
                  >
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Account
              </p>
              <ul className="mt-3 space-y-2.5">
                <li>
                  <Link href="/login" className="font-medium text-ink-soft transition hover:text-forest-700">
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link
                    href="/signup"
                    className="font-medium text-ink-soft transition hover:text-forest-700"
                  >
                    Create account
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-xs text-slate-400">
          <p>TopFit. Walk in ready.</p>
          <p>Prep packs are generated from your resume and the job description you provide.</p>
        </div>
      </div>
    </footer>
  );
}
