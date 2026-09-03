import { Link } from 'react-router-dom'
import { ArrowRight, MessagesSquare, Repeat, Users } from 'lucide-react'
import { Page } from '@/layouts/AppShell'
import { Card, EmptyState, PageHeader } from '@/components/primitives'
import { courseHref } from '@/lib/courses'
import { useAuth } from '@/state/AuthProvider'

/**
 * Three things a student can start, in the order they usually want them.
 *
 * A session is deliberately absent: sessions come from confirming a study
 * request or scheduling inside a circle, never from a blank form. That is what
 * keeps a session something people have already agreed to attend.
 */
export default function Create() {
  const { myCourses } = useAuth()
  const firstCourse = myCourses[0]

  const OPTIONS = [
    {
      to: '/study-requests/new',
      icon: Users,
      title: 'Find study partners',
      body: 'Post a topic and a few times you could meet. Anyone in the course can join, and you confirm the time that works.',
      primary: true,
    },
    {
      to: firstCourse ? `${courseHref(firstCourse)}/questions` : '/courses',
      icon: MessagesSquare,
      title: 'Ask a course question',
      body: 'Get an answer that stays searchable in the course hub long after the session is over.',
    },
    {
      to: '/circles/new',
      icon: Repeat,
      title: 'Start a study circle',
      body: 'A recurring team for one course, with a standing roster and a cadence. Best once you know who you study well with.',
    },
  ]

  if (myCourses.length === 0) {
    return (
      <Page width="narrow">
        <PageHeader title="Create" />
        <EmptyState
          icon={Users}
          title="Add a course first"
          description="Everything you can create belongs to a course, so start there."
          actionLabel="Browse courses"
          to="/courses"
        />
      </Page>
    )
  }

  return (
    <Page width="narrow">
      <PageHeader
        title="Create"
        description="What do you want to start?"
      />

      <div className="space-y-4">
        {OPTIONS.map((option) => (
          <Card
            key={option.title}
            variant="interactive"
            to={option.to}
            label={option.title}
            className={option.primary ? 'border-primary-border bg-[var(--brand-wash)]/50' : undefined}
          >
            <div className="flex items-start gap-4">
              <span
                className={
                  option.primary
                    ? 'flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary-border bg-primary-subtle text-primary'
                    : 'flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-sunken text-muted-foreground'
                }
              >
                <option.icon className="size-5" aria-hidden="true" />
              </span>

              <div className="min-w-0 flex-1">
                <h2 className="text-[15px] font-semibold text-foreground">{option.title}</h2>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  {option.body}
                </p>
              </div>

              <ArrowRight
                className="mt-3 size-4 shrink-0 text-faint-foreground transition-transform group-hover/card:translate-x-0.5"
                aria-hidden="true"
              />
            </div>
          </Card>
        ))}
      </div>

      <p className="mt-6 text-[13px] leading-relaxed text-muted-foreground">
        Looking to schedule a session? Confirm a time on a{' '}
        <Link to="/home" className="font-medium text-primary underline underline-offset-4">
          study request
        </Link>{' '}
        you posted, or schedule one from inside a study circle.
      </p>
    </Page>
  )
}
