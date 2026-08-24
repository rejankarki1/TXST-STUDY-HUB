import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/primitives'
import { cn } from '@/lib/utils'

/**
 * Secondary by design: it sits below the fold, in the quiet surface, and never
 * competes with Next Up, Your groups, or Upcoming. Home only shows it to
 * students who already have groups — for everyone else the Your groups empty
 * state already points at Discover, and two of them would be one too many.
 */
export function DiscoveryCTA({ className }: { className?: string }) {
  return (
    <Card variant="subtle" className={cn('flex flex-wrap items-center gap-4', className)}>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-muted-foreground shadow-xs">
        <Compass className="size-[18px]" aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">Looking to join another group?</p>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          Find study groups in your courses and connect with classmates.
        </p>
      </div>

      <Button asChild variant="secondary" size="sm">
        <Link to="/discover">Discover groups</Link>
      </Button>
    </Card>
  )
}
