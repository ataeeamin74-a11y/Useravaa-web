import rawCourseCatalog from "./data/career-learning-courses.json";
import {
  auditCareerLearningCourse,
  sortCareerLearningCourses,
  type CareerLearningCourse,
  type CareerLearningCourseCatalog
} from "./career-learning";

export const careerLearningCourseCatalog = rawCourseCatalog as CareerLearningCourseCatalog;

export const careerLearningCourses = careerLearningCourseCatalog.courses.filter(
  (course) => auditCareerLearningCourse(course).length === 0
);

const coursesBySkillId = new Map<string, CareerLearningCourse[]>();
for (const course of careerLearningCourses) {
  for (const skillId of course.skillIds) {
    const matches = coursesBySkillId.get(skillId) ?? [];
    matches.push(course);
    coursesBySkillId.set(skillId, matches);
  }
}

export function getCareerLearningCoursesForSkill(skillId: string, now = Date.now()) {
  return sortCareerLearningCourses(coursesBySkillId.get(skillId) ?? [], now);
}

export function getCareerLearningCourseById(courseId: string) {
  return careerLearningCourses.find((course) => course.id === courseId);
}
