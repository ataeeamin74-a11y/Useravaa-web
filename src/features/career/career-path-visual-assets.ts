import { existsSync } from "node:fs";
import { join } from "node:path";

export type CareerPathVisualSlot =
  | "heroMascot"
  | "fit"
  | "jobReality"
  | "difficulties"
  | "aiImpact"
  | "interviewQuestions";

export const careerPathVisualAssetFiles = {
  heroMascot: "hero-mascot.png",
  fit: "fit.png",
  jobReality: "job-reality.png",
  difficulties: "difficulties.png",
  aiImpact: "ai-impact.png",
  interviewQuestions: "interview-questions.png"
} as const satisfies Record<CareerPathVisualSlot, string>;

export function getCareerPathVisualAssetPath(slug: string, slot: CareerPathVisualSlot) {
  return `/career-paths/${slug}/${careerPathVisualAssetFiles[slot]}`;
}

export function careerPathVisualAssetExists(slug: string, slot: CareerPathVisualSlot) {
  const publicPath = getCareerPathVisualAssetPath(slug, slot);
  return existsSync(join(process.cwd(), "public", publicPath));
}

export function getCareerPathVisualAssetPaths(slug: string) {
  return {
    heroMascot: getCareerPathVisualAssetPath(slug, "heroMascot"),
    fit: getCareerPathVisualAssetPath(slug, "fit"),
    jobReality: getCareerPathVisualAssetPath(slug, "jobReality"),
    difficulties: getCareerPathVisualAssetPath(slug, "difficulties"),
    aiImpact: getCareerPathVisualAssetPath(slug, "aiImpact"),
    interviewQuestions: getCareerPathVisualAssetPath(slug, "interviewQuestions")
  } as const;
}
