import type { Group } from '@/data/types'
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

/** Case-insensitive code-or-title match, shared by every course search surface. */
export function matchesCourseQuery(course: { code: string; title: string }, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return course.code.toLowerCase().includes(q) || course.title.toLowerCase().includes(q)
}

/** The one place a group's parent course is named. Codes are display strings and
 *  can drift; the id is the real relationship. Demo/seed groups carry no
 *  courseId, so the code compare stays as a fallback rather than a preference. */
type GroupCourseRef = { courseId?: string; courseCode: string }

export const groupInCourse = (group: GroupCourseRef, course: { id: string; code: string }) =>
  group.courseId ? group.courseId === course.id : group.courseCode === course.code

export function courseForGroup(courses: ApiCourse[], group: GroupCourseRef) {
  return (
    (group.courseId ? courses.find((course) => course.id === group.courseId) : undefined) ??
    courses.find((course) => course.code === group.courseCode)
  )
}

/** /courses/:slug is the preserved route and there is no slug column, so the
 *  href is still derived from the code — but *which* course we link to is
 *  resolved by id upstream. */
export const courseHref = (course: { code: string }) => `/courses/${courseSlug(course.code)}`

export type CourseWithGroups = { course: ApiCourse; groups: Group[] }
/** An orphan bucket keeps its real course when we can resolve one, so the UI can
 *  offer "add it back" instead of just naming a code. */
export type OrphanGroups = { course: ApiCourse | undefined; courseCode: string; groups: Group[] }

/**
 * The Course -> Group hierarchy. Pure so the sidebar, the My Groups page, and a
 * plain node assertion all agree on one definition of the tree.
 *
 * `orphans` exists because removing a course from My Courses deliberately keeps
 * group membership — those groups would otherwise vanish from navigation.
 */
export function buildCourseTree(
  enrolled: ApiCourse[],
  joined: Group[],
  allCourses: ApiCourse[] = [],
): { courses: CourseWithGroups[]; orphans: OrphanGroups[] } {
  const byName = (a: Group, b: Group) => a.name.localeCompare(b.name)

  const courses = [...enrolled]
    .sort((a, b) => a.code.localeCompare(b.code))
    .map((course) => ({
      course,
      groups: joined.filter((group) => groupInCourse(group, course)).sort(byName),
    }))

  const buckets = new Map<string, OrphanGroups>()
  for (const group of joined) {
    if (enrolled.some((course) => groupInCourse(group, course))) continue
    const course = courseForGroup(allCourses, group)
    const key = course?.id ?? group.courseCode
    const bucket = buckets.get(key) ?? { course, courseCode: group.courseCode, groups: [] }
    bucket.groups.push(group)
    buckets.set(key, bucket)
  }

  const orphans = [...buckets.values()]
    .map((bucket) => ({ ...bucket, groups: bucket.groups.sort(byName) }))
    .sort((a, b) => a.courseCode.localeCompare(b.courseCode))

  return { courses, orphans }
}
