import { EyeOff, Users } from 'lucide-react'
import { Card, EmptyState, SectionHeader, Skeleton } from '@/components/primitives'
import { PersonRow } from '@/components/PersonRow'
import { coursesApi } from '@/lib/api'
import { plural } from '@/lib/utils'
import { useAsync } from '@/hooks/useAsync'
import { useCourseHub } from '@/hooks/useCourse'
import { useAuth } from '@/state/AuthProvider'

/**
 * Who else is in this course.
 *
 * There is no way to contact anyone from here by design — no message button, no
 * email, no follow. Discovery answers "am I the only one?"; coordination happens
 * through Study Requests, where intent and times are already on the table.
 */
export default function CoursePeople() {
  const { course, reloadKey } = useCourseHub()
  const { user } = useAuth()

  const state = useAsync(() => coursesApi.people(course.id), [course.id, reloadKey])
  const people = state.data?.people ?? []
  const looking = people.filter((person) => person.currentIntent)

  return (
    <div className="space-y-5">
      <SectionHeader title={`Students in ${course.code}`} count={people.length || undefined} />

      {state.error && (
        <Card variant="subtle" className="border-danger/30">
          <p className="text-sm text-danger">{state.error}</p>
        </Card>
      )}

      {state.loading && people.length === 0 ? (
        <Skeleton className="h-48 rounded-xl" />
      ) : people.length > 0 ? (
        <>
          {looking.length > 0 && (
            <p className="text-[13px] text-muted-foreground">
              {plural(looking.length, 'student')} currently looking for a study partner here.
            </p>
          )}

          <Card padded={false} className="overflow-hidden">
            <ul className="divide-y divide-border">
              {people.map((person) => (
                <PersonRow key={person.id} person={person} />
              ))}
            </ul>
          </Card>
        </>
      ) : (
        <EmptyState
          icon={Users}
          title="Nobody listed yet"
          description="Students appear here once they add this course and leave their study profile visible."
        />
      )}

      {user && !user.studyProfileVisible && (
        <Card variant="subtle" className="flex flex-wrap items-center justify-between gap-3">
          <p className="inline-flex items-center gap-2 text-[13px] text-muted-foreground">
            <EyeOff className="size-3.5 shrink-0" aria-hidden="true" />
            Your study profile is hidden, so classmates can't see you in this list.
          </p>
          <a
            href="/profile"
            className="text-[13px] font-medium text-primary underline underline-offset-4"
          >
            Change in Profile
          </a>
        </Card>
      )}
    </div>
  )
}
