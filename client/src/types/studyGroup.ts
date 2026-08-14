import type { Course } from "./course.ts";
import type { QuestionAuthor } from "./question.ts";

export type StudyGroupMode = "ONLINE" | "IN_PERSON";
export type StudyGroupStatus = "OPEN" | "FULL" | "CANCELLED";

export type StudyGroupMember = {
  id: string;
  joinedAt: string;
  user: QuestionAuthor;
};

export type CourseStudyGroup = {
  id: string;
  title: string;
  description: string;
  startDateTime: string;
  mode: StudyGroupMode;
  location: string | null;
  onlineDetails: string | null;
  maxMembers: number;
  status: StudyGroupStatus;
  courseId: string;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  course: Course;
  creator: QuestionAuthor;
  members: StudyGroupMember[];
  _count: {
    members: number;
  };
};

export type CreateStudyGroupPayload = {
  title: string;
  description: string;
  startDateTime: string;
  mode: StudyGroupMode;
  location?: string;
  onlineDetails?: string;
  maxMembers: number;
};

export type CourseStudyGroupsResponse = {
  success: true;
  data: {
    studyGroups: CourseStudyGroup[];
  };
};

export type StudyGroupResponse = {
  success: true;
  message?: string;
  data: {
    studyGroup: CourseStudyGroup;
  };
};
