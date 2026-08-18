import * as React from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Calendar, Plus, Users } from 'lucide-react'
import { Page } from '@/layouts/AppShell'
import { Button } from '@/components/ui/button'
import { EmptyState, PageHeader, SectionHeader } from '@/components/primitives'
import { GroupCard } from '@/components/GroupCard'
import { SessionRow } from '@/components/rows'
import { courseBySlug } from '@/lib/courses'
import { useApp } from '@/state/AppState'
import { useCourseStats } from '@/state/selectors'

export default function CoursePage() {
  const { slug } = useParams()
  const { state, refreshCourseGroups } = useApp()
  const course = courseBySlug(state.courses, slug ?? '')
  const stats = useCourseStats(course?.code ?? '')

  React.useEffect(() => {
    if (!course?.id) return
    void refreshCourseGroups(course.id)
  }, [course?.id])

  if (state.coursesLoading) {
    return (
      <Page>
        <PageHeader title="Loading course..." description="Fetching course details from TXST Study Hub." />
      </Page>
    )
  }

  if (state.coursesError) {
    return (
      <Page>
        <EmptyState
          icon={Users}
          title="Courses could not load"
          description={state.coursesError}
          actionLabel="Back to discover"
          to="/discover"
        />
      </Page>
    )
  }

  if (!course && state.courses.length === 0) {
    return (
      <Page>
        <EmptyState
          icon={Users}
          title="No courses available"
          description="Course data is empty right now."
          actionLabel="Back to discover"
          to="/discover"
        />
      </Page>
    )
  }

  if (!course) return <Navigate to="/discover" replace />

  const groupNames = new Map(stats.groups.map((group) => [group.id, group.name]))
  const department = course.department?.name ?? course.department?.code ?? 'Department not assigned'

  return (
    <Page>
      <PageHeader
        title={course.code}
        description={`${course.title} · ${department}`}
        action={
          <Button asChild variant="primary">
            <Link to="/groups/new">
              <Plus />
              Create group
            </Link>
          </Button>
        }
      />

      {state.groupsLoading && (
        <p className="mb-5 text-sm text-muted-foreground">Loading study groups...</p>
      )}

      {state.groupsError && (
        <EmptyState
          className="mb-5"
          icon={Users}
          title="Study groups could not load"
          description={state.groupsError}
          actionLabel="Back to discover"
          to="/discover"
        />
      )}

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <Stat icon={Users} label="Students" value={stats.studentCount} />
        <Stat icon={Users} label="Groups" value={stats.groups.length} />
        <Stat icon={Calendar} label="Upcoming" value={stats.upcomingSessions.length} />
      </div>

      <section>
        <SectionHeader title="Study groups" count={stats.groups.length} action="Find more" to="/discover" />
        {!state.groupsError && stats.groups.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {stats.groups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        ) : !state.groupsError && !state.groupsLoading ? (
          <EmptyState
            icon={Users}
            title="No groups for this course yet"
            description="Start the first group and classmates will be able to join."
            actionLabel="Create group"
            to="/groups/new"
          />
        ) : null}
      </section>

      {stats.upcomingSessions.length > 0 && (
        <section className="mt-9">
          <SectionHeader title="Upcoming sessions" count={stats.upcomingSessions.length} />
          <div className="divide-y divide-border border-y border-border">
            {stats.upcomingSessions.map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                showDay
                showGroup={groupNames.get(session.groupId)}
              />
            ))}
          </div>
        </section>
      )}
    </Page>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
        {label}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  )
}
