import * as React from 'react'
import { GraduationCap, Mail, Plus, Trash2, User } from 'lucide-react'
import { Page } from '@/layouts/AppShell'
import { Button } from '@/components/ui/button'
import { AddCourseDialog } from '@/components/AddCourseDialog'
import { Avatar } from '@/components/Avatar'
import { Card, ConfirmDialog, PageHeader } from '@/components/primitives'
import { CourseRow } from '@/components/rows'
import type { ApiCourse } from '@/lib/api'
import { courseHref, groupInCourse } from '@/lib/courses'
import { plural } from '@/lib/utils'
import { useApp } from '@/state/AppState'
import { isMember, useMyCourses } from '@/state/selectors'

export default function Profile() {
  const { state, signOut, removeCourse } = useApp()
  const { profile } = state
  const selectedCourses = useMyCourses()
  const [removingId, setRemovingId] = React.useState<string | null>(null)
  const [confirmCourse, setConfirmCourse] = React.useState<ApiCourse | null>(null)
  const [addOpen, setAddOpen] = React.useState(false)

  const groupsForCourse = (course: ApiCourse) =>
    state.groups.filter((group) => isMember(group) && groupInCourse(group, course))

  async function removeSelectedCourse(course: ApiCourse) {
    setRemovingId(course.id)
    try {
      await removeCourse(course.id)
      setConfirmCourse(null)
    } finally {
      setRemovingId(null)
    }
  }

  const openRemove = (course: ApiCourse) => setConfirmCourse(course)

  const confirmGroups = confirmCourse ? groupsForCourse(confirmCourse) : []
  const courseCount = selectedCourses.length

  return (
    <Page width="narrow">
      <PageHeader title="Profile" description="Your study account and enrolled courses." />

      <Card variant="raised" className="p-5">
        <div className="flex items-center gap-4">
          <Avatar person={{ name: profile.name }} size="lg" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold text-foreground">{profile.name}</h2>
            <p className="text-sm text-muted-foreground">{profile.major}</p>
          </div>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <Info icon={Mail} label="Email" value={profile.email} />
          <Info icon={GraduationCap} label="Graduation year" value={profile.gradYear} />
          <Info icon={User} label="Major" value={profile.major} />
        </dl>
      </Card>

      <section className="mt-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <h2 className="text-sm font-semibold text-foreground">My Courses</h2>
            <span className="text-xs text-muted-foreground">
              {courseCount} {courseCount === 1 ? 'course' : 'courses'}
            </span>
          </div>
          {/* Same dialog the sidebar opens -- one add-a-course surface. */}
          <Button type="button" variant="secondary" size="sm" onClick={() => setAddOpen(true)}>
            <Plus />
            Add course
          </Button>
        </div>

        <Card padded={false} className="overflow-hidden">
          <div className="divide-y divide-border">
          {selectedCourses.length ? (
            selectedCourses.map((course) => (
              <CourseRow
                key={course.id}
                course={course}
                to={courseHref(course)}
                groupCount={groupsForCourse(course).length}
                action={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${course.code}`}
                    disabled={removingId === course.id}
                    onClick={() => openRemove(course)}
                  >
                    <Trash2 />
                  </Button>
                }
              />
            ))
          ) : (
            <p className="py-4 text-sm text-muted-foreground">
              No courses yet. Add one to start finding study groups.
            </p>
          )}
          </div>
        </Card>
      </section>

      <Button variant="danger" className="mt-8" onClick={() => void signOut()}>
        Sign out
      </Button>

      <AddCourseDialog open={addOpen} onOpenChange={setAddOpen} />

      <ConfirmDialog
        open={Boolean(confirmCourse)}
        onOpenChange={(open) => !open && setConfirmCourse(null)}
        title={`Remove ${confirmCourse?.code ?? ''} from My Courses?`}
        description={
          confirmGroups.length > 0
            ? `You'll stay in ${plural(confirmGroups.length, 'group')} for this course — ${confirmGroups
                .map((group) => group.name)
                .join(', ')} — and they'll move to "outside My Courses" in your sidebar.`
            : 'It will disappear from your sidebar and Home. You can add it back any time.'
        }
        confirmLabel="Remove course"
        destructive
        onConfirm={async () => {
          if (confirmCourse) await removeSelectedCourse(confirmCourse)
        }}
      />
    </Page>
  )
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-eyebrow text-faint-foreground">
        <Icon className="size-3.5" aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-foreground">{value}</dd>
    </div>
  )
}
