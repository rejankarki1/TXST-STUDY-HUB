import { Check, Users } from 'lucide-react'
import { dayLabel, duration, timeRange } from '@/lib/format'
import { cn, plural } from '@/lib/utils'
import type { ApiTimeOption } from '@/lib/api'

/**
 * "Which of these can you make?"
 *
 * Checkbox semantics, not a radio group: saying you can make two windows is the
 * signal that lets an organiser pick the one that works for everyone.
 */
export function TimeOptionPicker({
  options,
  selected,
  onToggle,
  showCounts = true,
  disabled,
}: {
  options: ApiTimeOption[]
  selected: string[]
  onToggle: (optionId: string) => void
  showCounts?: boolean
  disabled?: boolean
}) {
  return (
    <ul className="flex flex-col gap-2">
      {options.map((option) => {
        const checked = selected.includes(option.id)

        return (
          <li key={option.id}>
            <label
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-[border-color,background-color,box-shadow] duration-150',
                checked
                  ? 'border-primary-border bg-primary-subtle shadow-xs'
                  : 'border-border bg-surface hover:border-border-strong hover:bg-surface-hover',
                disabled && 'pointer-events-none opacity-60',
              )}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                disabled={disabled}
                onChange={() => onToggle(option.id)}
              />
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors',
                  checked
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border-strong bg-surface',
                )}
              >
                {checked && <Check className="size-3.5" />}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">
                  {dayLabel(option.startsAt)}
                </span>
                <span className="block text-[13px] text-muted-foreground">
                  {timeRange(option.startsAt, option.endsAt)} ·{' '}
                  {duration(option.startsAt, option.endsAt)}
                </span>
              </span>

              {showCounts && (
                <span className="inline-flex shrink-0 items-center gap-1 text-[13px] text-muted-foreground">
                  <Users className="size-3.5" aria-hidden="true" />
                  {plural(option.availableCount, 'person', 'people')}
                </span>
              )}
            </label>
          </li>
        )
      })}
    </ul>
  )
}
