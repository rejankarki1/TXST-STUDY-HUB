import { Link, useParams } from 'react-router-dom'
import { CalendarPlus, Lock, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarStack } from '@/components/Avatar'
import { EmptyState, SectionHeader } from '@/components/primitives'
import { NextSessionCard } from '@/components/NextSessionCard'
import { peopleById } from '@/data/people'
import { time } from '@/lib/format'
import {
  isMember,
  membersOf,
  useGroup,
  useGroupSessions,
  useLastMessages,
} from '@/state/selectors'

export default function GroupOverview() {
  const { groupId } = useParams()
  const group = useGroup(groupId)
  const { upcoming } = useGroupSessions(groupId)
  const recent = useLastMessages(groupId, 3)

  if (!group) return null

  const members = membersOf(group)
  const joined = isMember(group)
  const next = upcoming[0]

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10">
      <div className="space-y-9">
        {/* next session */}
        <section>
          {next ? (
            <NextSessionCard session={next} eyebrow="Next session" showGroupLink={false} />
          ) : (
            <EmptyState
              icon={CalendarPlus}
              title="Nothing scheduled yet"
              description={
                joined
                  ? 'Pick a time that works and the group will get an invite.'
                  : 'This group hasn’t planned its next session.'
              }
              actionLabel={joined ? 'Schedule session' : undefined}
              to={joined ? `/groups/${group.id}/sessions/new` : undefined}
            />
          )}
        </section>

        {/* about */}
        <section>
          <SectionHeader title="About" />
          <p className="text-sm leading-relaxed text-foreground-soft">{group.description}</p>
          <dl className="mt-4 flex flex-wrap gap-x-10 gap-y-3 text-[13px]">
            <div>
              <dt className="text-muted-foreground">Focus</dt>
              <dd className="mt-0.5 font-medium text-foreground">{group.purpose}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Usually meets</dt>
              <dd className="mt-0.5 font-medium capitalize text-foreground">
                {group.meetingStyle === 'in-person' ? 'In person' : group.meetingStyle}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Size</dt>
              <dd className="mt-0.5 font-medium text-foreground">
                {members.length} of {group.maxMembers}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Started by</dt>
              <dd className="mt-0.5 font-medium text-foreground">
                {peopleById[group.creatorId]?.name.split(' ')[0] ?? 'A student'}
              </dd>
            </div>
          </dl>
        </section>

        {/* recent chat — this is what makes the group feel alive */}
        <section>
          <SectionHeader
            title="Recent chat"
            action="Open chat"
            to={`/groups/${group.id}/chat`}
          />

          {!joined ? (
            <EmptyState
              compact
              icon={Lock}
              title="Join to see the conversation"
              description="Group chat is only visible to members."
            />
          ) : recent.length ? (
            <div className="space-y-4 rounded-lg border border-border bg-surface p-5">
              {recent.map((m) => {
                const person = peopleById[m.authorId]
                return (
                  <div key={m.id} className="flex gap-3">
                    <Avatar person={person} size="sm" className="mt-0.5" />
                    <div className="min-w-0">
                      <p className="flex items-baseline gap-2">
                        <span className="text-[13px] font-semibold text-foreground">
                          {person?.name}
                        </span>
                        <span className="text-xs text-faint-foreground">{time(m.sentAt)}</span>
                      </p>
                      <p className="break-message text-sm leading-relaxed text-foreground-soft">
                        {m.body}
                      </p>
                    </div>
                  </div>
                )
              })}

              <div className="border-t border-border pt-4">
                <Button asChild variant="secondary" size="sm">
                  <Link to={`/groups/${group.id}/chat`}>
                    <MessageSquare />
                    Open chat
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <EmptyState
              compact
              icon={MessageSquare}
              title="No messages yet"
              description={`Say hello and start planning ${group.name}'s first study session.`}
              actionLabel={joined ? 'Start the conversation' : undefined}
              to={joined ? `/groups/${group.id}/chat` : undefined}
            />
          )}
        </section>
      </div>

      {/* ------------------------------------------------------------ rail */}
      <aside className="space-y-8">
        <section>
          <SectionHeader
            title="Members"
            count={members.length}
            action="View all"
            to={`/groups/${group.id}/members`}
          />
          <AvatarStack people={members} max={6} size="md" className="mb-3" />
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            {members
              .slice(0, 4)
              .map((p) => p.name.split(' ')[0])
              .join(', ')}
            {members.length > 4 && ` and ${members.length - 4} more`}
          </p>
        </section>

        {upcoming.length > 1 && (
          <section>
            <SectionHeader
              title="Also coming up"
              action="All sessions"
              to={`/groups/${group.id}/sessions`}
            />
            <ul className="space-y-3.5">
              {upcoming.slice(1, 4).map((s) => (
                <li key={s.id}>
                  <Link to={`/sessions/${s.id}`} className="group block">
                    <p className="text-sm font-medium text-foreground group-hover:text-primary">
                      {s.title}
                    </p>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">
                      {new Date(s.startsAt).toLocaleDateString(undefined, {
                        weekday: 'long',
                      })}{' '}
                      · {time(s.startsAt)} · {s.location}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {!joined && (
          <section className="rounded-lg border border-border bg-surface p-5">
            <p className="text-sm font-medium text-foreground">Not a member yet</p>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
              Join to see the group chat and RSVP to study sessions.
            </p>
          </section>
        )}
      </aside>
    </div>
  )
}
