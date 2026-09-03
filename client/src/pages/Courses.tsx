import * as React from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Plus, Search, Trash2 } from 'lucide-react'
import { Page } from '@/layouts/AppShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  ConfirmDialog,
  EmptyState,
  Menu,
  Meta,
  PageHeader,
  SectionHeader,
  Skeleton,
} from '@/components/primitives'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { AddCourseDialog } from '@/components/AddCourseDialog'
import { courseHref, matchesCourseQuery } from '@/lib/courses'
import { courseVars } from '@/lib/utils'
import { useAuth } from '@/state/AuthProvider'
import type { ApiCourse } from '@/lib/api'

const MAX_RESULTS = 30

/**
 * Two jobs, in priority order: get to a course hub you already have, and add one
 * you don't. Everything about what happens *inside* a course lives in the hub,
 * so this page deliberately shows no requests, sessions or circles.
 */
export default function Courses() {
  const { courses, coursesLoading, coursesError, myCourses, addCourse, removeCourse } = useAuth()
  const [query, setQuery] = React.useState('')
  const [addOpen, setAddOpen] = React.useState(false)
  const [pendingId, setPendingId] = React.useState<string | null>(null)
  const [removing, setRemoving] = React.useState<ApiCourse | null>(null)

  const mineIds = React.useMemo(() => new Set(myCourses.map((course) => course.id)), [myCourses])

  const results = React.useMemo(() => {
    if (!query.trim()) return []
    return courses.filter((course) => matchesCourseQuery(course, query)).slice(0, MAX_RESULTS)
  }, [courses, query])

  const add = async (course: ApiCourse) => {
    setPendingId(course.id)
    try {
      await addCourse(course.id)
    } finally {
      setPendingId(null)
    }
  }

  return (
    <Page>
      <PageHeader
        title="Courses"
        description="Your course hubs, and the catalog they come from."
        action={
          <Button variant="primary" onClick={() => setAddOpen(true)}>
            <Plus />
            Add a course
          </Button>
        }
      />

      {/* -------------------------------------------------------- search */}
      <section className="mb-9">
        <label htmlFor="course-search" className="sr-only">
          Search all courses
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="course-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search all Texas State courses by code or title…"
            className="pl-11"
          />
        </div>

        {query.trim() && (
          <div className="mt-4">
            {coursesLoading ? (
              <Skeleton className="h-24 rounded-xl" />
            ) : results.length > 0 ? (
              <Card padded={false} className="overflow-hidden">
                <ul className="divide-y divide-border">
                  {results.map((course) => {
                    const mine = mineIds.has(course.id)
                    return (
                      <li
                        key={course.id}
                        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-hover"
                      >
                        <div className="min-w-0 flex-1">
                          <Link
                            to={courseHref(course)}
                            className="text-sm font-medium text-foreground hover:text-primary"
                          >
                            {course.code}
                          </Link>
                          <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                            {course.title}
                          </p>
                        </div>
                        {mine ? (
                          <Button asChild size="sm" variant="ghost">
                            <Link to={courseHref(course)}>Open hub</Link>
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={pendingId === course.id}
                            onClick={() => void add(course)}
                          >
                            <Plus />
                            {pendingId === course.id ? 'Adding…' : 'Add'}
                          </Button>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </Card>
            ) : (
              <EmptyState
                compact
                icon={Search}
                title={`No course matches “${query.trim()}”`}
                description="Check the code, or add the course to the catalog yourself."
                actionLabel="Add a course"
                onAction={() => setAddOpen(true)}
              />
            )}
          </div>
        )}
      </section>

      {/* --------------------------------------------------- my courses */}
      <section>
        <SectionHeader title="My courses" count={myCourses.length || undefined} />

        {coursesError && (
          <Card variant="subtle" className="mb-4 border-danger/30">
            <p className="text-sm text-danger">{coursesError}</p>
          </Card>
        )}

        {myCourses.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No courses yet"
            description="Add the classes you're taking this semester. Each one gets its own hub for study requests, sessions and questions."
            actionLabel="Add your first course"
            onAction={() => setAddOpen(true)}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myCourses.map((course) => (
              <Card
                key={course.id}
                accent
                style={courseVars(course.code)}
                variant="interactive"
                to={courseHref(course)}
                label={`${course.code} hub`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-semibold text-foreground">{course.code}</h3>
                    <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
                      {course.title}
                    </p>
                  </div>
                  <Menu label={`${course.code} options`}>
                    <DropdownMenuItem destructive onSelect={() => setRemoving(course)}>
                      <Trash2 />
                      Remove from My Courses
                    </DropdownMenuItem>
                  </Menu>
                </div>

                <Meta className="mt-3" items={[course.department?.name ?? course.department?.code]} />
              </Card>
            ))}
          </div>
        )}
      </section>

      <AddCourseDialog open={addOpen} onOpenChange={setAddOpen} />

      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`Remove ${removing?.code} from My Courses?`}
        description="Its hub stays available and anything you posted there is kept — it just stops appearing in your sidebar and on Home. You can add it back any time."
        confirmLabel="Remove course"
        destructive
        onConfirm={async () => {
          if (removing) await removeCourse(removing.id)
          setRemoving(null)
        }}
      />
    </Page>
  )
}
