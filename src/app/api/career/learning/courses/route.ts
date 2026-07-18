import { NextRequest, NextResponse } from "next/server";
import { getCareerLearningCoursesForSkill } from "@/features/career/career-learning-server";
import { getSkillById } from "@/features/career/skill-catalog";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const skillId = request.nextUrl.searchParams.get("skillId") ?? "";
  const skill = getSkillById(skillId);
  if (!skill?.isSelectable) {
    return NextResponse.json(
      { ok: false, error: "invalid_skill" },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      skillId,
      courses: getCareerLearningCoursesForSkill(skillId)
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800"
      }
    }
  );
}
