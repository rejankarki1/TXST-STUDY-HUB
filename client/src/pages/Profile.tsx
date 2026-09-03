import * as React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, Check, Eye, EyeOff, LogOut, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Page } from '@/layouts/AppShell'
import { Button } from '@/components/ui/button'
import { Field, Input, Label } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  SectionHeader,
} from '@/components/primitives'
import { Avatar } from '@/components/Avatar'
import { AddCourseDialog } from '@/components/AddCourseDialog'
import { courseHref } from '@/lib/courses'
import { courseVars } from '@/lib/utils'
import { useAuth } from '@/state/AuthProvider'
import type { ApiCourse } from '@/lib/api'

const currentYear = new Date().getFullYear()
const GRAD_YEARS = Array.from({ length: 9 }, (_, index) => String(currentYear + index))

/**
 * Account settings only.
 *
 * Deliberately not a social profile: no followers, no bio, no posts. The one
 * genuinely product-shaping control here is study-profile visibility, which
 * decides whether classmates can see you in a Course Hub's People tab.
 */
export default function Profile() {
  const { user, myCourses, updateProfile, removeCourse, signOut } = useAuth()
  const navigate = useNavigate()

  /* AppShell only renders this route for a signed-in, onboarded user, so the
     form can initialise straight from the session rather than being synced by
     an effect after the fact. */
  const [name, setName] = React.useState(user?.name ?? '')
  const [major, setMajor] = React.useState(user?.major ?? '')
  const [gradYear, setGradYear] = React.useState(user?.gradYear ? String(user.gradYear) : '')
  const [saving, setSaving] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [addOpen, setAddOpen] = React.useState(false)
  const [removing, setRemoving] = React.useState<ApiCourse | null>(null)
  const [visibilityPending, setVisibilityPending] = React.useState(false)

  if (!user) return null

  const dirty =
    name !== (user.name ?? '') ||
    major !== (user.major ?? '') ||
    gradYear !== (user.gradYear ? String(user.gradYear) : '')

  const save = async (event: React.FormEvent) => {
    event.preventDefault()

    if (name.trim().length < 1) {
      setError('Enter your name.')
      return
    }
    if (major.trim().length < 2) {
      setError('Pick a major.')
      return
    }

    setError(null)
    setSaving(true)
    try {
      await updateProfile({
        name: name.trim(),
        major: major.trim(),
        gradYear: Number(gradYear) || undefined,
      })
      setSaved(true)
      toast.success('Profile updated')
      window.setTimeout(() => setSaved(false), 2500)
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Could not save your profile'
      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const toggleVisibility = async () => {
    setVisibilityPending(true)
    try {
      const next = await updateProfile({ studyProfileVisible: !user.studyProfileVisible })
      toast.success(
        next.studyProfileVisible
          ? 'Classmates can see you in your courses'
          : 'You are hidden from course People tabs',
      )
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Could not change that setting')
    } finally {
      setVisibilityPending(false)
    }
  }

  return (
    <Page width="narrow">
      <PageHeader title="Profile" description="Your account and what classmates can see." />

      <Card className="mb-6 flex items-center gap-4">
        <Avatar person={{ name: user.name ?? 'Student' }} size="xl" />
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-foreground">
            {user.name ?? 'Student'}
          </p>
          <p className="truncate text-[13px] text-muted-foreground">{user.email}</p>
        </div>
      </Card>

      {/* ------------------------------------------------------- details */}
      <Card className="mb-6">
        <SectionHeader title="Details" className="mb-4" />
        <form onSubmit={save} noValidate className="space-y-4">
          <Field label="Name" htmlFor="profile-name">
            <Input
              id="profile-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Major" htmlFor="profile-major">
              <Input
                id="profile-major"
                value={major}
                onChange={(event) => setMajor(event.target.value)}
              />
            </Field>

            <div className="space-y-1.5">
              <Label htmlFor="profile-grad">Graduation year</Label>
              <Select value={gradYear} onValueChange={setGradYear}>
                <SelectTrigger id="profile-grad">
                  <SelectValue placeholder="Choose a year" />
                </SelectTrigger>
                <SelectContent>
                  {GRAD_YEARS.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <p role="alert" className="text-[13px] text-danger">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" variant="primary" disabled={saving || !dirty}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
            {saved && (
              <span
                role="status"
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-success"
              >
                <Check className="size-3.5" aria-hidden="true" />
                Saved
              </span>
            )}
          </div>
        </form>
      </Card>

      {/* ----------------------------------------------------- visibility */}
      <Card className="mb-6">
        <SectionHeader title="Study profile" className="mb-3" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 max-w-md">
            <p className="text-sm font-medium text-foreground">
              {user.studyProfileVisible ? 'Visible to classmates' : 'Hidden from classmates'}
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
              When visible, students in your courses can see your name, major and graduation year
              in the course People tab. Your email is never shown, and there is no way for anyone
              to message you directly.
            </p>
          </div>

          <Button
            variant="secondary"
            disabled={visibilityPending}
            onClick={() => void toggleVisibility()}
          >
            {user.studyProfileVisible ? <EyeOff /> : <Eye />}
            {visibilityPending
              ? 'Saving…'
              : user.studyProfileVisible
                ? 'Hide me'
                : 'Make me visible'}
          </Button>
        </div>
      </Card>

      {/* ------------------------------------------------------- courses */}
      <section className="mb-6">
        <SectionHeader
          title="My courses"
          count={myCourses.length || undefined}
          action="Add a course"
          onAction={() => setAddOpen(true)}
        />

        {myCourses.length === 0 ? (
          <EmptyState
            compact
            icon={BookOpen}
            title="No courses yet"
            description="Add the classes you're taking to see study requests and sessions."
            actionLabel="Add a course"
            onAction={() => setAddOpen(true)}
          />
        ) : (
          <Card padded={false} className="overflow-hidden">
            <ul className="divide-y divide-border">
              {myCourses.map((course) => (
                <li
                  key={course.id}
                  style={courseVars(course.code)}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <span
                    className="size-2 shrink-0 rounded-full bg-(--course)"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      to={courseHref(course)}
                      className="text-sm font-medium text-foreground hover:text-primary"
                    >
                      {course.code}
                    </Link>
                    <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                      {course.title}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${course.code}`}
                    onClick={() => setRemoving(course)}
                  >
                    <Trash2 />
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>

      {/* -------------------------------------------------------- account */}
      <Card variant="subtle">
        <SectionHeader title="Account" className="mb-3" />
        <Button
          variant="danger"
          onClick={() => {
            void signOut().then(() => navigate('/'))
          }}
        >
          <LogOut />
          Sign out
        </Button>
      </Card>

      <AddCourseDialog open={addOpen} onOpenChange={setAddOpen} />

      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`Remove ${removing?.code}?`}
        description="Anything you posted in that course is kept, and you can add it back any time. It just stops appearing in your sidebar and on Home."
        confirmLabel="Remove course"
        destructive
        onConfirm={async () => {
          if (removing) await removeCourse(removing.id)
          setRemoving(null)
        }}
      />
    </Page>
  )
}
