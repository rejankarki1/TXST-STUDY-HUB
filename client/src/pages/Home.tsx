import * as React from 'react'
import { Page } from '@/layouts/AppShell'
import { DiscoveryCTA } from '@/components/home/DiscoveryCTA'
import { HomeGroups } from '@/components/home/HomeGroups'
import { HomeHeader } from '@/components/home/HomeHeader'
import { NextUpCard } from '@/components/home/NextUpCard'
import { RecentActivity } from '@/components/home/RecentActivity'
import { UpcomingPanel } from '@/components/home/UpcomingPanel'
import { useApp } from '@/state/AppState'
import { useMyGroups, useMySessions } from '@/state/selectors'

/**
 * Home answers one question: what should I know or do next.
 *
 * Priority runs top-left to bottom-right — the next session, then the groups
 * that produce sessions, then the schedule and what changed. Finding new groups
 * is Discover's job, the full group list is My Groups', the full agenda is
 * Sessions'; Home only previews and links out.
 *
 * This file composes. The sections own their own markup and branching.
 */
export default function Home() {
  const { state, refreshSessions } = useApp()
  const myGroups = useMyGroups()
  const { upcoming } = useMySessions()

  React.useEffect(() => {
    void refreshSessions()
  }, [])

  const next = upcoming[0]
  const nextGroup = next ? state.groups.find((group) => group.id === next.groupId) : undefined
  const firstName = state.profile.name.split(' ')[0]

  return (
    <Page width="wide">
      <HomeHeader firstName={firstName} groups={myGroups} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
        <div className="min-w-0 space-y-8">
          <NextUpCard session={next} group={nextGroup} groups={myGroups} />
          <HomeGroups groups={myGroups} unread={state.unread} />
        </div>

        {/* <main> is the scroll container, so the rail can simply stick. */}
        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <UpcomingPanel sessions={upcoming} groups={myGroups} />
          <RecentActivity />
        </aside>
      </div>

      {myGroups.length > 0 && <DiscoveryCTA className="mt-8" />}
    </Page>
  )
}
