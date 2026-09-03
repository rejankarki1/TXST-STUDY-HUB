import { get, post, query } from './client'
import type { ApiCourse, ApiCoursePerson, ApiDepartment } from './types'

export const coursesApi = {
  list(search?: string) {
    return get<{ courses: ApiCourse[] }>(`/courses${query({ search })}`, { auth: false })
  },

  get(courseId: string) {
    return get<{ course: ApiCourse }>(`/courses/${courseId}`, { auth: false })
  },

  listDepartments(search?: string) {
    return get<{ departments: ApiDepartment[] }>(`/courses/departments${query({ search })}`, {
      auth: false,
    })
  },

  /** departmentId only — never a department code or name, so the client cannot
   *  create a department even though the endpoint would allow it. */
  create(input: { code: string; title: string; description?: string; departmentId: string }) {
    return post<{ course: ApiCourse }>('/courses', input)
  },

  people(courseId: string) {
    return get<{ people: ApiCoursePerson[] }>(`/courses/${courseId}/people`)
  },
}
