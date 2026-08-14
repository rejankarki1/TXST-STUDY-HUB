import type { Department } from "./department.ts";

export type Course = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  department: Department | null;
  questionCount?: number;
};

export type CreateCoursePayload = {
  code: string;
  title: string;
  description?: string;
  departmentId?: string;
  departmentCode?: string;
  departmentName?: string;
};

export type CoursesResponse = {
  success: true;
  data: {
    courses: Course[];
  };
};

export type CourseResponse = {
  success: true;
  data: {
    course: Course;
  };
};
