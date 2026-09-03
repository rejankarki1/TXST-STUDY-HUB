import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Wordmark } from '@/components/Wordmark'
import { useDemoLogin } from '@/hooks/useDemoLogin'
import {
  HeroPreview,
  QuestionPreview,
  RequestPreview,
  RsvpPreview,
} from './landing/previews'

const STEPS = [
  {
    n: '1',
    title: 'Choose a course',
    body: 'Open the hub for a class you are actually taking this semester.',
  },
  {
    n: '2',
    title: 'Find compatible students',
    body: 'Post what you want to study and when, or join someone else’s request.',
  },
  {
    n: '3',
    title: 'Meet and study',
    body: 'Agree on a time, confirm the session, and show up.',
  },
]

const FEATURES = [
  {
    title: 'Say what you want to study',
    body: 'A study request names one topic and whether you need help, can help, or want to review together. That is what makes two students a match instead of two names in a list.',
    preview: <RequestPreview />,
  },
  {
    title: 'Agree on a time that works',
    body: 'Propose up to three windows, everyone marks what they can make, and the organiser confirms the one that works. Then it is a real session with a real RSVP list.',
    preview: <RsvpPreview />,
  },
  {
    title: 'Answers that outlive the session',
    body: 'What the group could not solve becomes a course question. The accepted answer stays searchable for whoever takes the class next semester.',
    preview: <QuestionPreview />,
  },
]

export default function Landing() {
  const { enterDemo, pending, available } = useDemoLogin()

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Wordmark size="lg" />
          <nav className="flex items-center gap-1.5">
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild variant="primary" size="sm">
              <Link to="/signup">Get started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* ---------------------------------------------------------- hero */}
      <section className="mx-auto max-w-6xl px-5 pb-12 pt-10 sm:px-8 sm:pt-12 lg:pb-16 lg:pt-14">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-16">
          <div>
            <p className="text-eyebrow text-primary">For Texas State students</p>
            <h1 className="mt-4 text-[42px] font-semibold leading-[1.05] tracking-[-0.035em] text-foreground sm:text-[52px] lg:text-[56px]">
              Find someone
              <br />
              studying the same
              <br />
              thing you are.
            </h1>
            <p className="mt-5 max-w-md text-[17px] leading-relaxed text-muted-foreground">
              TXST Study Hub matches you with classmates in your course who want to study the same
              topic at a time you can both make — then turns that into a real study session.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild variant="primary" size="lg">
                <Link to="/signup">
                  Get started
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <a href="#how-it-works">See how it works</a>
              </Button>
            </div>

            {available && (
              <p className="mt-6 text-[13px] text-faint-foreground">
                Just looking?{' '}
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void enterDemo()}
                  className="font-medium text-muted-foreground underline underline-offset-4 transition-colors hover:text-primary disabled:opacity-60"
                >
                  {pending ? 'Opening the demo…' : 'Explore the demo account'}
                </button>
              </p>
            )}
          </div>

          <HeroPreview className="lg:mt-2" />
        </div>
      </section>

      {/* -------------------------------------------------- how it works */}
      <section
        id="how-it-works"
        className="scroll-mt-16 border-y border-border bg-surface py-10 sm:py-12"
      >
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">
            How it works
          </h2>

          <ol className="mt-8 grid gap-4 sm:grid-cols-3">
            {STEPS.map((step) => (
              <li
                key={step.n}
                className="rounded-lg border border-border bg-background p-6 transition-colors hover:border-border-strong"
              >
                <span className="flex size-11 items-center justify-center rounded-full bg-primary-subtle text-lg font-semibold text-primary">
                  {step.n}
                </span>
                <h3 className="mt-5 text-[19px] font-semibold tracking-tight text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------------ features */}
      <section className="py-10 sm:py-12 lg:py-14">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <h2 className="max-w-lg text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">
            Everything happens inside a course.
          </h2>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
            Not a campus feed, not another group chat. One hub per class, holding the people, the
            sessions and the answers for that class.
          </p>

          <div className="mt-12 grid gap-10 lg:grid-cols-3 lg:gap-8">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="flex flex-col">
                {feature.preview}
                <h3 className="mt-5 text-[15px] font-semibold tracking-tight text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {feature.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- cta */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-16 text-center sm:px-8 sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">
            Stop studying alone by default.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] text-muted-foreground">
            Add your courses and post one topic. Someone in the same class is stuck on the same
            thing this week.
          </p>
          <div className="mt-7 flex justify-center">
            <Button asChild variant="primary" size="lg">
              <Link to="/signup">
                Create your account
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-6 sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Wordmark size="sm" />
              <p className="mt-2 text-[13px] text-muted-foreground">
                Course-centered study matching for Texas State.
              </p>
            </div>

            <div className="space-y-1 text-[13px] leading-5 text-muted-foreground sm:text-right">
              <p>Built for Texas State students.</p>
              <p>Independent student project.</p>
              <p>Not affiliated with Texas State University.</p>
            </div>
          </div>

          <div className="mt-5 border-t border-border pt-4">
            <p className="text-xs text-faint-foreground">© {new Date().getFullYear()} TXST Study Hub</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
