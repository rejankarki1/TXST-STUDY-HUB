import * as React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, MessagesSquare, Plus, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Field, Input, Textarea } from '@/components/ui/input'
import {
  Badge,
  Card,
  ConfirmDialog,
  EmptyState,
  Modal,
  Segmented,
  SectionHeader,
  Skeleton,
} from '@/components/primitives'
import { QuestionRow } from '@/components/QuestionRow'
import { Avatar } from '@/components/Avatar'
import { questionsApi } from '@/lib/api'
import { courseHref } from '@/lib/courses'
import { relative } from '@/lib/format'
import { plural } from '@/lib/utils'
import { useAsync } from '@/hooks/useAsync'
import { useCourseHub } from '@/hooks/useCourse'

type StatusFilter = 'ALL' | 'OPEN' | 'SOLVED'

const STATUS_OPTIONS = [
  { id: 'ALL' as const, label: 'All' },
  { id: 'OPEN' as const, label: 'Open' },
  { id: 'SOLVED' as const, label: 'Solved' },
]

/**
 * Course questions — a searchable record of what this class got stuck on.
 *
 * Deliberately not a discussion board: no votes, no threads, no chat. One
 * question, its answers, and the one the asker marked correct.
 */
export default function CourseQuestions() {
  const { course } = useCourseHub()
  const { questionId } = useParams()

  const [status, setStatus] = React.useState<StatusFilter>('ALL')
  const [search, setSearch] = React.useState('')
  const [askOpen, setAskOpen] = React.useState(false)

  const list = useAsync(
    () =>
      questionsApi.listForCourse(course.id, {
        status: status === 'ALL' ? undefined : status,
        search: search.trim() || undefined,
      }),
    [course.id, status, search],
  )

  const questions = list.data?.questions ?? []

  if (questionId) {
    return <QuestionDetail questionId={questionId} onChanged={() => void list.reload()} />
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Course questions"
        count={questions.length || undefined}
        action="Ask a question"
        onAction={() => setAskOpen(true)}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={`Search ${course.code} questions…`}
            className="pl-11"
            aria-label="Search questions"
          />
        </div>
        <Segmented
          label="Filter by status"
          options={STATUS_OPTIONS}
          value={status}
          onChange={setStatus}
        />
      </div>

      {list.error && (
        <Card variant="subtle" className="border-danger/30">
          <p className="text-sm text-danger">{list.error}</p>
        </Card>
      )}

      {list.loading && questions.length === 0 ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : questions.length > 0 ? (
        <Card padded={false} className="overflow-hidden">
          <div className="divide-y divide-border">
            {questions.map((question) => (
              <QuestionRow
                key={question.id}
                question={question}
                to={`${courseHref(course)}/questions/${question.id}`}
              />
            ))}
          </div>
        </Card>
      ) : search.trim() || status !== 'ALL' ? (
        <EmptyState
          compact
          icon={Search}
          title="Nothing matches"
          description="Try a different search, or clear the filter."
          actionLabel="Clear filters"
          onAction={() => {
            setSearch('')
            setStatus('ALL')
          }}
        />
      ) : (
        <EmptyState
          icon={MessagesSquare}
          title="No questions yet"
          description="Ask the thing you got stuck on. An accepted answer stays searchable for everyone taking this course."
          actionLabel="Ask the first question"
          onAction={() => setAskOpen(true)}
        />
      )}

      <AskQuestionModal
        open={askOpen}
        onOpenChange={setAskOpen}
        courseId={course.id}
        courseCode={course.code}
        onAsked={() => void list.reload()}
      />
    </div>
  )
}

/* ------------------------------------------------------------- ask modal */

function AskQuestionModal({
  open,
  onOpenChange,
  courseId,
  courseCode,
  onAsked,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseId: string
  courseCode: string
  onAsked: () => void
}) {
  const [title, setTitle] = React.useState('')
  const [body, setBody] = React.useState('')
  const [errors, setErrors] = React.useState<{ title?: string; body?: string }>({})
  const [submitting, setSubmitting] = React.useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()

    const next: typeof errors = {}
    if (title.trim().length < 8) next.title = 'Give the question a clear title (8+ characters).'
    if (body.trim().length < 10) next.body = 'Add enough detail for someone to answer.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setSubmitting(true)
    try {
      await questionsApi.create(courseId, { title: title.trim(), body: body.trim() })
      toast.success('Question posted')
      setTitle('')
      setBody('')
      onOpenChange(false)
      onAsked()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not post that question')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`Ask a ${courseCode} question`}
      description="Everyone in this course can see and answer it. Posts are never anonymous."
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="Question" htmlFor="question-title" error={errors.title}>
          <Input
            id="question-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Why does deleting a node with two children use the in-order successor?"
            aria-invalid={Boolean(errors.title)}
          />
        </Field>

        <Field label="Details" htmlFor="question-body" error={errors.body}>
          <Textarea
            id="question-body"
            rows={5}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="What you already tried, and where it stopped making sense."
            aria-invalid={Boolean(errors.body)}
          />
        </Field>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Posting…' : 'Post question'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

/* ---------------------------------------------------------- detail view */

function QuestionDetail({
  questionId,
  onChanged,
}: {
  questionId: string
  onChanged: () => void
}) {
  const { course } = useCourseHub()
  const navigate = useNavigate()
  const [answer, setAnswer] = React.useState('')
  const [answerError, setAnswerError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)

  const state = useAsync(() => questionsApi.get(questionId), [questionId])
  const question = state.data?.question

  const backHref = `${courseHref(course)}/questions`

  const submitAnswer = async (event: React.FormEvent) => {
    event.preventDefault()

    if (answer.trim().length < 2) {
      setAnswerError('Write an answer first.')
      return
    }

    setAnswerError(null)
    setSubmitting(true)
    try {
      await questionsApi.answer(questionId, answer.trim())
      setAnswer('')
      toast.success('Answer posted')
      await state.reload()
      onChanged()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not post that answer')
    } finally {
      setSubmitting(false)
    }
  }

  const setAccepted = async (answerId: string, accepted: boolean) => {
    try {
      await questionsApi.setAccepted(questionId, answerId, accepted)
      toast.success(accepted ? 'Answer accepted' : 'Answer unaccepted')
      await state.reload()
      onChanged()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update the answer')
    }
  }

  if (state.loading && !question) {
    return <Skeleton className="h-64 rounded-xl" />
  }

  if (state.error || !question) {
    return (
      <EmptyState
        icon={MessagesSquare}
        title="Question not found"
        description={state.error ?? 'It may have been deleted.'}
        actionLabel="Back to questions"
        to={backHref}
      />
    )
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <button type="button" onClick={() => navigate(backHref)}>
          <ArrowLeft />
          All questions
        </button>
      </Button>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Badge tone={question.status === 'SOLVED' ? 'success' : 'neutral'}>
                {question.status === 'SOLVED' ? 'Solved' : 'Open'}
              </Badge>
              <span className="text-[13px] text-muted-foreground">
                {plural(question.answerCount, 'answer')}
              </span>
            </div>
            <h1 className="mt-2 text-xl font-semibold leading-snug tracking-tight text-foreground">
              {question.title}
            </h1>
          </div>

          {question.isAuthor && (
            <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 />
              Delete
            </Button>
          )}
        </div>

        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground-soft">
          {question.body}
        </p>

        <div className="mt-5 flex items-center gap-2.5 border-t border-border pt-4">
          <Avatar person={question.author} size="sm" />
          <span className="text-[13px] text-muted-foreground">
            {question.author.name} · asked {relative(question.createdAt)}
          </span>
        </div>
      </Card>

      <section>
        <SectionHeader title="Answers" count={question.answers.length || undefined} />

        {question.answers.length === 0 ? (
          <EmptyState
            compact
            icon={MessagesSquare}
            title="No answers yet"
            description="Know this one? Write it up below."
          />
        ) : (
          <ul className="space-y-3">
            {question.answers.map((item) => (
              <li key={item.id}>
                <Card
                  className={
                    item.isAccepted ? 'border-success/35 bg-success-subtle/40' : undefined
                  }
                >
                  {item.isAccepted && (
                    <p className="mb-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-success">
                      <Check className="size-3.5" aria-hidden="true" />
                      Accepted answer
                    </p>
                  )}

                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground-soft">
                    {item.body}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar person={item.author} size="sm" />
                      <span className="text-[13px] text-muted-foreground">
                        {item.author.name} · {relative(item.createdAt)}
                      </span>
                    </div>

                    {/* Only the asker decides what counts as the answer. */}
                    {question.isAuthor && (
                      <Button
                        size="sm"
                        variant={item.isAccepted ? 'ghost' : 'secondary'}
                        onClick={() => void setAccepted(item.id, !item.isAccepted)}
                      >
                        {item.isAccepted ? 'Unaccept' : 'Accept answer'}
                      </Button>
                    )}
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Card>
        <form onSubmit={submitAnswer} noValidate className="space-y-3">
          <Field label="Your answer" htmlFor="new-answer" error={answerError ?? undefined}>
            <Textarea
              id="new-answer"
              rows={4}
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="Explain it the way you'd want it explained to you."
              aria-invalid={Boolean(answerError)}
            />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" disabled={submitting}>
              <Plus />
              {submitting ? 'Posting…' : 'Post answer'}
            </Button>
          </div>
        </form>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this question?"
        description="Its answers go with it. This cannot be undone."
        confirmLabel="Delete question"
        destructive
        onConfirm={async () => {
          await questionsApi.remove(questionId)
          toast('Question deleted')
          onChanged()
          navigate(backHref)
        }}
      />
    </div>
  )
}
