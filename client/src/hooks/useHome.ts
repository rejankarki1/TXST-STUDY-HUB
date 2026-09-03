import * as React from 'react'
import { toast } from 'sonner'
import { circlesApi, sessionsApi, studyRequestsApi, type ApiStudyRequest } from '@/lib/api'
import { myTimeOptionIds } from '@/lib/requests'
import { groupSessions } from '@/lib/sessions'
import { useAsync } from './useAsync'
import { useAuth } from '@/state/AuthProvider'

/**
 * Home's four feeds in one place.
 *
 * Fetched together because Home is a single screen with a single loading state —
 * four independent spinners on one page reads as a broken layout.
 */
export function useHome() {
  const { user } = useAuth()

  const state = useAsync(async () => {
    const [sessions, opportunities, mine, circles] = await Promise.all([
      sessionsApi.mine(),
      studyRequestsApi.opportunities(),
      studyRequestsApi.mine(),
      circlesApi.mine(),
    ])

    return {
      sessions: sessions.sessions,
      opportunities: opportunities.studyRequests,
      myRequests: mine.studyRequests,
      circles: circles.circles.filter((circle) => circle.status === 'ACTIVE'),
    }
  }, [])

  const grouped = React.useMemo(
    () => groupSessions(state.data?.sessions ?? [], user?.id),
    [state.data?.sessions, user?.id],
  )

  /* Joining from Home takes every proposed time: the student has not seen the
     detail page, so the honest default is "any of these", which they can narrow
     on the request itself. */
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
    nextSession: grouped.upcoming[0],
    upcoming: grouped.upcoming,
    opportunities: state.data?.opportunities ?? [],
    myRequests: state.data?.myRequests ?? [],
    circles: state.data?.circles ?? [],
    loading: state.loading,
    error: state.error,
    reload: state.reload,
    join,
  }
}

export { myTimeOptionIds }
