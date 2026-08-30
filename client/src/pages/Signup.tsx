import * as React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useApp } from '@/state/AppState'
import { AuthLayout } from './auth/AuthLayout'

type Errors = Partial<Record<'name' | 'email' | 'password' | 'confirm', string>>

const PASSWORD_ERROR = 'Use 8+ characters with uppercase, lowercase, number, and symbol.'

const PASSWORD_RULES = [
  {
    label: '8+ characters',
    test: (value: string) => value.length >= 8,
  },
  {
    label: 'Lowercase letter',
    test: (value: string) => /[a-z]/.test(value),
  },
  {
    label: 'Uppercase letter',
    test: (value: string) => /[A-Z]/.test(value),
  },
  {
    label: 'Number',
    test: (value: string) => /\d/.test(value),
  },
  {
    label: 'Symbol',
    test: (value: string) => /[^A-Za-z0-9]/.test(value),
  },
]

function passwordIsStrong(value: string) {
  return PASSWORD_RULES.every((rule) => rule.test(value))
}

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
    if (!passwordIsStrong(values.password)) next.password = PASSWORD_ERROR
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

        <Field label="Password" htmlFor="password" error={errors.password}>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            value={values.password}
            onChange={set('password')}
            aria-invalid={!!errors.password}
            aria-describedby={
              errors.password ? 'password-error password-checklist' : 'password-checklist'
            }
          />
          <PasswordChecklist password={values.password} />
        </Field>

        <Field label="Confirm password" htmlFor="confirm" error={errors.confirm}>
          <PasswordInput
            id="confirm"
            name="confirm"
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

function PasswordInput({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Input>, 'type'>) {
  const [visible, setVisible] = React.useState(false)
  const label = visible ? 'Hide password' : 'Show password'
  const Icon = visible ? EyeOff : Eye

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? 'text' : 'password'}
        className={cn('pr-11', className)}
      />
      <button
        type="button"
        className="absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15"
        onClick={() => setVisible((current) => !current)}
        aria-label={label}
      >
        <Icon className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}

function PasswordChecklist({ password }: { password: string }) {
  return (
    <ul id="password-checklist" className="mt-2 grid gap-1.5 text-xs" aria-label="Password rules">
      {PASSWORD_RULES.map((rule) => {
        const valid = rule.test(password)
        return (
          <li
            key={rule.label}
            className={cn(
              'flex items-center gap-2 transition-colors',
              valid ? 'text-success' : 'text-muted-foreground',
            )}
          >
            {valid ? (
              <Check className="size-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <span
                className="size-3.5 shrink-0 rounded-full border border-border-strong"
                aria-hidden="true"
              />
            )}
            <span>{rule.label}</span>
          </li>
        )
      })}
    </ul>
  )
}
