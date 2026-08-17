/**
 * Mock data is generated relative to *now* so the prototype always reads
 * correctly ("Tonight · 6 PM") no matter when it is opened.
 */

const iso = (d: Date) => d.toISOString()

/** A time `hours` from now, rounded down to the nearest half hour. */
export function inHours(hours: number) {
  const d = new Date(Date.now() + hours * 3_600_000)
  d.setMinutes(d.getMinutes() < 30 ? 0 : 30, 0, 0)
  return iso(d)
}

/** `minutes` in the past — used for today's chat messages and activity. */
export function minutesAgo(minutes: number) {
  return iso(new Date(Date.now() - minutes * 60_000))
}

/** A specific wall-clock time, `offsetDays` from today. */
export function atDay(offsetDays: number, hour: number, minute = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  d.setHours(hour, minute, 0, 0)
  return iso(d)
}

/** Adds minutes to an ISO timestamp — used for session end times. */
export function plusMinutes(isoString: string, minutes: number) {
  return iso(new Date(new Date(isoString).getTime() + minutes * 60_000))
}

/**
 * The next time it will be `hour:minute` — today if that is still at least an
 * hour away, otherwise tomorrow. Keeps the hero "next session" believable and
 * always in the future regardless of when the prototype is opened.
 */
export function nextOccurrenceAt(hour: number, minute = 0) {
  const today = new Date()
  today.setHours(hour, minute, 0, 0)
  if (today.getTime() - Date.now() > 3_600_000) return iso(today)
  today.setDate(today.getDate() + 1)
  return iso(today)
}

/** A wall-clock time on a past day, for chat transcripts. */
export function daysAgoAt(days: number, hour: number, minute = 0) {
  return atDay(-days, hour, minute)
}
