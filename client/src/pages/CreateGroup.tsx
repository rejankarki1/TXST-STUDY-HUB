import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Page } from '@/layouts/AppShell'
import { Button } from '@/components/ui/button'
import { Field, Input, Textarea } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/primitives'
import type { GroupPurpose, MeetingStyle } from '@/data/types'
import { useApp } from '@/state/AppState'

const PURPOSES: GroupPurpose[] = [
  'Exam prep',
  'Homework',
  'Weekly studying',
  'Project work',
  'General study',
]

const MEETING_STYLES: { value: MeetingStyle; label: string }[] = [
  { value: 'in-person', label: 'In person' },
  { value: 'online', label: 'Online' },
  { value: 'flexible', label: 'Flexible' },
]

export default function CreateGroup() {
  const { state, createGroup } = useApp()
  const navigate = useNavigate()
  const [name, setName] = React.useState('')
  const [courseId, setCourseId] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [purpose, setPurpose] = React.useState<GroupPurpose>('Weekly studying')
  const [meetingStyle, setMeetingStyle] = React.useState<MeetingStyle>('flexible')
  const [maxMembers, setMaxMembers] = React.useState(6)
  const selectedCourse = state.courses.find((course) => course.id === courseId)

  React.useEffect(() => {
    if (courseId || state.courses.length === 0) return

    const selectedUserCourse = state.courses.find((course) =>
      state.profile.courses.includes(course.code),
    )
    setCourseId((selectedUserCourse ?? state.courses[0]).id)
  }, [courseId, state.courses, state.profile.courses])

  const [submitting, setSubmitting] = React.useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedCourse) return

    setSubmitting(true)
    try {
      const id = await createGroup({
        name: name.trim() || `${selectedCourse.code} study group`,
        courseId: selectedCourse.id,
        description:
          description.trim() || 'A study group for classmates to compare notes and prepare together.',
        purpose,
        meetingStyle,
        maxMembers,
      })
      navigate(`/groups/${id}`)
    } catch {
      // AppState shows the API error toast.
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Page width="narrow">
      <PageHeader
        title="Create group"
        description="Start a course-based group that classmates can discover and join."
      />

      <form onSubmit={submit} className="space-y-5">
        <Field label="Group name" htmlFor="name">
          <Input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Data structures exam prep"
          />
        </Field>

        <Field label="Course" htmlFor="course">
          <Select value={courseId} onValueChange={setCourseId} disabled={state.coursesLoading}>
            <SelectTrigger id="course">
              <SelectValue
                placeholder={state.coursesLoading ? 'Loading courses...' : 'Choose a course'}
              />
            </SelectTrigger>
            <SelectContent>
              {state.courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.code} · {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state.coursesError && (
            <p className="mt-1.5 text-[13px] text-danger">{state.coursesError}</p>
          )}
          {!state.coursesLoading && !state.coursesError && state.courses.length === 0 && (
            <p className="mt-1.5 text-[13px] text-muted-foreground">
              No courses are available yet.
            </p>
          )}
        </Field>

        <Field label="Description" htmlFor="description">
          <Textarea
            id="description"
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What will this group work on?"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Purpose" htmlFor="purpose">
            <Select value={purpose} onValueChange={(value) => setPurpose(value as GroupPurpose)}>
              <SelectTrigger id="purpose">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PURPOSES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Meeting style" htmlFor="meeting-style">
            <Select
              value={meetingStyle}
              onValueChange={(value) => setMeetingStyle(value as MeetingStyle)}
            >
              <SelectTrigger id="meeting-style">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEETING_STYLES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field label="Member limit" htmlFor="max-members" hint="3-12">
          <Input
            id="max-members"
            type="number"
            min={3}
            max={12}
            value={maxMembers}
            onChange={(event) => setMaxMembers(Number(event.target.value))}
          />
        </Field>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" disabled={!selectedCourse || submitting}>
            <Plus />
            {submitting ? 'Creating...' : 'Create group'}
          </Button>
        </div>
      </form>
    </Page>
  )
}
