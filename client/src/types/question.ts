import type { Course } from "./course.ts";

export type QuestionAuthor = {
  id: string;
  name: string | null;
  email: string;
};

export type CourseQuestion = {
  id: string;
  title: string;
  body: string;
  status: "OPEN" | "RESOLVED" | "ARCHIVED";
  acceptedAnswerId: string | null;
  courseId: string;
  createdAt: string;
  updatedAt: string;
  author: QuestionAuthor;
  _count: {
    answers: number;
  };
};

export type QuestionAnswer = {
  id: string;
  body: string;
  postId: string;
  createdAt: string;
  updatedAt: string;
  author: QuestionAuthor;
};

export type QuestionDetails = Omit<CourseQuestion, "_count"> & {
  course: Course;
  answers: QuestionAnswer[];
};

export type CreateQuestionPayload = {
  title: string;
  body: string;
};

export type CreateAnswerPayload = {
  body: string;
};

export type CourseQuestionsResponse = {
  success: true;
  data: {
    questions: CourseQuestion[];
  };
};

export type QuestionResponse = {
  success: true;
  data: {
    question: QuestionDetails;
  };
};

export type CreateQuestionResponse = {
  success: true;
  message: string;
  data: {
    question: CourseQuestion;
  };
};

export type CreateAnswerResponse = {
  success: true;
  message: string;
  data: {
    answer: QuestionAnswer;
  };
};

export type AcceptAnswerResponse = {
  success: true;
  message: string;
  data: {
    question: QuestionDetails;
  };
};
