import type { Message } from './types'
import { daysAgoAt, minutesAgo } from './time'

let seq = 0
const m = (groupId: string, authorId: string, sentAt: string, body: string): Message => ({
  id: `m${++seq}`,
  groupId,
  authorId,
  body,
  sentAt,
})

/**
 * Real conversations, not filler. The g1 transcript deliberately spans three
 * days and includes back-to-back messages from one person so the date
 * separators and message grouping in the chat design have something to do.
 */
export const messages: Message[] = [
  /* ---- Data Structures Grind (g1) — two days ago ---- */
  m('g1', 'p2', daysAgoAt(2, 19, 2), 'Heads up — Exam 1 is a week from Tuesday.'),
  m(
    'g1',
    'p2',
    daysAgoAt(2, 19, 3),
    'I think we should do a real review session instead of just the usual weekly meetup.',
  ),
  m('g1', 'p3', daysAgoAt(2, 19, 14), 'yes please'),
  m(
    'g1',
    'p9',
    daysAgoAt(2, 19, 31),
    "Agreed. I looked at the review sheet and there's a lot more recursion on it than I expected.",
  ),
  m('g1', 'p2', daysAgoAt(2, 19, 40), 'Same thing I noticed.'),

  /* ---- Yesterday ---- */
  m('g1', 'p7', daysAgoAt(1, 13, 20), 'did anyone start the problem set yet'),
  m('g1', 'p3', daysAgoAt(1, 13, 26), 'started it, got through 3'),
  m('g1', 'p3', daysAgoAt(1, 13, 27), 'number 4 is rough though'),
  m('g1', 'p1', daysAgoAt(1, 14, 2), 'which part of 4?'),
  m(
    'g1',
    'p3',
    daysAgoAt(1, 14, 5),
    'the part where you delete a node in the middle and you only have a pointer to that node',
  ),
  m(
    'g1',
    'p1',
    daysAgoAt(1, 14, 9),
    "you copy the next node's data into the current one, then delete the next node instead. same result, and you never need the previous pointer",
  ),
  m('g1', 'p3', daysAgoAt(1, 14, 11), "ok that's kind of a hack"),
  m('g1', 'p1', daysAgoAt(1, 14, 11), "it is, but it's the intended answer"),
  m('g1', 'p4', daysAgoAt(1, 15, 48), 'wait that actually makes sense. thanks'),
  m('g1', 'p2', daysAgoAt(1, 17, 3), 'Okay — I scheduled the Exam 1 review.'),
  m('g1', 'p2', daysAgoAt(1, 17, 4), 'Alkek, 4th floor, the study rooms by the windows.'),
  m('g1', 'p6', daysAgoAt(1, 17, 20), "I'll be there"),
  m('g1', 'p9', daysAgoAt(1, 17, 44), 'same'),

  /* ---- Today ---- */
  m('g1', 'p2', minutesAgo(196), 'Are we still meeting at Alkek tonight?'),
  m('g1', 'p3', minutesAgo(191), 'yeah, fourth floor at 6'),
  m('g1', 'p3', minutesAgo(189), "I'll grab a table early if I can get there first"),
  m('g1', 'p7', minutesAgo(142), 'I might be about 10 minutes late, coming straight from lab'),
  m(
    'g1',
    'p9',
    minutesAgo(96),
    'Does anyone want to go over linked lists before we start on practice problems?',
  ),
  m('g1', 'p2', minutesAgo(92), "Good call. Let's do 30 minutes of review, then problems."),
  m('g1', 'p3', minutesAgo(88), 'I can bring my notes from the pointers lecture'),
  /* --- last three are unread for the viewer --- */
  m('g1', 'p2', minutesAgo(46), 'Perfect. See everyone at 6 👍'),
  m('g1', 'p6', minutesAgo(23), 'Did everyone finish question 4?'),
  m('g1', 'p3', minutesAgo(12), "I'm still stuck on the linked list part honestly"),

  /* ---- Calc II Final Prep (g3) ---- */
  m('g3', 'p5', daysAgoAt(2, 11, 15), 'Reminder: bring one problem you got stuck on this week.'),
  m('g3', 'p8', daysAgoAt(2, 11, 40), 'mine is going to be trig sub, every time'),
  m('g3', 'p11', daysAgoAt(1, 9, 22), 'is partial fractions on the final?'),
  m('g3', 'p5', daysAgoAt(1, 9, 35), "Yes — it was two questions on last semester's."),
  m('g3', 'p5', daysAgoAt(1, 9, 36), "I'll print copies of that final for Thursday."),
  m('g3', 'p1', daysAgoAt(1, 12, 5), 'that would help a lot, thanks'),
  m('g3', 'p4', minutesAgo(310), 'Ingram 244 again this week right?'),
  m('g3', 'p5', minutesAgo(295), 'Yep, same room. 5:30.'),

  /* ---- Discrete Math Crew (g4) ---- */
  m('g4', 'p1', daysAgoAt(3, 20, 10), 'Problem set 4 is up. Induction and a bit of graph theory.'),
  m('g4', 'p8', daysAgoAt(3, 20, 42), 'how bad is it'),
  m('g4', 'p1', daysAgoAt(3, 20, 45), 'six problems, but two of them are proofs'),
  m('g4', 'p5', daysAgoAt(2, 18, 3), 'The strong induction one took me an hour. Worth starting early.'),
  m('g4', 'p11', minutesAgo(180), 'can we meet a bit earlier this week? I have a lab at 6'),
  /* --- unread for the viewer --- */
  m('g4', 'p8', minutesAgo(64), '4pm works for me if it works for everyone else'),

  /* ---- Exam 1 Prep (g2) ---- */
  m('g2', 'p9', daysAgoAt(2, 16, 0), 'Review sheet is posted. Chapters 1 through 5.'),
  m('g2', 'p10', daysAgoAt(2, 16, 30), 'are we going through all of it in one session?'),
  m('g2', 'p9', daysAgoAt(2, 16, 33), 'That’s the plan. Three hours, we take a break halfway.'),
  m('g2', 'p7', daysAgoAt(1, 10, 12), 'I can bring practice quizzes from last semester'),
  m('g2', 'p9', daysAgoAt(1, 10, 20), 'That would be great, bring them.'),

  /* ---- Friday Calculus Study (g5) ---- */
  m('g5', 'p8', daysAgoAt(1, 14, 0), 'Same time Friday. Alkek 2nd floor.'),
  m('g5', 'p11', daysAgoAt(1, 14, 22), 'see you there'),

  /* ---- CS 1428 Beginners (g6) ---- */
  m('g6', 'p6', daysAgoAt(2, 19, 30), 'Starting this because I know I am not the only one lost.'),
  m('g6', 'p11', daysAgoAt(2, 20, 1), 'definitely not just you'),
  m('g6', 'p12', daysAgoAt(1, 21, 15), 'do we need to have the lab done before we meet?'),
  m('g6', 'p6', daysAgoAt(1, 21, 20), 'Nope, we do it together on the call.'),

  /* ---- Late Night Debuggers (g7) ---- */
  m('g7', 'p3', daysAgoAt(1, 22, 10), 'call is open, come through'),
  m('g7', 'p10', daysAgoAt(1, 22, 48), 'segfault. again.'),
  m('g7', 'p7', daysAgoAt(1, 22, 51), 'check your loop bounds, it is always the loop bounds'),
  m('g7', 'p10', daysAgoAt(1, 23, 4), 'it was the loop bounds'),

  /* ---- Essay Workshop (g8) has no messages — this is the empty chat state. ---- */
]

/** Groups with unread messages for the viewer at first load. */
export const initialUnread: Record<string, number> = { g1: 3, g4: 1 }
