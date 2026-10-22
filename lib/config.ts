const DEFAULT_SUBREDDITS = "n8n,automation,nocode,webscraping,zapier";

export const REFRESH_COOLDOWN_MS = 10 * 60 * 1000;
export const AUTO_REFRESH_MS = 15 * 60 * 1000;
export const OPEN_WINDOW_DAYS = 7; // questions older than this leave the list
export const TOPIC_WINDOW_DAYS = 30;
export const RETENTION_DAYS = 45; // posts older than this are pruned from the store

export function getSubreddits(): string[] {
  return (process.env.SUBREDDITS || DEFAULT_SUBREDDITS)
    .split(",")
    .map((s) => s.trim().replace(/^r\//i, ""))
    .filter(Boolean);
}

export function hasCredentials(): boolean {
  return Boolean(process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET);
}

/** Demo mode serves fixture data so the UI works before API access is approved. */
export function isDemo(): boolean {
  return process.env.RADAR_DEMO === "1" || !hasCredentials();
}
