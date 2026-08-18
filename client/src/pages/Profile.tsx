import * as React from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, GraduationCap, Mail, Plus, Search, Trash2, User } from 'lucide-react'
import { Page } from '@/layouts/AppShell'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/Avatar'
import { PageHeader } from '@/components/primitives'
import type { ApiCourse } from '@/lib/api'
import { courseSlug } from '@/lib/courses'
import { useApp } from '@/state/AppState'
import { isMember } from '@/state/selectors'

export default function Profile() {
  const { state, signOut, addCourse, removeCourse } = useApp()
  const { profile } = state
  const [query, setQuery] = React.useState('')
  const [addingId, setAddingId] = React.useState<string | null>(null)
  const [removingId, setRemovingId] = React.useState<string | null>(null)
  const [confirmCourse, setConfirmCourse] = React.useState<ApiCourse | null>(null)

  const selectedCourses = React.useMemo(() => {
    if (state.currentUser?.courses.length) return state.currentUser.courses
    if (profile.courseDetails.length) return profile.courseDetails
    return profile.courses
      .map((code) => state.courses.find((course) => course.code === code))
      .filter((course): course is ApiCourse => Boolean(course))
  }, [profile.courseDetails, profile.courses, state.courses, state.currentUser?.courses])

  const selectedIds = new Set(selectedCourses.map((course) => course.id))
  const addResults = state.courses
    .filter((course) => !selectedIds.has(course.id))
    .filter((course) => {
      const q = query.trim().toLowerCase()
      if (!q) return true
      return course.code.toLowerCase().includes(q) || course.title.toLowerCase().includes(q)
    })
    .slice(0, 6)

  const groupsForCourse = (course: ApiCourse) =>
    state.groups.filter(
      (group) =>
        isMember(group) && (group.courseId === course.id || group.courseCode === course.code),
    )

  async function addSelectedCourse(courseId: string) {
    setAddingId(courseId)
    try {
      await addCourse(courseId)
      setQuery('')
    } finally {
      setAddingId(null)
    }
  }

  async function removeSelectedCourse(course: ApiCourse) {
    setRemovingId(course.id)
    try {
      await removeCourse(course.id)
      setConfirmCourse(null)
    } finally {
      setRemovingId(null)
    }
  }

  const openRemove = (course: ApiCourse) => {
    if (groupsForCourse(course).length > 0) {
      setConfirmCourse(course)
      return
    }

    void removeSelectedCourse(course)
  }

  const confirmGroups = confirmCourse ? groupsForCourse(confirmCourse) : []
  const courseCount = selectedCourses.length
  const emptyMessage = state.coursesLoading
    ? 'Loading courses...'
    : query
      ? 'No matching courses to add.'
      : 'No more courses available.'

  return (
    <Page width="narrow">
      <PageHeader title="Profile" description="Your study account and enrolled courses." />

      <section className="rounded-lg border border-border bg-surface p-5">
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
          <Info icon={BookOpen} label="Courses" value={courseCount} />
        </dl>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">My Courses</h2>
          <span className="text-xs text-muted-foreground">
            {courseCount} {courseCount === 1 ? 'course' : 'courses'}
          </span>
        </div>

        <div className="divide-y divide-border border-y border-border">
          {selectedCourses.length ? (
            selectedCourses.map((course) => (
              <div
                key={course.id}
                className="flex items-center gap-3 py-3.5 transition-colors hover:bg-surface-sunken/60 sm:-mx-3 sm:rounded-md sm:px-3"
              >
                <Link to={`/courses/${courseSlug(course.code)}`} className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{course.code}</p>
                  <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                    {course.title}
                  </p>
                </Link>
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
              </div>
            ))
          ) : (
            <p className="py-4 text-sm text-muted-foreground">No courses selected yet.</p>
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Add Course</h2>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search courses..."
            className="pl-11"
            aria-label="Search courses"
          />
        </div>

        <div className="mt-3 divide-y divide-border border-y border-border">
          {!state.coursesLoading && addResults.length ? (
            addResults.map((course) => (
              <div
                key={course.id}
                className="flex items-center gap-3 py-3 transition-colors hover:bg-surface-sunken/60 sm:-mx-3 sm:rounded-md sm:px-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{course.code}</p>
                  <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                    {course.title}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={addingId === course.id}
                  onClick={() => void addSelectedCourse(course.id)}
                >
                  <Plus />
                  Add
                </Button>
              </div>
            ))
          ) : (
            <p className="py-4 text-sm text-muted-foreground">{emptyMessage}</p>
          )}
        </div>
      </section>

      <Button variant="danger" className="mt-8" onClick={() => void signOut()}>
        Sign out
      </Button>

      <Dialog open={Boolean(confirmCourse)} onOpenChange={(open) => !open && setConfirmCourse(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {confirmCourse?.code} from My Courses?</DialogTitle>
            <DialogDescription>
              You are still a member of study groups for this course. Those groups and sessions will
              remain available.
            </DialogDescription>
          </DialogHeader>

          {confirmGroups.length > 0 && (
            <div className="rounded-md border border-border bg-surface-sunken p-3">
              <p className="text-[13px] font-medium text-foreground">You are still a member of:</p>
              <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                {confirmGroups.map((group) => (
                  <li key={group.id}>{group.name}</li>
                ))}
              </ul>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setConfirmCourse(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={!confirmCourse || removingId === confirmCourse.id}
              onClick={() => confirmCourse && void removeSelectedCourse(confirmCourse)}
            >
              Remove Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
