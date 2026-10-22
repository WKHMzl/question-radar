import { getSubreddits, isDemo, OPEN_WINDOW_DAYS, REFRESH_COOLDOWN_MS, RETENTION_DAYS } from "./config";
import { demoPosts } from "./fixtures";
import { isQuestion } from "./questions";
import { fetchInfo, fetchNew, type FetchedPost } from "./reddit";
import { updateData } from "./store";

export type RefreshResult =
  | { ok: true; demo: boolean; added: number; updated: number; requests: number }
  | { ok: false; cooldownSec: number };

export async function refresh(): Promise<RefreshResult> {
  return updateData(async (data) => {
    const now = Date.now();
    if (data.lastRefreshAt && now - data.lastRefreshAt < REFRESH_COOLDOWN_MS) {
      return { ok: false, cooldownSec: Math.ceil((REFRESH_COOLDOWN_MS - (now - data.lastRefreshAt)) / 1000) };
    }

    const demo = isDemo();
    let requests = 0;
    let updated = 0;

    // 1) newest posts (one request for all subreddits)
    const fresh: FetchedPost[] = demo ? demoPosts(now) : await fetchNew(getSubreddits());
    if (!demo) requests++;

    let added = 0;
    for (const p of fresh) {
      const existing = data.posts[p.id];
      if (existing) {
        Object.assign(existing, { numComments: p.numComments, removed: p.removed, flair: p.flair });
      } else if (isQuestion(p)) {
        data.posts[p.id] = { ...p, status: "open", statusAt: null, fetchedAt: now };
        added++;
      }
    }

    // 2) refresh comment counts of open questions still in the window
    if (!demo) {
      const windowStart = now / 1000 - OPEN_WINDOW_DAYS * 86400;
      const freshIds = new Set(fresh.map((p) => p.id));
      const openIds = Object.values(data.posts)
        .filter((p) => p.status === "open" && !p.removed && p.createdUtc >= windowStart && !freshIds.has(p.id))
        .map((p) => p.id);
      if (openIds.length) {
        for (const p of await fetchInfo(openIds)) {
          const existing = data.posts[p.id];
          if (!existing) continue;
          existing.numComments = p.numComments;
          existing.removed = p.removed;
          updated++;
        }
        requests += Math.ceil(openIds.length / 100);
      }
    }

    // 3) prune old posts
    const retentionStart = now / 1000 - RETENTION_DAYS * 86400;
    for (const [id, p] of Object.entries(data.posts)) {
      if (p.createdUtc < retentionStart) delete data.posts[id];
    }

    data.lastRefreshAt = now;
    return { ok: true, demo, added, updated, requests };
  });
}
