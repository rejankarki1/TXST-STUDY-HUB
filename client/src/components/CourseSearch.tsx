import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { courseHref, matchesCourseQuery } from '@/lib/courses'
import { cn } from '@/lib/utils'
import { useAuth } from '@/state/AuthProvider'

const MAX_RESULTS = 8

/**
 * Global course jump. The one search that is always reachable, because a Course
 * Hub is where every task in this product starts.
 *
 * Cmd/Ctrl-K opens it; arrows and Enter drive it without touching the mouse.
 */
export function CourseSearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { courses, myCourses } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = React.useState('')
  const [active, setActive] = React.useState(0)

  /* Typing resets the highlight; both are set from the same event rather than
     synced by an effect afterwards. */
  const search = (value: string) => {
    setQuery(value)
    setActive(0)
  }

  /* My Courses first: the course you are looking for is almost always one you
     are taking. */
  const results = React.useMemo(() => {
    const mineIds = new Set(myCourses.map((course) => course.id))
    const matches = courses.filter((course) => matchesCourseQuery(course, query))

    return [...matches]
      .toSorted((a, b) => {
        const aMine = mineIds.has(a.id) ? 0 : 1
        const bMine = mineIds.has(b.id) ? 0 : 1
        if (aMine !== bMine) return aMine - bMine
        return a.code.localeCompare(b.code, undefined, { numeric: true })
      })
      .slice(0, MAX_RESULTS)
  }, [courses, myCourses, query])

  const go = (index: number) => {
    const course = results[index]
    if (!course) return
    onOpenChange(false)
    navigate(courseHref(course))
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((current) => (current + 1) % Math.max(results.length, 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((current) => (current - 1 + results.length) % Math.max(results.length, 1))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      go(active)
    }
  }

  /* Remounting on open is what clears the previous query, instead of an effect
     watching `open`. */
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) search('')
        onOpenChange(next)
      }}
    >
      <DialogContent className="p-0 sm:max-w-lg" aria-describedby={undefined}>
        <DialogTitle className="sr-only">Search courses</DialogTitle>

        <div className="relative border-b border-border">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => search(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Jump to a course…"
            aria-label="Search courses"
            autoFocus
            className="h-14 rounded-none border-0 pl-12 shadow-none focus-visible:ring-0"
          />
        </div>

        <ul className="max-h-80 overflow-y-auto scroll-slim p-2">
          {results.length === 0 ? (
            <li className="px-3 py-8 text-center text-sm text-muted-foreground">
              No course matches “{query}”.
            </li>
          ) : (
            results.map((course, index) => (
              <li key={course.id}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(index)}
                  onClick={() => go(index)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                    index === active ? 'bg-primary-subtle' : 'hover:bg-surface-hover',
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground">
                      {course.code}
                    </span>
                    <span className="block truncate text-[13px] text-muted-foreground">
                      {course.title}
                    </span>
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </DialogContent>
    </Dialog>
  )
}

/** Opens the dialog on Cmd/Ctrl-K from anywhere inside the app shell. */
export function useCourseSearchShortcut(onOpen: () => void) {
  React.useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        onOpen()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onOpen])
}
