import { Navigate, useParams } from 'react-router-dom'

/**
 * Old deep links still resolve.
 *
 * The refactor renamed groups to circles and removed Discover, My Groups and
 * chat. A bookmark or a shared link from before should land somewhere sensible
 * rather than bouncing off the catch-all to the marketing page.
 */
export function GroupToCircleRedirect() {
  const { groupId } = useParams()
  /* Ids were preserved by the rename migration, so the same id still resolves. */
  return <Navigate to={groupId ? `/circles/${groupId}` : '/home'} replace />
}

export function GroupSessionsRedirect() {
  const { groupId } = useParams()
  return <Navigate to={groupId ? `/circles/${groupId}` : '/home'} replace />
}
