import type { ApiCourse } from '@/lib/api'

/** "CS 2308" -> "cs-2308" keeps course URLs readable. */
export const courseSlug = (code: string) => code.toLowerCase().replace(/\s+/g, '-')

export function courseBySlug(courses: ApiCourse[], slug: string) {
  return courses.find((course) => courseSlug(course.code) === slug)
}

/** Case-insensitive code-or-title match, shared by every course search surface. */
export function matchesCourseQuery(course: { code: string; title: string }, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return course.code.toLowerCase().includes(q) || course.title.toLowerCase().includes(q)
}

/** There is no slug column, so the href is derived from the code — but *which*
 *  course we link to is always resolved by id upstream. */
export const courseHref = (course: { code: string }) => `/courses/${courseSlug(course.code)}`

export const courseTab = (course: { code: string }, tab: string) =>
  `${courseHref(course)}/${tab}`
