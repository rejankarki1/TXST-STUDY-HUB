import type { ApiCourse } from './api'

/** "CS 2308" -> "cs-2308" keeps course URLs readable. */
export const courseSlug = (code: string) => code.toLowerCase().replace(/\s+/g, '-')

export function courseBySlug(courses: ApiCourse[], slug: string) {
  return courses.find((course) => courseSlug(course.code) === slug)
}

export function coursesByCode(courses: ApiCourse[]) {
  return Object.fromEntries(courses.map((course) => [course.code, course])) as Record<
    string,
    ApiCourse
  >
}
