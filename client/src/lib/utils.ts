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
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return AVATAR_TINTS[hash % AVATAR_TINTS.length]
}
