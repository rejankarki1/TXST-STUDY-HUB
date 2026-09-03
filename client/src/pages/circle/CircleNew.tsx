import * as React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Users } from 'lucide-react'
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
import { ApiError, circlesApi } from '@/lib/api'
import {
  CIRCLE_PURPOSES,
  CIRCLE_PURPOSE_LABELS,
  MEETING_STYLES,
  MEETING_STYLE_LABELS,
  type CirclePurpose,
  type MeetingStyle,
} from '@/lib/contracts'
import { useAuth } from '@/state/AuthProvider'

/** "Fall 2026" — the current term, and the two after it. */
function termOptions() {
  const now = new Date()
  const year = now.getFullYear()
  const seasons = ['Spring', 'Summer', 'Fall']
  const startIndex = now.getMonth() >= 7 ? 2 : now.getMonth() >= 4 ? 1 : 0

  return Array.from({ length: 3 }, (_, offset) => {
    const index = startIndex + offset
    return `${seasons[index % 3]} ${year + Math.floor(index / 3)}`
  })
}

type Errors = Partial<Record<'courseId' | 'name' | 'description' | 'externalLink', string>>

/**
 * Starting a recurring study circle.
 *
 * A circle is a commitment, so the form asks for the two things that make it one:
 * a term it belongs to, and the cadence it meets on.
 */
export default function CircleNew() {
  const { myCourses } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const terms = React.useMemo(() => termOptions(), [])
  const prefilled = params.get('courseId') ?? ''

  const [courseId, setCourseId] = React.useState(
    myCourses.some((course) => course.id === prefilled) ? prefilled : myCourses[0]?.id ?? '',
  )
  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [purpose, setPurpose] = React.useState<CirclePurpose>('WEEKLY_STUDYING')
  const [meetingStyle, setMeetingStyle] = React.useState<MeetingStyle>('IN_PERSON')
  const [maxMembers, setMaxMembers] = React.useState('6')
  const [term, setTerm] = React.useState(terms[0])
  const [recurringSchedule, setRecurringSchedule] = React.useState('')
  const [externalLink, setExternalLink] = React.useState('')
  const [errors, setErrors] = React.useState<Errors>({})
  const [submitting, setSubmitting] = React.useState(false)

  if (myCourses.length === 0) {
    return (
      <Page width="narrow">
        <EmptyState
          icon={Users}
          title="Add a course first"
          description="A study circle belongs to one course."
          actionLabel="Browse courses"
          to="/courses"
        />
      </Page>
    )
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()

    const next: Errors = {}
    if (!courseId) next.courseId = 'Pick a course.'
    if (name.trim().length < 5) next.name = 'Give the circle a name (5+ characters).'
    if (description.trim().length < 10) next.description = 'Say what this circle is for.'
    if (externalLink.trim() && !/^https?:\/\//i.test(externalLink.trim())) {
      next.externalLink = 'Enter a full URL starting with https://'
    }
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setSubmitting(true)
    try {
      const { circle } = await circlesApi.create({
        courseId,
        name: name.trim(),
        description: description.trim(),
        purpose,
        meetingStyle,
        maxMembers: Number(maxMembers),
        term,
        recurringSchedule: recurringSchedule.trim() || undefined,
        externalLink: externalLink.trim() || undefined,
      })

      toast.success(`${circle.name} created`)
      navigate(`/circles/${circle.id}`)
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        setErrors({
          name: error.fieldError('name'),
          description: error.fieldError('description'),
          externalLink: error.fieldError('externalLink'),
        })
      }
      toast.error(error instanceof Error ? error.message : 'Could not create that circle')
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
        title="Start a study circle"
        description="A recurring team for one course — a standing roster that meets on a cadence."
      />

      <form onSubmit={submit} noValidate className="space-y-6">
        <Card className="space-y-5">
          <Field label="Course" htmlFor="circle-course" error={errors.courseId}>
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger id="circle-course">
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

          <Field label="Circle name" htmlFor="circle-name" error={errors.name}>
            <Input
              id="circle-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="CS 3358 Tuesday Problem Set Crew"
              aria-invalid={Boolean(errors.name)}
            />
          </Field>

          <Field label="What is this circle for?" htmlFor="circle-description" error={errors.description}>
            <Textarea
              id="circle-description"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="We meet every Tuesday to work the problem set together before it is due."
              aria-invalid={Boolean(errors.description)}
            />
          </Field>
        </Card>

        <Card className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="circle-purpose">Purpose</Label>
              <Select
                value={purpose}
                onValueChange={(value) => setPurpose(value as CirclePurpose)}
              >
                <SelectTrigger id="circle-purpose">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CIRCLE_PURPOSES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {CIRCLE_PURPOSE_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="circle-style">Meeting style</Label>
              <Select
                value={meetingStyle}
                onValueChange={(value) => setMeetingStyle(value as MeetingStyle)}
              >
                <SelectTrigger id="circle-style">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEETING_STYLES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {MEETING_STYLE_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="circle-term">Term</Label>
              <Select value={term} onValueChange={setTerm}>
                <SelectTrigger id="circle-term">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {terms.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="circle-max">Max members</Label>
              <Select value={maxMembers} onValueChange={setMaxMembers}>
                <SelectTrigger id="circle-max">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['3', '4', '5', '6', '8', '10', '12'].map((value) => (
                    <SelectItem key={value} value={value}>
                      {value} members
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Field label="When do you meet?" htmlFor="circle-schedule" hint="Optional">
            <Input
              id="circle-schedule"
              value={recurringSchedule}
              onChange={(event) => setRecurringSchedule(event.target.value)}
              placeholder="Tuesdays 6:00 PM, Alkek 4th floor"
            />
          </Field>

          <Field
            label="Group chat link"
            htmlFor="circle-link"
            error={errors.externalLink}
            hint="Optional"
          >
            <Input
              id="circle-link"
              type="url"
              value={externalLink}
              onChange={(event) => setExternalLink(event.target.value)}
              placeholder="https://…"
              aria-invalid={Boolean(errors.externalLink)}
            />
          </Field>
          <p className="-mt-2 text-xs text-muted-foreground">
            TXST Study Hub doesn't host chat. If your circle already uses one, link it here.
          </p>
        </Card>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="lg" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create circle'}
          </Button>
        </div>
      </form>
    </Page>
  )
}
