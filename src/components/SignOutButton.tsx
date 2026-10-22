"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function SignOutButton() {
  const router = useRouter();
  async function signOut() {
    await supabaseBrowser().auth.signOut();
    router.push("/");
    router.refresh();
  }
  return (
    <button
      onClick={signOut}
      className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-white/60 px-3.5 py-2 text-sm font-medium text-ink-soft transition hover:border-forest-300 hover:text-forest-800"
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </button>
  );
}
