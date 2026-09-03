import { del, get, patch, post, query } from './client'
import type { ApiQuestion } from './types'
import type { QuestionStatus } from '@/lib/contracts'

export const questionsApi = {
  listForCourse(courseId: string, filters: { search?: string; status?: QuestionStatus } = {}) {
    return get<{ questions: ApiQuestion[] }>(
      `/courses/${courseId}/questions${query({ ...filters })}`,
    )
  },

  mine() {
    return get<{ questions: ApiQuestion[] }>('/questions/mine')
  },

  get(questionId: string) {
    return get<{ question: ApiQuestion }>(`/questions/${questionId}`)
  },

  create(courseId: string, input: { title: string; body: string }) {
    return post<{ question: ApiQuestion }>(`/courses/${courseId}/questions`, input)
  },

  update(questionId: string, input: { title?: string; body?: string }) {
    return patch<{ question: ApiQuestion }>(`/questions/${questionId}`, input)
  },

  remove(questionId: string) {
    return del<{ questionId: string }>(`/questions/${questionId}`)
  },

  answer(questionId: string, body: string) {
    return post<{ question: ApiQuestion }>(`/questions/${questionId}/answers`, { body })
  },

  updateAnswer(questionId: string, answerId: string, body: string) {
    return patch<{ question: ApiQuestion }>(`/questions/${questionId}/answers/${answerId}`, {
      body,
    })
  },

  deleteAnswer(questionId: string, answerId: string) {
    return del<{ question: ApiQuestion }>(`/questions/${questionId}/answers/${answerId}`)
  },

  setAccepted(questionId: string, answerId: string, accepted: boolean) {
    return patch<{ question: ApiQuestion }>(
      `/questions/${questionId}/answers/${answerId}/accept`,
      { accepted },
    )
  },
}
