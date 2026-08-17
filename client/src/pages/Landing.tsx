import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Wordmark } from '@/components/Wordmark'
import { useApp } from '@/state/AppState'
import {
  ChatPreview,
  GroupCardPreview,
  HeroPreview,
  RsvpPreview,
} from './landing/previews'

const STEPS = [
  {
    n: '1',
    title: 'Find your course',
    body: 'Search the courses you’re taking this semester.',
  },
  {
    n: '2',
    title: 'Join your people',
    body: 'Discover students studying the same material.',
  },
  {
    n: '3',
    title: 'Study together',
    body: 'Schedule sessions, RSVP, and keep the group talking.',
  },
]

const FEATURES = [
  {
    title: 'Groups live inside courses',
    body: 'Every study group belongs to a class, so you always know who you’re studying with and what for.',
    preview: <GroupCardPreview />,
  },
  {
    title: 'Everyone knows who’s coming',
    body: 'Plan a session, pick a spot on campus, and see at a glance who said they’d be there.',
    preview: <RsvpPreview />,
  },
  {
    title: 'One place to talk',
    body: 'Each group has its own chat. No more five different group texts for the same class.',
    preview: <ChatPreview />,
  },
]

export default function Landing() {
  const { enterDemo } = useApp()
  const navigate = useNavigate()

  const skipToDemo = () => {
    enterDemo()
    navigate('/home')
  }

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
      <section className="mx-auto max-w-6xl px-5 pb-20 pt-14 sm:px-8 sm:pt-20 lg:pb-28 lg:pt-24">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-16">
          <div>
            <p className="text-eyebrow text-primary">For Texas State students</p>
            <h1 className="mt-4 text-[42px] font-semibold leading-[1.05] tracking-[-0.035em] text-foreground sm:text-[52px] lg:text-[58px]">
              Study better,
              <br />
              together.
            </h1>
            <p className="mt-5 max-w-md text-[17px] leading-relaxed text-muted-foreground">
              Find classmates in your Texas State courses, join study groups, plan study
              sessions, and stay connected.
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

            <p className="mt-6 text-[13px] text-faint-foreground">
              Just browsing?{' '}
              <button
                type="button"
                onClick={skipToDemo}
                className="font-medium text-muted-foreground underline underline-offset-4 transition-colors hover:text-primary"
              >
                Skip to the demo
              </button>
            </p>
          </div>

          <HeroPreview className="lg:mt-2" />
        </div>
      </section>

      {/* -------------------------------------------------- how it works */}
      <section
        id="how-it-works"
        className="scroll-mt-16 border-y border-border bg-surface py-16 sm:py-20"
      >
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">
            How it works
          </h2>

          <ol className="mt-10 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {STEPS.map((step) => (
              <li key={step.n}>
                <span className="flex size-8 items-center justify-center rounded-full bg-primary-subtle text-[13px] font-semibold text-primary">
                  {step.n}
                </span>
                <h3 className="mt-4 text-[17px] font-semibold tracking-tight text-foreground">
                  {step.title}
                </h3>
                <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------------ features */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <h2 className="max-w-lg text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">
            Everything happens around your courses.
          </h2>

          <div className="mt-12 grid gap-10 lg:grid-cols-3 lg:gap-8">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex flex-col">
                {f.preview}
                <h3 className="mt-5 text-[15px] font-semibold tracking-tight text-foreground">
                  {f.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- cta */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-16 text-center sm:px-8 sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">
            Find your study people.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] text-muted-foreground">
            It takes about a minute to set up. Pick your courses and see who else is already
            studying.
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

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row sm:px-8">
          <Wordmark size="sm" />
          <p className="text-center text-xs text-faint-foreground sm:text-right">
            Made for Texas State students. Not affiliated with Texas State University.
          </p>
        </div>
      </footer>
    </div>
  )
}
