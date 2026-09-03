import { toast } from 'sonner'
import {
  circlesApi,
  questionsApi,
  sessionsApi,
  studyRequestsApi,
  type ApiStudyRequest,
} from '@/lib/api'
import { useAsync } from './useAsync'
import { useCourseHub } from './useCourse'

/** The four previews on the Course Hub overview, fetched as one screen. */
export function useCourseOverview() {
  const { course, reloadKey } = useCourseHub()

  const state = useAsync(async () => {
    const [requests, sessions, circles, questions] = await Promise.all([
      studyRequestsApi.listForCourse(course.id),
      sessionsApi.forCourse(course.id),
      circlesApi.list({ courseId: course.id, status: 'ACTIVE' }),
      questionsApi.listForCourse(course.id, { status: 'SOLVED' }),
    ])

    return {
      requests: requests.studyRequests,
      sessions: sessions.sessions,
      circles: circles.circles,
      solved: questions.questions,
    }
  }, [course.id, reloadKey])

  const join = async (request: ApiStudyRequest) => {
    try {
      await studyRequestsApi.join(
        request.id,
        request.timeOptions.map((option) => option.id),
      )
      toast.success(`Joined "${request.topic}"`)
      await state.reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not join')
    }
  }

  return {
    requests: state.data?.requests ?? [],
    sessions: state.data?.sessions ?? [],
    circles: state.data?.circles ?? [],
    solved: state.data?.solved ?? [],
    loading: state.loading,
    error: state.error,
    reload: state.reload,
    join,
  }
}
