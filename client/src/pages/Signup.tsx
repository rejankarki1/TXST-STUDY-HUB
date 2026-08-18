import * as React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { useApp } from '@/state/AppState'
import { AuthLayout } from './auth/AuthLayout'

type Errors = Partial<Record<'name' | 'email' | 'password' | 'confirm', string>>

export default function Signup() {
  const { signup } = useApp()
  const navigate = useNavigate()
  const [values, setValues] = React.useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
  })
  const [errors, setErrors] = React.useState<Errors>({})
  const [submitting, setSubmitting] = React.useState(false)

  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }))

  /* Validation runs on submit only — nothing shouts at you mid-typing. */
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const next: Errors = {}
    if (!values.name.trim()) next.name = 'Enter your name'
    if (!values.email.trim()) next.email = 'Enter your TXST email'
    else if (!/^[^\s@]+@txstate\.edu$/i.test(values.email.trim()))
      next.email = 'Use your @txstate.edu email'
    if (values.password.length < 8) next.password = 'At least 8 characters'
    if (values.confirm !== values.password) next.confirm = 'Passwords don’t match'

    setErrors(next)
    if (Object.keys(next).length) return

    setSubmitting(true)
    try {
      const user = await signup({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      })

      navigate(user.onboardingCompleted ? '/home' : '/onboarding')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Signup failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Use your Texas State email so classmates know you're in the course."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="Full name" htmlFor="name" error={errors.name}>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            placeholder="Rejan Karki"
            value={values.name}
            onChange={set('name')}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
        </Field>

        <Field label="TXST email" htmlFor="email" error={errors.email}>
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

        <Field label="Password" htmlFor="password" error={errors.password} hint="8+ characters">
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={values.password}
            onChange={set('password')}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
          />
        </Field>

        <Field label="Confirm password" htmlFor="confirm" error={errors.confirm}>
          <Input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            value={values.confirm}
            onChange={set('confirm')}
            aria-invalid={!!errors.confirm}
            aria-describedby={errors.confirm ? 'confirm-error' : undefined}
          />
        </Field>

        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  )
}
