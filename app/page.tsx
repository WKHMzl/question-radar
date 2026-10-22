import { Suspense } from "react";
import { connection } from "next/server";
import { getSubreddits, isDemo } from "@/lib/config";
import { answerLevel, isOnRadar } from "@/lib/questions";
import { readData } from "@/lib/store";
import { computeTopics } from "@/lib/topics";
import Radar, { type RadarItem } from "./components/Radar";

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
        <RadarLoader />
      </Suspense>
    </main>
  );
}

async function RadarLoader() {
  await connection(); // request-time data (local file + clock)
  return <Radar {...await loadRadarProps()} />;
}

async function loadRadarProps() {
  const now = Date.now();
  const data = await readData();
  const subreddits = getSubreddits();
  const posts = Object.values(data.posts);

  const items: RadarItem[] = posts
    .map((p) => ({ ...p, level: answerLevel(p, now), onRadar: isOnRadar(p, now) }))
    .sort((a, b) => b.createdUtc - a.createdUtc);

  return {
    items,
    topics: computeTopics(posts, subreddits, now),
    subreddits,
    now,
    demo: isDemo(),
    lastRefreshAt: data.lastRefreshAt,
  };
}
