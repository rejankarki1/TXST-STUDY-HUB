import type * as React from 'react'
import { Link } from 'react-router-dom'
import { Wordmark } from '@/components/Wordmark'
import { AvatarStack } from '@/components/Avatar'
import { courseVars } from '@/lib/utils'

/* Illustrative only, and local to this file: the auth screens render before
   there is a session, so nothing here can come from the API. */
const COURSE_ROWS = [
  {
    code: 'CS 3358',
    title: 'Data Structures and Algorithms',
    people: [
      { id: 'a', name: 'Maya Torres' },
      { id: 'b', name: 'Priya Nair' },
      { id: 'c', name: 'Andre Willis' },
      { id: 'd', name: 'Jordan Reyes' },
    ],
  },
  {
    code: 'MATH 2358',
    title: 'Discrete Mathematics',
    people: [
      { id: 'c', name: 'Andre Willis' },
      { id: 'e', name: 'Sam Okafor' },
      { id: 'a', name: 'Maya Torres' },
    ],
  },
  {
    code: 'ENG 1310',
    title: 'College Writing I',
    people: [
      { id: 'd', name: 'Jordan Reyes' },
      { id: 'e', name: 'Sam Okafor' },
    ],
  },
]

/**
 * Split screen: the form gets the clean white surface and the reader's full
 * attention; the right panel carries the brand and one quiet reminder of what
 * they're signing up for. Collapses to a single centred column below lg.
 */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
  footer: React.ReactNode
}) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-2">
      {/* form side */}
      <div className="flex min-h-dvh flex-col bg-background px-5 py-8 sm:px-8 lg:min-h-0">
        <Link to="/" className="self-start">
          <Wordmark size="md" />
        </Link>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[24rem] rounded-2xl border border-border bg-surface-raised p-6 shadow-card sm:p-7">
            <h1 className="text-[26px] font-semibold tracking-tight text-foreground">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-7">{children}</div>
            <div className="mt-6 text-center text-[13px] text-muted-foreground">{footer}</div>
          </div>
        </div>
      </div>

      {/* brand side */}
      <div className="hidden flex-col justify-center border-l border-border bg-[linear-gradient(135deg,var(--brand-wash),var(--background)_52%,var(--surface-sunken))] px-12 py-16 lg:flex xl:px-16">
        <div className="max-w-md">
          <h2 className="text-[28px] font-semibold leading-tight tracking-tight text-foreground">
            Someone else is stuck
            <br />
            on the same thing.
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Post the topic you want to work on and find the classmates already looking for it.
          </p>

          <ul className="mt-9 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface/75 shadow-card">
            {COURSE_ROWS.map((row) => (
              <li
                key={row.code}
                style={courseVars(row.code)}
                className="flex items-center gap-3 px-4 py-4"
              >
                <span
                  className="size-2.5 shrink-0 rounded-full bg-(--course)"
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{row.code}</p>
                  <p className="truncate text-[13px] text-muted-foreground">{row.title}</p>
                </div>
                <AvatarStack
                  people={row.people}
                  max={4}
                  size="sm"
                  className="[&_span]:ring-background"
                />
              </li>
            ))}
          </ul>

          <p className="mt-8 text-[13px] text-faint-foreground">
            Made for Texas State students. Not affiliated with Texas State University.
          </p>
        </div>
      </div>
    </div>
  )
}
