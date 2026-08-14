import type { Course } from "./course.ts";
import type { CourseExperience } from "./experience.ts";
import type { CourseQuestion } from "./question.ts";
import type { CourseResource } from "./resource.ts";
import type { CourseStudyGroup } from "./studyGroup.ts";

export type HomeQuestion = CourseQuestion & {
  course: Course;
};

export type HomeExperience = CourseExperience & {
  course: Course;
};

export type HomeResource = CourseResource & {
  course: Course;
};

export type HomeOverview = {
  courses: Course[];
  questions: HomeQuestion[];
  experiences: HomeExperience[];
  resources: HomeResource[];
  studyGroups: CourseStudyGroup[];
};

export type HomeOverviewResponse = {
  success: true;
  data: HomeOverview;
};
