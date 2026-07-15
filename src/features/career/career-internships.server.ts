import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  getCareerInternshipSeedFeed,
  isCareerInternshipFeedStale,
  parseCareerInternshipFeed,
  type CareerInternshipFeed
} from "./career-internships";

const REFRESH_RETRY_DELAY_MS = 15 * 60 * 1000;
let lastRefreshStart = 0;

export function getCareerInternshipRuntimePath(source: NodeJS.ProcessEnv = process.env) {
  return source.USERAVAA_CAREER_INTERNSHIPS_PATH
    || join(tmpdir(), "useravaa-career-internships.json");
}

async function readRuntimeFeed(filePath: string, now: number) {
  try {
    return parseCareerInternshipFeed(JSON.parse(await readFile(filePath, "utf8")), now);
  } catch {
    return undefined;
  }
}

export async function loadCareerInternshipFeed(now = Date.now()): Promise<CareerInternshipFeed> {
  const runtimeFeed = await readRuntimeFeed(getCareerInternshipRuntimePath(), now);
  const seedFeed = getCareerInternshipSeedFeed(now);
  const feed = runtimeFeed && (!seedFeed || Date.parse(runtimeFeed.updatedAt) >= Date.parse(seedFeed.updatedAt))
    ? runtimeFeed
    : seedFeed;

  return feed ?? {
    schemaVersion: 1,
    updatedAt: new Date(0).toISOString(),
    refreshEveryHours: 72,
    maxAgeDays: 45,
    canonicalPathCount: 58,
    sourceCounts: { jobinja: 0, jobvision: 0 },
    items: []
  };
}

export function startCareerInternshipRefresh(feed: CareerInternshipFeed, now = Date.now()) {
  if (!isCareerInternshipFeedStale(feed, now) || now - lastRefreshStart < REFRESH_RETRY_DELAY_MS) {
    return false;
  }

  lastRefreshStart = now;
  try {
    const child = spawn(
      process.execPath,
      [join(process.cwd(), "scripts/refresh-career-internships.mjs"), "--output", getCareerInternshipRuntimePath()],
      { detached: true, stdio: "ignore" }
    );
    child.unref();
    return true;
  } catch (error) {
    console.error(
      "career internship refresh failed to start",
      error instanceof Error ? error.message : "unknown error"
    );
    return false;
  }
}

export function resetCareerInternshipRefreshGuard() {
  lastRefreshStart = 0;
}
