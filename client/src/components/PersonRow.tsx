import { Badge, Meta } from '@/components/primitives'
import { Avatar } from '@/components/Avatar'
import { INTENT_LABELS, INTENT_TONES } from '@/lib/contracts'
import type { ApiCoursePerson } from '@/lib/api'

/**
 * A classmate in the Course Hub People tab.
 *
 * There is deliberately no way to contact anyone from here — no message button,
 * no email. If you want to study with someone, you answer their Study Request or
 * post your own. Discovery exists to tell you the room is not empty.
 */
export function PersonRow({ person }: { person: ApiCoursePerson }) {
  return (
    <li className="flex items-center gap-3 px-4 py-3.5">
      <Avatar person={person} size="md" />

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
          <span className="truncate">{person.name}</span>
          {person.isMe && <Badge tone="neutral">You</Badge>}
        </p>
        <Meta
          className="mt-0.5"
          items={[person.major, person.gradYear && `Class of ${person.gradYear}`]}
        />
      </div>

      {person.currentIntent && (
        <Badge tone={INTENT_TONES[person.currentIntent.intent]} className="shrink-0">
          {INTENT_LABELS[person.currentIntent.intent]}
        </Badge>
      )}
    </li>
  )
}
