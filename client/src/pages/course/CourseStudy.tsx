import * as React from 'react'
import { Link } from 'react-router-dom'
import { CalendarPlus, Search, Users, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, Chip, EmptyState, SectionHeader, Skeleton } from '@/components/primitives'
import { RequestCard } from '@/components/RequestCard'
import { SessionRow } from '@/components/SessionRow'
import { CircleCard } from '@/components/CircleCard'
import {
  EMPTY_REQUEST_FILTERS,
  filterRequests,
  type RequestFilterState,
} from '@/lib/requests'
import {
  INTENT_LABELS,
  MEETING_STYLE_LABELS,
  MEETING_STYLES,
  STUDY_REQUEST_INTENTS,
} from '@/lib/contracts'
import { plural } from '@/lib/utils'
import { useCourseHub } from '@/hooks/useCourse'
import { useCourseOverview } from '@/hooks/useCourseOverview'

const WHEN_OPTIONS: { id: RequestFilterState['when']; label: string }[] = [
  { id: 'ALL', label: 'Any time' },
  { id: 'TODAY', label: 'Today' },
  { id: 'THIS_WEEK', label: 'This week' },
]

/**
 * Everything happening in this course, filterable.
 *
 * The filters are applied client-side over the course's open requests: the list
 * is bounded by one course, so a round trip per keystroke would cost more than
 * it saves.
 */
export default function CourseStudy() {
  const { course, bumpReloadKey } = useCourseHub()
  const { requests, sessions, circles, loading, error, join } = useCourseOverview()
  const [filters, setFilters] = React.useState<RequestFilterState>(EMPTY_REQUEST_FILTERS)

  const set = <K extends keyof RequestFilterState>(key: K, value: RequestFilterState[K]) =>
    setFilters((current) => ({ ...current, [key]: value }))

  const visible = React.useMemo(() => filterRequests(requests, filters), [requests, filters])
  const filtered = JSON.stringify(filters) !== JSON.stringify(EMPTY_REQUEST_FILTERS)

  return (
    <div className="space-y-9">
      {error && (
        <Card variant="subtle" className="border-danger/30">
          <p className="text-sm text-danger">{error}</p>
        </Card>
      )}

      <section>
        <SectionHeader
          title="Open study requests"
          count={visible.length}
          action="Post a request"
          to={`/study-requests/new?courseId=${course.id}`}
        />

        {/* ------------------------------------------------------ filters */}
        <div className="mb-5 space-y-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={filters.search}
              onChange={(event) => set('search', event.target.value)}
              placeholder={`Search topics in ${course.code}…`}
              className="pl-11"
              aria-label="Search study requests"
            />
          </div>

          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by intent">
            {STUDY_REQUEST_INTENTS.map((intent) => (
              <Chip
                key={intent}
                selected={filters.intent === intent}
                onClick={() => set('intent', filters.intent === intent ? 'ALL' : intent)}
              >
                {INTENT_LABELS[intent]}
              </Chip>
            ))}

            <span className="mx-1 w-px self-stretch bg-border" aria-hidden="true" />

            {MEETING_STYLES.map((style) => (
              <Chip
                key={style}
                selected={filters.meetingStyle === style}
                onClick={() =>
                  set('meetingStyle', filters.meetingStyle === style ? 'ALL' : style)
                }
              >
                {MEETING_STYLE_LABELS[style]}
              </Chip>
            ))}

            <span className="mx-1 w-px self-stretch bg-border" aria-hidden="true" />

            {WHEN_OPTIONS.filter((option) => option.id !== 'ALL').map((option) => (
              <Chip
                key={option.id}
                selected={filters.when === option.id}
                onClick={() => set('when', filters.when === option.id ? 'ALL' : option.id)}
              >
                {option.label}
              </Chip>
            ))}

            <Chip
              selected={filters.openSpotsOnly}
              onClick={() => set('openSpotsOnly', !filters.openSpotsOnly)}
            >
              Open spots
            </Chip>

            {filtered && (
              <Chip icon={X} onClick={() => setFilters(EMPTY_REQUEST_FILTERS)}>
                Clear
              </Chip>
            )}
          </div>
        </div>

        {loading && requests.length === 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-44 rounded-xl" />
            <Skeleton className="h-44 rounded-xl" />
          </div>
        ) : visible.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {visible.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                showCourse={false}
                onJoin={() => void join(request).then(bumpReloadKey)}
              />
            ))}
          </div>
        ) : filtered ? (
          <EmptyState
            compact
            icon={Search}
            title="No requests match those filters"
            description={`${plural(requests.length, 'request')} open in ${course.code}.`}
            actionLabel="Clear filters"
            onAction={() => setFilters(EMPTY_REQUEST_FILTERS)}
          />
        ) : (
          <EmptyState
            icon={Users}
            title="No open study requests"
            description="Nobody has posted in this course yet. Say what you want to study and pick a few times you could meet."
            actionLabel="Post a study request"
            to={`/study-requests/new?courseId=${course.id}`}
          />
        )}
      </section>

      <section>
        <SectionHeader title="Upcoming sessions" count={sessions.length || undefined} />
        {sessions.length > 0 ? (
          <Card padded={false} className="overflow-hidden">
            <div className="divide-y divide-border">
              {sessions.map((session) => (
                <SessionRow key={session.id} session={session} showCourse={false} />
              ))}
            </div>
          </Card>
        ) : (
          <EmptyState
            compact
            icon={CalendarPlus}
            title="No sessions scheduled"
            description="A session appears once a request organiser confirms a time."
          />
        )}
      </section>

      <section>
        <SectionHeader
          title="Study circles"
          count={circles.length || undefined}
          action="Start a circle"
          to={`/circles/new?courseId=${course.id}`}
        />
        {circles.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {circles.map((circle) => (
              <CircleCard key={circle.id} circle={circle} showCourse={false} />
            ))}
          </div>
        ) : (
          <EmptyState
            compact
            icon={Users}
            title="No recurring circles"
            description="Once you've studied with the same people a few times, a circle keeps it on a cadence."
          >
            <Button asChild size="sm" variant="secondary">
              <Link to={`/circles/new?courseId=${course.id}`}>Start a circle</Link>
            </Button>
          </EmptyState>
        )}
      </section>
    </div>
  )
}
