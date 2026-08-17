import { Link } from 'react-router-dom'
import { CalendarPlus, MessageSquare, Users } from 'lucide-react'
import { Page } from '@/layouts/AppShell'
import { Avatar } from '@/components/Avatar'
import { EmptyState, SectionHeader } from '@/components/primitives'
import { NextSessionCard } from '@/components/NextSessionCard'
import { GroupCard } from '@/components/GroupCard'
import { GroupRow } from '@/components/rows'
import { peopleById } from '@/data/people'
import { relative, shortWhen } from '@/lib/format'
import { useApp } from '@/state/AppState'
import { useActivity, useMyGroups, useMySessions, useSuggestedGroups } from '@/state/selectors'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Home() {
  const { state } = useApp()
  const myGroups = useMyGroups()
  const { upcoming } = useMySessions()
  const suggestions = useSuggestedGroups(2)
  const activity = useActivity(4)

  const next = upcoming[0]
  const thisWeek = upcoming.slice(1, 5)
  const firstName = state.profile.name.split(' ')[0]

  return (
    <Page width="wide">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-10">
        {/* ------------------------------------------------ focus column */}
        <div>
          <header className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {greeting()}, {firstName} 👋
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {next
                ? "Here's what's happening with your groups."
                : 'Nothing scheduled yet — a good time to plan something.'}
            </p>
          </header>

          {next ? (
            <NextSessionCard session={next} />
          ) : (
            <EmptyState
              icon={CalendarPlus}
              title="Nothing scheduled yet"
              description="Plan your next study session and your group will get an invite."
              actionLabel={myGroups.length ? 'Schedule session' : 'Discover groups'}
              to={myGroups.length ? `/groups/${myGroups[0].id}/sessions/new` : '/discover'}
            />
          )}

          {/* your groups */}
          <section className="mt-9">
            <SectionHeader title="Your groups" action="See all" to="/my-groups" />
            {myGroups.length ? (
              <div className="divide-y divide-border border-y border-border">
                {myGroups.map((group) => (
                  <GroupRow key={group.id} group={group} unread={state.unread[group.id]} />
                ))}
              </div>
            ) : (
              <EmptyState
                compact
                icon={Users}
                title="You haven't joined any study groups yet"
                description="Find students in your courses and start studying together."
                actionLabel="Discover groups"
                to="/discover"
              />
            )}
          </section>

          {/* discover */}
          {suggestions.length > 0 && (
            <section className="mt-9">
              <SectionHeader title="Worth joining" action="Browse all" to="/discover" />
              <div className="grid gap-4 sm:grid-cols-2">
                {suggestions.map((group) => (
                  <GroupCard key={group.id} group={group} />
                ))}
              </div>
            </section>
          )}

          {/* On narrower screens the rail's content follows the column. */}
          <div className="mt-9 grid gap-9 sm:grid-cols-2 xl:hidden">
            <ThisWeek sessions={thisWeek} />
            <Activity items={activity} />
          </div>
        </div>

        {/* -------------------------------------------------------- rail */}
        <aside className="hidden xl:block">
          <div className="sticky top-0 space-y-8">
            <ThisWeek sessions={thisWeek} />
            <Activity items={activity} />
          </div>
        </aside>
      </div>
    </Page>
  )
}

/* ------------------------------------------------------------------ rail */

function ThisWeek({ sessions }: { sessions: ReturnType<typeof useMySessions>['upcoming'] }) {
  const { state } = useApp()

  return (
    <section>
      <h2 className="text-eyebrow mb-3 text-faint-foreground">Coming up</h2>
      {sessions.length ? (
        <ul className="space-y-3.5">
          {sessions.map((s) => {
            const group = state.groups.find((g) => g.id === s.groupId)
            return (
              <li key={s.id}>
                <Link to={`/sessions/${s.id}`} className="group block">
                  <p className="text-[13px] font-medium text-foreground-soft">
                    {shortWhen(s.startsAt)}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-foreground group-hover:text-primary">
                    {s.title}
                  </p>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">
                    {group?.courseCode} · {s.location}
                  </p>
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-[13px] text-muted-foreground">
          Nothing else on the calendar.{' '}
          <Link to="/sessions" className="text-primary hover:underline">
            View sessions
          </Link>
        </p>
      )}
    </section>
  )
}

function Activity({ items }: { items: ReturnType<typeof useActivity> }) {
  if (!items.length) {
    return (
      <section>
        <h2 className="text-eyebrow mb-3 text-faint-foreground">Activity</h2>
        <p className="text-[13px] text-muted-foreground">
          Nothing new. Join a group to see what people are working on.
        </p>
      </section>
    )
  }

  return (
    <section>
      <h2 className="text-eyebrow mb-3 text-faint-foreground">Activity</h2>
      <ul className="space-y-4">
        {items.map((item) => {
          const person = peopleById[item.actorId]
          return (
            <li key={item.id}>
              <Link
                to={
                  item.kind === 'message'
                    ? `/groups/${item.groupId}/chat`
                    : `/groups/${item.groupId}`
                }
                className="group flex gap-2.5"
              >
                <Avatar person={person} size="xs" className="mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] leading-snug text-foreground-soft">
                    <span className="font-semibold text-foreground">
                      {person?.name.split(' ')[0]}
                    </span>{' '}
                    {item.kind === 'message' ? (
                      <span className="line-clamp-2 text-muted-foreground">{item.text}</span>
                    ) : (
                      <span className="text-muted-foreground">{item.text}</span>
                    )}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-faint-foreground">
                    {item.kind === 'message' && (
                      <MessageSquare className="size-3" aria-hidden="true" />
                    )}
                    <span className="truncate group-hover:text-muted-foreground">
                      {item.groupName}
                    </span>
                    <span aria-hidden="true">·</span>
                    {relative(item.at)}
                  </p>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
