import { OPEN_WINDOW_DAYS } from "./config";
import type { RadarPost } from "./types";

const QUESTION_STARTS = [
  "how", "what", "why", "which", "where", "when", "any", "anyone", "is there", "is it",
  "can i", "can you", "can someone", "should i", "does", "do i", "help", "best way", "need help",
];

export function isQuestion(p: Pick<RadarPost, "title" | "flair">): boolean {
  const title = p.title.trim().toLowerCase();
  if (title.includes("?")) return true;
  if (p.flair && /question|help/i.test(p.flair)) return true;
  return QUESTION_STARTS.some((s) => title.startsWith(s + " ") || title.startsWith(s + ","));
}

export type AnswerLevel = "none" | "low" | "answered";

/** none = 0 comments; low = 1–2 comments and older than 3h; otherwise answered. */
export function answerLevel(p: RadarPost, nowMs: number): AnswerLevel {
  if (p.numComments === 0) return "none";
  const ageH = (nowMs / 1000 - p.createdUtc) / 3600;
  if (p.numComments <= 2 && ageH > 3) return "low";
  return "answered";
}

/** Open, not removed, recent and still lacking answers. */
export function isOnRadar(p: RadarPost, nowMs: number): boolean {
  const ageDays = (nowMs / 1000 - p.createdUtc) / 86400;
  return (
    p.status === "open" &&
    !p.removed &&
    ageDays <= OPEN_WINDOW_DAYS &&
    answerLevel(p, nowMs) !== "answered"
  );
}
