/**
 * Scripted responses for the prototype's chat. When the viewer sends a
 * message, one group member "types" and then answers from this pool, so a
 * walkthrough of the chat screen feels like a real conversation rather than
 * a monologue. Purely a design device — there is no backend here.
 */

type ReplyScript = { authorId: string; body: string }

const GENERIC: ReplyScript[] = [
  { authorId: 'p3', body: 'good point' },
  { authorId: 'p2', body: 'Works for me.' },
  { authorId: 'p7', body: "I'm in" },
  { authorId: 'p9', body: 'same here' },
]

const BY_GROUP: Record<string, ReplyScript[]> = {
  g1: [
    { authorId: 'p3', body: 'yeah that works' },
    { authorId: 'p2', body: "Sounds good — I'll save us a table on the 4th floor." },
    { authorId: 'p7', body: 'perfect, see you there' },
    { authorId: 'p9', body: 'I can go over the recursion problems if people want' },
    { authorId: 'p6', body: 'ok that helps a lot actually' },
    { authorId: 'p4', body: 'bringing my laptop, we can run through the lab together' },
    { authorId: 'p3', body: "wait can you explain that part again when we meet? I don't want to hold up the group in chat" },
  ],
  g3: [
    { authorId: 'p5', body: "Nice — I'll add that to the list for Thursday." },
    { authorId: 'p8', body: 'trig sub is going to be the end of me' },
    { authorId: 'p11', body: 'that makes sense, thank you' },
    { authorId: 'p4', body: 'same room right? Ingram 244' },
  ],
  g4: [
    { authorId: 'p8', body: '4pm works for me' },
    { authorId: 'p5', body: 'I can make 4 as well.' },
    { authorId: 'p11', body: 'perfect, that saves me' },
    { authorId: 'p8', body: 'are we doing the proofs first or the graph theory' },
  ],
  g2: [
    { authorId: 'p9', body: 'Adding that to the review sheet.' },
    { authorId: 'p10', body: 'good, I needed that one explained' },
    { authorId: 'p7', body: "I'll bring the practice quizzes" },
  ],
  g6: [
    { authorId: 'p6', body: 'no worries, we go slow in here' },
    { authorId: 'p11', body: 'I had the exact same question' },
    { authorId: 'p12', body: 'ok that finally clicked' },
  ],
  g7: [
    { authorId: 'p3', body: 'send the error, we can look at it on the call' },
    { authorId: 'p10', body: 'it is always the loop bounds' },
    { authorId: 'p7', body: 'hop on whenever' },
  ],
  g5: [
    { authorId: 'p8', body: 'see you Friday' },
    { authorId: 'p11', body: 'sounds good' },
  ],
  g8: [
    { authorId: 'p12', body: 'Happy to read a draft whenever you have one.' },
    { authorId: 'p11', body: 'same, just send it over' },
  ],
}

/**
 * Picks a reply from a member who is actually in the group, rotating through
 * the script so repeated messages don't get the same answer twice.
 */
export function nextReply(groupId: string, memberIds: string[], turn: number) {
  const pool = (BY_GROUP[groupId] ?? GENERIC).filter((r) => memberIds.includes(r.authorId))
  const usable = pool.length ? pool : GENERIC.filter((r) => memberIds.includes(r.authorId))
  if (!usable.length) return null
  return usable[turn % usable.length]
}
