import type * as React from 'react'
import { Calendar, BookOpen, Home, Plus, User } from 'lucide-react'

export type NavItem = {
  to: string
  label: string
  /** Shorter label for the mobile tab bar. */
  short?: string
  icon: React.ComponentType<{ className?: string }>
}

/**
 * Five destinations with five distinct jobs: what's next (Home), which classes
 * (Courses), when (Schedule), start something (Create), and me (Profile).
 *
 * Discover, My Groups and Chat are deliberately absent — finding people happens
 * inside a Course Hub, which is what makes this product course-centered rather
 * than a group marketplace.
 */
export const NAV_ITEMS: NavItem[] = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/courses', label: 'Courses', icon: BookOpen },
  { to: '/schedule', label: 'Schedule', icon: Calendar },
  { to: '/create', label: 'Create', icon: Plus },
  { to: '/profile', label: 'Profile', short: 'You', icon: User },
]
