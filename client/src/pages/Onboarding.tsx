import * as React from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpen, Check, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Wordmark } from '@/components/Wordmark'
import { Card } from '@/components/primitives'
import { CreateMissingCourse } from '@/components/AddCourse'
import { BrandedSplash } from '@/layouts/AppShell'
import { matchesCourseQuery } from '@/lib/courses'
import { cn, courseVars, plural } from '@/lib/utils'
import { useAuth } from '@/state/AuthProvider'

const MAJORS = [
  'Computer Science',
  'Mathematics',
  'Engineering',
  'Biology',
  'Psychology',
  'English',
  'Business Administration',
  'Nursing',
  'Political Science',
  'Undecided',
]

const currentYear = new Date().getFullYear()
const GRAD_YEARS = Array.from({ length: 7 }, (_, index) => String(currentYear + index))

/**
 * Three steps: who you are, what you're taking, confirm.
 *
 * Step two is the one that matters — every Study Request, Circle and question in
 * the product hangs off a course, so an account with no courses has nothing to
 * show. That is why the Continue button stays disabled until one is picked.
 */
export default function Onboarding() {
  const { status, user, courses, coursesLoading, updateProfile } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = React.useState(0)
  const [major, setMajor] = React.useState('')
  const [gradYear, setGradYear] = React.useState('')
  const [selected, setSelected] = React.useState<string[]>([])
  const [query, setQuery] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)

  if (status === 'loading') return <BrandedSplash />
  if (status === 'signedOut') return <Navigate to="/signup" replace />
  if (user?.onboardingCompleted) return <Navigate to="/home" replace />

  const firstName = (user?.name ?? '').split(' ')[0]
  const results = courses.filter((course) => matchesCourseQuery(course, query))

  const toggle = (code: string) =>
    setSelected((prev) =>
      prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code],
    )

  async function finish() {
    setSubmitting(true)
    try {
      await updateProfile({
        major: major || 'Undecided',
        gradYear: Number(gradYear) || currentYear + 3,
        courseCodes: selected,
      })
      navigate('/home')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not finish setting up')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[linear-gradient(135deg,var(--brand-wash),var(--background)_48%,var(--surface-sunken))]">
      <header className="flex h-16 shrink-0 items-center justify-between px-5 sm:px-8">
        <Wordmark />
        <span className="text-[13px] text-muted-foreground">Step {step + 1} of 3</span>
      </header>

      <div className="flex gap-1.5 px-5 sm:px-8">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className={cn(
              'h-[3px] flex-1 rounded-full transition-colors duration-300',
              index <= step ? 'bg-primary' : 'bg-border',
            )}
          />
        ))}
      </div>

      <main className="flex flex-1 justify-center px-5 py-10 sm:px-8 sm:py-14">
        <Card variant="raised" className="w-full max-w-xl p-6 sm:p-8">
          {step === 0 && (
            <div className="animate-rise">
              <h1 className="text-[26px] font-semibold tracking-tight text-foreground sm:text-3xl">
                Welcome{firstName ? `, ${firstName}` : ''} 👋
              </h1>
              <p className="mt-2 text-[15px] text-muted-foreground">
                Two questions, then your courses. This takes about a minute.
              </p>

              <div className="mt-9 space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="major">Major</Label>
                  <Select value={major} onValueChange={setMajor}>
                    <SelectTrigger id="major">
                      <SelectValue placeholder="Choose your major" />
                    </SelectTrigger>
                    <SelectContent>
                      {MAJORS.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="grad">Graduation year</Label>
                  <Select value={gradYear} onValueChange={setGradYear}>
                    <SelectTrigger id="grad">
                      <SelectValue placeholder="Choose a year" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRAD_YEARS.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-9">
                <Button
                  variant="primary"
                  size="lg"
                  disabled={!major || !gradYear}
                  onClick={() => setStep(1)}
                >
                  Continue
                  <ArrowRight />
                </Button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="animate-rise">
              <h1 className="text-[26px] font-semibold tracking-tight text-foreground sm:text-3xl">
                What are you taking?
              </h1>
              <p className="mt-2 text-[15px] text-muted-foreground">
                Each course gets its own hub — study requests, sessions, and questions all live
                there. You can change these later.
              </p>

              <div className="relative mt-7">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by code or title…"
                  className="pl-11"
                  aria-label="Search courses"
                />
              </div>

              {selected.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {selected.map((code) => (
                    <li key={code}>
                      <button
                        type="button"
                        onClick={() => toggle(code)}
                        style={courseVars(code)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-primary-border bg-primary-subtle px-3 py-1 text-[13px] font-medium text-primary transition-colors hover:bg-primary-subtle-hover"
                      >
                        {code}
                        <X className="size-3.5" aria-hidden="true" />
                        <span className="sr-only">Remove {code}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="-mx-1 mt-4 max-h-72 overflow-y-auto scroll-slim px-1">
                {coursesLoading ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Loading the catalog…
                  </p>
                ) : results.length > 0 ? (
                  <ul className="divide-y divide-border">
                    {results.slice(0, 40).map((course) => {
                      const picked = selected.includes(course.code)
                      return (
                        <li key={course.id}>
                          <button
                            type="button"
                            onClick={() => toggle(course.code)}
                            aria-pressed={picked}
                            className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-surface-hover"
                          >
                            <span
                              aria-hidden="true"
                              className={cn(
                                'flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors',
                                picked
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : 'border-border-strong bg-surface',
                              )}
                            >
                              {picked && <Check className="size-3.5" />}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-medium text-foreground">
                                {course.code}
                              </span>
                              <span className="block truncate text-[13px] text-muted-foreground">
                                {course.title}
                              </span>
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <CreateMissingCourse
                    query={query}
                    onCreated={(course) => {
                      toggle(course.code)
                      setQuery('')
                    }}
                  />
                )}
              </div>

              <div className="mt-8 flex items-center gap-2">
                <Button variant="ghost" onClick={() => setStep(0)}>
                  <ArrowLeft />
                  Back
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  disabled={selected.length === 0}
                  onClick={() => setStep(2)}
                >
                  Continue
                  <ArrowRight />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-rise">
              <h1 className="text-[26px] font-semibold tracking-tight text-foreground sm:text-3xl">
                You're set
              </h1>
              <p className="mt-2 text-[15px] text-muted-foreground">
                {plural(selected.length, 'course hub')} ready. Open one and post what you want to
                study — someone in the same class is looking for the same thing.
              </p>

              <ul className="mt-7 space-y-2">
                {selected.map((code) => {
                  const course = courses.find((item) => item.code === code)
                  return (
                    <li
                      key={code}
                      style={courseVars(code)}
                      className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3"
                    >
                      <span
                        className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-(--course-subtle) text-(--course)"
                        aria-hidden="true"
                      >
                        <BookOpen className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-foreground">{code}</span>
                        <span className="block truncate text-[13px] text-muted-foreground">
                          {course?.title ?? 'Course'}
                        </span>
                      </span>
                    </li>
                  )
                })}
              </ul>

              <div className="mt-8 flex items-center gap-2">
                <Button variant="ghost" onClick={() => setStep(1)} disabled={submitting}>
                  <ArrowLeft />
                  Back
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  disabled={submitting}
                  onClick={() => void finish()}
                >
                  {submitting ? 'Setting up…' : 'Go to my hub'}
                  <ArrowRight />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  )
}
