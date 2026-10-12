"use client";

import { useTransition } from "react";
import { toggleStoreAction } from "./actions";

export function ToggleStoreButton({ storeId, isActive }: { storeId: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => toggleStoreAction(storeId))}
      disabled={pending}
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
        isActive ? "bg-red-500/10 text-red-300 hover:bg-red-500/20" : "bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
      }`}
    >
      {isActive ? "تعطيل" : "تفعيل"}
    </button>
  );
}
