import * as React from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, MoreHorizontal } from 'lucide-react'
import { cn, courseVars } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

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
   Breadcrumb — the parent trail. Used where a page sits inside something else
   (a group inside a course), so the hierarchy is read rather than inferred.
   ---------------------------------------------------------------------- */
export type Crumb = { label: string; to?: string; title?: string }

export function Breadcrumb({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex min-w-0 items-center gap-1.5 text-[13px]">
        {items.map((item, index) => {
          const last = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
              {index > 0 && (
                <span aria-hidden="true" className="text-border-strong">
                  /
                </span>
              )}
              {item.to && !last ? (
                <Link
                  to={item.to}
                  title={item.title}
                  className="max-w-[14rem] truncate font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={last ? 'page' : undefined}
                  title={item.title}
                  className={cn(
                    'max-w-[16rem] truncate',
                    last ? 'text-foreground-soft' : 'text-muted-foreground',
                  )}
                >
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
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
        'inline-flex items-center gap-1 rounded-md border border-transparent px-1.5 py-0.5 text-[11px] font-medium leading-4',
        tones[tone],
        tone === 'primary' && 'border-primary-border',
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
    <div className={cn('mb-3 flex items-center justify-between gap-4', className)}>
      <h2 className="text-[15px] font-semibold text-foreground">
        {title}
        {count !== undefined && (
          <span className="ml-2 font-normal text-faint-foreground">{count}</span>
        )}
      </h2>
      {action && to && (
        <Link
          to={to}
          className="group inline-flex items-center gap-0.5 rounded-md px-1.5 py-1 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-surface-hover hover:text-primary"
        >
          {action}
          <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
      {action && !to && (
        <button
          type="button"
          onClick={onAction}
          className="rounded-md px-1.5 py-1 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-surface-hover hover:text-primary"
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
    <div className={cn('mb-7 flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5', className)}>
      <div className="min-w-0">
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-foreground sm:text-[28px]">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{description}</p>
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
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  actionLabel?: string
  to?: string
  onAction?: () => void
  className?: string
  compact?: boolean
  /** An extra control beside the action — for callers whose way out is a button
      that owns its own dialog rather than a plain link. */
  children?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-primary-border bg-[var(--brand-wash)]/55 px-6 text-center shadow-xs',
        compact ? 'py-8' : 'py-14',
        className,
      )}
    >
      <span className="mb-3 flex size-11 items-center justify-center rounded-xl border border-primary-border bg-primary-subtle text-primary shadow-xs">
        <Icon className="size-[19px]" />
      </span>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="mt-1 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {(children || (actionLabel && (to || onAction))) && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {children}
          {actionLabel &&
            (to ? (
              <Button asChild size="sm" variant="secondary">
                <Link to={to}>{actionLabel}</Link>
              </Button>
            ) : onAction ? (
              <Button size="sm" variant="secondary" onClick={onAction}>
                {actionLabel}
              </Button>
            ) : null)}
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
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-[transform,background-color,border-color,color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 active:translate-y-px',
        selected
          ? 'border-primary bg-primary text-primary-foreground shadow-button'
          : 'border-border bg-surface-raised text-foreground-soft shadow-xs hover:border-border-strong hover:bg-surface-hover hover:text-foreground hover:shadow-sm',
        className,
      )}
    >
      {Icon && <Icon className="size-3.5" />}
      {children}
    </button>
  )
}

/* -------------------------------------------------------------------------
   Card — the primary surface. `to`/`onClick` make the whole card the action.

   The activator is a stretched overlay rather than a wrapper, because a card's
   ⋯ menu is itself a button and a button inside a link is invalid HTML. Anything
   interactive inside a card therefore needs `relative z-10` to sit above the
   overlay; everything else is covered by it and reads as one target.

   `accent` paints the course spine. Pass `style={courseVars(code)}` (or use
   CourseCard, which does it for you) so `--course` resolves.
   ---------------------------------------------------------------------- */
export function Card({
  children,
  className,
  style,
  to,
  onClick,
  label,
  accent,
  padded = true,
  variant = 'default',
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  /** Navigates when the card is activated. */
  to?: string
  /** Fires when the card is activated. Ignored when `to` is set. */
  onClick?: () => void
  /** Accessible name for the stretched activator, e.g. the card's title. */
  label?: string
  /** Left spine in the course accent. */
  accent?: boolean
  padded?: boolean
  variant?: 'default' | 'interactive' | 'raised' | 'subtle' | 'selected'
}) {
  const interactive = Boolean(to || onClick)
  const variants = {
    default: 'border-border bg-surface shadow-card',
    interactive: 'border-border bg-surface shadow-card',
    raised: 'border-border bg-surface-raised shadow-md',
    subtle: 'border-border bg-surface-sunken/55 shadow-none',
    selected: 'border-primary-border bg-primary-subtle shadow-xs',
  } as const

  return (
    <div
      style={style}
      className={cn(
        'relative rounded-xl border',
        variants[variant],
        padded && 'p-4 sm:p-5',
        accent && 'border-l-[3px] border-l-(--course)',
        (interactive || variant === 'interactive') &&
          'group/card transition-[transform,border-color,box-shadow,background-color] duration-150 hover:-translate-y-0.5 hover:border-primary-border hover:bg-surface-raised hover:shadow-card-hover focus-within:ring-2 focus-within:ring-primary/25 active:translate-y-0 active:shadow-card',
        className,
      )}
    >
      {to ? (
        <Link to={to} className="absolute inset-0 z-0 rounded-lg focus:outline-none">
          <span className="sr-only">{label}</span>
        </Link>
      ) : onClick ? (
        <button
          type="button"
          onClick={onClick}
          className="absolute inset-0 z-0 rounded-lg focus:outline-none"
        >
          <span className="sr-only">{label}</span>
        </button>
      ) : null}
      {children}
    </div>
  )
}

/* -------------------------------------------------------------------------
   Course tag — the course code in that course's accent. This is the mark that
   makes a group or session visibly belong to a class.
   ---------------------------------------------------------------------- */
export function CourseTag({
  code,
  className,
  size = 'md',
  dot,
}: {
  code: string
  className?: string
  size?: 'sm' | 'md'
  /** A bare accent dot instead of a filled pill — for dense rows and nav. */
  dot?: boolean
}) {
  if (dot) {
    return (
      <span style={courseVars(code)} className={cn('inline-flex items-center gap-1.5', className)}>
        <span className="size-2 shrink-0 rounded-full bg-(--course)" aria-hidden="true" />
        <span className="text-[13px] font-medium text-foreground-soft">{code}</span>
      </span>
    )
  }

  return (
    <span
      style={courseVars(code)}
      className={cn(
        'inline-flex shrink-0 items-center rounded-md bg-(--course-subtle) font-semibold text-(--course)',
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px] leading-4' : 'px-2 py-0.5 text-xs leading-5',
        className,
      )}
    >
      {code}
    </span>
  )
}

/* -------------------------------------------------------------------------
   Segmented — single-select control (the RSVP switch). Radio semantics with a
   roving tabindex: one tab stop, arrows move between options.
   ---------------------------------------------------------------------- */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
  disabled,
}: {
  options: { id: T; label: string; icon?: React.ComponentType<{ className?: string }> }[]
  value?: T
  onChange: (id: T) => void
  label: string
  className?: string
  disabled?: boolean
}) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([])

  const move = (from: number, delta: number) => {
    const next = (from + delta + options.length) % options.length
    refs.current[next]?.focus()
    onChange(options[next].id)
  }

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      move(index, 1)
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      move(index, -1)
    }
  }

  /* With nothing selected the first option holds the tab stop, so the control
     is always reachable by keyboard. */
  const activeIndex = Math.max(
    options.findIndex((option) => option.id === value),
    0,
  )

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        'inline-flex gap-1 rounded-xl border border-border bg-surface-sunken p-1 shadow-inner',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
    >
      {options.map((option, index) => {
        const selected = option.id === value
        const Icon = option.icon
        return (
          <button
            key={option.id}
            ref={(node) => {
              refs.current[index] = node
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={index === activeIndex ? 0 : -1}
            onClick={() => onChange(option.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              'inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-[background-color,color,box-shadow] duration-150',
              selected
                ? 'bg-surface-raised text-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-surface/60 hover:text-foreground',
            )}
          >
            {Icon && <Icon className="size-3.5" />}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------------
   Tabs — the strip styling only. Membership of the strip is either routes
   (NavLink, see GroupLayout) or local state (TabButton), so this exports the
   frame and the item classes rather than owning selection.
   ---------------------------------------------------------------------- */
export function Tabs({
  children,
  className,
  label,
}: {
  children: React.ReactNode
  className?: string
  label: string
}) {
  return (
    <div className={cn('-mx-4 overflow-x-auto no-scrollbar px-4 sm:mx-0 sm:px-0', className)}>
      <nav className="flex w-max gap-1 rounded-xl border border-border bg-surface-sunken p-1" aria-label={label}>
        {children}
      </nav>
    </div>
  )
}

export function tabClass(isActive: boolean) {
  return cn(
    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-[background-color,color,box-shadow] duration-150',
    isActive
      ? 'bg-surface-raised font-medium text-primary shadow-xs'
      : 'text-muted-foreground hover:bg-surface/60 hover:text-foreground',
  )
}

export function TabButton({
  children,
  active,
  onClick,
  count,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
  count?: number
}) {
  return (
    <button type="button" onClick={onClick} aria-current={active} className={tabClass(active)}>
      {children}
      {count !== undefined && <span className="text-xs text-faint-foreground">{count}</span>}
    </button>
  )
}

/* -------------------------------------------------------------------------
   Menu — the ⋯ overflow. Always rendered, never hover-revealed: a hidden
   control is unreachable on touch. z-10 keeps it above a Card's stretched
   activator.
   ---------------------------------------------------------------------- */
export function Menu({
  children,
  label = 'More options',
  className,
  align = 'end',
}: {
  children: React.ReactNode
  label?: string
  className?: string
  align?: 'start' | 'end'
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={label}
          className={cn('relative z-10 shrink-0', className)}
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>{children}</DropdownMenuContent>
    </DropdownMenu>
  )
}

/* -------------------------------------------------------------------------
   Modal — Radix Dialog with the app's header/footer rhythm. Focus trap and
   Escape come from the primitive.
   ---------------------------------------------------------------------- */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className}>
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-sm text-muted-foreground">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        {children}
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  )
}

/* -------------------------------------------------------------------------
   Confirm dialog — the one gate in front of anything destructive.

   Owns the pending state so callers don't each re-implement it, and stays open
   while the promise is in flight: a failed leave/delete must not look like it
   succeeded.
   ---------------------------------------------------------------------- */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void | Promise<void>
}) {
  const [pending, setPending] = React.useState(false)

  const confirm = async () => {
    setPending(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch {
      /* The action already surfaced a toast; keep the dialog open so the user
         can retry or cancel. */
    } finally {
      setPending(false)
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={(next) => !pending && onOpenChange(next)}
      title={title}
      description={description}
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? 'danger' : 'primary'}
            disabled={pending}
            onClick={() => void confirm()}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <span className="sr-only" aria-live="polite">
        {pending ? 'Working…' : ''}
      </span>
    </Modal>
  )
}
