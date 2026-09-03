import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { toPublicUser } from "../shared/publicUser.js";

export const sessionSelect = {
  id: true,
  courseId: true,
  circleId: true,
  studyRequestId: true,
  organizerId: true,
  title: true,
  description: true,
  agenda: true,
  startsAt: true,
  endsAt: true,
  mode: true,
  location: true,
  locationDetail: true,
  meetingLink: true,
  status: true,
  topicsCompleted: true,
  recap: true,
  createdAt: true,
  updatedAt: true,
  course: { select: { id: true, code: true, title: true } },
  organizer: { select: { id: true, name: true, major: true, gradYear: true } },
  circle: {
    select: {
      id: true,
      name: true,
      status: true,
      members: { select: { userId: true } },
    },
  },
  studyRequest: { select: { id: true, topic: true, intent: true } },
  rsvps: {
    orderBy: { updatedAt: "asc" as const },
    select: {
      id: true,
      status: true,
      updatedAt: true,
      user: { select: { id: true, name: true, major: true, gradYear: true } },
    },
  },
} satisfies Prisma.StudySessionSelect;

export type SelectedSession = NonNullable<
  Awaited<ReturnType<typeof prisma.studySession.findFirst<{ select: typeof sessionSelect }>>>
>;

/**
 * Who is allowed to see the private half of a session.
 *
 * Three ways in, and no fourth: you organised it, you are on the RSVP list
 * (which is how request participants arrive), or you are in the Circle that owns
 * it. Everyone else gets the public shape below — enough to know a session
 * exists in their course, never the meeting link or who is attending.
 */
export function canAccessSession(session: SelectedSession, userId: string) {
  if (session.organizerId === userId) return true;
  if (session.rsvps.some((rsvp) => rsvp.user.id === userId)) return true;
  if (session.circle?.members.some((member) => member.userId === userId)) return true;

  return false;
}

export function formatSession(session: SelectedSession, currentUserId: string) {
  const canAccess = canAccessSession(session, currentUserId);
  const count = (status: "GOING" | "MAYBE" | "CANT") =>
    session.rsvps.filter((rsvp) => rsvp.status === status).length;

  const mine = session.rsvps.find((rsvp) => rsvp.user.id === currentUserId);

  return {
    id: session.id,
    courseId: session.courseId,
    course: session.course,
    circleId: session.circleId,
    circle: session.circle ? { id: session.circle.id, name: session.circle.name } : null,
    studyRequestId: session.studyRequestId,
    studyRequest: session.studyRequest,
    organizerId: session.organizerId,
    organizer: toPublicUser(session.organizer),
    title: session.title,
    description: session.description,
    agenda: session.agenda,
    startsAt: session.startsAt.toISOString(),
    endsAt: session.endsAt.toISOString(),
    mode: session.mode,
    location: session.location,
    locationDetail: session.locationDetail,
    /* The two fields worth protecting: a join link is a door, and an attendee
       list is other students' business. Counts stay visible so a classmate can
       still see the session has traction. */
    meetingLink: canAccess ? session.meetingLink : null,
    attendees: canAccess
      ? session.rsvps.map((rsvp) => ({
          ...toPublicUser(rsvp.user),
          status: rsvp.status,
          rsvpUpdatedAt: rsvp.updatedAt.toISOString(),
        }))
      : [],
    status: session.status,
    topicsCompleted: session.topicsCompleted,
    recap: session.recap,
    myRsvp: mine?.status ?? null,
    goingCount: count("GOING"),
    maybeCount: count("MAYBE"),
    cantCount: count("CANT"),
    isOrganizer: session.organizerId === currentUserId,
    canAccessDetails: canAccess,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}

export type FormattedSession = ReturnType<typeof formatSession>;
