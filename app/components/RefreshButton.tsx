"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AUTO_REFRESH_MS } from "@/lib/config";

type Result = { ok: true; added: number; updated: number; demo: boolean } | { ok: false; cooldownSec?: number; error?: string };

export default function RefreshButton({ lastRefreshAt }: { lastRefreshAt: number | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const run = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/refresh", { method: "POST" });
      const r = (await res.json()) as Result;
      if (r.ok) setMessage(`+${r.added} new, ${r.updated} updated`);
      else if (r.cooldownSec) setMessage(`Next refresh in ${Math.ceil(r.cooldownSec / 60)} min`);
      else setMessage(r.error ?? "Refresh failed");
      router.refresh();
    } catch {
      setMessage("Refresh failed");
    } finally {
      setBusy(false);
    }
  }, [router]);

  // Auto-refresh while the tab is visible (server enforces the cooldown).
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void run();
    }, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [run]);

  return (
    <div className="flex items-center gap-3 text-sm">
      {message && <span className="text-muted">{message}</span>}
      {!message && lastRefreshAt && (
        <span className="text-muted" suppressHydrationWarning>
          last refresh {new Date(lastRefreshAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      )}
      <button onClick={run} disabled={busy} className="rounded-md bg-accent px-4 py-1.5 font-medium text-white disabled:opacity-60">
        {busy ? "Refreshing…" : "Refresh"}
      </button>
    </div>
  );
}
