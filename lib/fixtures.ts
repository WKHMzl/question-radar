import type { FetchedPost } from "./reddit";

// Demo data (fictional) so the UI can be used before Reddit API access is approved.
const SAMPLES: [string, string, string, number, number][] = [
  // [subreddit, title, body, hoursAgo, comments]
  ["n8n", "How do I handle pagination in the HTTP Request node?", "The API returns a next_cursor field and I can't figure out how to loop until it's empty.", 1, 0],
  ["n8n", "Webhook node returns 404 in production but works in test", "Activated the workflow, the production URL still 404s. Self-hosted with Docker.", 5, 1],
  ["n8n", "Best way to handle pagination with Google Sheets API?", "Reading 20k rows, the node times out.", 30, 0],
  ["automation", "Any tool to sync Shopify orders to Google Sheets automatically?", "Small store, ~50 orders/day, don't want to pay for an expensive app.", 2, 0],
  ["automation", "What's the cheapest way to send WhatsApp messages from a workflow?", "", 8, 2],
  ["nocode", "Can I build a client portal without code?", "Need login, file uploads and a simple dashboard per client.", 4, 0],
  ["nocode", "Is there a no-code way to scrape a list of URLs weekly?", "", 50, 1],
  ["webscraping", "How to handle Cloudflare challenge with Playwright?", "Getting blocked after ~20 requests even with delays.", 3, 0],
  ["webscraping", "Pagination with infinite scroll — how do you detect the end?", "", 12, 1],
  ["zapier", "Zapier webhook not triggering from Typeform", "The test works but live submissions don't trigger the zap.", 6, 0],
  ["zapier", "How to dedupe rows before sending to Google Sheets?", "", 20, 2],
];

export function demoPosts(nowMs: number): FetchedPost[] {
  return SAMPLES.map(([subreddit, title, selftext, hoursAgo, numComments], i) => ({
    id: `demo${i}`,
    subreddit,
    title,
    selftext,
    author: "demo_user",
    permalink: `https://www.reddit.com/r/${subreddit}/new/`,
    createdUtc: Math.floor(nowMs / 1000 - hoursAgo * 3600),
    numComments,
    flair: null,
    removed: false,
  }));
}
