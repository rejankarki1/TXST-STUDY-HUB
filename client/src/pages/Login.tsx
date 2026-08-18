import * as React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { useApp } from '@/state/AppState'
import { AuthLayout } from './auth/AuthLayout'

type Errors = Partial<Record<'email' | 'password', string>>

export default function Login() {
  const { login, enterDemo } = useApp()
  const navigate = useNavigate()
  const [values, setValues] = React.useState({ email: '', password: '' })
  const [errors, setErrors] = React.useState<Errors>({})
  const [submitting, setSubmitting] = React.useState(false)

  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const next: Errors = {}
    if (!values.email.trim()) next.email = 'Enter your email'
    if (!values.password) next.password = 'Enter your password'

    setErrors(next)
    if (Object.keys(next).length) return

    setSubmitting(true)
    try {
      const user = await login({
        email: values.email.trim(),
        password: values.password,
      })

      navigate(user.onboardingCompleted ? '/home' : '/onboarding')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to see what your study groups are up to."
      footer={
        <>
          New here?{' '}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="Email" htmlFor="email" error={errors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="netid@txstate.edu"
            value={values.email}
            onChange={set('email')}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          error={errors.password}
          hint={
            <button
              type="button"
              onClick={() => toast('Password reset isn’t part of this prototype')}
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Forgot password?
            </button>
          }
        >
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={values.password}
            onChange={set('password')}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
          />
        </Field>

        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={submitting}>
          {submitting ? 'Logging in...' : 'Log in'}
        </Button>
      </form>

      <p className="mt-5 text-center text-[13px] text-faint-foreground">
        <button
          type="button"
          onClick={() => {
            enterDemo()
            navigate('/home')
          }}
          className="font-medium text-muted-foreground underline underline-offset-4 transition-colors hover:text-primary"
        >
          Skip to the demo
        </button>
      </p>
    </AuthLayout>
  )
}
