import * as React from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Lock, Paperclip, Send, Smile, Users } from 'lucide-react'
import type { GroupMember, Message } from '@/data/types'
import { Avatar } from '@/components/Avatar'
import { Button } from '@/components/ui/button'
import { peopleById, VIEWER_ID } from '@/data/people'
import { chatDayLabel, sameDay, time } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useApp } from '@/state/AppState'
import { isMember, membersOf, useGroup, useGroupMessages } from '@/state/selectors'

/** Consecutive messages from one person within this window get grouped. */
const GROUPING_WINDOW_MS = 5 * 60 * 1000
const MESSAGE_POLL_MS = 4000

type Row =
  | { kind: 'day'; id: string; iso: string }
  | { kind: 'unread'; id: string }
  | { kind: 'message'; id: string; message: Message; grouped: boolean }

function buildRows(messages: Message[], firstUnreadId: string | null): Row[] {
  const rows: Row[] = []

  messages.forEach((message, i) => {
    const prev = messages[i - 1]

    if (!prev || !sameDay(prev.sentAt, message.sentAt)) {
      rows.push({ kind: 'day', id: `day-${message.id}`, iso: message.sentAt })
    }

    if (message.id === firstUnreadId) {
      rows.push({ kind: 'unread', id: 'unread-divider' })
    }

    const grouped =
      !!prev &&
      prev.authorId === message.authorId &&
      sameDay(prev.sentAt, message.sentAt) &&
      new Date(message.sentAt).getTime() - new Date(prev.sentAt).getTime() <
        GROUPING_WINDOW_MS &&
      message.id !== firstUnreadId

    rows.push({ kind: 'message', id: message.id, message, grouped })
  })

  return rows
}

export default function GroupChat() {
  const { groupId } = useParams()
  const group = useGroup(groupId)
  const { state, loadGroupMessages, sendMessage, markGroupRead } = useApp()
  const messages = useGroupMessages(groupId)

  const scrollRef = React.useRef<HTMLDivElement>(null)
  const bottomRef = React.useRef<HTMLDivElement>(null)
  const loadMessagesRef = React.useRef(loadGroupMessages)

  React.useEffect(() => {
    loadMessagesRef.current = loadGroupMessages
  }, [loadGroupMessages])

  /* The unread marker is frozen on entry — it shouldn't jump while you read. */
  const [unreadAnchor] = React.useState(() => {
    const count = groupId ? (state.unread[groupId] ?? 0) : 0
    if (!count) return null
    return messages[messages.length - count]?.id ?? null
  })

  React.useEffect(() => {
    if (groupId) markGroupRead(groupId)
  }, [groupId, markGroupRead])

  React.useEffect(() => {
    if (!groupId || !group?.isMember || state.demoMode) return

    void loadMessagesRef.current(groupId).catch(() => undefined)
    const id = window.setInterval(() => {
      void loadMessagesRef.current(groupId).catch(() => undefined)
    }, MESSAGE_POLL_MS)

    return () => window.clearInterval(id)
  }, [groupId, group?.isMember, state.demoMode])

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, state.typingIn])

  if (!group) return null

  const joined = isMember(group)
  const members = membersOf(group)
  const typing = state.typingIn === group.id
  const rows = buildRows(messages, unreadAnchor)
  const viewerId = state.demoMode ? VIEWER_ID : state.currentUser?.id
  const authors = new Map<string, Pick<GroupMember, 'id' | 'name'>>(
    members.map((member) => [member.id, member]),
  )
  if (state.currentUser) {
    authors.set(state.currentUser.id, {
      id: state.currentUser.id,
      name: state.currentUser.name ?? state.currentUser.email,
    })
  }

  return (
    <div className="flex h-full flex-col bg-surface-raised lg:border-t lg:border-border">
      {/* Mobile header — the desktop one lives in GroupLayout. */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-2 lg:hidden">
        <Link
          to={`/groups/${group.id}`}
          className="flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
          aria-label="Back to group"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{group.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {members.length} members · {group.courseCode}
          </p>
        </div>
        <Link
          to={`/groups/${group.id}/members`}
          className="flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
          aria-label="View members"
        >
          <Users className="size-[18px]" />
        </Link>
      </header>

      {/* transcript */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto scroll-slim">
        <div className="mx-auto max-w-3xl px-3 py-4 sm:px-5">
          {messages.length === 0 ? (
            <EmptyChat groupName={group.name} />
          ) : (
            <>
              <ChatIntro groupName={group.name} />
              {rows.map((row) => {
                if (row.kind === 'day') return <DaySeparator key={row.id} iso={row.iso} />
                if (row.kind === 'unread') return <UnreadDivider key={row.id} />
                return (
                  <MessageRow
                    key={row.id}
                    message={row.message}
                    grouped={row.grouped}
                    author={authors.get(row.message.authorId)}
                    viewerId={viewerId}
                  />
                )
              })}
            </>
          )}

          {typing && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* composer */}
      {joined ? (
        <Composer groupName={group.name} onSend={(body) => sendMessage(group.id, body)} />
      ) : (
        <div className="safe-bottom shrink-0 border-t border-border px-4 py-4">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
            <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <Lock className="size-4 shrink-0" aria-hidden="true" />
              Join the group to send messages.
            </p>
            <Button asChild size="sm" variant="primary">
              <Link to={`/groups/${group.id}`}>View group</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------- messages */

function MessageRow({
  message,
  grouped,
  author,
  viewerId,
}: {
  message: Message
  grouped: boolean
  author?: Pick<GroupMember, 'id' | 'name'>
  viewerId?: string
}) {
  const person = author ?? peopleById[message.authorId]
  const isMine = message.authorId === viewerId

  return (
    <div
      className={cn(
        'group/message relative -mx-2 rounded-lg px-2 transition-colors hover:bg-surface-hover',
        grouped ? 'py-0.5' : 'mt-4 py-1 first:mt-0',
      )}
    >
      <div className="flex gap-3">
        {grouped ? (
          /* Timestamp fills the avatar gutter on hover — Slack's trick, and it
             keeps grouped runs visually tight without losing the detail. */
          <span
            className="mt-[3px] w-9 shrink-0 text-right text-[10px] leading-5 text-faint-foreground opacity-0 transition-opacity group-hover/message:opacity-100"
            aria-hidden="true"
          >
            {time(message.sentAt).replace(/\s?[AP]M/, '')}
          </span>
        ) : (
          <Avatar person={person} size="md" className="mt-0.5" />
        )}

        <div className="min-w-0 flex-1">
          {!grouped && (
            <p className="flex items-baseline gap-2">
              <span
                className={cn(
                  'text-sm font-semibold',
                  isMine ? 'text-primary' : 'text-foreground',
                )}
              >
                {person?.name ?? 'Unknown'}
                {isMine && <span className="ml-1.5 font-normal text-faint-foreground">you</span>}
              </span>
              <span className="text-[11px] text-faint-foreground">{time(message.sentAt)}</span>
            </p>
          )}
          <p className="break-message whitespace-pre-wrap text-[14.5px] leading-relaxed text-foreground-soft">
            {message.body}
          </p>
        </div>
      </div>
    </div>
  )
}

function DaySeparator({ iso }: { iso: string }) {
  return (
    <div className="my-6 flex items-center gap-3 first:mt-2">
      <span className="h-px flex-1 bg-border" />
      <span className="text-[11px] font-medium uppercase tracking-wide text-faint-foreground">
        {chatDayLabel(iso)}
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}

function UnreadDivider() {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-primary/35" />
      <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">
        New messages
      </span>
      <span className="h-px flex-1 bg-primary/35" />
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="mt-4 flex items-center gap-3 px-2">
      <span className="flex w-9 justify-center" aria-hidden="true">
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="size-1.5 animate-bounce rounded-full bg-faint-foreground"
              style={{ animationDelay: `${i * 120}ms`, animationDuration: '900ms' }}
            />
          ))}
        </span>
      </span>
      <span className="text-[13px] text-muted-foreground">Someone is typing…</span>
    </div>
  )
}

function ChatIntro({ groupName }: { groupName: string }) {
  return (
    <div className="mb-2 px-2 pt-3">
      <p className="text-[13px] text-muted-foreground">
        This is the beginning of{' '}
        <span className="font-medium text-foreground">{groupName}</span>.
      </p>
    </div>
  )
}

function EmptyChat({ groupName }: { groupName: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center py-20 text-center">
      <span className="text-3xl" aria-hidden="true">
        👋
      </span>
      <p className="mt-4 text-[15px] font-medium text-foreground">Start the conversation</p>
      <p className="mt-1.5 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
        This is the beginning of {groupName}. Say hello and start planning your first study
        session.
      </p>
    </div>
  )
}

/* -------------------------------------------------------------- composer */

function Composer({
  groupName,
  onSend,
}: {
  groupName: string
  onSend: (body: string) => Promise<void> | void
}) {
  const [value, setValue] = React.useState('')
  const [sending, setSending] = React.useState(false)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  /* Auto-grow, capped so the transcript never disappears behind the composer. */
  React.useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [value])

  async function send() {
    const body = value.trim()
    if (!body || sending) return
    setSending(true)
    try {
      await onSend(body)
      setValue('')
      textareaRef.current?.focus()
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="safe-bottom shrink-0 border-t border-border bg-surface-raised px-3 py-3 shadow-[0_-8px_24px_-22px_rgb(28_26_25_/_0.5)] sm:px-5">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-end gap-2 rounded-xl border border-border-strong bg-surface px-2 py-1.5 shadow-xs transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
          <button
            type="button"
            className="hidden size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground sm:flex"
            aria-label="Attach a file"
            tabIndex={-1}
          >
            <Paperclip className="size-[18px]" />
          </button>

          <label htmlFor="composer" className="sr-only">
            Message {groupName}
          </label>
          <textarea
            id="composer"
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void send()
              }
            }}
            placeholder={`Message ${groupName}…`}
            className="max-h-40 flex-1 resize-none bg-transparent py-2 text-[14.5px] leading-relaxed text-foreground placeholder:text-faint-foreground focus:outline-none"
          />

          <button
            type="button"
            className="hidden size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-sunken hover:text-foreground sm:flex"
            aria-label="Add an emoji"
            tabIndex={-1}
          >
            <Smile className="size-[18px]" />
          </button>

          <button
            type="button"
            onClick={() => void send()}
            disabled={!value.trim() || sending}
            aria-label="Send message"
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-md transition-colors',
              value.trim() && !sending
                ? 'bg-primary text-primary-foreground hover:bg-primary-hover'
                : 'text-faint-foreground',
            )}
          >
            <Send className="size-[16px]" />
          </button>
        </div>

        <p className="mt-1.5 hidden px-1 text-[11px] text-faint-foreground sm:block">
          <kbd className="font-sans font-medium">Enter</kbd> to send ·{' '}
          <kbd className="font-sans font-medium">Shift + Enter</kbd> for a new line
        </p>
      </div>
    </div>
  )
}
