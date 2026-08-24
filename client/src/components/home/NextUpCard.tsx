import { CalendarPlus } from 'lucide-react'
import type { Group, Session } from '@/data/types'
import { NextSessionCard } from '@/components/NextSessionCard'
import { ScheduleSessionButton } from '@/components/ScheduleSessionButton'

/**
 * The dashboard's lead. With a session it hands off to the shared card, which is
 * already the strongest surface in the product. Without one it stays a compact
 * card rather than a full-height empty state — the old version reserved half the
 * screen to say nothing was happening.
 */
export function NextUpCard({
  session,
  group,
  groups,
}: {
  session?: Session
  group?: Group
  groups: Group[]
}) {
  if (session) {
    return (
      <NextSessionCard
        session={session}
        group={
          group ? { id: group.id, name: group.name, courseCode: group.courseCode } : undefined
        }
      />
    )
  }

  return (
    <section
      aria-label="Next up"
      className="relative overflow-hidden rounded-xl border border-border bg-surface p-5 shadow-card sm:p-6"
    >
      {/* Quiet depth, drawn from the maroon token. No artwork, nothing to load. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 hidden size-56 rounded-full opacity-60 sm:block"
        style={{
          background:
            'radial-gradient(circle, var(--primary-subtle) 0%, transparent 70%)',
        }}
      />

      <div className="relative">
        <p className="text-eyebrow text-muted-foreground">Next up</p>

        <span className="mt-3 flex size-11 items-center justify-center rounded-xl border border-primary-border bg-primary-subtle text-primary shadow-xs">
          <CalendarPlus className="size-[19px]" aria-hidden="true" />
        </span>

        <h2 className="mt-3 text-[17px] font-semibold tracking-tight text-foreground">
          No session scheduled
        </h2>
        <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
          {groups.length
            ? 'Plan a study session with your group and get everyone on the same page.'
            : 'Join a study group first — sessions belong to a group, and the group sets the course.'}
        </p>

        {groups.length > 0 && (
          <div className="mt-4">
            <ScheduleSessionButton groups={groups} size="sm">
              Schedule a session
            </ScheduleSessionButton>
          </div>
        )}
      </div>
    </section>
  )
}
