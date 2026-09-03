import * as React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Users } from 'lucide-react'
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
import { Card, EmptyState, PageHeader } from '@/components/primitives'
import { ApiError, studyRequestsApi } from '@/lib/api'
import {
  INTENT_CHOICE_LABELS,
  INTENT_HINTS,
  MEETING_STYLES,
  MEETING_STYLE_LABELS,
  STUDY_REQUEST_INTENTS,
  type MeetingStyle,
  type StudyRequestIntent,
} from '@/lib/contracts'
import { defaultSlot, isFuture, localInputToIso } from '@/lib/datetime'
import { cn } from '@/lib/utils'
import { useAuth } from '@/state/AuthProvider'

type Slot = { startsAt: string; endsAt: string }
type Errors = Partial<Record<'courseId' | 'topic' | 'location' | 'times', string>>

const MAX_SLOTS = 3

/**
 * Posting a study request.
 *
 * The form is ordered the way the decision is made: what course, what topic,
 * what kind of help, then when. Times come last because they are the part people
 * change their mind about.
 */
export default function StudyRequestNew() {
  const { myCourses } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const prefilled = params.get('courseId') ?? ''
  const [courseId, setCourseId] = React.useState(
    myCourses.some((course) => course.id === prefilled) ? prefilled : myCourses[0]?.id ?? '',
  )
  const [topic, setTopic] = React.useState('')
  const [details, setDetails] = React.useState('')
  const [intent, setIntent] = React.useState<StudyRequestIntent>('NEED_HELP')
  const [meetingStyle, setMeetingStyle] = React.useState<MeetingStyle>('FLEXIBLE')
  const [location, setLocation] = React.useState('')
  const [maxParticipants, setMaxParticipants] = React.useState('4')
  const [slots, setSlots] = React.useState<Slot[]>([defaultSlot(1), defaultSlot(2)])
  const [errors, setErrors] = React.useState<Errors>({})
  const [submitting, setSubmitting] = React.useState(false)

  if (myCourses.length === 0) {
    return (
      <Page width="narrow">
        <EmptyState
          icon={Users}
          title="Add a course first"
          description="A study request belongs to a course, so you need at least one in My Courses."
          actionLabel="Browse courses"
          to="/courses"
        />
      </Page>
    )
  }

  const setSlot = (index: number, key: keyof Slot, value: string) =>
    setSlots((current) =>
      current.map((slot, position) =>
        position === index ? { ...slot, [key]: value } : slot,
      ),
    )

  const validate = () => {
    const next: Errors = {}

    if (!courseId) next.courseId = 'Pick a course.'
    if (topic.trim().length < 3) next.topic = 'Say what you want to study.'
    if (meetingStyle === 'IN_PERSON' && !location.trim()) {
      next.location = 'In-person requests need a place to meet.'
    }

    const usable = slots.filter((slot) => slot.startsAt && slot.endsAt)
    if (usable.length === 0) {
      next.times = 'Propose at least one time.'
    } else if (usable.some((slot) => new Date(slot.endsAt) <= new Date(slot.startsAt))) {
      next.times = 'Each window must end after it starts.'
    } else if (!usable.some((slot) => isFuture(slot.startsAt))) {
      next.times = 'At least one time needs to be in the future.'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validate()) return

    const timeOptions = slots
      .filter((slot) => slot.startsAt && slot.endsAt)
      .map((slot) => ({
        startsAt: localInputToIso(slot.startsAt)!,
        endsAt: localInputToIso(slot.endsAt)!,
      }))

    setSubmitting(true)
    try {
      const { studyRequest } = await studyRequestsApi.create(courseId, {
        topic: topic.trim(),
        details: details.trim() || undefined,
        intent,
        meetingStyle,
        location: location.trim() || undefined,
        maxParticipants: Number(maxParticipants),
        timeOptions,
      })

      toast.success('Study request posted')
      navigate(`/study-requests/${studyRequest.id}`)
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        setErrors({
          topic: error.fieldError('topic'),
          location: error.fieldError('location'),
          times: error.fieldError('timeOptions'),
        })
      }
      toast.error(error instanceof Error ? error.message : 'Could not post that request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Page width="narrow">
      <Button variant="ghost" size="sm" className="-ml-2 mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft />
        Back
      </Button>

      <PageHeader
        title="Find study partners"
        description="Say what you want to work on and when you could meet. Anyone in the course can join."
      />

      <form onSubmit={submit} noValidate className="space-y-6">
        <Card className="space-y-5">
          <Field label="Course" htmlFor="request-course" error={errors.courseId}>
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger id="request-course">
                <SelectValue placeholder="Pick a course" />
              </SelectTrigger>
              <SelectContent>
                {myCourses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.code} — {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field
            label="What do you want to study?"
            htmlFor="request-topic"
            error={errors.topic}
            hint="One topic works better than five"
          >
            <Input
              id="request-topic"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="Linked lists and pointer diagrams before Exam 1"
              aria-invalid={Boolean(errors.topic)}
            />
          </Field>

          <Field label="Details" htmlFor="request-details" hint="Optional">
            <Textarea
              id="request-details"
              rows={3}
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder="What you've already tried, which problems, what would help."
            />
          </Field>
        </Card>

        {/* ------------------------------------------------------- intent */}
        <Card className="space-y-4">
          <fieldset>
            <legend className="text-[13px] font-medium text-foreground">
              What are you looking for?
            </legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {STUDY_REQUEST_INTENTS.map((option) => (
                <label
                  key={option}
                  className={cn(
                    'cursor-pointer rounded-xl border px-4 py-3 transition-[border-color,background-color,box-shadow] duration-150',
                    intent === option
                      ? 'border-primary-border bg-primary-subtle shadow-xs'
                      : 'border-border bg-surface hover:border-border-strong hover:bg-surface-hover',
                  )}
                >
                  <input
                    type="radio"
                    name="intent"
                    className="sr-only"
                    checked={intent === option}
                    onChange={() => setIntent(option)}
                  />
                  <span className="block text-sm font-medium text-foreground">
                    {INTENT_CHOICE_LABELS[option]}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                    {INTENT_HINTS[option]}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="request-style">How would you meet?</Label>
              <Select
                value={meetingStyle}
                onValueChange={(value) => setMeetingStyle(value as MeetingStyle)}
              >
                <SelectTrigger id="request-style">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEETING_STYLES.map((style) => (
                    <SelectItem key={style} value={style}>
                      {MEETING_STYLE_LABELS[style]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="request-max">Max people</Label>
              <Select value={maxParticipants} onValueChange={setMaxParticipants}>
                <SelectTrigger id="request-max">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['2', '3', '4', '5', '6', '8', '10', '12'].map((value) => (
                    <SelectItem key={value} value={value}>
                      {value} people
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Field
            label="Where"
            htmlFor="request-location"
            error={errors.location}
            hint={meetingStyle === 'IN_PERSON' ? 'Required' : 'Optional'}
          >
            <Input
              id="request-location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Alkek Library, 4th floor"
              aria-invalid={Boolean(errors.location)}
            />
          </Field>
        </Card>

        {/* -------------------------------------------------------- times */}
        <Card className="space-y-4">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">When could you meet?</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Offer up to three windows. Whoever joins marks which ones they can make, and you
              confirm the one that works for everyone.
            </p>
          </div>

          <ul className="space-y-3">
            {slots.map((slot, index) => (
              <li
                key={index}
                className="rounded-xl border border-border bg-surface-sunken/50 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-medium text-foreground">
                    Option {index + 1}
                  </span>
                  {slots.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove option ${index + 1}`}
                      onClick={() =>
                        setSlots((current) => current.filter((_, i) => i !== index))
                      }
                    >
                      <Trash2 />
                    </Button>
                  )}
                </div>

                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor={`slot-${index}-start`}>Starts</Label>
                    <Input
                      id={`slot-${index}-start`}
                      type="datetime-local"
                      value={slot.startsAt}
                      onChange={(event) => setSlot(index, 'startsAt', event.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`slot-${index}-end`}>Ends</Label>
                    <Input
                      id={`slot-${index}-end`}
                      type="datetime-local"
                      value={slot.endsAt}
                      onChange={(event) => setSlot(index, 'endsAt', event.target.value)}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {errors.times && <p className="text-xs text-danger">{errors.times}</p>}

          {slots.length < MAX_SLOTS && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setSlots((current) => [...current, defaultSlot(current.length + 1)])}
            >
              <Plus />
              Add another time
            </Button>
          )}
        </Card>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="lg" disabled={submitting}>
            {submitting ? 'Posting…' : 'Post study request'}
          </Button>
        </div>
      </form>
    </Page>
  )
}
