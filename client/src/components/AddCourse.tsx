import * as React from 'react'
import { Check, Plus, Search } from 'lucide-react'
import type { ApiCourse } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { matchesCourseQuery } from '@/lib/courses'
import { useAuth } from '@/state/AuthProvider'

/** Enough rows to browse, few enough to stay scannable as the catalog grows. */
const MAX_RESULTS = 50

/** Same shape the server enforces in createCourseSchema, checked here so the
 *  student sees the problem while typing instead of after a round trip. */
const COURSE_CODE = /^[A-Z]{2,5} \d{4}[A-Z]?$/

/** "cs2308" / "  cs  2308 " -> "CS 2308". Mirrors normalizeCourseCode server-side. */
export function normalizeCourseCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/^([A-Z]+)\s*(\d)/, '$1 $2')
}

/**
 * The way out of a search that found nothing. Deliberately not a standalone
 * "create course" button: it only ever renders as a zero-match empty state, so
 * students look before they add and the catalog does not fill up with
 * near-duplicates.
 *
 * The department is derived from the code prefix and shown read-only — the
 * client never sends departmentCode/departmentName, so it cannot invent a
 * department even though the endpoint would allow it.
 */
export function CreateMissingCourse({
  query,
  onCreated,
}: {
  query: string
  onCreated: (course: ApiCourse) => void | Promise<void>
}) {
  const { departments, createCourse, loadDepartments } = useAuth()
  const [open, setOpen] = React.useState(false)
  const [code, setCode] = React.useState('')
  const [title, setTitle] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open) void loadDepartments()
  }, [open, loadDepartments])

  // Prefill from the search that came up empty, so the code is typed once.
  const openForm = () => {
    const guess = normalizeCourseCode(query)
    setCode(COURSE_CODE.test(guess) ? guess : query.trim().toUpperCase())
    setTitle('')
    setError(null)
    setOpen(true)
  }

  const normalized = normalizeCourseCode(code)
  const validCode = COURSE_CODE.test(normalized)
  const prefix = validCode ? normalized.split(' ')[0] : ''
  const department = prefix
    ? departments.find((item) => item.code === prefix)
    : undefined
  const departmentMissing = validCode && departments.length > 0 && !department
  const canSubmit = validCode && Boolean(department) && title.trim().length >= 3 && !submitting

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!canSubmit || !department) return
    setSubmitting(true)
    setError(null)
    try {
      const course = await createCourse({
        code: normalized,
        title: title.trim(),
        departmentId: department.id,
      })
      await onCreated(course)
      setOpen(false)
      setCode('')
      setTitle('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not add that course')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <div className="py-4">
        <p className="text-sm text-muted-foreground">
          {query.trim() ? `No course matches “${query.trim()}”.` : 'No more courses available.'}
        </p>
        <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={openForm}>
          <Plus />
          Add this course
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4 py-4">
      <Field
        label="Course code"
        htmlFor="new-course-code"
        hint="Like CS 2308"
        error={code.trim() && !validCode ? 'Use a code like CS 2308.' : undefined}
      >
        <Input
          id="new-course-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="CS 2308"
          autoFocus
        />
      </Field>

      <Field label="Course title" htmlFor="new-course-title">
        <Input
          id="new-course-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Foundations of Computer Science II"
        />
      </Field>

      <div className="text-[13px]">
        <span className="text-muted-foreground">Department: </span>
        {department ? (
          <span className="font-medium text-foreground">
            {department.code} · {department.name}
          </span>
        ) : departmentMissing ? (
          <span className="text-danger">
            “{prefix}” isn’t a listed department. Check the code, or ask an admin to add it.
          </span>
        ) : (
          <span className="text-muted-foreground">Enter a valid course code first.</span>
        )}
      </div>

      {error && <p className="text-[13px] text-danger">{error}</p>}

      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" variant="primary" disabled={!canSubmit}>
          {submitting ? 'Adding...' : 'Add course'}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  )
}


/**
 * Search the catalog and add a course. The single add-a-course surface, hosted
 * by AddCourseDialog from both the sidebar and Profile.
 *
 * Courses you already have stay in the results marked "Added" rather than being
 * filtered out. Hiding them would make a search for a course you already hold
 * return nothing, which drops you into CreateMissingCourse -- and that would
 * 409-adopt and silently re-add it. Showing them keeps the create path
 * reachable only when the course genuinely does not exist.
 */
export function AddCourse({ onAdded }: { onAdded?: (course: ApiCourse) => void }) {
  const { courses, coursesLoading, coursesError, myCourses, addCourse } = useAuth()
  const [query, setQuery] = React.useState('')
  const [addingId, setAddingId] = React.useState<string | null>(null)

  const enrolledIds = React.useMemo(
    () => new Set(myCourses.map((course) => course.id)),
    [myCourses],
  )

  const matches = React.useMemo(
    () => courses.filter((course) => matchesCourseQuery(course, query)),
    [courses, query],
  )
  const results = matches.slice(0, MAX_RESULTS)
  const overflow = matches.length - results.length

  const add = async (course: ApiCourse) => {
    setAddingId(course.id)
    try {
      await addCourse(course.id)
      onAdded?.(course)
    } finally {
      setAddingId(null)
    }
  }

  return (
    <div className="flex min-h-0 flex-col">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by code or title..."
          className="pl-11"
          aria-label="Search courses"
          autoFocus
        />
      </div>

      <div className="-mx-1 mt-3 min-h-0 max-h-[min(24rem,50vh)] overflow-y-auto scroll-slim px-1">
        {coursesLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading courses...</p>
        ) : coursesError ? (
          <p className="py-8 text-center text-sm text-danger">{coursesError}</p>
        ) : results.length ? (
          <div className="divide-y divide-border">
            {results.map((course) => {
              const enrolled = enrolledIds.has(course.id)
              return (
                <div key={course.id} className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-surface-hover">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{course.code}</p>
                    <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                      {course.title}
                    </p>
                  </div>
                  {enrolled ? (
                    <span className="inline-flex shrink-0 items-center gap-1.5 px-2 text-[13px] font-medium text-success">
                      <Check className="size-3.5" aria-hidden="true" />
                      Added
                    </span>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={addingId === course.id}
                      onClick={() => void add(course)}
                    >
                      <Plus />
                      Add
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          /* Nothing in the catalog matches -- the only point where creating is right. */
          <CreateMissingCourse query={query} onCreated={(course) => add(course)} />
        )}
      </div>

      {overflow > 0 && (
        <p className="pt-2 text-[13px] text-muted-foreground">
          {overflow} more {overflow === 1 ? 'course' : 'courses'} match. Refine your search.
        </p>
      )}
    </div>
  )
}
