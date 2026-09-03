import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/state/AuthProvider'

/**
 * "Try the demo" signs into a real, seeded account.
 *
 * There is no client-side demo mode any more. The old one kept a parallel
 * in-memory copy of the product that behaved differently from a real account and
 * quietly diverged from it; this hits the same API and database as everyone else.
 *
 * The API grants a normal session for the one seeded demo account. No password
 * is embedded in the browser bundle, and changing Vite env no longer breaks it.
 */
export function useDemoLogin() {
  const { signInDemo } = useAuth()
  const navigate = useNavigate()
  const [pending, setPending] = React.useState(false)

  const enterDemo = async () => {
    setPending(true)
    try {
      const user = await signInDemo()
      navigate(user.onboardingCompleted ? '/home' : '/onboarding')
    } catch {
      toast.error('The demo account is unavailable. Run the database seed and try again.')
    } finally {
      setPending(false)
    }
  }

  return { enterDemo, pending, available: true }
}
