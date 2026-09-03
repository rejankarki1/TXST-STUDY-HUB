import { cn, avatarTint, initials } from '@/lib/utils'

/** Anything with a name can be rendered as an avatar — a student, an
 *  organiser, a bare `{ name }` from a form. */
type Named = { id?: string; name: string }

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
  person?: Pick<Named, 'name'> | null
  size?: Size
  className?: string
  /** Adds a background-coloured ring, for overlapping stacks. */
  ring?: boolean
}) {
  const name = person?.name?.trim() || 'Student'

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold uppercase leading-none select-none',
        SIZES[size],
        avatarTint(name),
        ring && 'ring-2 ring-surface',
        className,
      )}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  )
}

export function AvatarStack({
  people,
  max = 4,
  size = 'sm',
  className,
  label,
  total,
}: {
  people: Named[]
  max?: number
  size?: Size
  className?: string
  /** Accessible description, e.g. "7 members". */
  label?: string
  /**
   * The real population size, when `people` is only a slice of it — the server's
   * `memberCount` / `goingCount`. Without it "+N" counts the array we were
   * handed, which undercounts every time a caller passes a subset.
   */
  total?: number
}) {
  const shown = people.slice(0, max)
  const extra = (total ?? people.length) - shown.length

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
