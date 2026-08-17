import { cn } from '@/lib/utils'

/**
 * The mark is the product's own avatar stack — two overlapping circles —
 * which is the same motif used on every group card. Small on purpose.
 */
export function Mark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('size-6 text-primary', className)}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="24" height="24" rx="7" fill="currentColor" />
      <circle cx="9.4" cy="12" r="3.9" fill="#fff" fillOpacity="0.92" />
      <circle cx="14.9" cy="12" r="5.2" fill="currentColor" />
      <circle cx="14.9" cy="12" r="3.9" fill="#fff" fillOpacity="0.92" />
    </svg>
  )
}

export function Wordmark({
  className,
  markClassName,
  size = 'md',
}: {
  className?: string
  markClassName?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const text = {
    sm: 'text-[13px]',
    md: 'text-[15px]',
    lg: 'text-lg',
  }[size]
  const mark = { sm: 'size-5', md: 'size-6', lg: 'size-7' }[size]

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <Mark className={cn(mark, markClassName)} />
      <span className={cn('font-semibold tracking-tight text-foreground', text)}>
        TXST Study
      </span>
    </span>
  )
}
