import * as React from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { BookOpen, Check, Plus, Trash2 } from 'lucide-react'
import { Page } from '@/layouts/AppShell'
import { Button } from '@/components/ui/button'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import {
  ConfirmDialog,
  EmptyState,
  Menu,
  Meta,
  Skeleton,
  Tabs,
  tabClass,
} from '@/components/primitives'
import { courseHref } from '@/lib/courses'
import { courseVars } from '@/lib/utils'
import { useAuth } from '@/state/AuthProvider'
import { useCourseFromSlug, type CourseHubContext } from '@/hooks/useCourse'

const TABS = [
  { to: '', label: 'Overview', end: true },
  { to: 'study', label: 'Study' },
  { to: 'questions', label: 'Questions' },
  { to: 'people', label: 'People' },
]

/**
 * One course, one workspace.
 *
 * The header and tabs are constant; each tab owns its own data. `reloadKey` lets
 * a tab tell the others that something changed (a new request, a joined circle)
 * without any of them sharing a store.
 */
export default function CourseLayout() {
  const { course, loading } = useCourseFromSlug()
  const { myCourses, addCourse, removeCourse } = useAuth()
  const [pending, setPending] = React.useState(false)
  const [removeOpen, setRemoveOpen] = React.useState(false)
  const [reloadKey, setReloadKey] = React.useState(0)

  const bumpReloadKey = React.useCallback(() => setReloadKey((key) => key + 1), [])

  if (loading) {
    return (
      <Page>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-3 h-5 w-72" />
        <Skeleton className="mt-6 h-11 w-full max-w-md rounded-xl" />
        <Skeleton className="mt-6 h-48 w-full rounded-xl" />
      </Page>
    )
  }

  if (!course) {
    return (
      <Page>
        <EmptyState
          icon={BookOpen}
          title="Course not found"
          description="That course code doesn't match anything in the catalog."
          actionLabel="Browse courses"
          to="/courses"
        />
      </Page>
    )
  }

  const isEnrolled = myCourses.some((item) => item.id === course.id)

  const enrol = async () => {
    setPending(true)
    try {
      await addCourse(course.id)
    } finally {
      setPending(false)
    }
  }

  const context: CourseHubContext = { course, isEnrolled, reloadKey, bumpReloadKey }

  return (
    <Page>
      <div style={courseVars(course.code)}>
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="size-3 shrink-0 rounded-full bg-(--course)" aria-hidden="true" />
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {course.code}
              </h1>
            </div>
            <p className="mt-1.5 max-w-xl text-[15px] text-muted-foreground">{course.title}</p>
            <Meta className="mt-2" items={[course.department?.name ?? course.department?.code]} />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {isEnrolled ? (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-success/25 bg-success-subtle px-3 py-2 text-[13px] font-medium text-success">
                  <Check className="size-3.5" aria-hidden="true" />
                  In My Courses
                </span>
                <Menu label={`${course.code} options`}>
                  <DropdownMenuItem destructive onSelect={() => setRemoveOpen(true)}>
                    <Trash2 />
                    Remove from My Courses
                  </DropdownMenuItem>
                </Menu>
              </>
            ) : (
              <Button variant="secondary" disabled={pending} onClick={() => void enrol()}>
                <Plus />
                {pending ? 'Adding…' : 'Add to My Courses'}
              </Button>
            )}
          </div>
        </div>

        {course.description && (
          <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {course.description}
          </p>
        )}

        <Tabs label={`${course.code} sections`} className="mb-7">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to ? `${courseHref(course)}/${tab.to}` : courseHref(course)}
              end={tab.end}
              className={({ isActive }) => tabClass(isActive)}
            >
              {tab.label}
            </NavLink>
          ))}
        </Tabs>
      </div>

      <Outlet context={context} />

      <ConfirmDialog
        open={removeOpen}
        onOpenChange={setRemoveOpen}
        title={`Remove ${course.code} from My Courses?`}
        description="This hub stays available and everything you posted here is kept. It just stops appearing in your sidebar and on Home."
        confirmLabel="Remove course"
        destructive
        onConfirm={() => removeCourse(course.id)}
      />
    </Page>
  )
}
