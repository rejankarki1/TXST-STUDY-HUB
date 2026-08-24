import { Calendar, Check, Clock, MapPin, Send } from 'lucide-react'
import { Avatar, AvatarStack } from '@/components/Avatar'
import { peopleById } from '@/data/people'
import { CourseTag } from '@/components/primitives'
import { cn, courseVars } from '@/lib/utils'

/**
 * Static, non-interactive slices of the real product used on the landing page.
 * They are built from the same tokens and spacing as the app itself, so the
 * marketing page is an honest preview rather than an illustration.
 */

const p = (id: string) => peopleById[id]
const GRIND_MEMBERS = ['p2', 'p3', 'p1', 'p7', 'p9', 'p4', 'p6'].map(p)
const GOING = ['p2', 'p3', 'p7', 'p9', 'p4', 'p6'].map(p)

/* ------------------------------------------------------------------ hero */

export function HeroPreview({ className }: { className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-md">
        {/* group header */}
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <CourseTag code="CS 2308" />
          <h3 className="mt-1 text-[17px] font-semibold tracking-tight text-foreground">
            Data Structures Grind
          </h3>
          <div className="mt-3 flex items-center gap-2.5">
            <AvatarStack people={GRIND_MEMBERS} max={4} size="sm" />
            <span className="text-[13px] text-muted-foreground">7 members</span>
          </div>
        </div>

        {/* next session */}
        <div style={courseVars('CS 2308')} className="bg-(--course-subtle) px-5 py-4 sm:px-6">
          <p className="text-eyebrow text-(--course)">Next session</p>
          <p className="mt-1.5 text-[15px] font-semibold text-foreground">Exam 1 Review</p>
          <div className="mt-2.5 space-y-1.5 text-[13px]">
            <p className="flex items-center gap-2 text-foreground-soft">
              <Clock className="size-3.5 shrink-0 text-(--course)" aria-hidden="true" />
              Tonight · 6:00 – 8:00 PM
            </p>
            <p className="flex items-center gap-2 text-foreground-soft">
              <MapPin className="size-3.5 shrink-0 text-(--course)" aria-hidden="true" />
              Alkek Library · 4th Floor
            </p>
          </div>
          <div className="mt-3.5 flex items-center gap-2.5">
            <AvatarStack people={GOING} max={5} size="xs" />
            <span className="text-[13px] text-muted-foreground">6 going</span>
          </div>
        </div>

        {/* chat preview — faded at the bottom edge so the card reads as a
            window into a longer screen rather than a cut-off screenshot. */}
        <div
          className="space-y-3 px-5 py-4 sm:px-6"
          style={{
            maskImage: 'linear-gradient(to bottom, #000 55%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, #000 55%, transparent 100%)',
          }}
        >
          <ChatLine person={p('p2')} text="Did everyone finish question 4?" at="5:42 PM" />
          <ChatLine person={p('p3')} text="I'm still stuck on the linked list part" at="5:44 PM" />
          <ChatLine person={p('p1')} text="I can walk through it when we meet" at="5:46 PM" />
        </div>
      </div>

      {/* One floating detail — the RSVP moment, which is the product's payoff. */}
      <div className="absolute -bottom-4 -left-3 flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 shadow-md sm:-left-6">
        <span className="flex size-6 items-center justify-center rounded-full bg-success-subtle">
          <Check className="size-3.5 text-success" aria-hidden="true" />
        </span>
        <span className="text-[13px] font-medium text-foreground">You're going</span>
      </div>
    </div>
  )
}

function ChatLine({
  person,
  text,
  at,
}: {
  person: { id: string; name: string }
  text: string
  at: string
}) {
  return (
    <div className="flex gap-2.5">
      <Avatar person={person} size="xs" className="mt-0.5" />
      <div className="min-w-0">
        <p className="flex items-baseline gap-2">
          <span className="text-[13px] font-semibold text-foreground">
            {person.name.split(' ')[0]}
          </span>
          <span className="text-[11px] text-faint-foreground">{at}</span>
        </p>
        <p className="text-[13px] leading-relaxed text-foreground-soft">{text}</p>
      </div>
    </div>
  )
}

/* -------------------------------------------------------- feature slices */

export function GroupCardPreview() {
  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-xs">
      <CourseTag code="MATH 2472" />
      <h4 className="mt-1.5 text-[15px] font-semibold tracking-tight text-foreground">
        Calc II Final Prep
      </h4>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
        Working through series, integration techniques, and old finals.
      </p>
      <div className="mt-4 flex items-center gap-2.5">
        <AvatarStack people={['p5', 'p1', 'p8', 'p11'].map(p)} max={4} size="sm" />
        <span className="text-[13px] text-muted-foreground">
          <span className="font-medium text-foreground-soft">5</span> of 8 members
        </span>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-[13px] text-foreground-soft">
        <Calendar className="size-3.5 text-muted-foreground" aria-hidden="true" />
        <span className="font-medium">Thu · 5:30 PM</span>
        <span aria-hidden="true" className="text-border-strong">·</span>
        <span className="text-muted-foreground">Ingram Hall</span>
      </p>
      <div className="mt-4 flex justify-end border-t border-border pt-4">
        <span className="inline-flex h-8 items-center rounded-md bg-primary px-3.5 text-[13px] font-medium text-primary-foreground">
          Join
        </span>
      </div>
    </div>
  )
}

export function RsvpPreview() {
  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-xs">
      <p className="text-eyebrow text-muted-foreground">Tuesday, 6:00 PM</p>
      <h4 className="mt-1.5 text-[15px] font-semibold tracking-tight text-foreground">
        Exam 1 Review
      </h4>
      <p className="mt-1.5 text-[13px] text-muted-foreground">Alkek Library · 4th Floor</p>

      <div className="mt-4 grid grid-cols-3 gap-1 rounded-md bg-surface-sunken p-1">
        <span className="inline-flex items-center justify-center gap-1.5 rounded-[5px] bg-primary py-1.5 text-[13px] font-medium text-primary-foreground">
          <Check className="size-3.5" aria-hidden="true" />
          Going
        </span>
        <span className="inline-flex items-center justify-center rounded-[5px] py-1.5 text-[13px] text-muted-foreground">
          Maybe
        </span>
        <span className="inline-flex items-center justify-center rounded-[5px] py-1.5 text-[13px] text-muted-foreground">
          Can't go
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2.5 border-t border-border pt-4">
        <AvatarStack people={GOING} max={5} size="xs" />
        <span className="text-[13px] text-muted-foreground">6 going · 1 maybe</span>
      </div>
    </div>
  )
}

export function ChatPreview() {
  return (
    <div className="flex flex-col rounded-lg border border-border bg-surface shadow-xs">
      <div className="border-b border-border px-4 py-3">
        <p className="text-[13px] font-semibold text-foreground">Data Structures Grind</p>
        <p className="text-xs text-muted-foreground">7 members · CS 2308</p>
      </div>
      <div className="flex-1 space-y-3 px-4 py-4">
        <ChatLine person={p('p7')} text="Are we still meeting at Alkek tonight?" at="4:12 PM" />
        <ChatLine person={p('p3')} text="yeah, fourth floor at 6" at="4:15 PM" />
        <ChatLine person={p('p9')} text="I'll bring my notes from the pointers lecture" at="4:31 PM" />
      </div>
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2 rounded-md border border-border-strong px-3 py-2">
          <span className="flex-1 text-[13px] text-faint-foreground">
            Message Data Structures Grind…
          </span>
          <Send className="size-4 text-muted-foreground" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}
