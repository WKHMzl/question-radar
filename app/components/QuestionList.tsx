"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PostStatus } from "@/lib/types";
import type { RadarItem } from "./Radar";

function age(createdUtc: number, now: number): string {
  const min = Math.max(0, Math.floor((now / 1000 - createdUtc) / 60));
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  return h < 48 ? `${h}h` : `${Math.floor(h / 24)}d`;
}

export default function QuestionList({ items, now }: { items: RadarItem[]; now: number }) {
  if (!items.length) {
    return <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted">Nothing here.</p>;
  }
  return (
    <ul className="flex flex-col gap-3">
      {items.map((p) => (
        <QuestionCard key={p.id} post={p} now={now} />
      ))}
    </ul>
  );
}

function QuestionCard({ post, now }: { post: RadarItem; now: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function setStatus(status: PostStatus) {
    setBusy(true);
    try {
      await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const badge =
    post.level === "none"
      ? { text: "no answers", cls: "bg-accent/15 text-accent" }
      : post.level === "low"
        ? { text: `${post.numComments} comment${post.numComments > 1 ? "s" : ""}`, cls: "bg-warn/15 text-warn" }
        : { text: `${post.numComments} comments`, cls: "bg-card text-muted" };

  return (
    <li className={`rounded-lg border border-border bg-card p-4 ${busy ? "opacity-50" : ""}`}>
      <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted">
        <span className="font-medium text-foreground">r/{post.subreddit}</span>
        <span>· {age(post.createdUtc, now)} ago</span>
        {post.flair && <span>· {post.flair}</span>}
        <span className={`rounded-full px-2 py-0.5 ${badge.cls}`}>{badge.text}</span>
      </div>
      <h2 className="font-medium leading-snug">{post.title}</h2>
      {post.selftext && <p className="mt-1 line-clamp-3 text-sm text-muted">{post.selftext}</p>}
      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        <a href={post.permalink} target="_blank" rel="noreferrer" className="rounded-md bg-foreground px-3 py-1 text-background">
          Open on Reddit ↗
        </a>
        {post.status === "open" ? (
          <>
            <button disabled={busy} onClick={() => setStatus("answered")} className="rounded-md border border-border px-3 py-1 hover:bg-border">
              I answered
            </button>
            <button disabled={busy} onClick={() => setStatus("skipped")} className="rounded-md px-3 py-1 text-muted hover:bg-border">
              Skip
            </button>
          </>
        ) : (
          <button disabled={busy} onClick={() => setStatus("open")} className="rounded-md px-3 py-1 text-muted hover:bg-border">
            Move back to radar
          </button>
        )}
      </div>
    </li>
  );
}
