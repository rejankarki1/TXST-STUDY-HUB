import { Link } from 'react-router-dom'
import { CheckCircle2, MessageSquareText } from 'lucide-react'
import { Badge, Meta } from '@/components/primitives'
import { plural } from '@/lib/utils'
import { relative } from '@/lib/format'
import type { ApiQuestion } from '@/lib/api'

/** A course question in a list. Solved state is the one signal that matters. */
export function QuestionRow({ question, to }: { question: ApiQuestion; to: string }) {
  const solved = question.status === 'SOLVED'

  return (
    <Link
      to={to}
      className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
    >
      <span
        className={
          solved
            ? 'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-transparent bg-success-subtle text-success'
            : 'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-sunken text-muted-foreground'
        }
      >
        {solved ? (
          <CheckCircle2 className="size-4" aria-hidden="true" />
        ) : (
          <MessageSquareText className="size-4" aria-hidden="true" />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium leading-snug text-foreground">
          {question.title}
        </span>
        <Meta
          className="mt-1"
          items={[
            question.author.name,
            relative(question.createdAt),
            plural(question.answerCount, 'answer'),
          ]}
        />
      </span>

      <span className="shrink-0 pt-0.5">
        <Badge tone={solved ? 'success' : 'neutral'}>{solved ? 'Solved' : 'Open'}</Badge>
      </span>
    </Link>
  )
}
