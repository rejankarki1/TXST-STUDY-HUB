import * as React from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, SearchX, SlidersHorizontal } from 'lucide-react'
import type { Group } from '@/data/types'
import { Page } from '@/layouts/AppShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Chip, EmptyState, PageHeader, Skeleton } from '@/components/primitives'
import { GroupCard } from '@/components/GroupCard'
import { courseForGroup } from '@/lib/courses'
import {
  buildCourseFacets,
  matchesGroupQuery,
  matchesOpenSpots,
  type CourseFacet,
  type Scope,
} from '@/lib/discover'
import { useApp } from '@/state/AppState'
import { isFull, isMember, membersOf, useMyCourses, useNextSessionByGroup } from '@/state/selectors'

const COURSE_SELECT_ALL = 'all'

export default function Discover() {
  const { state, joinGroup, leaveGroup, deleteGroup } = useApp()
  const myCourses = useMyCourses()
  const nextByGroup = useNextSessionByGroup()
  const [query, setQuery] = React.useState('')
  const [scope, setScope] = React.useState<Scope>('all')
  const [openOnly, setOpenOnly] = React.useState(false)
  const [courseKey, setCourseKey] = React.useState<string | null>(null)

  const myCourseKeys = React.useMemo(() => {
    const keys = new Set<string>()
    for (const course of myCourses) {
      keys.add(course.id)
      keys.add(course.code)
    }
    return keys
  }, [myCourses])

  const courseOf = React.useCallback(
    (group: Group) => courseForGroup(state.courses, group),
    [state.courses],
  )

  const keyOf = React.useCallback(
    (group: Group) => courseOf(group)?.id ?? group.courseId ?? group.courseCode,
    [courseOf],
  )

  const groupsBeforeCourse = React.useMemo(() => {
    return state.groups.filter((group) => {
      const course = courseOf(group)
      const key = keyOf(group)
      if (scope === 'mine' && !myCourseKeys.has(key) && !myCourseKeys.has(group.courseCode)) {
        return false
      }
      return (
        matchesOpenSpots(group, openOnly) &&
        matchesGroupQuery(group, course, query)
      )
    })
  }, [state.groups, courseOf, keyOf, scope, myCourseKeys, openOnly, query])

  const courseFacets = React.useMemo(
    () => buildCourseFacets(groupsBeforeCourse, courseOf, keyOf),
    [groupsBeforeCourse, courseOf, keyOf],
  )

  const selectedFacet = courseKey
    ? courseFacets.find((facet) => facet.key === courseKey) ??
      buildCourseFacets(
        state.groups.filter((group) => keyOf(group) === courseKey),
        courseOf,
        keyOf,
      )[0]
    : undefined

  const results = React.useMemo(() => {
    const filtered = courseKey
      ? groupsBeforeCourse.filter((group) => keyOf(group) === courseKey)
      : groupsBeforeCourse

    return [...filtered].sort((a, b) => {
      const aJoined = isMember(a) ? 1 : 0
      const bJoined = isMember(b) ? 1 : 0
      if (aJoined !== bJoined) return aJoined - bJoined

      const aMine = myCourseKeys.has(keyOf(a)) || myCourseKeys.has(a.courseCode) ? 0 : 1
      const bMine = myCourseKeys.has(keyOf(b)) || myCourseKeys.has(b.courseCode) ? 0 : 1
      if (aMine !== bMine) return aMine - bMine

      const aFull = isFull(a) && !isMember(a) ? 1 : 0
      const bFull = isFull(b) && !isMember(b) ? 1 : 0
      if (aFull !== bFull) return aFull - bFull

      return (
        a.courseCode.localeCompare(b.courseCode, undefined, { numeric: true }) ||
        a.name.localeCompare(b.name) ||
        membersOf(b).length - membersOf(a).length
      )
    })
  }, [groupsBeforeCourse, courseKey, keyOf, myCourseKeys])

  const filtered = Boolean(query) || scope !== 'all' || openOnly || courseKey
  const popoverFiltered = Boolean(openOnly || courseKey)
  const loading = state.coursesLoading || state.groupsLoading
  const error = state.coursesError ?? state.groupsError

  const clearAll = () => {
    setQuery('')
    setScope('all')
    setOpenOnly(false)
    setCourseKey(null)
  }

  const selectedCourseLabel = selectedFacet?.code ?? 'that course'

  return (
    <Page>
      <PageHeader
        title="Discover"
        description="Find classmates and study groups for your courses."
        action={
          <Button asChild variant="primary">
            <Link to="/groups/new">
              <Plus />
              Create group
            </Link>
          </Button>
        }
      />

      {error && (
        <EmptyState
          className="mb-5"
          icon={SearchX}
          title="Discover could not load"
          description={error}
        />
      )}

      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search groups, courses or topics..."
              aria-label="Search groups, courses or topics"
              className="h-12 pl-12 text-[15px]"
            />
          </div>
          <FiltersPopover
            facets={courseFacets}
            selectedKey={courseKey}
            openOnly={openOnly}
            active={popoverFiltered}
            onCourseChange={setCourseKey}
            onOpenOnlyChange={setOpenOnly}
          />
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Group scope">
          <Chip selected={scope === 'all'} onClick={() => setScope('all')}>
            All groups
          </Chip>
          <Chip selected={scope === 'mine'} onClick={() => setScope('mine')}>
            My courses
          </Chip>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <p className="text-[13px] text-muted-foreground">
          {loading
            ? 'Loading groups...'
            : `${results.length} ${results.length === 1 ? 'group' : 'groups'}`}
        </p>
        {filtered && (
          <button
            type="button"
            onClick={clearAll}
            className="rounded-md px-1.5 py-1 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-surface-hover hover:text-primary"
          >
            Clear filters
          </button>
        )}
      </div>

      {!error && loading && (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-52 rounded-xl" />
          ))}
        </div>
      )}

      {!error && !loading && results.length > 0 && (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {results.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              density="compact"
              nextSession={nextByGroup.get(group.id) ?? null}
              onJoin={() => joinGroup(group.id)}
              onLeave={() => leaveGroup(group.id)}
              onDelete={() => deleteGroup(group.id)}
            />
          ))}
        </div>
      )}

      {!error && !loading && results.length === 0 && (
        <EmptyState
          compact
          className="mt-4"
          icon={SearchX}
          title={courseKey ? `No groups for ${selectedCourseLabel} yet.` : 'No groups match that.'}
          description={
            courseKey
              ? 'Be the first to start one.'
              : 'Try a different search or filter, or start a group yourself.'
          }
          actionLabel="Create group"
          to={
            selectedFacet?.course ? `/groups/new?courseId=${selectedFacet.course.id}` : '/groups/new'
          }
        />
      )}
    </Page>
  )
}

function FiltersPopover({
  facets,
  selectedKey,
  openOnly,
  active,
  onCourseChange,
  onOpenOnlyChange,
}: {
  facets: CourseFacet[]
  selectedKey: string | null
  openOnly: boolean
  active: boolean
  onCourseChange: (key: string | null) => void
  onOpenOnlyChange: (value: boolean) => void
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={active ? 'subtle' : 'secondary'}
          className="h-12 shrink-0"
        >
          <SlidersHorizontal />
          Filters
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(20rem,calc(100vw-2rem))] p-4">
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-[13px] font-medium text-foreground-soft">
              Course
            </label>
            <Select
              value={selectedKey ?? COURSE_SELECT_ALL}
              onValueChange={(value) =>
                onCourseChange(value === COURSE_SELECT_ALL ? null : value)
              }
            >
              <SelectTrigger aria-label="Course filter">
                <SelectValue placeholder="Course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={COURSE_SELECT_ALL}>All courses</SelectItem>
                {facets.map((facet) => (
                  <SelectItem key={facet.key} value={facet.key}>
                    {facet.code} ({facet.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <button
            type="button"
            aria-pressed={openOnly}
            onClick={() => onOpenOnlyChange(!openOnly)}
            className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface-hover"
          >
            <span>
              <span className="block font-medium text-foreground">Open groups only</span>
              <span className="block text-[12px] text-muted-foreground">
                Hide groups that are already full.
              </span>
            </span>
            <span
              className={[
                'flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors',
                openOnly
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border-strong bg-surface-raised',
              ].join(' ')}
              aria-hidden="true"
            >
              {openOnly && <span className="size-2 rounded-sm bg-current" />}
            </span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
