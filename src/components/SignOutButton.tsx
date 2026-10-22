"use client";

import { useRouter } from "next/navigation";
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
      className="text-sm font-medium text-slate-600 hover:text-slate-900"
    >
      Sign out
    </button>
  );
}
