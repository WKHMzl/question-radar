import { promises as fs } from "fs";
import path from "path";
import type { RadarData } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "radar.json");

const EMPTY: RadarData = { posts: {}, lastRefreshAt: null };

export async function readData(): Promise<RadarData> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return { ...EMPTY, ...JSON.parse(raw) };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return structuredClone(EMPTY);
    throw err;
  }
}

async function writeData(data: RadarData): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DATA_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, DATA_FILE); // atomic replace
}

// Serialize read-modify-write cycles within this process.
let queue: Promise<unknown> = Promise.resolve();

export function updateData<T>(fn: (data: RadarData) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const data = await readData();
    const result = await fn(data);
    await writeData(data);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}
