import { useOutletContext, useParams } from 'react-router-dom'
import type { ApiCourse } from '@/lib/api'
import { courseBySlug } from '@/lib/courses'
import { useAuth } from '@/state/AuthProvider'

export type CourseHubContext = {
  course: ApiCourse
  isEnrolled: boolean
  reloadKey: number
  bumpReloadKey: () => void
}

/** Inside a Course Hub tab, the course is already resolved by the layout. */
export function useCourseHub() {
  return useOutletContext<CourseHubContext>()
}

/**
 * Resolve `/courses/:slug` against the catalog.
 *
 * Returns `undefined` while the catalog is still loading and `null` when the
 * slug genuinely matches nothing — the layout needs to tell those apart so a
 * slow catalog does not render as a 404.
 */
export function useCourseFromSlug(): { course: ApiCourse | null | undefined; loading: boolean } {
  const { slug } = useParams()
  const { courses, coursesLoading } = useAuth()

  if (coursesLoading) return { course: undefined, loading: true }

  return { course: courseBySlug(courses, slug ?? '') ?? null, loading: false }
}
