import * as React from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { CalendarX, Trash2, Users } from 'lucide-react'
import { Page } from '@/layouts/AppShell'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import {
  ConfirmDialog,
  Card,
  EmptyState,
  Menu,
  Meta,
  PageHeader,
  SectionHeader,
} from '@/components/primitives'
import { GroupCard } from '@/components/GroupCard'
import { SessionRow } from '@/components/rows'
import { courseBySlug } from '@/lib/courses'
import { courseVars, plural } from '@/lib/utils'
import { useApp } from '@/state/AppState'
import { isMember, useCourseStats, useMyCourses } from '@/state/selectors'

/** Sessions are secondary here — enough to see what's coming, not the agenda. */
const SESSION_PREVIEW = 3

/**
 * One course, one question: how do I find or start a study group for this class?
 * Groups are the page. Counts stay as a single line and sessions sit underneath,
 * so nothing outranks the thing the student came for.
 */
export default function CoursePage() {
  const { slug } = useParams()
  const { state, refreshCourseGroups, joinGroup, leaveGroup, deleteGroup, removeCourse } = useApp()
  const course = courseBySlug(state.courses, slug ?? '')
  const stats = useCourseStats(course)
  const myCourses = useMyCourses()
  const [removeOpen, setRemoveOpen] = React.useState(false)

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
  const department = course.department?.name ?? course.department?.code
  const sessions = stats.upcomingSessions.slice(0, SESSION_PREVIEW)
  const moreSessions = stats.upcomingSessions.length - sessions.length
  /* Counts, not cards. A term is dropped at zero so a brand-new course reads
     "No study groups yet" once, in the empty state, instead of twice. */
  const summary = [
    stats.groups.length > 0 && plural(stats.groups.length, 'study group'),
    stats.studentCount > 0 && plural(stats.studentCount, 'student'),
    stats.upcomingSessions.length > 0 &&
      `${plural(stats.upcomingSessions.length, 'upcoming session')}`,
    department,
  ]

  const enrolled = myCourses.some((item) => item.id === course.id)
  /* Memberships outlive the enrolment, so the confirm has to say so. */
  const joinedHere = stats.groups.filter(isMember).length

  return (
    <Page>
      <div style={courseVars(course.code)}>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="size-3 shrink-0 rounded-full bg-(--course)" aria-hidden="true" />
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {course.code}
              </h1>
            </div>
            <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">{course.title}</p>
          </div>

          {enrolled && (
            <Menu label={`${course.code} options`}>
              <DropdownMenuItem destructive onSelect={() => setRemoveOpen(true)}>
                <Trash2 />
                Remove from My Courses
              </DropdownMenuItem>
            </Menu>
          )}
        </div>

        {course.description && (
          <p className="mb-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {course.description}
          </p>
        )}

        <Meta items={summary} className="mb-8" />
      </div>

      <ConfirmDialog
        open={removeOpen}
        onOpenChange={setRemoveOpen}
        title={`Remove ${course.code} from My Courses?`}
        description={
          joinedHere > 0
            ? `You'll stay in ${plural(joinedHere, 'group')} for this course — they'll move to "outside My Courses" in your sidebar. You can add the course back any time.`
            : 'It will disappear from your sidebar and Home. You can add it back any time.'
        }
        confirmLabel="Remove course"
        destructive
        onConfirm={() => removeCourse(course.id)}
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

      <section>
        <SectionHeader
          title="Study groups"
          count={stats.groups.length || undefined}
          action="Find more"
          to="/discover"
        />
        {!state.groupsError && stats.groups.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {stats.groups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                showCourse={false}
                showMeta
                onJoin={() => void joinGroup(group.id)}
                onLeave={() => leaveGroup(group.id)}
                onDelete={() => deleteGroup(group.id)}
              />
            ))}
          </div>
        ) : !state.groupsError && !state.groupsLoading ? (
          <EmptyState
            compact
            icon={Users}
            title="No study groups yet"
            description="Be the first to start one for this course."
            actionLabel="Start a group"
            to={`/groups/new?courseId=${course.id}`}
          />
        ) : null}
      </section>

      <section className="mt-9">
        <SectionHeader title="Upcoming sessions" count={stats.upcomingSessions.length} />
        {sessions.length ? (
          <>
            <Card padded={false} className="overflow-hidden">
              <div className="divide-y divide-border">
              {sessions.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  showDay
                  showGroup={groupNames.get(session.groupId)}
                />
              ))}
              </div>
            </Card>
            {moreSessions > 0 && (
              <p className="mt-3 text-[13px] text-muted-foreground">
                {plural(moreSessions, 'more session')} scheduled.
              </p>
            )}
          </>
        ) : (
          <EmptyState
            compact
            icon={CalendarX}
            title="No sessions scheduled"
            description={
              stats.groups.length
                ? 'When a group in this course plans a session, it shows up here.'
                : 'Start a group and you can plan your first session.'
            }
          />
        )}
      </section>
    </Page>
  )
}
