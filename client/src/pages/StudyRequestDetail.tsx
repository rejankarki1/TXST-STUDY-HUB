import * as React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarCheck, LogOut, Users, X } from 'lucide-react'
import { toast } from 'sonner'
import { Page } from '@/layouts/AppShell'
import { Button } from '@/components/ui/button'
import { Field, Input, Label, Textarea } from '@/components/ui/input'
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
  Meta,
  Modal,
  SectionHeader,
  Skeleton,
} from '@/components/primitives'
import { Avatar } from '@/components/Avatar'
import { TimeOptionPicker } from '@/components/TimeOptionPicker'
import { studyRequestsApi, type ApiStudyRequest } from '@/lib/api'
import {
  INTENT_LABELS,
  INTENT_TONES,
  MEETING_STYLE_LABELS,
  SESSION_MODES,
  SESSION_MODE_LABELS,
  STUDY_REQUEST_STATUS_LABELS,
  type SessionMode,
} from '@/lib/contracts'
import { courseHref } from '@/lib/courses'
import { dayLabel, relative, timeRange } from '@/lib/format'
import { bestTimeOption, canJoin, myTimeOptionIds, toggleTimeOption } from '@/lib/requests'
import { plural } from '@/lib/utils'
import { useAsync } from '@/hooks/useAsync'

/**
 * One study request: who is in, when they can meet, and — for the person who
 * posted it — the button that turns all of that into a real session.
 */
export default function StudyRequestDetail() {
  const { requestId } = useParams()
  const navigate = useNavigate()

  const state = useAsync(() => studyRequestsApi.get(requestId!), [requestId])
  const request = state.data?.studyRequest

  /* The picker's selection is derived until the student touches it. Seeding it
     from an effect meant an extra render on every reload, and a stale selection
     whenever the request came back changed. */
  const [override, setOverride] = React.useState<string[] | null>(null)
  const [pending, setPending] = React.useState(false)
  const [convertOpen, setConvertOpen] = React.useState(false)
  const [cancelOpen, setCancelOpen] = React.useState(false)
  const [withdrawOpen, setWithdrawOpen] = React.useState(false)

  if (state.loading && !request) {
    return (
      <Page width="narrow">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-4 h-56 rounded-xl" />
      </Page>
    )
  }

  if (state.error || !request) {
    return (
      <Page width="narrow">
        <EmptyState
          icon={Users}
          title="Study request not found"
          description={state.error ?? 'It may have been cancelled or removed.'}
          actionLabel="Back home"
          to="/home"
        />
      </Page>
    )
  }

  /* A participant sees the windows they already committed to; a newcomer starts
     with all of them ticked, which is the honest default before they narrow it. */
  const mine = myTimeOptionIds(request)
  const selected =
    override ?? (mine.length > 0 ? mine : request.timeOptions.map((option) => option.id))

  const joinable = canJoin(request)
  const canSetAvailability = request.hasJoined && !request.isCreator && request.status === 'OPEN'

  const run = async (action: () => Promise<unknown>, success: string) => {
    setPending(true)
    try {
      await action()
      toast.success(success)
      /* Drop the local override so the refreshed server value takes over. */
      setOverride(null)
      await state.reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
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
          { label: request.course.code, to: courseHref(request.course) },
          { label: 'Study request' },
        ]}
      />

      {/* ------------------------------------------------------- summary */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={INTENT_TONES[request.intent]}>{INTENT_LABELS[request.intent]}</Badge>
          <CourseTag code={request.course.code} size="sm" />
          {request.status !== 'OPEN' && (
            <Badge tone={request.status === 'CONVERTED' ? 'success' : 'neutral'}>
              {STUDY_REQUEST_STATUS_LABELS[request.status]}
            </Badge>
          )}
        </div>

        <h1 className="mt-3 text-xl font-semibold leading-snug tracking-tight text-foreground sm:text-2xl">
          {request.topic}
        </h1>

        {request.details && (
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground-soft">
            {request.details}
          </p>
        )}

        <Meta
          className="mt-4"
          items={[
            request.location ?? MEETING_STYLE_LABELS[request.meetingStyle],
            `${request.participantCount}/${request.maxParticipants} joined`,
            request.spotsLeft > 0 ? `${plural(request.spotsLeft, 'spot')} left` : 'Full',
          ]}
        />

        <div className="mt-5 flex items-center gap-2.5 border-t border-border pt-4">
          <Avatar person={request.creator} size="sm" />
          <span className="text-[13px] text-muted-foreground">
            Posted by {request.creator.name} · {relative(request.createdAt)}
          </span>
        </div>
      </Card>

      {/* --------------------------------------------- converted banner */}
      {request.status === 'CONVERTED' && request.sessionId && (
        <Card variant="subtle" className="mb-6 border-success/30 bg-success-subtle/40">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
              <CalendarCheck className="size-4 text-success" aria-hidden="true" />
              This request became a study session.
            </p>
            <Button asChild variant="primary" size="sm">
              <Link to={`/sessions/${request.sessionId}`}>Open the session</Link>
            </Button>
          </div>
        </Card>
      )}

      {/* ---------------------------------------------------------- times */}
      <section className="mb-6">
        <SectionHeader
          title={
            request.isCreator ? 'Times you proposed' : 'Which of these can you make?'
          }
          count={request.timeOptions.length}
        />

        <TimeOptionPicker
          options={request.timeOptions}
          selected={selected}
          onToggle={(optionId) => setOverride(toggleTimeOption(selected, optionId))}
          disabled={!joinable && !canSetAvailability}
        />

        <div className="mt-4 flex flex-wrap gap-2">
          {joinable && (
            <Button
              variant="primary"
              disabled={pending}
              onClick={() =>
                void run(
                  () => studyRequestsApi.join(request.id, selected),
                  'You joined this request',
                )
              }
            >
              <Users />
              {pending ? 'Joining…' : 'Join with these times'}
            </Button>
          )}

          {canSetAvailability && (
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() =>
                void run(
                  () => studyRequestsApi.setAvailability(request.id, selected),
                  'Availability updated',
                )
              }
            >
              Update my times
            </Button>
          )}

          {request.isCreator && request.status === 'OPEN' && (
            <Button variant="primary" onClick={() => setConvertOpen(true)}>
              <CalendarCheck />
              Confirm a time
            </Button>
          )}
        </div>

        {!joinable && !request.hasJoined && request.status === 'OPEN' && request.isFull && (
          <p className="mt-3 text-[13px] text-muted-foreground">
            This request is full. Try another, or post your own for the same topic.
          </p>
        )}
      </section>

      {/* --------------------------------------------------- participants */}
      <section className="mb-6">
        <SectionHeader title="Who's in" count={request.participantCount} />
        <Card padded={false} className="overflow-hidden">
          <ul className="divide-y divide-border">
            {request.participants.map((participant) => (
              <li key={participant.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar person={participant} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <span className="truncate">{participant.name}</span>
                    {participant.isCreator && <Badge tone="primary">Organizer</Badge>}
                  </p>
                  <Meta
                    className="mt-0.5"
                    items={[
                      participant.major,
                      `${plural(participant.timeOptionIds.length, 'time')} available`,
                    ]}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* -------------------------------------------------------- actions */}
      {(request.isCreator || request.hasJoined) && request.status === 'OPEN' && (
        <div className="flex flex-wrap gap-2 border-t border-border pt-5">
          {request.isCreator ? (
            <Button variant="danger" onClick={() => setCancelOpen(true)}>
              <X />
              Cancel this request
            </Button>
          ) : (
            <Button variant="danger" onClick={() => setWithdrawOpen(true)}>
              <LogOut />
              Withdraw
            </Button>
          )}
        </div>
      )}

      {convertOpen && (
        <ConvertModal
          open
          onOpenChange={setConvertOpen}
          request={request}
          onConverted={(sessionId) => navigate(`/sessions/${sessionId}`)}
        />
      )}

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel this study request?"
        description="It stops showing as an opening and nobody else can join. Anyone already in keeps seeing it as cancelled."
        confirmLabel="Cancel request"
        destructive
        onConfirm={async () => {
          await studyRequestsApi.cancel(request.id)
          toast('Study request cancelled')
          await state.reload()
        }}
      />

      <ConfirmDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        title="Withdraw from this request?"
        description="Your availability is removed and your spot opens up for someone else. You can join again while it stays open."
        confirmLabel="Withdraw"
        destructive
        onConfirm={async () => {
          await studyRequestsApi.withdraw(request.id)
          toast('You left this request')
          await state.reload()
        }}
      />
    </Page>
  )
}

/* ----------------------------------------------------------- conversion */

/**
 * The organiser confirms one proposed window and it becomes a session.
 *
 * The window with the most availability is preselected, because that is the
 * decision the data already made — the organiser just has to agree with it.
 */
function ConvertModal({
  open,
  onOpenChange,
  request,
  onConverted,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: ApiStudyRequest
  onConverted: (sessionId: string) => void
}) {
  const best = bestTimeOption(request.timeOptions)

  const [timeOptionId, setTimeOptionId] = React.useState(best?.id ?? '')
  const [mode, setMode] = React.useState<SessionMode>(
    request.meetingStyle === 'ONLINE' ? 'ONLINE' : 'IN_PERSON',
  )
  const [location, setLocation] = React.useState(request.location ?? '')
  const [locationDetail, setLocationDetail] = React.useState('')
  const [meetingLink, setMeetingLink] = React.useState('')
  const [agenda, setAgenda] = React.useState('')
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [submitting, setSubmitting] = React.useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()

    const next: Record<string, string> = {}
    if (!timeOptionId) next.timeOptionId = 'Pick the time you are confirming.'
    if (!location.trim()) next.location = mode === 'ONLINE' ? 'Name the platform.' : 'Where are you meeting?'
    if (mode === 'ONLINE' && !meetingLink.trim()) next.meetingLink = 'Online sessions need a link.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setSubmitting(true)
    try {
      const { session } = await studyRequestsApi.convertToSession(request.id, {
        timeOptionId,
        mode,
        location: location.trim(),
        locationDetail: locationDetail.trim() || undefined,
        meetingLink: meetingLink.trim() || undefined,
        agenda: agenda.trim() || undefined,
      })

      toast.success('Study session confirmed')
      onOpenChange(false)
      onConverted(session.id)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not confirm that time')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Confirm a study session"
      description="Everyone who joined gets added to the session and can RSVP."
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="convert-time">Time</Label>
          <Select value={timeOptionId} onValueChange={setTimeOptionId}>
            <SelectTrigger id="convert-time">
              <SelectValue placeholder="Pick a time" />
            </SelectTrigger>
            <SelectContent>
              {request.timeOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {dayLabel(option.startsAt)} · {timeRange(option.startsAt, option.endsAt)} (
                  {plural(option.availableCount, 'person', 'people')})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.timeOptionId && <p className="text-xs text-danger">{errors.timeOptionId}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="convert-mode">Format</Label>
          <Select value={mode} onValueChange={(value) => setMode(value as SessionMode)}>
            <SelectTrigger id="convert-mode">
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
          htmlFor="convert-location"
          error={errors.location}
        >
          <Input
            id="convert-location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder={mode === 'ONLINE' ? 'Zoom' : 'Alkek Library'}
            aria-invalid={Boolean(errors.location)}
          />
        </Field>

        {mode === 'IN_PERSON' ? (
          <Field label="Room or detail" htmlFor="convert-detail" hint="Optional">
            <Input
              id="convert-detail"
              value={locationDetail}
              onChange={(event) => setLocationDetail(event.target.value)}
              placeholder="4th floor, group room B"
            />
          </Field>
        ) : (
          <Field label="Meeting link" htmlFor="convert-link" error={errors.meetingLink}>
            <Input
              id="convert-link"
              type="url"
              value={meetingLink}
              onChange={(event) => setMeetingLink(event.target.value)}
              placeholder="https://txstate.zoom.us/j/…"
              aria-invalid={Boolean(errors.meetingLink)}
            />
          </Field>
        )}

        <Field label="Agenda" htmlFor="convert-agenda" hint="Optional">
          <Textarea
            id="convert-agenda"
            rows={3}
            value={agenda}
            onChange={(event) => setAgenda(event.target.value)}
            placeholder="What you plan to get through."
          />
        </Field>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Confirming…' : 'Confirm session'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
