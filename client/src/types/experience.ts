import type { Course } from "./course.ts";
import type { QuestionAuthor } from "./question.ts";

export type ExperienceDifficulty = "EASY" | "MEDIUM" | "HARD";

export type CourseExperience = {
  id: string;
  title: string;
  body: string;
  difficulty: ExperienceDifficulty;
  professorName: string | null;
  term: string | null;
  courseId: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author: QuestionAuthor;
};

export type ExperienceDetails = CourseExperience & {
  course: Course;
};

export type CreateExperiencePayload = {
  title: string;
  body: string;
  difficulty: ExperienceDifficulty;
  professorName?: string;
  term?: string;
};

export type CourseExperiencesResponse = {
  success: true;
  data: {
    experiences: CourseExperience[];
  };
};

export type CreateExperienceResponse = {
  success: true;
  message: string;
  data: {
    experience: CourseExperience;
  };
};

export type ExperienceResponse = {
  success: true;
  data: {
    experience: ExperienceDetails;
  };
};
