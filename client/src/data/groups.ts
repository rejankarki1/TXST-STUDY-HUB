import type { Group } from './types'
import { atDay } from './time'

/**
 * Eight groups, chosen to exercise every state the design has to handle:
 * joined, joinable, created-by-me, full, online-only, and brand new.
 */
export const groups: Group[] = [
  {
    id: 'g1',
    name: 'Data Structures Grind',
    courseCode: 'CS 2308',
    description:
      'Weekly study group for staying ahead on assignments and preparing for exams. We work through the hard problems together instead of suffering alone at 2 AM.',
    purpose: 'Weekly studying',
    meetingStyle: 'in-person',
    maxMembers: 10,
    memberIds: ['p2', 'p3', 'p1', 'p7', 'p9', 'p4', 'p6'],
    creatorId: 'p2',
    createdAt: atDay(-38, 14),
  },
  {
    id: 'g2',
    name: 'Exam 1 Prep',
    courseCode: 'CS 2308',
    description:
      'Focused review group for the first exam. Practice problems, past quizzes, and a walkthrough of everything from chapters 1–5.',
    purpose: 'Exam prep',
    meetingStyle: 'in-person',
    maxMembers: 10,
    memberIds: ['p9', 'p10', 'p7', 'p3', 'p6', 'p4', 'p12', 'p11'],
    creatorId: 'p9',
    createdAt: atDay(-12, 11),
  },
  {
    id: 'g3',
    name: 'Calc II Final Prep',
    courseCode: 'MATH 2472',
    description:
      'Working through series, integration techniques, and old finals. Everyone brings one problem they are stuck on.',
    purpose: 'Exam prep',
    meetingStyle: 'flexible',
    maxMembers: 8,
    memberIds: ['p5', 'p1', 'p8', 'p11', 'p4'],
    creatorId: 'p5',
    createdAt: atDay(-21, 16),
  },
  {
    id: 'g4',
    name: 'Discrete Math Crew',
    courseCode: 'MATH 2358',
    description:
      'Small group for the weekly problem sets. Mostly proofs, induction, and trying to make graph theory click.',
    purpose: 'Weekly studying',
    meetingStyle: 'in-person',
    maxMembers: 6,
    memberIds: ['p1', 'p8', 'p5', 'p11'],
    creatorId: 'p1',
    createdAt: atDay(-9, 20),
  },
  {
    id: 'g5',
    name: 'Friday Calculus Study',
    courseCode: 'MATH 2471',
    description:
      'Every Friday afternoon before the weekend. We finish the homework together so nobody has to do it Sunday night.',
    purpose: 'Homework',
    meetingStyle: 'in-person',
    maxMembers: 6,
    memberIds: ['p8', 'p11', 'p5', 'p10', 'p4', 'p12'],
    creatorId: 'p8',
    createdAt: atDay(-30, 13),
  },
  {
    id: 'g6',
    name: 'CS 1428 Beginners',
    courseCode: 'CS 1428',
    description:
      'For anyone new to programming. No question is too basic here — we cover loops, functions, and the labs from scratch.',
    purpose: 'General study',
    meetingStyle: 'online',
    maxMembers: 12,
    memberIds: ['p6', 'p11', 'p12'],
    creatorId: 'p6',
    createdAt: atDay(-6, 19),
  },
  {
    id: 'g7',
    name: 'Late Night Debuggers',
    courseCode: 'CS 2308',
    description:
      'We hop on a call around 9 PM and debug assignments together. Good for people who study late.',
    purpose: 'Homework',
    meetingStyle: 'online',
    maxMembers: 8,
    memberIds: ['p3', 'p7', 'p9', 'p10'],
    creatorId: 'p3',
    createdAt: atDay(-15, 21),
  },
  {
    id: 'g8',
    name: 'Essay Workshop',
    courseCode: 'ENG 1310',
    description:
      'Peer review before papers are due. Bring a draft, leave with notes.',
    purpose: 'Project work',
    meetingStyle: 'flexible',
    maxMembers: 8,
    memberIds: ['p12', 'p11'],
    creatorId: 'p12',
    createdAt: atDay(-1, 10),
  },
]
