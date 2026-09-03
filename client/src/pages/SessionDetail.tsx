import * as React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  Lock,
  MapPin,
  Pencil,
  Users,
  Video,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Page } from '@/layouts/AppShell'
import { Button } from '@/components/ui/button'
import { Field, Input, Label, Textarea } from '@/components/ui/input'
import {
  Badge,
  Breadcrumb,
  Card,
  ConfirmDialog,
  CourseTag,
  EmptyState,
  Meta,
  Modal,
  SectionHeader,
  Skeleton,
} from '@/components/primitives'
import { Avatar } from '@/components/Avatar'
import { RsvpControl } from '@/components/RsvpControl'
import { sessionsApi, type ApiSession } from '@/lib/api'
import {
  RSVP_LABELS,
  SESSION_STATUS_LABELS,
  type RsvpStatus,
} from '@/lib/contracts'
import { courseHref } from '@/lib/courses'
import { fullDate, timeRange } from '@/lib/format'
import { isoToLocalInput, localInputToIso } from '@/lib/datetime'
import { plural } from '@/lib/utils'
import { useAsync } from '@/hooks/useAsync'

const RSVP_TONES = { GOING: 'success', MAYBE: 'warning', CANT: 'neutral' } as const

/**
 * One study session. The organiser gets the lifecycle controls; everyone on the
 * RSVP list gets the meeting details. Anyone else sees that it exists and
 * nothing more.
 */
export default function SessionDetail() {
  const { sessionId } = useParams()
  const navigate = useNavigate()

  const state = useAsync(() => sessionsApi.get(sessionId!), [sessionId])
  const session = state.data?.session

  const [editOpen, setEditOpen] = React.useState(false)
  const [completeOpen, setCompleteOpen] = React.useState(false)
  const [cancelOpen, setCancelOpen] = React.useState(false)

  if (state.loading && !session) {
    return (
      <Page width="narrow">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-4 h-64 rounded-xl" />
      </Page>
    )
  }

  if (state.error || !session) {
    return (
      <Page width="narrow">
        <EmptyState
          icon={CalendarClock}
          title="Session not found"
          description={state.error ?? 'It may have been cancelled or removed.'}
          actionLabel="Back to schedule"
          to="/schedule"
        />
      </Page>
    )
  }

  const setRsvp = async (status: RsvpStatus) => {
    await sessionsApi.setRsvp(session.id, status)
    await state.reload()
  }

  const cancelled = session.status === 'CANCELLED'
  const completed = session.status === 'COMPLETED'

  return (
    <Page width="narrow">
      <Button variant="ghost" size="sm" className="-ml-2 mb-3" onClick={() => navigate(-1)}>
        <ArrowLeft />
        Back
      </Button>

      <Breadcrumb
        className="mb-4"
        items={[
          { label: 'Schedule', to: '/schedule' },
          { label: session.course.code, to: courseHref(session.course) },
          { label: session.title },
        ]}
      />

      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <CourseTag code={session.course.code} size="sm" />
          {session.status !== 'PLANNED' && (
            <Badge tone={completed ? 'success' : 'neutral'}>
              {SESSION_STATUS_LABELS[session.status]}
            </Badge>
          )}
          {session.isOrganizer && <Badge tone="primary">You're organizing</Badge>}
          {session.circle && <Badge tone="neutral">{session.circle.name}</Badge>}
        </div>

        <h1 className="mt-3 text-xl font-semibold leading-snug tracking-tight text-foreground sm:text-2xl">
          {session.title}
        </h1>

        <div className="mt-4 space-y-2 text-sm">
          <p className="flex items-center gap-2.5 text-foreground-soft">
            <CalendarClock className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            {fullDate(session.startsAt)} · {timeRange(session.startsAt, session.endsAt)}
          </p>
          <p className="flex items-center gap-2.5 text-foreground-soft">
            {session.mode === 'ONLINE' ? (
              <Video className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            ) : (
              <MapPin className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            )}
            {session.location}
            {session.locationDetail && ` · ${session.locationDetail}`}
          </p>
        </div>

        {session.description && (
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground-soft">
            {session.description}
          </p>
        )}

        {session.agenda && (
          <div className="mt-4 rounded-lg border border-border bg-surface-sunken/60 p-3">
            <p className="text-eyebrow text-faint-foreground">Agenda</p>
            <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-foreground-soft">
              {session.agenda}
            </p>
          </div>
        )}

        {/* The link is the one thing worth protecting; the server already
            withholds it, and this explains the gap rather than showing nothing. */}
        {session.mode === 'ONLINE' && (
          <div className="mt-4">
            {session.meetingLink ? (
              <Button asChild variant="secondary" size="sm">
                <a href={session.meetingLink} target="_blank" rel="noreferrer noopener">
                  <ExternalLink />
                  Join online
                </a>
              </Button>
            ) : (
              <p className="inline-flex items-center gap-2 text-[13px] text-muted-foreground">
                <Lock className="size-3.5" aria-hidden="true" />
                The meeting link is visible to people in this session.
              </p>
            )}
          </div>
        )}

        <div className="mt-5 flex items-center gap-2.5 border-t border-border pt-4">
          <Avatar person={session.organizer} size="sm" />
          <span className="text-[13px] text-muted-foreground">
            Organized by {session.organizer.name}
          </span>
        </div>
      </Card>

      {session.studyRequest && (
        <p className="mb-6 text-[13px] text-muted-foreground">
          Came from the study request{' '}
          <Link
            to={`/study-requests/${session.studyRequest.id}`}
            className="font-medium text-primary underline underline-offset-4"
          >
            “{session.studyRequest.topic}”
          </Link>
        </p>
      )}

      {/* ----------------------------------------------------------- rsvp */}
      {session.canAccessDetails && !cancelled && !completed && (
        <Card className="mb-6">
          <SectionHeader title="Are you going?" className="mb-3" />
          <RsvpControl value={session.myRsvp} onChange={setRsvp} />
          <Meta
            className="mt-3"
            items={[
              `${session.goingCount} going`,
              `${session.maybeCount} maybe`,
              `${session.cantCount} can't`,
            ]}
          />
        </Card>
      )}

      {cancelled && (
        <Card variant="subtle" className="mb-6 border-danger/25">
          <p className="text-sm text-foreground-soft">
            This session was cancelled by the organiser.
          </p>
        </Card>
      )}

      {completed && (session.recap || session.topicsCompleted) && (
        <Card variant="subtle" className="mb-6 border-success/25 bg-success-subtle/30">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
            <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
            Session recap
          </p>
          {session.topicsCompleted && (
            <p className="mt-2 text-[13px] text-muted-foreground">
              <span className="font-medium text-foreground-soft">Covered:</span>{' '}
              {session.topicsCompleted}
            </p>
          )}
          {session.recap && (
            <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-foreground-soft">
              {session.recap}
            </p>
          )}
        </Card>
      )}

      {/* ------------------------------------------------------ attendees */}
      <section className="mb-6">
        <SectionHeader
          title="Who's coming"
          count={session.canAccessDetails ? session.attendees.length : undefined}
        />
        {session.canAccessDetails ? (
          <Card padded={false} className="overflow-hidden">
            <ul className="divide-y divide-border">
              {session.attendees.map((attendee) => (
                <li key={attendee.id} className="flex items-center gap-3 px-4 py-3">
                  <Avatar person={attendee} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {attendee.name}
                    </p>
                    <Meta className="mt-0.5" items={[attendee.major]} />
                  </div>
                  <Badge tone={RSVP_TONES[attendee.status]}>{RSVP_LABELS[attendee.status]}</Badge>
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <Card variant="subtle">
            <p className="inline-flex items-center gap-2 text-[13px] text-muted-foreground">
              <Users className="size-3.5" aria-hidden="true" />
              {plural(session.goingCount, 'person', 'people')} going. Attendee details are visible
              to people in this session.
            </p>
          </Card>
        )}
      </section>

      {/* --------------------------------------------------- organizer ops */}
      {session.isOrganizer && !cancelled && (
        <div className="flex flex-wrap gap-2 border-t border-border pt-5">
          {!completed && (
            <>
              <Button variant="secondary" onClick={() => setEditOpen(true)}>
                <Pencil />
                Edit session
              </Button>
              <Button variant="primary" onClick={() => setCompleteOpen(true)}>
                <CheckCircle2 />
                Mark complete
              </Button>
              <Button variant="danger" onClick={() => setCancelOpen(true)}>
                <X />
                Cancel session
              </Button>
            </>
          )}
        </div>
      )}

      <EditSessionModal
        open={editOpen}
        onOpenChange={setEditOpen}
        session={session}
        onSaved={() => void state.reload()}
      />

      <CompleteSessionModal
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        session={session}
        onCompleted={() => void state.reload()}
      />

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel this session?"
        description="Everyone who RSVP'd sees it as cancelled. This cannot be undone."
        confirmLabel="Cancel session"
        destructive
        onConfirm={async () => {
          await sessionsApi.cancel(session.id)
          toast('Session cancelled')
          await state.reload()
        }}
      />
    </Page>
  )
}

/* ---------------------------------------------------------------- edit */

function EditSessionModal({
  open,
  onOpenChange,
  session,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: ApiSession
  onSaved: () => void
}) {
  const [title, setTitle] = React.useState(session.title)
  const [description, setDescription] = React.useState(session.description)
  const [agenda, setAgenda] = React.useState(session.agenda ?? '')
  const [startsAt, setStartsAt] = React.useState(isoToLocalInput(session.startsAt))
  const [endsAt, setEndsAt] = React.useState(isoToLocalInput(session.endsAt))
  const [location, setLocation] = React.useState(session.location)
  const [locationDetail, setLocationDetail] = React.useState(session.locationDetail ?? '')
  const [meetingLink, setMeetingLink] = React.useState(session.meetingLink ?? '')
  const [error, setError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()

    const startIso = localInputToIso(startsAt)
    const endIso = localInputToIso(endsAt)

    if (!startIso || !endIso || new Date(endIso) <= new Date(startIso)) {
      setError('End time must be after start time.')
      return
    }

    setError(null)
    setSubmitting(true)
    try {
      await sessionsApi.update(session.id, {
        title: title.trim(),
        description: description.trim(),
        agenda: agenda.trim() || undefined,
        startsAt: startIso,
        endsAt: endIso,
        location: location.trim(),
        locationDetail: locationDetail.trim() || undefined,
        meetingLink: meetingLink.trim() || undefined,
      })
      toast.success('Session updated')
      onOpenChange(false)
      onSaved()
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Could not save those changes')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Edit session">
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="Title" htmlFor="edit-title">
          <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>

        <Field label="Description" htmlFor="edit-description">
          <Textarea
            id="edit-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-start">Starts</Label>
            <Input
              id="edit-start"
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-end">Ends</Label>
            <Input
              id="edit-end"
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />
          </div>
        </div>

        <Field label="Location" htmlFor="edit-location">
          <Input
            id="edit-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </Field>

        {session.mode === 'IN_PERSON' ? (
          <Field label="Room or detail" htmlFor="edit-detail" hint="Optional">
            <Input
              id="edit-detail"
              value={locationDetail}
              onChange={(e) => setLocationDetail(e.target.value)}
            />
          </Field>
        ) : (
          <Field label="Meeting link" htmlFor="edit-link">
            <Input
              id="edit-link"
              type="url"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
            />
          </Field>
        )}

        <Field label="Agenda" htmlFor="edit-agenda" hint="Optional">
          <Textarea
            id="edit-agenda"
            rows={3}
            value={agenda}
            onChange={(e) => setAgenda(e.target.value)}
          />
        </Field>

        {error && <p className="text-xs text-danger">{error}</p>}

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

/* ------------------------------------------------------------ complete */

/**
 * Completing a session, and the one place a session turns into lasting course
 * knowledge: an unresolved question can become a Course Question, but only when
 * the organiser explicitly ticks the box.
 */
function CompleteSessionModal({
  open,
  onOpenChange,
  session,
  onCompleted,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: ApiSession
  onCompleted: () => void
}) {
  const [topicsCompleted, setTopicsCompleted] = React.useState('')
  const [recap, setRecap] = React.useState('')
  const [question, setQuestion] = React.useState('')
  const [saveAsQuestion, setSaveAsQuestion] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()

    setSubmitting(true)
    try {
      const { questionId } = await sessionsApi.complete(session.id, {
        topicsCompleted: topicsCompleted.trim() || undefined,
        recap: recap.trim() || undefined,
        unresolvedQuestion: question.trim() || undefined,
        saveAsQuestion: saveAsQuestion && question.trim().length > 0,
      })

      toast.success(questionId ? 'Session completed and question posted' : 'Session completed')
      onOpenChange(false)
      onCompleted()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not complete the session')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Mark session complete"
      description="A short record of what the group got through. Everything here is optional."
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="Topics covered" htmlFor="complete-topics" hint="Optional">
          <Input
            id="complete-topics"
            value={topicsCompleted}
            onChange={(event) => setTopicsCompleted(event.target.value)}
            placeholder="Separate chaining, load factor tradeoffs"
          />
        </Field>

        <Field label="Recap" htmlFor="complete-recap" hint="Optional">
          <Textarea
            id="complete-recap"
            rows={3}
            value={recap}
            onChange={(event) => setRecap(event.target.value)}
            placeholder="What went well, what is still shaky."
          />
        </Field>

        <Field label="Anything you couldn't resolve?" htmlFor="complete-question" hint="Optional">
          <Input
            id="complete-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="When does an array decay to a pointer?"
          />
        </Field>

        {question.trim().length > 0 && (
          <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border bg-surface-sunken/60 p-3">
            <input
              type="checkbox"
              checked={saveAsQuestion}
              onChange={(event) => setSaveAsQuestion(event.target.checked)}
              className="mt-0.5 size-4 accent-[var(--primary)]"
            />
            <span className="text-[13px] leading-relaxed text-foreground-soft">
              Post this to {session.course.code} questions so someone else can answer it.
            </span>
          </label>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Mark complete'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
