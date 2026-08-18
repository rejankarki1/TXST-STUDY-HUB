import * as React from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Search, X } from 'lucide-react'
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
import { cn } from '@/lib/utils'
import { useApp } from '@/state/AppState'

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

const GRAD_YEARS = ['2026', '2027', '2028', '2029', '2030']

export default function Onboarding() {
  const { state, completeOnboarding } = useApp()
  const navigate = useNavigate()

  const [step, setStep] = React.useState(0)
  const [major, setMajor] = React.useState('')
  const [gradYear, setGradYear] = React.useState('')
  const [selected, setSelected] = React.useState<string[]>([])
  const [query, setQuery] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)

  if (state.authLoading) return null
  if (!state.signedIn) return <Navigate to="/signup" replace />
  if (state.onboarded) return <Navigate to="/home" replace />

  const firstName = state.profile.name.split(' ')[0]
  const results = state.courses.filter((c) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q)
  })

  const toggle = (code: string) =>
    setSelected((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    )

  const groupCount = (code: string) => state.groups.filter((g) => g.courseCode === code).length
  const matchingGroups = state.groups.filter((g) => selected.includes(g.courseCode)).length

  async function finish() {
    setSubmitting(true)
    try {
      await completeOnboarding({
        name: state.profile.name,
        major: major || 'Undecided',
        gradYear: Number(gradYear) || 2029,
        courseCodes: selected,
      })
      navigate('/home')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not complete onboarding')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex h-16 shrink-0 items-center justify-between px-5 sm:px-8">
        <Wordmark />
        <span className="text-[13px] text-muted-foreground">Step {step + 1} of 3</span>
      </header>

      {/* progress */}
      <div className="flex gap-1.5 px-5 sm:px-8">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(
              'h-[3px] flex-1 rounded-full transition-colors duration-300',
              i <= step ? 'bg-primary' : 'bg-border',
            )}
          />
        ))}
      </div>

      <main className="flex flex-1 justify-center px-5 py-10 sm:px-8 sm:py-14">
        <div className="w-full max-w-xl">
          {/* ------------------------------------------------ step 1 */}
          {step === 0 && (
            <div className="animate-rise">
              <h1 className="text-[26px] font-semibold tracking-tight text-foreground sm:text-3xl">
                Welcome to TXST Study{firstName ? `, ${firstName}` : ''} 👋
              </h1>
              <p className="mt-2 text-[15px] text-muted-foreground">
                Let's set up your study space. This takes about a minute.
              </p>

              <div className="mt-9 space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="major">Major</Label>
                  <Select value={major} onValueChange={setMajor}>
                    <SelectTrigger id="major">
                      <SelectValue placeholder="Choose your major" />
                    </SelectTrigger>
                    <SelectContent>
                      {MAJORS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
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
                      {GRAD_YEARS.map((y) => (
                        <SelectItem key={y} value={y}>
                          {y}
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

          {/* ------------------------------------------------ step 2 */}
          {step === 1 && (
            <div className="animate-rise">
              <h1 className="text-[26px] font-semibold tracking-tight text-foreground sm:text-3xl">
                What are you taking?
              </h1>
              <p className="mt-2 text-[15px] text-muted-foreground">
                Pick the courses you want to find study groups in. You can change these later.
              </p>

              <div className="relative mt-7">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="course-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search your courses..."
                  className="h-11 pl-11"
                  aria-label="Search courses"
                />
              </div>

              {selected.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {selected.map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => toggle(code)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary-subtle py-1 pl-3 pr-2 text-[13px] font-medium text-primary transition-colors hover:bg-primary-subtle-hover"
                    >
                      {code}
                      <X className="size-3.5" aria-hidden="true" />
                      <span className="sr-only">Remove {code}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-5 max-h-[22rem] space-y-2 overflow-y-auto scroll-slim pr-1">
                {state.coursesLoading && (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    Loading courses...
                  </p>
                )}

                {!state.coursesLoading && state.coursesError && (
                  <p className="py-10 text-center text-sm text-danger">
                    {state.coursesError}
                  </p>
                )}

                {!state.coursesLoading && !state.coursesError && results.map((course) => {
                  const on = selected.includes(course.code)
                  const count = groupCount(course.code)
                  return (
                    <button
                      key={course.code}
                      type="button"
                      onClick={() => toggle(course.code)}
                      aria-pressed={on}
                      className={cn(
                        'flex w-full items-center gap-4 rounded-lg border px-4 py-3 text-left transition-colors',
                        on
                          ? 'border-primary bg-primary-subtle'
                          : 'border-border bg-surface hover:border-border-strong hover:bg-surface-sunken/60',
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-foreground">
                          {course.code}
                        </span>
                        <span className="block truncate text-[13px] text-muted-foreground">
                          {course.title}
                        </span>
                        {count > 0 && (
                          <span className="mt-0.5 block text-xs text-faint-foreground">
                            {count} study {count === 1 ? 'group' : 'groups'}
                          </span>
                        )}
                      </span>
                      <span
                        className={cn(
                          'flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                          on
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border-strong',
                        )}
                        aria-hidden="true"
                      >
                        {on && <Check className="size-3" strokeWidth={3} />}
                      </span>
                    </button>
                  )
                })}

                {!state.coursesLoading && !state.coursesError && results.length === 0 && (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    No courses match “{query}”.
                  </p>
                )}
              </div>

              <div className="mt-8 flex items-center justify-between gap-3">
                <Button variant="ghost" size="lg" onClick={() => setStep(0)}>
                  <ArrowLeft />
                  Back
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  disabled={selected.length === 0}
                  onClick={() => setStep(2)}
                >
                  {selected.length > 0
                    ? `Continue with ${selected.length}`
                    : 'Pick at least one course'}
                  <ArrowRight />
                </Button>
              </div>
            </div>
          )}

          {/* ------------------------------------------------ step 3 */}
          {step === 2 && (
            <div className="animate-rise pt-4">
              <span className="flex size-12 items-center justify-center rounded-full bg-success-subtle">
                <Check className="size-6 text-success" strokeWidth={2.5} aria-hidden="true" />
              </span>

              <h1 className="mt-6 text-[26px] font-semibold tracking-tight text-foreground sm:text-3xl">
                You're ready.
              </h1>
              <p className="mt-2 text-[15px] text-muted-foreground">
                We found {matchingGroups} active study {matchingGroups === 1 ? 'group' : 'groups'}{' '}
                across your courses.
              </p>

              <ul className="mt-8 divide-y divide-border border-y border-border">
                {selected.map((code) => {
                  const course = state.courses.find((c) => c.code === code)
                  const count = groupCount(code)
                  return (
                    <li key={code} className="flex items-center justify-between gap-4 py-3.5">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{code}</p>
                        <p className="truncate text-[13px] text-muted-foreground">
                          {course?.title}
                        </p>
                      </div>
                      <span className="shrink-0 text-[13px] text-muted-foreground">
                        {count} {count === 1 ? 'group' : 'groups'}
                      </span>
                    </li>
                  )
                })}
              </ul>

              <div className="mt-9 flex items-center gap-3">
                <Button variant="primary" size="lg" onClick={finish} disabled={submitting}>
                  {submitting ? 'Saving...' : 'Explore your dashboard'}
                  <ArrowRight />
                </Button>
                <Button variant="ghost" size="lg" onClick={() => setStep(1)}>
                  Edit courses
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
