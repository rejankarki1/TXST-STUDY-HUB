import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TimeOptionPicker } from '@/components/TimeOptionPicker'
import { timeOption } from '@/test/factories'

const options = [
  timeOption({ id: 't1', availableCount: 2 }),
  timeOption({ id: 't2', availableCount: 1 }),
]

describe('TimeOptionPicker', () => {
  it('renders a checkbox per proposed window', () => {
    render(<TimeOptionPicker options={options} selected={[]} onToggle={vi.fn()} />)
    expect(screen.getAllByRole('checkbox')).toHaveLength(2)
  })

  it('checks the windows already selected', () => {
    render(<TimeOptionPicker options={options} selected={['t1']} onToggle={vi.fn()} />)

    const [first, second] = screen.getAllByRole('checkbox')
    expect(first).toBeChecked()
    expect(second).not.toBeChecked()
  })

  it('reports the toggled option id', async () => {
    const onToggle = vi.fn()
    render(<TimeOptionPicker options={options} selected={['t1']} onToggle={onToggle} />)

    await userEvent.click(screen.getAllByRole('checkbox')[1])

    expect(onToggle).toHaveBeenCalledWith('t2')
  })

  it('shows how many people can make each window', () => {
    render(<TimeOptionPicker options={options} selected={[]} onToggle={vi.fn()} />)

    expect(screen.getByText('2 people')).toBeInTheDocument()
    expect(screen.getByText('1 person')).toBeInTheDocument()
  })

  it('can hide the counts for the compose form, where nobody has answered yet', () => {
    render(
      <TimeOptionPicker options={options} selected={[]} onToggle={vi.fn()} showCounts={false} />,
    )
    expect(screen.queryByText('2 people')).not.toBeInTheDocument()
  })

  it('does not fire when disabled', async () => {
    const onToggle = vi.fn()
    render(<TimeOptionPicker options={options} selected={[]} onToggle={onToggle} disabled />)

    await userEvent.click(screen.getAllByRole('checkbox')[0], { pointerEventsCheck: 0 })

    expect(onToggle).not.toHaveBeenCalled()
  })
})
