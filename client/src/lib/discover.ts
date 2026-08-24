import type { Group } from '@/data/types'
import type { ApiCourse } from '@/lib/api'

export type Scope = 'all' | 'mine'

export type CourseFacet = {
  key: string
  code: string
  course?: ApiCourse
  count: number
}

export function matchesGroupQuery(group: Group, course: ApiCourse | undefined, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true

  return (
    group.name.toLowerCase().includes(q) ||
    group.courseCode.toLowerCase().includes(q) ||
    group.description.toLowerCase().includes(q) ||
    (course?.title.toLowerCase().includes(q) ?? false)
  )
}

export function matchesOpenSpots(group: Group, openOnly: boolean) {
  const full =
    group.isFull ??
    (group.memberCount ?? group.members?.length ?? group.memberIds?.length ?? 0) >= group.maxMembers
  return !openOnly || !full
}

export function buildCourseFacets(
  groups: Group[],
  courseOf: (group: Group) => ApiCourse | undefined,
  keyOf: (group: Group) => string,
): CourseFacet[] {
  const facets = new Map<string, CourseFacet>()

  for (const group of groups) {
    const key = keyOf(group)
    const held = facets.get(key)
    if (held) {
      held.count += 1
    } else {
      facets.set(key, {
        key,
        code: group.courseCode,
        course: courseOf(group),
        count: 1,
      })
    }
  }

  return [...facets.values()].sort((a, b) =>
    a.code.localeCompare(b.code, undefined, { numeric: true }),
  )
}
