import * as React from 'react'
import { Check, HelpCircle, X } from 'lucide-react'
import { Segmented } from '@/components/primitives'
import { RSVP_STATUSES, RSVP_LABELS, type RsvpStatus } from '@/lib/contracts'

const ICONS = { GOING: Check, MAYBE: HelpCircle, CANT: X } as const

const OPTIONS = RSVP_STATUSES.map((status) => ({
  id: status,
  label: RSVP_LABELS[status],
  icon: ICONS[status],
}))

/**
 * The RSVP switch. Optimistic: the selection moves immediately and rolls back if
 * the server rejects it, because a control that lags a round trip feels broken.
 */
export function RsvpControl({
  value,
  onChange,
  disabled,
  className,
}: {
  value: RsvpStatus | null
  onChange: (status: RsvpStatus) => Promise<void>
  disabled?: boolean
  className?: string
}) {
  const [optimistic, setOptimistic] = React.useState<RsvpStatus | null>(null)
  const [pending, setPending] = React.useState(false)

  /* Once the server's value matches what we optimistically showed, stop
     overriding it. Derived during render — there is no external system to
     synchronise with, so an effect would only add a second render pass. */
  const shown = (optimistic && optimistic !== value ? optimistic : value) ?? undefined

  const select = async (status: RsvpStatus) => {
    if (status === shown) return

    setOptimistic(status)
    setPending(true)
    try {
      await onChange(status)
    } catch {
      setOptimistic(null)
    } finally {
      setPending(false)
    }
  }

  return (
    <Segmented
      label="Your RSVP"
      options={OPTIONS}
      value={shown}
      onChange={(status) => void select(status)}
      disabled={disabled || pending}
      className={className}
    />
  )
}
