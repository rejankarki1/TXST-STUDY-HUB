import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarPlus } from 'lucide-react'
import type { Group } from '@/data/types'
import { Button, type ButtonProps } from '@/components/ui/button'
import { Modal } from '@/components/primitives'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/**
 * The one way into session creation from outside a group.
 *
 * A session belongs to a group and the group sets the course, so there is no
 * groupless create route — /groups/:groupId/sessions/new needs the id. With more
 * than one group we have to ask; with exactly one there is nothing to ask about.
 * Renders nothing when the student has no groups: the caller shows the way to
 * Discover instead, because scheduling is not yet a thing they can do.
 */
export function ScheduleSessionButton({
  groups,
  variant = 'primary',
  size = 'md',
  className,
  icon = true,
  children = 'Schedule session',
}: {
  groups: Group[]
  variant?: ButtonProps['variant']
  size?: ButtonProps['size']
  className?: string
  icon?: boolean
  children?: React.ReactNode
}) {
  const navigate = useNavigate()
  const [open, setOpen] = React.useState(false)
  const [picked, setPicked] = React.useState('')

  if (groups.length === 0) return null

  const start = () => {
    if (groups.length === 1) navigate(`/groups/${groups[0].id}/sessions/new`)
    else setOpen(true)
  }

  return (
    <>
      <Button type="button" variant={variant} size={size} className={className} onClick={start}>
        {icon && <CalendarPlus />}
        {children}
      </Button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Which group?"
        description="Sessions belong to a group, and the group sets the course."
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={!picked}
              onClick={() => navigate(`/groups/${picked}/sessions/new`)}
            >
              Continue
            </Button>
          </>
        }
      >
        <Select value={picked} onValueChange={setPicked}>
          <SelectTrigger aria-label="Group">
            <SelectValue placeholder="Choose a group" />
          </SelectTrigger>
          <SelectContent>
            {groups.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                {group.courseCode} · {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Modal>
    </>
  )
}
