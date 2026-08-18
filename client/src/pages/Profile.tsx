import type * as React from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, GraduationCap, Mail, User } from 'lucide-react'
import { Page } from '@/layouts/AppShell'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/Avatar'
import { PageHeader } from '@/components/primitives'
import { courseSlug } from '@/lib/courses'
import { useApp } from '@/state/AppState'

export default function Profile() {
  const { state, signOut } = useApp()
  const { profile } = state
  const courseDetailsByCode = Object.fromEntries(
    profile.courseDetails.map((course) => [course.code, course]),
  )

  return (
    <Page width="narrow">
      <PageHeader title="Profile" description="Your study account and enrolled courses." />

      <section className="rounded-lg border border-border bg-surface p-5">
        <div className="flex items-center gap-4">
          <Avatar person={{ name: profile.name }} size="lg" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold text-foreground">{profile.name}</h2>
            <p className="text-sm text-muted-foreground">{profile.major}</p>
          </div>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <Info icon={Mail} label="Email" value={profile.email} />
          <Info icon={GraduationCap} label="Graduation year" value={profile.gradYear} />
          <Info icon={User} label="Major" value={profile.major} />
          <Info icon={BookOpen} label="Courses" value={profile.courses.length} />
        </dl>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Courses</h2>
        <div className="divide-y divide-border border-y border-border">
          {profile.courses.map((code) => (
            <Link
              key={code}
              to={`/courses/${courseSlug(code)}`}
              className="block py-3.5 transition-colors hover:bg-surface-sunken/60 sm:-mx-3 sm:rounded-md sm:px-3"
            >
              <p className="text-sm font-medium text-foreground">{code}</p>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                {courseDetailsByCode[code]?.title ?? code}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <Button variant="danger" className="mt-8" onClick={signOut}>
        Sign out
      </Button>
    </Page>
  )
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-eyebrow text-faint-foreground">
        <Icon className="size-3.5" aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-foreground">{value}</dd>
    </div>
  )
}
