import * as React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Archive,
  ArrowLeft,
  CalendarClock,
  CalendarPlus,
  ExternalLink,
  LogOut,
  Trash2,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { Page } from '@/layouts/AppShell'
import { Button } from '@/components/ui/button'
import { Field, Input, Label, Textarea } from '@/components/ui/input'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Badge,
  Breadcrumb,
  Card,
  ConfirmDialog,
  CourseTag,
  EmptyState,
  Menu,
  Meta,
  Modal,
  SectionHeader,
  Skeleton,
} from '@/components/primitives'
import { Avatar } from '@/components/Avatar'
import { SessionRow } from '@/components/SessionRow'
import { circlesApi } from '@/lib/api'
import {
  CIRCLE_PURPOSE_LABELS,
  MEETING_STYLE_LABELS,
  SESSION_MODES,
  SESSION_MODE_LABELS,
  type SessionMode,
} from '@/lib/contracts'
import { courseHref } from '@/lib/courses'
import { defaultSlot, localInputToIso } from '@/lib/datetime'
import { byStart, byStartDesc, isUpcoming } from '@/lib/sessions'
import { plural } from '@/lib/utils'
import { useAsync } from '@/hooks/useAsync'

/**
 * A study circle: the roster, the cadence, and the next session.
 *
 * There is no chat tab. A circle is a standing team that meets — if its members
 * already talk somewhere, the owner can link that, and it stays clearly
 * secondary to the roster and the schedule.
 */
export default function CircleDetail() {
  const { circleId } = useParams()
  const navigate = useNavigate()

  const state = useAsync(async () => {
    const [circle, sessions] = await Promise.all([
      circlesApi.get(circleId!),
      circlesApi.sessions(circleId!),
    ])
    return { circle: circle.circle, sessions: sessions.sessions }
  }, [circleId])

  const circle = state.data?.circle
  const sessions = state.data?.sessions ?? []

  const [pending, setPending] = React.useState(false)
  const [scheduleOpen, setScheduleOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const [leaveOpen, setLeaveOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [archiveOpen, setArchiveOpen] = React.useState(false)

  if (state.loading && !circle) {
    return (
      <Page width="narrow">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-4 h-56 rounded-xl" />
      </Page>
    )
  }

  if (state.error || !circle) {
    return (
      <Page width="narrow">
        <EmptyState
          icon={Users}
          title="Study circle not found"
          description={state.error ?? 'It may have been deleted.'}
          actionLabel="Back home"
          to="/home"
        />
      </Page>
    )
  }

  const upcoming = sessions.filter(isUpcoming).toSorted(byStart)
  const past = sessions.filter((session) => !isUpcoming(session)).toSorted(byStartDesc)
  const archived = circle.status === 'ARCHIVED'

  const join = async () => {
    setPending(true)
    try {
      await circlesApi.join(circle.id)
      toast.success(`Joined ${circle.name}`)
      await state.reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not join')
    } finally {
      setPending(false)
    }
  }

  return (
    <Page width="narrow">
      <Button variant="ghost" size="sm" className="-ml-2 mb-3" onClick={() => navigate(-1)}>
        <ArrowLeft />
        Back
      </Button>

      <Breadcrumb
        className="mb-4"
        items={[
          { label: 'Courses', to: '/courses' },
          { label: circle.course.code, to: courseHref(circle.course) },
          { label: circle.name },
        ]}
      />

      <Card className="mb-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <CourseTag code={circle.course.code} size="sm" />
              <Badge tone="neutral">{CIRCLE_PURPOSE_LABELS[circle.purpose]}</Badge>
              <Badge tone="neutral">{circle.term}</Badge>
              {archived && <Badge tone="neutral">Archived</Badge>}
            </div>
            <h1 className="mt-3 text-xl font-semibold leading-snug tracking-tight text-foreground sm:text-2xl">
              {circle.name}
            </h1>
          </div>

          {circle.isOwner && (
            <Menu label="Circle options">
              <DropdownMenuItem onSelect={() => setEditOpen(true)}>Edit circle</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setArchiveOpen(true)}>
                <Archive />
                {archived ? 'Reopen circle' : 'Archive circle'}
              </DropdownMenuItem>
              <DropdownMenuItem destructive onSelect={() => setDeleteOpen(true)}>
                <Trash2 />
                Delete circle
              </DropdownMenuItem>
            </Menu>
          )}
        </div>

        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground-soft">
          {circle.description}
        </p>

        <Meta
          className="mt-4"
          items={[
            MEETING_STYLE_LABELS[circle.meetingStyle],
            circle.recurringSchedule && (
              <>
                <CalendarClock className="size-3.5" aria-hidden="true" />
                {circle.recurringSchedule}
              </>
            ),
            `${circle.memberCount}/${circle.maxMembers} members`,
          ]}
        />

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
          {!circle.isMember && !archived && !circle.isFull && (
            <Button variant="primary" disabled={pending} onClick={() => void join()}>
              <Users />
              {pending ? 'Joining…' : 'Join circle'}
            </Button>
          )}

          {circle.isMember && !archived && (
            <Button variant="primary" onClick={() => setScheduleOpen(true)}>
              <CalendarPlus />
              Schedule a session
            </Button>
          )}

          {circle.isMember && !circle.isOwner && (
            <Button variant="secondary" onClick={() => setLeaveOpen(true)}>
              <LogOut />
              Leave
            </Button>
          )}

          {circle.externalLink && (
            <Button asChild variant="ghost" size="sm">
              <a href={circle.externalLink} target="_blank" rel="noreferrer noopener">
                <ExternalLink />
                Group chat
              </a>
            </Button>
          )}
        </div>

        {circle.isFull && !circle.isMember && (
          <p className="mt-3 text-[13px] text-muted-foreground">
            This circle is full ({plural(circle.maxMembers, 'member')}).
          </p>
        )}

        {circle.isOwner && (
          <p className="mt-3 text-[13px] text-muted-foreground">
            You own this circle, so you can't leave it — archive it when the term ends, or delete
            it outright.
          </p>
        )}
      </Card>

      {/* --------------------------------------------------------- roster */}
      <section className="mb-6">
        <SectionHeader title="Roster" count={circle.memberCount} />
        <Card padded={false} className="overflow-hidden">
          <ul className="divide-y divide-border">
            {circle.members.map((member) => (
              <li key={member.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar person={member} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <span className="truncate">{member.name}</span>
                    {member.role === 'OWNER' && <Badge tone="primary">Owner</Badge>}
                  </p>
                  <Meta
                    className="mt-0.5"
                    items={[member.major, member.gradYear && `Class of ${member.gradYear}`]}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* ------------------------------------------------------- sessions */}
      <section className="mb-6">
        <SectionHeader title="Next sessions" count={upcoming.length || undefined} />
        {upcoming.length > 0 ? (
          <Card padded={false} className="overflow-hidden">
            <div className="divide-y divide-border">
              {upcoming.map((session) => (
                <SessionRow key={session.id} session={session} showCourse={false} />
              ))}
            </div>
          </Card>
        ) : (
          <EmptyState
            compact
            icon={CalendarPlus}
            title="Nothing scheduled"
            description={
              circle.isMember && !archived
                ? 'Any member can put the next meeting on the calendar.'
                : 'This circle has no upcoming sessions.'
            }
            actionLabel={circle.isMember && !archived ? 'Schedule a session' : undefined}
            onAction={circle.isMember && !archived ? () => setScheduleOpen(true) : undefined}
          />
        )}
      </section>

      {past.length > 0 && (
        <section className="mb-6">
          <SectionHeader title="Previous sessions" count={past.length} />
          <Card padded={false} className="overflow-hidden">
            <div className="divide-y divide-border">
              {past.map((session) => (
                <SessionRow key={session.id} session={session} showCourse={false} />
              ))}
            </div>
          </Card>
        </section>
      )}

      <p className="text-[13px] text-muted-foreground">
        Looking for one-off study partners instead?{' '}
        <Link
          to={`${courseHref(circle.course)}/study`}
          className="font-medium text-primary underline underline-offset-4"
        >
          Browse {circle.course.code} study requests
        </Link>
        .
      </p>

      <ScheduleSessionModal
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        circleId={circle.id}
        onScheduled={(sessionId) => navigate(`/sessions/${sessionId}`)}
      />

      <EditCircleModal
        open={editOpen}
        onOpenChange={setEditOpen}
        circle={circle}
        onSaved={() => void state.reload()}
      />

      <ConfirmDialog
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        title={`Leave ${circle.name}?`}
        description="You come off the roster. Sessions you already RSVP'd to stay on your schedule."
        confirmLabel="Leave circle"
        destructive
        onConfirm={async () => {
          await circlesApi.leave(circle.id)
          toast(`Left ${circle.name}`)
          await state.reload()
        }}
      />

      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={archived ? `Reopen ${circle.name}?` : `Archive ${circle.name}?`}
        description={
          archived
            ? 'It becomes joinable again and reappears in course listings.'
            : 'It stops appearing as joinable and no new sessions can be scheduled. The roster and past sessions are kept.'
        }
        confirmLabel={archived ? 'Reopen circle' : 'Archive circle'}
        onConfirm={async () => {
          await circlesApi.setArchived(circle.id, !archived)
          toast(archived ? 'Circle reopened' : 'Circle archived')
          await state.reload()
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${circle.name}?`}
        description="The roster is removed permanently. Sessions the circle scheduled are kept, so nobody loses a meeting they RSVP'd to."
        confirmLabel="Delete circle"
        destructive
        onConfirm={async () => {
          await circlesApi.remove(circle.id)
          toast('Circle deleted')
          navigate('/home')
        }}
      />
    </Page>
  )
}

/* --------------------------------------------------------- schedule modal */

function ScheduleSessionModal({
  open,
  onOpenChange,
  circleId,
  onScheduled,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  circleId: string
  onScheduled: (sessionId: string) => void
}) {
  const initial = React.useMemo(() => defaultSlot(3), [])

  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [startsAt, setStartsAt] = React.useState(initial.startsAt)
  const [endsAt, setEndsAt] = React.useState(initial.endsAt)
  const [mode, setMode] = React.useState<SessionMode>('IN_PERSON')
  const [location, setLocation] = React.useState('')
  const [locationDetail, setLocationDetail] = React.useState('')
  const [meetingLink, setMeetingLink] = React.useState('')
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [submitting, setSubmitting] = React.useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()

    const next: Record<string, string> = {}
    if (title.trim().length < 3) next.title = 'Give the session a title.'
    if (description.trim().length < 1) next.description = 'Say what you will work on.'
    if (!location.trim()) next.location = mode === 'ONLINE' ? 'Name the platform.' : 'Where?'
    if (mode === 'ONLINE' && !meetingLink.trim()) next.meetingLink = 'Online sessions need a link.'

    const startIso = localInputToIso(startsAt)
    const endIso = localInputToIso(endsAt)
    if (!startIso || !endIso || new Date(endIso) <= new Date(startIso)) {
      next.endsAt = 'End time must be after start time.'
    }

    setErrors(next)
    if (Object.keys(next).length > 0) return

    setSubmitting(true)
    try {
      const { session } = await circlesApi.createSession(circleId, {
        title: title.trim(),
        description: description.trim(),
        startsAt: startIso!,
        endsAt: endIso!,
        mode,
        location: location.trim(),
        locationDetail: locationDetail.trim() || undefined,
        meetingLink: meetingLink.trim() || undefined,
      })

      toast.success('Session scheduled')
      onOpenChange(false)
      onScheduled(session.id)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not schedule that session')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Schedule a circle session"
      description="Everyone on the roster sees it on their schedule."
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="Title" htmlFor="circle-session-title" error={errors.title}>
          <Input
            id="circle-session-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Problem Set 5 — graphs"
          />
        </Field>

        <Field label="What will you work on?" htmlFor="circle-session-desc" error={errors.description}>
          <Textarea
            id="circle-session-desc"
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="circle-session-start">Starts</Label>
            <Input
              id="circle-session-start"
              type="datetime-local"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="circle-session-end">Ends</Label>
            <Input
              id="circle-session-end"
              type="datetime-local"
              value={endsAt}
              onChange={(event) => setEndsAt(event.target.value)}
            />
            {errors.endsAt && <p className="text-xs text-danger">{errors.endsAt}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="circle-session-mode">Format</Label>
          <Select value={mode} onValueChange={(value) => setMode(value as SessionMode)}>
            <SelectTrigger id="circle-session-mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SESSION_MODES.map((option) => (
                <SelectItem key={option} value={option}>
                  {SESSION_MODE_LABELS[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Field
          label={mode === 'ONLINE' ? 'Platform' : 'Location'}
          htmlFor="circle-session-location"
          error={errors.location}
        >
          <Input
            id="circle-session-location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder={mode === 'ONLINE' ? 'Zoom' : 'Alkek Library'}
          />
        </Field>

        {mode === 'IN_PERSON' ? (
          <Field label="Room or detail" htmlFor="circle-session-detail" hint="Optional">
            <Input
              id="circle-session-detail"
              value={locationDetail}
              onChange={(event) => setLocationDetail(event.target.value)}
            />
          </Field>
        ) : (
          <Field label="Meeting link" htmlFor="circle-session-link" error={errors.meetingLink}>
            <Input
              id="circle-session-link"
              type="url"
              value={meetingLink}
              onChange={(event) => setMeetingLink(event.target.value)}
            />
          </Field>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Scheduling…' : 'Schedule session'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

/* ------------------------------------------------------------ edit modal */

function EditCircleModal({
  open,
  onOpenChange,
  circle,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  circle: NonNullable<Awaited<ReturnType<typeof circlesApi.get>>['circle']>
  onSaved: () => void
}) {
  const [name, setName] = React.useState(circle.name)
  const [description, setDescription] = React.useState(circle.description)
  const [recurringSchedule, setRecurringSchedule] = React.useState(circle.recurringSchedule ?? '')
  const [externalLink, setExternalLink] = React.useState(circle.externalLink ?? '')
  const [submitting, setSubmitting] = React.useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()

    setSubmitting(true)
    try {
      await circlesApi.update(circle.id, {
        name: name.trim(),
        description: description.trim(),
        recurringSchedule: recurringSchedule.trim() || undefined,
        externalLink: externalLink.trim() || undefined,
      })
      toast.success('Circle updated')
      onOpenChange(false)
      onSaved()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save those changes')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Edit circle">
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="Circle name" htmlFor="edit-circle-name">
          <Input id="edit-circle-name" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>

        <Field label="Description" htmlFor="edit-circle-desc">
          <Textarea
            id="edit-circle-desc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>

        <Field label="When do you meet?" htmlFor="edit-circle-schedule" hint="Optional">
          <Input
            id="edit-circle-schedule"
            value={recurringSchedule}
            onChange={(e) => setRecurringSchedule(e.target.value)}
          />
        </Field>

        <Field label="Group chat link" htmlFor="edit-circle-link" hint="Optional">
          <Input
            id="edit-circle-link"
            type="url"
            value={externalLink}
            onChange={(e) => setExternalLink(e.target.value)}
          />
        </Field>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
