# Question Radar

A small personal tool that surfaces **unanswered or barely answered questions** in a few automation subreddits, so I can answer them myself on Reddit. When the same topic keeps coming up, I write a guide and post it in that subreddit (following its rules).

- **Read-only.** It never posts, comments, votes or sends messages. Every reply is written manually by me on reddit.com.
- **Small footprint.** One request per refresh for new posts (`/r/a+b+c/new`), plus one `/api/info` call to update comment counts. Refreshes are at least 10 minutes apart, which is roughly 3 requests per 10 minutes.
- **No AI and no third-party services.** Questions are detected with simple rules, and topics are word counts over titles.
- **Local only.** Data lives in `data/radar.json` on my machine. It is not shared, sold or used to train models. Posts older than 45 days are deleted.

Subreddits: r/n8n, r/automation, r/nocode, r/webscraping, r/zapier.

## How it works

1. **Refresh** fetches the newest posts and keeps the ones that look like questions (title has "?", starts with "how/what/any/is there…", or has a Question/Help flair).
2. **On radar** lists questions from the last 7 days with no comments, or with 1–2 comments after 3 hours.
3. Each card has **Open on Reddit ↗**, **I answered** and **Skip**.
4. **Recurring topics** lists frequent words and word pairs in question titles over the last 30 days. Clicking a topic filters the list, and "Copy questions of this topic" helps outline a guide.

## Run

```bash
cp .env.example .env.local   # add Reddit "script" app credentials
npm install
npm run dev                  # http://localhost:3000
```

Without credentials, or with `RADAR_DEMO=1`, the app runs in demo mode with sample posts.

## Stack

Next.js (App Router) and TypeScript, with plain `fetch` to the Reddit OAuth API and a JSON file for storage.

```
lib/reddit.ts     OAuth client_credentials, /new and /api/info
lib/refresh.ts    refresh cycle with a 10-minute cooldown
lib/questions.ts  question detection and answer level
lib/topics.ts     recurring topics
lib/store.ts      JSON file store (atomic writes)
app/              UI and route handlers (/api/refresh, /api/posts/[id])
```
