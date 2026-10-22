"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

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
      className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-white px-3.5 py-2 text-sm font-medium text-ink-soft transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-60"
    >
      <Trash2 className="h-4 w-4" />
      {busy ? "Deleting..." : "Delete"}
    </button>
  );
}
