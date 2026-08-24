import * as React from 'react'
import { Users } from 'lucide-react'
import { Page } from '@/layouts/AppShell'
import { Badge, Card, EmptyState, PageHeader, SectionHeader } from '@/components/primitives'
import { GroupRow } from '@/components/rows'
import { courseHref } from '@/lib/courses'
import { useApp } from '@/state/AppState'
import { useMyCourseGroups } from '@/state/selectors'

/**
 * "Groups I actively belong to" — grouped by their parent course, each group
 * exactly once. Creator-owned groups are not a separate list; they are the same
 * membership with a badge. Finding new groups is Discover's job.
 */
export default function MyGroups() {
  const { state, refreshMyGroups, addCourse } = useApp()
  const { courses, orphans } = useMyCourseGroups()

  React.useEffect(() => {
    void refreshMyGroups()
  }, [])

  const currentUserId = state.currentUser?.id
  const isCreator = (group: { isCreator?: boolean; creatorId: string }) =>
    group.isCreator ?? group.creatorId === currentUserId

  const withGroups = courses.filter(({ groups }) => groups.length > 0)
  const total =
    withGroups.reduce((sum, { groups }) => sum + groups.length, 0) +
    orphans.reduce((sum, { groups }) => sum + groups.length, 0)

  return (
    <Page>
      {/* No "create group" action here: this page is for returning to groups you
          already belong to. Starting one belongs to Discover and the course page,
          where you can see what already exists first. */}
      <PageHeader
        title="My groups"
        description="Keep up with your study groups and the sessions they are planning."
      />

      {state.groupsLoading && (
        <p className="mb-5 text-sm text-muted-foreground">Loading your study groups...</p>
      )}

      {state.groupsError && (
        <EmptyState
          className="mb-5"
          icon={Users}
          title="Study groups could not load"
          description={state.groupsError}
        />
      )}

      {!state.groupsError && total > 0
        ? withGroups.map(({ course, groups }, index) => (
            <section key={course.id} className={index > 0 ? 'mt-9' : undefined}>
              <SectionHeader
                title={course.code}
                count={groups.length}
                action="View course"
                to={courseHref(course)}
              />
              <Card padded={false} className="overflow-hidden">
                <div className="divide-y divide-border">
                {groups.map((group) => (
                  <GroupRow
                    key={group.id}
                    group={group}
                    showCourse={false}
                    creator={isCreator(group)}
                    unread={state.unread[group.id]}
                  />
                ))}
                </div>
              </Card>
            </section>
          ))
        : null}

      {/* Groups whose course the student removed from My Courses. Membership
          survives that removal, so these stay reachable and clearly labelled as
          sitting outside My Courses. */}
      {!state.groupsError &&
        orphans.map((bucket, index) => (
          <section
            key={bucket.course?.id ?? bucket.courseCode}
            className={withGroups.length > 0 ? 'mt-9' : undefined}
          >
            {index === 0 && (
              <h2 className="mb-3 text-eyebrow text-faint-foreground">
                Groups outside My Courses
              </h2>
            )}
            <div className="mb-1 flex items-center gap-2">
              <SectionHeader
                title={bucket.courseCode}
                count={bucket.groups.length}
                action={bucket.course ? 'Add to My Courses' : undefined}
                onAction={bucket.course ? () => void addCourse(bucket.course!.id) : undefined}
                className="mb-0 flex-1"
              />
            </div>
            <p className="mb-3 flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
              <Badge tone="warning">Course removed</Badge>
              You are still in {bucket.groups.length === 1 ? 'this group' : 'these groups'}.
            </p>
            <Card padded={false} className="overflow-hidden">
              <div className="divide-y divide-border">
              {bucket.groups.map((group) => (
                <GroupRow
                  key={group.id}
                  group={group}
                  showCourse={false}
                  creator={isCreator(group)}
                  unread={state.unread[group.id]}
                />
              ))}
              </div>
            </Card>
          </section>
        ))}

      {!state.groupsError && !state.groupsLoading && total === 0 ? (
        <EmptyState
          icon={Users}
          title="No groups yet"
          description="Join a group in one of your courses, or start one for classmates to find."
          actionLabel="Discover groups"
          to="/discover"
        />
      ) : null}
    </Page>
  )
}
