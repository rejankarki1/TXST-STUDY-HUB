import type { Course } from "./course.ts";
import type { QuestionAuthor } from "./question.ts";

export type ResourceType =
  | "VIDEO"
  | "PRACTICE"
  | "DOCUMENTATION"
  | "GUIDE"
  | "TOOL"
  | "OFFICIAL";

export type CourseResource = {
  id: string;
  postId: string;
  title: string;
  description: string;
  url: string;
  resourceType: ResourceType;
  courseId: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author: QuestionAuthor;
};

export type ResourceDetails = CourseResource & {
  course: Course;
};

export type CreateResourcePayload = {
  title: string;
  description: string;
  url: string;
  resourceType: ResourceType;
};

export type CourseResourcesResponse = {
  success: true;
  data: {
    resources: CourseResource[];
  };
};

export type CreateResourceResponse = {
  success: true;
  message: string;
  data: {
    resource: CourseResource;
  };
};

export type ResourceResponse = {
  success: true;
  data: {
    resource: ResourceDetails;
  };
};
