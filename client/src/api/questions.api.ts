import { api } from "./axios.ts";
import type {
  AcceptAnswerResponse,
  CourseQuestionsResponse,
  CreateAnswerPayload,
  CreateAnswerResponse,
  CreateQuestionPayload,
  CreateQuestionResponse,
  QuestionResponse,
} from "../types/question.ts";

export async function getCourseQuestions(courseId: string) {
  const response = await api.get<CourseQuestionsResponse>(
    `/courses/${courseId}/questions`,
  );

  return response.data;
}

export async function createCourseQuestion(
  courseId: string,
  payload: CreateQuestionPayload,
) {
  const response = await api.post<CreateQuestionResponse>(
    `/courses/${courseId}/questions`,
    payload,
  );

  return response.data;
}

export async function getQuestionById(questionId: string) {
  const response = await api.get<QuestionResponse>(`/questions/${questionId}`);
  return response.data;
}

export async function createAnswer(
  questionId: string,
  payload: CreateAnswerPayload,
) {
  const response = await api.post<CreateAnswerResponse>(
    `/questions/${questionId}/answers`,
    payload,
  );

  return response.data;
}

export async function acceptAnswer(questionId: string, answerId: string) {
  const response = await api.post<AcceptAnswerResponse>(
    `/questions/${questionId}/answers/${answerId}/accept`,
  );

  return response.data;
}
