import { del, get, patch, post, query } from './client'
import type { ApiCircle, ApiCircleMember, ApiSession } from './types'
import type { CirclePurpose, CircleStatus, MeetingStyle } from '@/lib/contracts'

export type NewCircle = {
  courseId: string
  name: string
  description: string
  purpose: CirclePurpose
  meetingStyle: MeetingStyle
  maxMembers: number
  term: string
  recurringSchedule?: string
  externalLink?: string
}

export const circlesApi = {
  list(filters: { courseId?: string; search?: string; status?: CircleStatus } = {}) {
    return get<{ circles: ApiCircle[] }>(`/circles${query({ ...filters })}`)
  },

  mine() {
    return get<{ circles: ApiCircle[] }>('/circles/mine')
  },

  get(circleId: string) {
    return get<{ circle: ApiCircle }>(`/circles/${circleId}`)
  },

  members(circleId: string) {
    return get<{ members: ApiCircleMember[] }>(`/circles/${circleId}/members`)
  },

  create(input: NewCircle) {
    return post<{ circle: ApiCircle }>('/circles', input)
  },

  update(circleId: string, input: Partial<Omit<NewCircle, 'courseId'>>) {
    return patch<{ circle: ApiCircle }>(`/circles/${circleId}`, input)
  },

  join(circleId: string) {
    return post<{ circle: ApiCircle }>(`/circles/${circleId}/join`)
  },

  leave(circleId: string) {
    return del<{ circle: ApiCircle }>(`/circles/${circleId}/leave`)
  },

  setArchived(circleId: string, archived: boolean) {
    return patch<{ circle: ApiCircle }>(`/circles/${circleId}/archive`, { archived })
  },

  remove(circleId: string) {
    return del<{ circleId: string }>(`/circles/${circleId}`)
  },

  sessions(circleId: string) {
    return get<{ sessions: ApiSession[] }>(`/circles/${circleId}/sessions`)
  },

  createSession(circleId: string, input: NewSessionInput) {
    return post<{ session: ApiSession }>(`/circles/${circleId}/sessions`, input)
  },
}

export type NewSessionInput = {
  title: string
  description: string
  agenda?: string
  startsAt: string
  endsAt: string
  mode: 'IN_PERSON' | 'ONLINE'
  location: string
  locationDetail?: string
  meetingLink?: string
}
