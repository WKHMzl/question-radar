"use client";

import { useState } from "react";
import type { Topic } from "@/lib/types";
import type { RadarItem } from "./Radar";

interface Props {
  topics: Topic[];
  items: RadarItem[];
  active: Topic | null;
  onSelect: (t: Topic | null) => void;
}

export default function TopicsPanel({ topics, items, active, onSelect }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyQuestions(t: Topic) {
    const ids = new Set(t.ids);
    const lines = items.filter((p) => ids.has(p.id)).map((p) => `- ${p.title} (r/${p.subreddit}) ${p.permalink}`);
    await navigator.clipboard.writeText(`Topic: ${t.term}\n${lines.join("\n")}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <aside className="h-fit rounded-lg border border-border bg-card p-4">
      <h2 className="mb-1 font-medium">Recurring topics</h2>
      <p className="mb-3 text-xs text-muted">Last 30 days. Good candidates for a guide posted in the subreddit.</p>
      {topics.length === 0 ? (
        <p className="text-sm text-muted">Not enough questions yet.</p>
      ) : (
        <ul className="flex flex-col gap-1 text-sm">
          {topics.map((t) => {
            const isActive = active?.term === t.term;
            return (
              <li key={t.term}>
                <button
                  onClick={() => onSelect(isActive ? null : t)}
                  className={`flex w-full justify-between rounded-md px-2 py-1 text-left ${isActive ? "bg-accent/15 text-accent" : "hover:bg-border"}`}
                >
                  <span>{t.term}</span>
                  <span className="text-muted">{t.count}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {active && (
        <button onClick={() => copyQuestions(active)} className="mt-3 w-full rounded-md border border-border px-3 py-1 text-sm hover:bg-border">
          {copied ? "Copied ✓" : "Copy questions of this topic"}
        </button>
      )}
    </aside>
  );
}
