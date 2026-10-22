"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeletePackButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!confirm("Delete this prep pack? This cannot be undone.")) return;
    setBusy(true);
    const res = await fetch(`/api/prep/${id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) router.refresh();
  }

  return (
    <button
      onClick={remove}
      disabled={busy}
      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-60"
    >
      {busy ? "Deleting..." : "Delete"}
    </button>
  );
}
