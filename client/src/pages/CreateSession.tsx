import * as React from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { CalendarPlus } from 'lucide-react'
import { Page } from '@/layouts/AppShell'
import { Button } from '@/components/ui/button'
import { Field, Input, Textarea } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/primitives'
import { CAMPUS_LOCATIONS } from '@/data/courses'
import { useApp } from '@/state/AppState'
import { isMember, useGroup } from '@/state/selectors'

function defaultStart() {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  date.setHours(17, 0, 0, 0)
  return date.toISOString().slice(0, 16)
}

export default function CreateSession() {
  const { groupId } = useParams()
  const group = useGroup(groupId)
  const { createSession } = useApp()
  const navigate = useNavigate()
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [startsAt, setStartsAt] = React.useState(defaultStart)
  const [durationMinutes, setDurationMinutes] = React.useState(90)
  const [mode, setMode] = React.useState<'in-person' | 'online'>('in-person')
  const [location, setLocation] = React.useState<string>(CAMPUS_LOCATIONS[0])
  const [locationDetail, setLocationDetail] = React.useState('')
  const [meetingLink, setMeetingLink] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)

  if (!group) return <Navigate to="/my-groups" replace />
  if (!isMember(group)) return <Navigate to={`/groups/${group.id}`} replace />

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      const id = await createSession({
        groupId: group.id,
        title: title.trim() || `${group.courseCode} study session`,
        description:
          description.trim() || 'Bring questions, notes, and the problems you want to review.',
        startsAt: new Date(startsAt).toISOString(),
        durationMinutes,
        mode,
        location: mode === 'online' ? 'Zoom' : location,
        locationDetail: mode === 'online' ? undefined : locationDetail.trim() || undefined,
        meetingLink: mode === 'online' ? meetingLink.trim() || 'https://txstate.zoom.us/' : undefined,
      })
      navigate(`/sessions/${id}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Page width="narrow">
      <PageHeader
        title="Schedule session"
        description={`Add a study session for ${group.name}.`}
      />

      <form onSubmit={submit} className="space-y-5">
        <Field label="Title" htmlFor="title">
          <Input
            id="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Chapter 6 review"
          />
        </Field>

        <Field label="Description" htmlFor="description">
          <Textarea
            id="description"
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What should everyone prepare?"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Starts" htmlFor="starts-at">
            <Input
              id="starts-at"
              type="datetime-local"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
            />
          </Field>

          <Field label="Duration" htmlFor="duration">
            <Select
              value={String(durationMinutes)}
              onValueChange={(value) => setDurationMinutes(Number(value))}
            >
              <SelectTrigger id="duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="90">1.5 hours</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field label="Mode" htmlFor="mode">
          <Select value={mode} onValueChange={(value) => setMode(value as 'in-person' | 'online')}>
            <SelectTrigger id="mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in-person">In person</SelectItem>
              <SelectItem value="online">Online</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        {mode === 'online' ? (
          <Field label="Meeting link" htmlFor="meeting-link">
            <Input
              id="meeting-link"
              value={meetingLink}
              onChange={(event) => setMeetingLink(event.target.value)}
              placeholder="https://txstate.zoom.us/..."
            />
          </Field>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Location" htmlFor="location">
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger id="location">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CAMPUS_LOCATIONS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Room or detail" htmlFor="location-detail">
              <Input
                id="location-detail"
                value={locationDetail}
                onChange={(event) => setLocationDetail(event.target.value)}
                placeholder="Room 244"
              />
            </Field>
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" variant="primary" disabled={submitting}>
            <CalendarPlus />
            {submitting ? 'Scheduling...' : 'Schedule session'}
          </Button>
        </div>
      </form>
    </Page>
  )
}
