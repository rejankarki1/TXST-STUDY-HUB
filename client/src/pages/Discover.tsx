import * as React from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Plus, Search, SearchX, Video } from 'lucide-react'
import { Page } from '@/layouts/AppShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Chip, EmptyState, PageHeader } from '@/components/primitives'
import { GroupCard } from '@/components/GroupCard'
import { coursesByCode } from '@/data/courses'
import { cn } from '@/lib/utils'
import { useApp } from '@/state/AppState'
import { isFull, isMember } from '@/state/selectors'

type Filter = 'my-courses' | 'open' | 'in-person' | 'online'

const FILTERS: { id: Filter; label: string; icon?: React.ComponentType<{ className?: string }> }[] =
  [
    { id: 'my-courses', label: 'My courses' },
    { id: 'open', label: 'Open groups' },
    { id: 'in-person', label: 'In person', icon: MapPin },
    { id: 'online', label: 'Online', icon: Video },
  ]

export default function Discover() {
  const { state } = useApp()
  const [query, setQuery] = React.useState('')
  const [course, setCourse] = React.useState<string>('all')
  const [filters, setFilters] = React.useState<Filter[]>([])

  const toggleFilter = (id: Filter) =>
    setFilters((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]))

  /* Course chips: the student's own courses first, then everything else that
     actually has groups. This is what makes the page read course-first. */
  const courseChips = React.useMemo(() => {
    const mine = state.profile.courses.filter((c) =>
      state.groups.some((g) => g.courseCode === c),
    )
    const others = [...new Set(state.groups.map((g) => g.courseCode))]
      .filter((c) => !mine.includes(c))
      .sort()
    return [...mine, ...others]
  }, [state.groups, state.profile.courses])

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return state.groups.filter((g) => {
      if (course !== 'all' && g.courseCode !== course) return false
      if (filters.includes('my-courses') && !state.profile.courses.includes(g.courseCode))
        return false
      if (filters.includes('open') && isFull(g)) return false
      if (filters.includes('in-person') && g.meetingStyle === 'online') return false
      if (filters.includes('online') && g.meetingStyle === 'in-person') return false
      if (!q) return true
      return (
        g.name.toLowerCase().includes(q) ||
        g.courseCode.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        (coursesByCode[g.courseCode]?.title.toLowerCase().includes(q) ?? false)
      )
    })
  }, [state.groups, state.profile.courses, query, course, filters])

  /* Groups you're already in sink to the bottom — you came here to find new ones. */
  const sorted = React.useMemo(
    () =>
      [...results].sort((a, b) => {
        const aJoined = isMember(a) ? 1 : 0
        const bJoined = isMember(b) ? 1 : 0
        if (aJoined !== bJoined) return aJoined - bJoined
        return b.memberIds.length - a.memberIds.length
      }),
    [results],
  )

  const clearAll = () => {
    setQuery('')
    setCourse('all')
    setFilters([])
  }

  return (
    <Page>
      <PageHeader
        title="Find your study group"
        description="Discover students studying the same courses you are."
        action={
          <Button asChild variant="secondary">
            <Link to="/groups/new">
              <Plus />
              Create group
            </Link>
          </Button>
        }
      />

      {/* search */}
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search courses or study groups..."
          aria-label="Search courses or study groups"
          className="h-12 pl-12 text-[15px]"
        />
      </div>

      {/* course rail — groups belong to courses, so this is the loudest filter */}
      <div className="-mx-4 mt-5 overflow-x-auto no-scrollbar px-4 sm:mx-0 sm:px-0">
        <div className="flex w-max gap-2 pb-0.5">
          <Chip selected={course === 'all'} onClick={() => setCourse('all')}>
            All courses
          </Chip>
          {courseChips.map((code) => (
            <Chip key={code} selected={course === code} onClick={() => setCourse(code)}>
              {code}
            </Chip>
          ))}
        </div>
      </div>

      {/* secondary filters */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {FILTERS.map(({ id, label, icon: Icon }) => {
            const on = filters.includes(id)
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleFilter(id)}
                aria-pressed={on}
                className={cn(
                  'inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors',
                  on ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <span
                  className={cn(
                    'flex size-4 items-center justify-center rounded-[4px] border transition-colors',
                    on ? 'border-primary bg-primary' : 'border-border-strong',
                  )}
                  aria-hidden="true"
                >
                  {on && (
                    <svg viewBox="0 0 10 8" className="w-2.5 text-primary-foreground" fill="none">
                      <path
                        d="M1 4l2.5 2.5L9 1"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                {Icon && <Icon className="size-3.5" aria-hidden="true" />}
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* results */}
      <div className="mt-7 flex items-baseline justify-between gap-4">
        <p className="text-[13px] text-muted-foreground">
          {sorted.length} {sorted.length === 1 ? 'group' : 'groups'}
          {course !== 'all' && (
            <>
              {' '}
              in <span className="font-medium text-foreground-soft">{course}</span>
            </>
          )}
        </p>
        {(query || course !== 'all' || filters.length > 0) && (
          <button
            type="button"
            onClick={clearAll}
            className="text-[13px] font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Clear filters
          </button>
        )}
      </div>

      {sorted.length ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {sorted.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      ) : (
        <EmptyState
          className="mt-4"
          icon={SearchX}
          title="No groups match that"
          description="Try a different course, or start a group yourself — someone else in the class is probably looking too."
          actionLabel="Create a study group"
          to="/groups/new"
        />
      )}
    </Page>
  )
}
