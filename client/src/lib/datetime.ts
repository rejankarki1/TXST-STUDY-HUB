/**
 * Bridge between `<input type="datetime-local">` and the ISO strings the API
 * speaks.
 *
 * datetime-local has no timezone: the browser gives back "2026-09-10T17:00" in
 * the user's local time. Constructing a Date from that and calling toISOString()
 * is what attaches the offset, so a 5 PM slot stays 5 PM for the student who
 * picked it.
 */

const pad = (value: number) => String(value).padStart(2, '0')

/** Date -> "2026-09-10T17:00", the value a datetime-local input expects. */
export function toLocalInputValue(date: Date) {
  return [
    date.getFullYear(),
    '-',
    pad(date.getMonth() + 1),
    '-',
    pad(date.getDate()),
    'T',
    pad(date.getHours()),
    ':',
    pad(date.getMinutes()),
  ].join('')
}

/** "2026-09-10T17:00" -> ISO with offset, or null if the input is incomplete. */
export function localInputToIso(value: string) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export function isoToLocalInput(iso: string) {
  return toLocalInputValue(new Date(iso))
}

/** A sensible default window: the next whole hour, `dayOffset` days out. */
export function defaultSlot(dayOffset: number, hour = 18, durationHours = 2) {
  const start = new Date()
  start.setDate(start.getDate() + dayOffset)
  start.setHours(hour, 0, 0, 0)

  const end = new Date(start)
  end.setHours(end.getHours() + durationHours)

  return { startsAt: toLocalInputValue(start), endsAt: toLocalInputValue(end) }
}

export const isFuture = (value: string) => {
  const iso = localInputToIso(value)
  return iso ? new Date(iso).getTime() > Date.now() : false
}
