import * as React from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** "1 course" / "3 courses" — the count and its noun, agreed. */
export function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`
}

/** Stable non-cryptographic hash. The one place a seed becomes a palette index. */
function hashSeed(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return hash
}

/**
 * Deterministic avatar tint so a given person always looks the same
 * without storing a colour on the record.
 */
const AVATAR_TINTS = [
  'bg-[#EAE4DC] text-[#6B5B4A]',
  'bg-[#E3E8E4] text-[#41614F]',
  'bg-[#E7E4EC] text-[#5A5070]',
  'bg-[#F0E4DE] text-[#8A5138]',
  'bg-[#E0E7EC] text-[#415F72]',
  'bg-[#EFE6D9] text-[#7A6230]',
] as const

export function avatarTint(seed: string) {
  return AVATAR_TINTS[hashSeed(seed) % AVATAR_TINTS.length]
}

/**
 * Course is colour; maroon is chrome.
 *
 * A course's accent is derived from its code rather than stored, so the same
 * class looks identical on every surface without a colour column and without a
 * migration. Maroon is deliberately absent from this palette: it belongs to the
 * app itself (logo, active nav, primary button), so a course can never be
 * mistaken for chrome.
 *
 * Each entry is dark enough to clear 4.5:1 against its own `subtle` tint, so
 * text and icons can sit on it directly.
 */
const COURSE_ACCENTS = [
  { accent: '#3B5BA5', subtle: '#EEF1F9', border: '#D6DEF0' }, // indigo
  { accent: '#1F7A6B', subtle: '#E9F4F1', border: '#CCE5DF' }, // teal
  { accent: '#8A5B12', subtle: '#F8F0E2', border: '#EDDFC5' }, // ochre
  { accent: '#6A4C93', subtle: '#F1EDF7', border: '#E0D6EE' }, // violet
  { accent: '#4A7C2F', subtle: '#EEF4E9', border: '#DAE7D0' }, // forest
  { accent: '#A85426', subtle: '#F8EDE7', border: '#EEDACD' }, // rust
  { accent: '#41647C', subtle: '#ECF1F4', border: '#D5E0E7' }, // slate
  { accent: '#1B6E8C', subtle: '#E8F2F6', border: '#CBE2EA' }, // cyan
] as const

/** The raw accent, for the rare caller that needs the value itself (a dot, an SVG fill). */
export function courseColor(code: string) {
  return COURSE_ACCENTS[hashSeed(code.trim().toUpperCase()) % COURSE_ACCENTS.length]
}

/**
 * Course accent as inline CSS variables. Spread onto any element and everything
 * beneath it can reach the accent through Tailwind arbitrary properties —
 * `bg-(--course-subtle)`, `text-(--course)`, `border-(--course-border)`.
 *
 * Inline rather than generated classes because Tailwind cannot produce class
 * names from runtime values; the variable is the seam between a dynamic colour
 * and a static stylesheet.
 */
export function courseVars(code: string) {
  const { accent, subtle, border } = courseColor(code)
  return {
    '--course': accent,
    '--course-subtle': subtle,
    '--course-border': border,
  } as React.CSSProperties
}

/**
 * State that survives a reload. Wrapped rather than called inline because
 * localStorage throws in Safari private mode and on blocked third-party
 * storage — a sidebar preference is never worth crashing the shell for.
 */
export function useStickyState<T>(key: string, initial: T) {
  const [value, setValue] = React.useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })

  React.useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* Preference is best-effort. */
    }
  }, [key, value])

  return [value, setValue] as const
}
