import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  Compass,
  Plus,
  Users,
} from 'lucide-react'
import { Page } from '@/layouts/AppShell'
import { Button } from '@/components/ui/button'
import { Badge, Card, CourseTag, EmptyState, Meta, SectionHeader, Skeleton } from '@/components/primitives'
import { RequestCard } from '@/components/RequestCard'
import { SessionRow } from '@/components/SessionRow'
import { CircleCard } from '@/components/CircleCard'
import { AvatarStack } from '@/components/Avatar'
import { useHome } from '@/hooks/useHome'
import { dayLabel, timeRange } from '@/lib/format'
import { STUDY_REQUEST_STATUS_LABELS } from '@/lib/contracts'
import { courseVars, plural } from '@/lib/utils'
import { useAuth } from '@/state/AuthProvider'

/**
 * Home answers one question: what should I do next.
 *
 * Everything on it is either something scheduled for the student, something
 * waiting on them, or an opening they could take. It is deliberately not a feed
 * — there is no "activity" here, because activity you cannot act on is noise.
 */
export default function Home() {
  const { user, myCourses } = useAuth()
  const { nextSession, upcoming, opportunities, myRequests, circles, loading, error, join } =
    useHome()

  const firstName = (user?.name ?? '').split(' ')[0]
  const openRequests = myRequests.filter((request) => request.status === 'OPEN')
  const scheduledRequests = myRequests.filter((request) => request.status === 'CONVERTED')

  if (myCourses.length === 0) {
    return (
      <Page width="wide">
        <h1 className="mb-6 text-[26px] font-semibold tracking-tight text-foreground">
          Welcome{firstName ? `, ${firstName}` : ''}
        </h1>
        <EmptyState
          icon={Compass}
          title="Add a course to get started"
          description="Every study request, session and question in TXST Study Hub lives inside a course hub."
          actionLabel="Browse courses"
          to="/courses"
        />
      </Page>
    )
  }

  return (
    <Page width="wide">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight text-foreground sm:text-[28px]">
            {firstName ? `Hey, ${firstName}` : 'Your study hub'}
          </h1>
          <p className="mt-1.5 text-[15px] text-muted-foreground">
            {plural(myCourses.length, 'course')} · {plural(upcoming.length, 'upcoming session')}
          </p>
        </div>
        <Button asChild variant="primary">
          <Link to="/create">
            <Plus />
            Create
          </Link>
        </Button>
      </div>

      {error && (
        <Card variant="subtle" className="mb-6 border-danger/30">
          <p className="text-sm text-danger">{error}</p>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
        <div className="min-w-0 space-y-8">
          {/* ---------------------------------------------- next session */}
          <section>
            <SectionHeader title="Next session" action="Full schedule" to="/schedule" />
            {loading && !nextSession ? (
              <Skeleton className="h-36 rounded-xl" />
            ) : nextSession ? (
              <Card
                accent
                style={courseVars(nextSession.course.code)}
                variant="interactive"
                to={`/sessions/${nextSession.id}`}
                label={nextSession.title}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <CourseTag code={nextSession.course.code} size="sm" />
                  {nextSession.myRsvp === null && <Badge tone="warning">Needs your RSVP</Badge>}
                  {nextSession.isOrganizer && <Badge tone="primary">You're organizing</Badge>}
                </div>

                <h3 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                  {nextSession.title}
                </h3>

                <Meta
                  className="mt-2"
                  items={[
                    <>
                      <CalendarClock className="size-3.5" aria-hidden="true" />
                      {dayLabel(nextSession.startsAt)} ·{' '}
                      {timeRange(nextSession.startsAt, nextSession.endsAt)}
                    </>,
                    nextSession.locationDetail
                      ? `${nextSession.location} · ${nextSession.locationDetail}`
                      : nextSession.location,
                  ]}
                />

                <div className="mt-4 flex items-center gap-2.5 border-t border-border pt-3.5">
                  <AvatarStack
                    people={nextSession.attendees}
                    total={nextSession.goingCount}
                    label={`${nextSession.goingCount} going`}
                  />
                  <span className="text-[13px] text-muted-foreground">
                    {nextSession.goingCount} going
                  </span>
                </div>
              </Card>
            ) : (
              <EmptyState
                compact
                icon={CalendarPlus}
                title="Nothing on the calendar"
                description="Join a study request or post your own — a confirmed time shows up here."
                actionLabel="Find study partners"
                to="/study-requests/new"
              />
            )}
          </section>

          {/* -------------------------------------------- opportunities */}
          <section>
            <SectionHeader
              title="Open in your courses"
              count={opportunities.length || undefined}
              action="Browse courses"
              to="/courses"
            />
            {loading && opportunities.length === 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-44 rounded-xl" />
                <Skeleton className="h-44 rounded-xl" />
              </div>
            ) : opportunities.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {opportunities.slice(0, 4).map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onJoin={() => void join(request)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                compact
                icon={Users}
                title="No open requests right now"
                description="Nobody in your courses is looking for a study partner yet. Be the first."
                actionLabel="Post a study request"
                to="/study-requests/new"
              />
            )}
          </section>
        </div>

        {/* --------------------------------------------------------- rail */}
        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <section>
            <SectionHeader title="Your requests" count={myRequests.length || undefined} />
            <Card padded={false} className="overflow-hidden">
              {myRequests.length === 0 ? (
                <p className="px-4 py-6 text-[13px] text-muted-foreground">
                  You haven't posted or joined a study request yet.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {[...openRequests, ...scheduledRequests].slice(0, 5).map((request) => (
                    <li key={request.id}>
                      <Link
                        to={`/study-requests/${request.id}`}
                        className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-hover"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <CourseTag code={request.course.code} size="sm" />
                            {request.status !== 'OPEN' && (
                              <Badge tone={request.status === 'CONVERTED' ? 'success' : 'neutral'}>
                                {STUDY_REQUEST_STATUS_LABELS[request.status]}
                              </Badge>
                            )}
                          </span>
                          <span className="mt-1 block truncate text-[13px] font-medium text-foreground">
                            {request.topic}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {request.isCreator ? 'You posted this' : 'You joined'} ·{' '}
                            {plural(request.participantCount, 'person', 'people')}
                          </span>
                        </span>
                        <ArrowRight
                          className="mt-1 size-3.5 shrink-0 text-faint-foreground"
                          aria-hidden="true"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </section>

          <section>
            <SectionHeader title="Upcoming" count={upcoming.length || undefined} />
            <Card padded={false} className="overflow-hidden">
              {upcoming.length === 0 ? (
                <p className="px-4 py-6 text-[13px] text-muted-foreground">
                  No sessions scheduled yet.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {upcoming.slice(0, 4).map((session) => (
                    <SessionRow key={session.id} session={session} />
                  ))}
                </div>
              )}
            </Card>
          </section>

          <section>
            <SectionHeader title="Your circles" count={circles.length || undefined} />
            {circles.length === 0 ? (
              <Card variant="subtle">
                <p className="text-[13px] text-muted-foreground">
                  A study circle is a recurring team for one course. Start one once you've found
                  people you study well with.
                </p>
                <Button asChild variant="secondary" size="sm" className="mt-3">
                  <Link to="/circles/new">
                    <Users />
                    Start a circle
                  </Link>
                </Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {circles.slice(0, 3).map((circle) => (
                  <CircleCard key={circle.id} circle={circle} />
                ))}
              </div>
            )}
          </section>

          {scheduledRequests.length > 0 && (
            <p className="flex items-center gap-2 px-1 text-[13px] text-muted-foreground">
              <CheckCircle2 className="size-3.5 text-success" aria-hidden="true" />
              {plural(scheduledRequests.length, 'request')} turned into a session.
            </p>
          )}
        </aside>
      </div>
    </Page>
  )
}
