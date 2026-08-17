import * as React from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

/* -------------------------------------------------------------------------
   Course label — the small, quiet, ever-present "what class is this?" mark.
   Deliberately typographic rather than a pill, so cards don't drown in badges.
   ---------------------------------------------------------------------- */
export function CourseLabel({
  code,
  className,
  as = 'span',
}: {
  code: string
  className?: string
  as?: 'span' | 'div'
}) {
  const Comp = as
  return (
    <Comp className={cn('text-eyebrow text-muted-foreground', className)}>{code}</Comp>
  )
}

/* -------------------------------------------------------------------------
   Badge — only for genuine state. Never for course code, counts, or times.
   ---------------------------------------------------------------------- */
export function Badge({
  children,
  tone = 'neutral',
  className,
  icon: Icon,
}: {
  children: React.ReactNode
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'primary'
  className?: string
  icon?: React.ComponentType<{ className?: string }>
}) {
  const tones = {
    neutral: 'bg-surface-sunken text-muted-foreground',
    success: 'bg-success-subtle text-success',
    warning: 'bg-warning-subtle text-warning',
    danger: 'bg-danger-subtle text-danger',
    primary: 'bg-primary-subtle text-primary',
  } as const

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-4',
        tones[tone],
        className,
      )}
    >
      {Icon && <Icon className="size-3" />}
      {children}
    </span>
  )
}

/* -------------------------------------------------------------------------
   Section header — title on the left, one optional action on the right.
   ---------------------------------------------------------------------- */
export function SectionHeader({
  title,
  action,
  to,
  onAction,
  className,
  count,
}: {
  title: string
  action?: string
  to?: string
  onAction?: () => void
  className?: string
  count?: number
}) {
  return (
    <div className={cn('mb-3 flex items-baseline justify-between gap-4', className)}>
      <h2 className="text-sm font-semibold text-foreground">
        {title}
        {count !== undefined && (
          <span className="ml-2 font-normal text-faint-foreground">{count}</span>
        )}
      </h2>
      {action && to && (
        <Link
          to={to}
          className="group inline-flex items-center gap-0.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          {action}
          <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
      {action && !to && (
        <button
          type="button"
          onClick={onAction}
          className="text-[13px] font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          {action}
        </button>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------
   Page header — title, optional supporting line, optional right-side action.
   ---------------------------------------------------------------------- */
export function PageHeader({
  title,
  description,
  action,
  className,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-7 flex flex-wrap items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}

/* -------------------------------------------------------------------------
   Empty state — one icon, one line, one route out. Never a dead end.
   ---------------------------------------------------------------------- */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  to,
  onAction,
  className,
  compact,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  actionLabel?: string
  to?: string
  onAction?: () => void
  className?: string
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 text-center',
        compact ? 'py-8' : 'py-14',
        className,
      )}
    >
      <span className="mb-3 flex size-10 items-center justify-center rounded-full bg-surface-sunken">
        <Icon className="size-[18px] text-muted-foreground" />
      </span>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="mt-1 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {actionLabel && (to || onAction) && (
        <div className="mt-4">
          {to ? (
            <Button asChild size="sm" variant="secondary">
              <Link to={to}>{actionLabel}</Link>
            </Button>
          ) : (
            <Button size="sm" variant="secondary" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------
   Meta — the "·"-joined metadata line used across cards and rows.
   ---------------------------------------------------------------------- */
export function Meta({
  items,
  className,
}: {
  items: (React.ReactNode | null | undefined | false)[]
  className?: string
}) {
  const visible = items.filter(Boolean)
  return (
    <p className={cn('flex flex-wrap items-center gap-x-1.5 text-[13px] text-muted-foreground', className)}>
      {visible.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span aria-hidden="true" className="text-border-strong">·</span>}
          <span className="inline-flex items-center gap-1">{item}</span>
        </React.Fragment>
      ))}
    </p>
  )
}

/* -------------------------------------------------------------------------
   Skeleton
   ---------------------------------------------------------------------- */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-surface-sunken', className)} />
}

/* -------------------------------------------------------------------------
   Chip — filter rails and selected-course pills.
   ---------------------------------------------------------------------- */
export function Chip({
  children,
  selected,
  onClick,
  className,
  icon: Icon,
}: {
  children: React.ReactNode
  selected?: boolean
  onClick?: () => void
  className?: string
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors',
        selected
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-surface text-foreground-soft hover:border-border-strong hover:bg-surface-sunken',
        className,
      )}
    >
      {Icon && <Icon className="size-3.5" />}
      {children}
    </button>
  )
}
