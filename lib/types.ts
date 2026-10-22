export type PostStatus = "open" | "answered" | "skipped";

export interface RadarPost {
  id: string; // reddit base36 id (without t3_)
  subreddit: string;
  title: string;
  selftext: string;
  author: string;
  permalink: string; // full https URL
  createdUtc: number; // seconds
  numComments: number;
  flair: string | null;
  removed: boolean;
  status: PostStatus;
  statusAt: number | null; // ms
  fetchedAt: number; // ms
}

export interface RadarData {
  posts: Record<string, RadarPost>;
  lastRefreshAt: number | null; // ms
}

export interface Topic {
  term: string;
  count: number;
  ids: string[];
}
