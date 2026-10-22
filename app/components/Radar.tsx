"use client";

import { useMemo, useState } from "react";
import type { AnswerLevel } from "@/lib/questions";
import type { PostStatus, RadarPost, Topic } from "@/lib/types";
import QuestionList from "./QuestionList";
import RefreshButton from "./RefreshButton";
import TopicsPanel from "./TopicsPanel";

export type RadarItem = RadarPost & { level: AnswerLevel; onRadar: boolean };

type View = "radar" | "answered" | "skipped";
type LevelFilter = "all" | "none" | "low";

interface Props {
  items: RadarItem[];
  topics: Topic[];
  subreddits: string[];
  now: number;
  demo: boolean;
  lastRefreshAt: number | null;
}

export default function Radar({ items, topics, subreddits, now, demo, lastRefreshAt }: Props) {
  const [view, setView] = useState<View>("radar");
  const [sub, setSub] = useState<string>("");
  const [level, setLevel] = useState<LevelFilter>("all");
  const [topic, setTopic] = useState<Topic | null>(null);

  const visible = useMemo(() => {
    const topicIds = topic ? new Set(topic.ids) : null;
    return items.filter((p) => {
      if (view === "radar" && !p.onRadar) return false;
      if (view !== "radar" && p.status !== view) return false;
      if (sub && p.subreddit.toLowerCase() !== sub.toLowerCase()) return false;
      if (view === "radar" && level !== "all" && p.level !== level) return false;
      if (topicIds && !topicIds.has(p.id)) return false;
      return true;
    });
  }, [items, view, sub, level, topic]);

  const counts: Record<View, number> = {
    radar: items.filter((p) => p.onRadar).length,
    answered: items.filter((p) => p.status === ("answered" satisfies PostStatus)).length,
    skipped: items.filter((p) => p.status === ("skipped" satisfies PostStatus)).length,
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Question Radar</h1>
          <p className="text-sm text-muted">
            Unanswered questions in {subreddits.map((s) => `r/${s}`).join(", ")}. Read-only, replies are
            written manually on Reddit.
          </p>
        </div>
        <RefreshButton lastRefreshAt={lastRefreshAt} />
      </header>

      {demo && (
        <div className="rounded-lg border border-warn/40 bg-warn/10 px-4 py-2 text-sm">
          Demo mode: showing sample posts. Set <code>REDDIT_CLIENT_ID</code> / <code>REDDIT_CLIENT_SECRET</code>{" "}
          in <code>.env.local</code> to read Reddit.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 text-sm">
        {(["radar", "answered", "skipped"] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`rounded-full px-3 py-1 ${view === v ? "bg-foreground text-background" : "bg-card hover:bg-border"}`}
          >
            {v === "radar" ? "On radar" : v === "answered" ? "Answered by me" : "Skipped"} ({counts[v]})
          </button>
        ))}
        <span className="mx-2 h-5 w-px bg-border" />
        <select value={sub} onChange={(e) => setSub(e.target.value)} className="rounded-md border border-border bg-card px-2 py-1">
          <option value="">All subreddits</option>
          {subreddits.map((s) => (
            <option key={s} value={s}>r/{s}</option>
          ))}
        </select>
        {view === "radar" && (
          <select value={level} onChange={(e) => setLevel(e.target.value as LevelFilter)} className="rounded-md border border-border bg-card px-2 py-1">
            <option value="all">No / few answers</option>
            <option value="none">No answers</option>
            <option value="low">Few answers (1–2)</option>
          </select>
        )}
        {topic && (
          <button onClick={() => setTopic(null)} className="rounded-full bg-accent/15 px-3 py-1 text-accent">
            Topic: {topic.term} ✕
          </button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        <QuestionList items={visible} now={now} />
        <TopicsPanel topics={topics} items={items} active={topic} onSelect={setTopic} />
      </div>
    </div>
  );
}
