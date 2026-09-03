import { Link } from 'react-router-dom'
import { CalendarPlus, CheckCircle2, MessagesSquare, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, EmptyState, SectionHeader, Skeleton } from '@/components/primitives'
import { RequestCard } from '@/components/RequestCard'
import { SessionRow } from '@/components/SessionRow'
import { CircleCard } from '@/components/CircleCard'
import { QuestionRow } from '@/components/QuestionRow'
import { courseHref } from '@/lib/courses'
import { useCourseHub } from '@/hooks/useCourse'
import { useCourseOverview } from '@/hooks/useCourseOverview'

/**
 * The course at a glance, with one obvious next action.
 *
 * Each section previews at most a few rows and links to the tab that owns it —
 * Overview never becomes a second copy of Study.
 */
export default function CourseOverview() {
  const { course, bumpReloadKey } = useCourseHub()
  const { requests, sessions, circles, solved, loading, error, join } = useCourseOverview()

  const href = courseHref(course)

  return (
    <div className="space-y-9">
      <Card
        variant="subtle"
        className="flex flex-wrap items-center justify-between gap-4 border-primary-border bg-[var(--brand-wash)]/60"
      >
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-foreground">
            Find people to study with
          </h2>
          <p className="mt-1 max-w-md text-[13px] leading-relaxed text-muted-foreground">
            Post the topic you want to work on and up to three times you could meet. Anyone in{' '}
            {course.code} can join.
          </p>
        </div>
        <Button asChild variant="primary">
          <Link to={`/study-requests/new?courseId=${course.id}`}>
            <Users />
            Post a study request
          </Link>
        </Button>
      </Card>

      {error && (
        <Card variant="subtle" className="border-danger/30">
          <p className="text-sm text-danger">{error}</p>
        </Card>
      )}

      <section>
        <SectionHeader
          title="Open study requests"
          count={requests.length || undefined}
          action="See all"
          to={`${href}/study`}
        />
        {loading && requests.length === 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-44 rounded-xl" />
            <Skeleton className="h-44 rounded-xl" />
          </div>
        ) : requests.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {requests.slice(0, 4).map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                showCourse={false}
                onJoin={() => void join(request).then(bumpReloadKey)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            compact
            icon={Users}
            title="No open requests yet"
            description="Be the first to say what you want to study in this course."
            actionLabel="Post a study request"
            to={`/study-requests/new?courseId=${course.id}`}
          />
        )}
      </section>

      <section>
        <SectionHeader
          title="Upcoming sessions"
          count={sessions.length || undefined}
          action="See all"
          to={`${href}/study`}
        />
        {sessions.length > 0 ? (
          <Card padded={false} className="overflow-hidden">
            <div className="divide-y divide-border">
              {sessions.slice(0, 4).map((session) => (
                <SessionRow key={session.id} session={session} showCourse={false} />
              ))}
            </div>
          </Card>
        ) : (
          <EmptyState
            compact
            icon={CalendarPlus}
            title="Nothing scheduled"
            description="When a study request finds a time, the session shows up here."
          />
        )}
      </section>

      <section>
        <SectionHeader
          title="Study circles"
          count={circles.length || undefined}
          action="See all"
          to={`${href}/study`}
        />
        {circles.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {circles.slice(0, 2).map((circle) => (
              <CircleCard key={circle.id} circle={circle} showCourse={false} />
            ))}
          </div>
        ) : (
          <EmptyState
            compact
            icon={Users}
            title="No recurring circles yet"
            description="A circle is a standing group that meets on a cadence for this course."
            actionLabel="Start a circle"
            to={`/circles/new?courseId=${course.id}`}
          />
        )}
      </section>

      <section>
        <SectionHeader
          title="Recently solved"
          count={solved.length || undefined}
          action="All questions"
          to={`${href}/questions`}
        />
        {solved.length > 0 ? (
          <Card padded={false} className="overflow-hidden">
            <div className="divide-y divide-border">
              {solved.slice(0, 4).map((question) => (
                <QuestionRow
                  key={question.id}
                  question={question}
                  to={`${href}/questions/${question.id}`}
                />
              ))}
            </div>
          </Card>
        ) : (
          <EmptyState
            compact
            icon={MessagesSquare}
            title="No solved questions yet"
            description="Answers accepted here stay searchable for everyone taking this course."
            actionLabel="Ask a question"
            to={`${href}/questions`}
          />
        )}
      </section>

      {solved.length > 0 && (
        <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <CheckCircle2 className="size-3.5 text-success" aria-hidden="true" />
          Accepted answers stay searchable for whoever takes {course.code} next.
        </p>
      )}
    </div>
  )
}
