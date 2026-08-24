import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { Group, Session } from '@/data/types'
import { Card, SectionHeader } from '@/components/primitives'
import { ScheduleSessionButton } from '@/components/ScheduleSessionButton'
import { dayLabel, time } from '@/lib/format'

/** Enough to orient without turning the rail into a second Sessions page. */
const PREVIEW = 4

/**
 * The rail's agenda. Only days that actually hold something get a row — the
 * seven-dashes calendar this replaced spent a whole card saying nothing.
 *
 * The soonest session appears here as well as in Next Up on purpose: the rail is
 * the schedule, the card is the highlight, and dropping it would leave "Upcoming"
 * claiming nothing is planned when something is.
 */
export function UpcomingPanel({ sessions, groups }: { sessions: Session[]; groups: Group[] }) {
  const shown = sessions.slice(0, PREVIEW)
  const codes = new Map(groups.map((group) => [group.id, group.courseCode]))

  return (
    <Card>
      <SectionHeader title="Upcoming" count={sessions.length || undefined} />

      {shown.length ? (
        <>
          <ol className="-mx-2 space-y-0.5">
            {shown.map((session, i) => {
              const day = dayLabel(session.startsAt)
              const newDay = i === 0 || day !== dayLabel(shown[i - 1].startsAt)
              const code = session.group?.course.code ?? codes.get(session.groupId)

              return (
                <li key={session.id}>
                  {newDay && (
                    <p
                      className={`text-eyebrow px-2 text-faint-foreground ${i === 0 ? 'pb-1' : 'pb-1 pt-3'}`}
                    >
                      {day}
                    </p>
                  )}
                  <Link
                    to={`/sessions/${session.id}`}
                    className="group block rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-hover"
                  >
                    <p className="text-[13px] font-semibold tabular-nums text-foreground">
                      {time(session.startsAt)}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-foreground-soft group-hover:text-primary">
                      {session.title}
                    </p>
                    {code && (
                      <p className="mt-0.5 text-[13px] text-muted-foreground">{code}</p>
                    )}
                  </Link>
                </li>
              )
            })}
          </ol>

          <Link
            to="/sessions"
            className="group mt-4 inline-flex items-center gap-0.5 border-t border-border pt-3 text-[13px] font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            View all sessions
            <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </>
      ) : (
        <div>
          <p className="text-sm font-medium text-foreground">Nothing planned yet</p>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            Schedule a session or RSVP to stay on track.
          </p>
          <ScheduleSessionButton groups={groups} variant="secondary" size="sm" className="mt-3" />
        </div>
      )}
    </Card>
  )
}
