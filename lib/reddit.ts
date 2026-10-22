import type { RadarPost } from "./types";

// Read-only, application-only OAuth (client_credentials). No user login, no write scopes.
const TOKEN_URL = "https://www.reddit.com/api/v1/access_token";
const API_BASE = "https://oauth.reddit.com";

const userAgent = () => process.env.REDDIT_USER_AGENT || "windows:question-radar:v0.1";

export class RateLimitError extends Error {
  constructor(public retryInSec: number) {
    super(`Reddit rate limit reached, retry in ${retryInSec}s`);
  }
}

let token: { value: string; expiresAt: number } | null = null;

async function getToken(force = false): Promise<string> {
  if (!force && token && Date.now() < token.expiresAt - 60_000) return token.value;

  const basic = Buffer.from(
    `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`,
  ).toString("base64");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": userAgent(),
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Reddit auth failed: HTTP ${res.status}`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  token = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return token.value;
}

async function apiGet<T>(pathAndQuery: string, retried = false): Promise<T> {
  const res = await fetch(`${API_BASE}${pathAndQuery}`, {
    headers: { Authorization: `Bearer ${await getToken(retried)}`, "User-Agent": userAgent() },
    cache: "no-store",
  });
  if (res.status === 401 && !retried) return apiGet<T>(pathAndQuery, true);
  if (res.status === 429) {
    throw new RateLimitError(Math.ceil(Number(res.headers.get("x-ratelimit-reset")) || 60));
  }
  if (!res.ok) throw new Error(`Reddit API ${pathAndQuery.split("?")[0]}: HTTP ${res.status}`);
  return (await res.json()) as T;
}

interface RawPost {
  id: string;
  subreddit: string;
  title: string;
  selftext: string;
  author: string;
  permalink: string;
  created_utc: number;
  num_comments: number;
  link_flair_text: string | null;
  removed_by_category: string | null;
}

interface Listing {
  data: { children: { kind: string; data: RawPost }[] };
}

export type FetchedPost = Omit<RadarPost, "status" | "statusAt" | "fetchedAt">;

function toPost(p: RawPost): FetchedPost {
  return {
    id: p.id,
    subreddit: p.subreddit,
    title: p.title,
    selftext: p.selftext || "",
    author: p.author,
    permalink: `https://www.reddit.com${p.permalink}`,
    createdUtc: Math.floor(p.created_utc),
    numComments: p.num_comments,
    flair: p.link_flair_text,
    removed: Boolean(p.removed_by_category) || p.selftext === "[removed]",
  };
}

/** Newest posts across all subreddits in ONE request (r/a+b+c/new). */
export async function fetchNew(subreddits: string[]): Promise<FetchedPost[]> {
  const listing = await apiGet<Listing>(`/r/${subreddits.join("+")}/new?limit=100&raw_json=1`);
  return listing.data.children.filter((c) => c.kind === "t3").map((c) => toPost(c.data));
}

/** Current state (comment count, removal) of known posts, 100 ids per request. */
export async function fetchInfo(ids: string[]): Promise<FetchedPost[]> {
  const out: FetchedPost[] = [];
  for (let i = 0; i < ids.length; i += 100) {
    const batch = ids.slice(i, i + 100).map((id) => `t3_${id}`).join(",");
    const listing = await apiGet<Listing>(`/api/info?id=${batch}&raw_json=1`);
    out.push(...listing.data.children.map((c) => toPost(c.data)));
  }
  return out;
}
