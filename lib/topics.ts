import { TOPIC_WINDOW_DAYS } from "./config";
import type { RadarPost, Topic } from "./types";

const STOPWORDS = new Set(
  (
    "a an the and or but if of to in on at by for with from into about as is are was were be been " +
    "it its this that these those i me my we our you your he she they them their what which who whom " +
    "how why when where can could should would will do does did done have has had not no yes any anyone " +
    "someone something there here just get got using use used way best need needs help please thanks " +
    "question questions new looking want trying try make making work working one more some all also " +
    "than then so very really good like know does doesn don't can't im i'm it's vs via etc"
  ).split(" "),
);

function tokens(title: string, subs: Set<string>): string[] {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/\s+/)
    .map((t) => t.replace(/^[.-]+|[.-]+$/g, ""))
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t) && !subs.has(t) && !/^\d+$/.test(t));
}

/** Recurring terms (words and adjacent word pairs) in question titles of the last 30 days. */
export function computeTopics(posts: RadarPost[], subreddits: string[], nowMs: number, limit = 15): Topic[] {
  const subs = new Set(subreddits.map((s) => s.toLowerCase()));
  const cutoff = nowMs / 1000 - TOPIC_WINDOW_DAYS * 86400;
  const byTerm = new Map<string, Set<string>>();

  for (const p of posts) {
    if (p.createdUtc < cutoff || p.removed) continue;
    const toks = tokens(p.title, subs);
    const terms = new Set<string>(toks);
    for (let i = 0; i < toks.length - 1; i++) terms.add(`${toks[i]} ${toks[i + 1]}`);
    for (const term of terms) {
      if (!byTerm.has(term)) byTerm.set(term, new Set());
      byTerm.get(term)!.add(p.id);
    }
  }

  const ranked = [...byTerm.entries()]
    .filter(([, ids]) => ids.size >= 2)
    .map(([term, ids]) => ({ term, count: ids.size, ids: [...ids] }))
    // pairs are more informative than single words at the same count
    .sort((a, b) => b.count - a.count || b.term.split(" ").length - a.term.split(" ").length);

  // Drop a single word when a pair containing it covers the same posts.
  const result: Topic[] = [];
  for (const t of ranked) {
    const redundant = result.some(
      (r) => r.term.includes(" ") && r.term.split(" ").includes(t.term) && r.count === t.count,
    );
    if (!redundant) result.push(t);
    if (result.length >= limit) break;
  }
  return result;
}
