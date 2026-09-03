import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QuestionRow } from '@/components/QuestionRow'
import { question } from '@/test/factories'

const renderRow = (props: Parameters<typeof QuestionRow>[0]) =>
  render(
    <MemoryRouter>
      <QuestionRow {...props} />
    </MemoryRouter>,
  )

describe('QuestionRow', () => {
  it('shows an open question as Open', () => {
    renderRow({ question: question(), to: '/x' })

    expect(screen.getByText('Open')).toBeInTheDocument()
    expect(screen.queryByText('Solved')).not.toBeInTheDocument()
  })

  it('shows a solved question as Solved', () => {
    renderRow({
      question: question({ status: 'SOLVED', acceptedAnswerId: 'answer-1', answerCount: 2 }),
      to: '/x',
    })

    expect(screen.getByText('Solved')).toBeInTheDocument()
  })

  it('agrees the answer count with its noun', () => {
    renderRow({ question: question({ answerCount: 1 }), to: '/x' })
    expect(screen.getByText(/1 answer(?!s)/)).toBeInTheDocument()
  })

  it('pluralises multiple answers', () => {
    renderRow({ question: question({ answerCount: 3 }), to: '/x' })
    expect(screen.getByText(/3 answers/)).toBeInTheDocument()
  })

  it('links to the question detail route it is given', () => {
    renderRow({ question: question(), to: '/courses/cs-3358/questions/question-1' })

    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/courses/cs-3358/questions/question-1',
    )
  })
})
