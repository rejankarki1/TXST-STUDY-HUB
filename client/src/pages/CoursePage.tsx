import type * as React from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Calendar, Plus, Users } from 'lucide-react'
import { Page } from '@/layouts/AppShell'
import { Button } from '@/components/ui/button'
import { EmptyState, PageHeader, SectionHeader } from '@/components/primitives'
import { GroupCard } from '@/components/GroupCard'
import { SessionRow } from '@/components/rows'
import { codeFromSlug, coursesByCode } from '@/data/courses'
import { useCourseStats } from '@/state/selectors'

export default function CoursePage() {
  const { slug } = useParams()
  const code = codeFromSlug(slug ?? '')
  const stats = useCourseStats(code ?? '')

  if (!code) return <Navigate to="/discover" replace />

  const course = coursesByCode[code]
  const groupNames = new Map(stats.groups.map((group) => [group.id, group.name]))

  return (
    <Page>
      <PageHeader
        title={code}
        description={`${course.title} · ${course.department}`}
        action={
          <Button asChild variant="primary">
            <Link to="/groups/new">
              <Plus />
              Create group
            </Link>
          </Button>
        }
      />

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <Stat icon={Users} label="Students" value={stats.studentCount} />
        <Stat icon={Users} label="Groups" value={stats.groups.length} />
        <Stat icon={Calendar} label="Upcoming" value={stats.upcomingSessions.length} />
      </div>

      <section>
        <SectionHeader title="Study groups" count={stats.groups.length} action="Find more" to="/discover" />
        {stats.groups.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {stats.groups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title="No groups for this course yet"
            description="Start the first group and classmates will be able to join."
            actionLabel="Create group"
            to="/groups/new"
          />
        )}
      </section>

      {stats.upcomingSessions.length > 0 && (
        <section className="mt-9">
          <SectionHeader title="Upcoming sessions" count={stats.upcomingSessions.length} />
          <div className="divide-y divide-border border-y border-border">
            {stats.upcomingSessions.map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                showDay
                showGroup={groupNames.get(session.groupId)}
              />
            ))}
          </div>
        </section>
      )}
    </Page>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
        {label}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  )
}
