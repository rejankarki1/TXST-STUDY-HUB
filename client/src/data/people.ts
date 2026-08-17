import type { Person } from './types'

export const VIEWER_ID = 'p1'

export const people: Person[] = [
  { id: 'p1', name: 'Rejan Karki', major: 'Computer Science', year: 'Sophomore', gradYear: 2029 },
  { id: 'p2', name: 'Sarah Miller', major: 'Computer Science', year: 'Junior', gradYear: 2027 },
  { id: 'p3', name: 'Miguel Santos', major: 'Computer Science', year: 'Sophomore', gradYear: 2028 },
  { id: 'p4', name: 'Alex Johnson', major: 'Engineering', year: 'Sophomore', gradYear: 2028 },
  { id: 'p5', name: 'Emily Chen', major: 'Mathematics', year: 'Junior', gradYear: 2027 },
  { id: 'p6', name: 'Jordan Williams', major: 'Computer Science', year: 'Freshman', gradYear: 2029 },
  { id: 'p7', name: 'Priya Nair', major: 'Computer Science', year: 'Sophomore', gradYear: 2028 },
  { id: 'p8', name: 'Tyler Brooks', major: 'Mathematics', year: 'Sophomore', gradYear: 2028 },
  { id: 'p9', name: 'Nia Robinson', major: 'Computer Science', year: 'Junior', gradYear: 2027 },
  { id: 'p10', name: 'Daniel Okafor', major: 'Engineering', year: 'Junior', gradYear: 2027 },
  { id: 'p11', name: 'Sofia Reyes', major: 'Mathematics', year: 'Freshman', gradYear: 2029 },
  { id: 'p12', name: 'Ben Carter', major: 'English', year: 'Sophomore', gradYear: 2028 },
]

export const peopleById = Object.fromEntries(people.map((p) => [p.id, p])) as Record<
  string,
  Person
>

export const viewer = peopleById[VIEWER_ID]

/** First name only — how students actually refer to each other. */
export const firstName = (id: string) => peopleById[id]?.name.split(' ')[0] ?? 'Someone'
