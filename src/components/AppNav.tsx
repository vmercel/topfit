"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, Mail, Plus, Sparkles, Tag } from "lucide-react";

const APP_ITEMS = [
  { href: "/app", label: "New prep", icon: Plus },
  { href: "/app/dashboard", label: "My prep packs", icon: History },
];

const SITE_ITEMS = [
  { href: "/features", label: "Features", icon: Sparkles },
  { href: "/pricing", label: "Pricing", icon: Tag },
  { href: "/contact", label: "Contact", icon: Mail },
];

export function AppNavItems() {
  const pathname = usePathname();
  return (
    <>
      {APP_ITEMS.map((item) => {
        const isPacks = item.href === "/app/dashboard";
        const highlighted = isPacks
          ? pathname.startsWith("/app/dashboard") || pathname.startsWith("/app/prep")
          : pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={highlighted ? "page" : undefined}
            className={`inline-flex shrink-0 items-center gap-2.5 rounded-full px-3.5 py-2.5 text-sm font-semibold transition lg:flex lg:rounded-xl ${
              highlighted
                ? "bg-forest-900 text-white shadow-pop"
                : "text-ink-soft hover:bg-forest-50 hover:text-forest-800"
            }`}
          >
            <item.icon className="h-4.5 w-4.5" />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export function SiteNavItems() {
  return (
    <>
      {SITE_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="inline-flex shrink-0 items-center gap-2.5 rounded-full px-3.5 py-2.5 text-sm font-medium text-ink-soft transition hover:bg-forest-50 hover:text-forest-800 lg:flex lg:rounded-xl"
        >
          <item.icon className="h-4.5 w-4.5" />
          {item.label}
        </Link>
      ))}
    </>
  );
}
