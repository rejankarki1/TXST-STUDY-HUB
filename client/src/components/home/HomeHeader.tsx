import { Link } from 'react-router-dom'
import type { Group } from '@/data/types'
import { Button } from '@/components/ui/button'
import { ScheduleSessionButton } from '@/components/ScheduleSessionButton'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

/**
 * The page's one primary action lives here. The supporting line stays constant —
 * whether anything is scheduled is Next Up's story to tell, and saying it twice
 * is what made the old Home feel like it was repeating itself.
 */
export function HomeHeader({ firstName, groups }: { firstName: string; groups: Group[] }) {
  return (
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {greeting()}, {firstName}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Here's what's happening with your study groups.
        </p>
      </div>

      {/* Scheduling is the primary action once you have a group to schedule with.
          Before that, finding one is the only thing to do, so it takes the slot. */}
      <div className="flex items-center gap-2">
        <Button
          asChild
          variant={groups.length ? 'ghost' : 'primary'}
          className={groups.length ? 'hidden sm:inline-flex' : undefined}
        >
          <Link to="/discover">Find a group</Link>
        </Button>
        <ScheduleSessionButton groups={groups} />
      </div>
    </header>
  )
}
