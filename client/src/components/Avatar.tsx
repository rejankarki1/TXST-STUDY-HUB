import { cn, avatarTint, initials } from '@/lib/utils'
import type { Person } from '@/data/types'

const SIZES = {
  xs: 'size-6 text-[10px]',
  sm: 'size-7 text-[11px]',
  md: 'size-9 text-xs',
  lg: 'size-11 text-sm',
  xl: 'size-16 text-lg',
  '2xl': 'size-20 text-2xl',
} as const

type Size = keyof typeof SIZES

export function Avatar({
  person,
  size = 'md',
  className,
  ring,
}: {
  person: Pick<Person, 'name'>
  size?: Size
  className?: string
  /** Adds a background-coloured ring, for overlapping stacks. */
  ring?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold uppercase leading-none select-none',
        SIZES[size],
        avatarTint(person.name),
        ring && 'ring-2 ring-surface',
        className,
      )}
      aria-hidden="true"
    >
      {initials(person.name)}
    </span>
  )
}

export function AvatarStack({
  people,
  max = 4,
  size = 'sm',
  className,
  label,
}: {
  people: Pick<Person, 'id' | 'name'>[]
  max?: number
  size?: Size
  className?: string
  /** Accessible description, e.g. "7 members". */
  label?: string
}) {
  const shown = people.slice(0, max)
  const extra = people.length - shown.length

  return (
    <div className={cn('flex items-center', className)}>
      <div className="flex -space-x-2">
        {shown.map((p) => (
          <Avatar key={p.id} person={p} size={size} ring />
        ))}
        {extra > 0 && (
          <span
            className={cn(
              'inline-flex shrink-0 items-center justify-center rounded-full bg-surface-sunken font-semibold text-muted-foreground ring-2 ring-surface',
              SIZES[size],
            )}
            aria-hidden="true"
          >
            +{extra}
          </span>
        )}
      </div>
      {label && <span className="sr-only">{label}</span>}
    </div>
  )
}
