import { Check, Clock, MapPin, Users } from 'lucide-react'
import { Avatar, AvatarStack } from '@/components/Avatar'
import { Badge, CourseTag } from '@/components/primitives'
import { cn, courseVars } from '@/lib/utils'

/**
 * Static, non-interactive slices of the real product used on the landing page.
 * Built from the same tokens, spacing and components as the app itself, so the
 * marketing page is an honest preview rather than an illustration.
 *
 * The names here are illustrative and local to this file — nothing on the
 * landing page reads from the API, because it renders before anyone signs in.
 */
const CAST = [
  { id: 'a', name: 'Maya Torres' },
  { id: 'b', name: 'Andre Willis' },
  { id: 'c', name: 'Priya Nair' },
  { id: 'd', name: 'Jordan Reyes' },
  { id: 'e', name: 'Sam Okafor' },
]

/* ------------------------------------------------------------------ hero */

export function HeroPreview({ className }: { className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-md">
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Badge tone="primary">Needs help</Badge>
            <CourseTag code="CS 3358" size="sm" />
          </div>
          <h3 className="mt-2 text-[17px] font-semibold leading-snug tracking-tight text-foreground">
            Linked lists and pointer diagrams before Exam 1
          </h3>
          <div className="mt-3 flex items-center gap-2.5">
            <Avatar person={CAST[0]} size="sm" />
            <span className="text-[13px] text-muted-foreground">
              Maya Torres · 2 spots left
            </span>
          </div>
        </div>

        <div className="px-5 py-4 sm:px-6">
          <p className="text-eyebrow text-faint-foreground">Which of these can you make?</p>
          <div className="mt-3 space-y-2">
            {[
              { day: 'Tuesday', time: '5:00 – 7:00 PM', people: 3, picked: true },
              { day: 'Wednesday', time: '6:00 – 8:00 PM', people: 1, picked: false },
            ].map((slot) => (
              <div
                key={slot.day}
                className={cn(
                  'flex items-center gap-3 rounded-xl border px-4 py-2.5',
                  slot.picked
                    ? 'border-primary-border bg-primary-subtle'
                    : 'border-border bg-surface',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded-md border',
                    slot.picked
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border-strong bg-surface',
                  )}
                >
                  {slot.picked && <Check className="size-3.5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">{slot.day}</span>
                  <span className="block text-[13px] text-muted-foreground">{slot.time}</span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 text-[13px] text-muted-foreground">
                  <Users className="size-3.5" aria-hidden="true" />
                  {slot.people}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          style={courseVars('CS 3358')}
          className="border-t border-border bg-(--course-subtle) px-5 py-4 sm:px-6"
        >
          <p className="text-eyebrow text-(--course)">Confirmed session</p>
          <div className="mt-2 space-y-1.5 text-[13px]">
            <p className="flex items-center gap-2 text-foreground-soft">
              <Clock className="size-3.5 shrink-0 text-(--course)" aria-hidden="true" />
              Tuesday · 5:00 – 7:00 PM
            </p>
            <p className="flex items-center gap-2 text-foreground-soft">
              <MapPin className="size-3.5 shrink-0 text-(--course)" aria-hidden="true" />
              Alkek Library · 4th floor
            </p>
          </div>
          <div className="mt-3 flex items-center gap-2.5">
            <AvatarStack people={CAST.slice(0, 3)} max={3} size="xs" />
            <span className="text-[13px] text-muted-foreground">3 going</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------- features */

export function RequestPreview() {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-card">
      {[
        { intent: 'Needs help', tone: 'primary' as const, topic: 'Recursion base cases', who: 'Demo Student' },
        { intent: 'Can help', tone: 'success' as const, topic: 'Big-O analysis, any time', who: 'Priya Nair' },
      ].map((item) => (
        <div key={item.topic} className="border-b border-border py-2.5 last:border-0 last:pb-0 first:pt-0">
          <div className="flex items-center gap-2">
            <Badge tone={item.tone}>{item.intent}</Badge>
            <CourseTag code="CS 2308" size="sm" />
          </div>
          <p className="mt-1.5 text-[13px] font-medium text-foreground">{item.topic}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{item.who}</p>
        </div>
      ))}
    </div>
  )
}

export function RsvpPreview() {
  return (
    <div style={courseVars('MATH 2358')} className="rounded-xl border border-border bg-surface p-4 shadow-card">
      <CourseTag code="MATH 2358" size="sm" />
      <p className="mt-2 text-[13px] font-semibold text-foreground">Exam 2 proof review</p>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="size-3.5" aria-hidden="true" />
        Sunday · 3:00 – 5:00 PM
      </p>
      <div className="mt-3 inline-flex gap-1 rounded-xl border border-border bg-surface-sunken p-1">
        {['Going', 'Maybe', "Can't"].map((label, index) => (
          <span
            key={label}
            className={cn(
              'rounded-lg px-2.5 py-1 text-xs font-medium',
              index === 0
                ? 'bg-surface-raised text-foreground shadow-xs'
                : 'text-muted-foreground',
            )}
          >
            {label}
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <AvatarStack people={CAST.slice(1, 4)} max={3} size="xs" />
        <span className="text-xs text-muted-foreground">4 going</span>
      </div>
    </div>
  )
}

export function QuestionPreview() {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-card">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-success-subtle text-success">
          <Check className="size-3.5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-medium leading-snug text-foreground">
            Why does deleting a node with two children use the in-order successor?
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Solved · 2 answers</p>
        </div>
      </div>
      <div className="mt-3 rounded-lg border border-success/25 bg-success-subtle/60 p-3">
        <p className="text-xs leading-relaxed text-foreground-soft">
          Either works — they're symmetric. Both sit immediately next to the deleted value in
          sorted order, so both preserve the BST ordering…
        </p>
        <p className="mt-2 text-[11px] font-medium text-success">Accepted answer</p>
      </div>
    </div>
  )
}
