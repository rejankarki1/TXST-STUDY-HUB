import type { Course } from './types'

export const courses: Course[] = [
  { code: 'CS 1428', title: 'Foundations of Computer Science I', department: 'Computer Science' },
  { code: 'CS 2308', title: 'Foundations of Computer Science II', department: 'Computer Science' },
  { code: 'CS 2318', title: 'Assembly Language', department: 'Computer Science' },
  { code: 'MATH 2471', title: 'Calculus I', department: 'Mathematics' },
  { code: 'MATH 2472', title: 'Calculus II', department: 'Mathematics' },
  { code: 'MATH 2358', title: 'Discrete Mathematics I', department: 'Mathematics' },
  { code: 'MATH 3305', title: 'Linear Algebra', department: 'Mathematics' },
  { code: 'ENG 1310', title: 'College Writing I', department: 'English' },
  { code: 'ENG 1320', title: 'College Writing II', department: 'English' },
  { code: 'POSI 2310', title: 'Principles of American Government', department: 'Political Science' },
  { code: 'HIST 1310', title: 'History of the United States to 1877', department: 'History' },
  { code: 'PHYS 1430', title: 'General Physics I', department: 'Physics' },
  { code: 'BIO 1330', title: 'Functional Biology', department: 'Biology' },
  { code: 'PSY 1300', title: 'Introduction to Psychology', department: 'Psychology' },
]

export const coursesByCode = Object.fromEntries(courses.map((c) => [c.code, c])) as Record<
  string,
  Course
>

/** "CS 2308" ⇄ "cs-2308" — keeps course URLs readable. */
export const courseSlug = (code: string) => code.toLowerCase().replace(/\s+/g, '-')

export const codeFromSlug = (slug: string) =>
  courses.find((c) => courseSlug(c.code) === slug)?.code

/** The courses the viewer picked during onboarding. */
export const defaultEnrolledCourses = ['CS 2308', 'MATH 2472', 'MATH 2358', 'ENG 1310']

export const CAMPUS_LOCATIONS = [
  'Alkek Library',
  'LBJ Student Center',
  'Ingram Hall',
  'Supple Science Building',
  'Comal Building',
  'Derrick Hall',
] as const
