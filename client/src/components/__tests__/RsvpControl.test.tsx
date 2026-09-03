import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RsvpControl } from '@/components/RsvpControl'

describe('RsvpControl', () => {
  it('renders the three RSVP states as radios', () => {
    render(<RsvpControl value={null} onChange={vi.fn().mockResolvedValue(undefined)} />)

    expect(screen.getByRole('radio', { name: 'Going' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Maybe' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: "Can't" })).toBeInTheDocument()
  })

  it('marks the current status as checked', () => {
    render(<RsvpControl value="MAYBE" onChange={vi.fn().mockResolvedValue(undefined)} />)

    expect(screen.getByRole('radio', { name: 'Maybe' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Going' })).not.toBeChecked()
  })

  it('sends the wire value, not the label, when a state is picked', async () => {
    const onChange = vi.fn().mockResolvedValue(undefined)
    render(<RsvpControl value={null} onChange={onChange} />)

    await userEvent.click(screen.getByRole('radio', { name: 'Going' }))

    expect(onChange).toHaveBeenCalledWith('GOING')
  })

  it('moves the selection immediately rather than waiting for the server', async () => {
    let resolve: () => void = () => {}
    const onChange = vi.fn().mockReturnValue(new Promise<void>((r) => { resolve = r }))

    render(<RsvpControl value={null} onChange={onChange} />)
    await userEvent.click(screen.getByRole('radio', { name: 'Going' }))

    expect(screen.getByRole('radio', { name: 'Going' })).toBeChecked()
    resolve()
  })

  /* A failed RSVP that keeps looking successful is the worst outcome here: the
     student thinks they are on the list and nobody expects them. */
  it('rolls the selection back when the server rejects it', async () => {
    const onChange = vi.fn().mockRejectedValue(new Error('nope'))
    render(<RsvpControl value="CANT" onChange={onChange} />)

    await userEvent.click(screen.getByRole('radio', { name: 'Going' }))

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: "Can't" })).toBeChecked()
    })
  })

  it('does not re-send the status that is already selected', async () => {
    const onChange = vi.fn().mockResolvedValue(undefined)
    render(<RsvpControl value="GOING" onChange={onChange} />)

    await userEvent.click(screen.getByRole('radio', { name: 'Going' }))

    expect(onChange).not.toHaveBeenCalled()
  })
})
