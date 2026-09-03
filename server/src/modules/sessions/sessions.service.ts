import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error.js";
import {
  canAccessSession,
  formatSession,
  sessionSelect,
  type SelectedSession,
} from "./sessions.format.js";
import type {
  CompleteSessionInput,
  CreateSessionInput,
  RsvpStatusInput,
  UpdateSessionInput,
} from "./sessions.schema.js";

async function loadSessionOr404(sessionId: string): Promise<SelectedSession> {
  const session = await prisma.studySession.findUnique({
    where: { id: sessionId },
    select: sessionSelect,
  });

  if (!session) {
    throw new AppError("Study session not found", 404);
  }

  return session;
}

async function reload(sessionId: string, currentUserId: string) {
  return formatSession(await loadSessionOr404(sessionId), currentUserId);
}

function requireOrganizer(session: SelectedSession, currentUserId: string) {
  if (session.organizerId !== currentUserId) {
    throw new AppError("Only the session organizer can do that", 403);
  }
}

export async function getSession(currentUserId: string, sessionId: string) {
  return formatSession(await loadSessionOr404(sessionId), currentUserId);
}

/**
 * Everything on the student's Schedule: sessions they organise, sessions they
 * were RSVP'd into by a request conversion, and sessions belonging to a Circle
 * they are in.
 */
export async function listMySessions(currentUserId: string) {
  const sessions = await prisma.studySession.findMany({
    where: {
      OR: [
        { organizerId: currentUserId },
        { rsvps: { some: { userId: currentUserId } } },
        { circle: { members: { some: { userId: currentUserId } } } },
      ],
    },
    orderBy: { startsAt: "asc" },
    select: sessionSelect,
  });

  return sessions.map((session) => formatSession(session, currentUserId));
}

/** Upcoming sessions in one course — the Course Hub view, public by design. */
export async function listCourseSessions(courseId: string, currentUserId: string) {
  const sessions = await prisma.studySession.findMany({
    where: { courseId, status: "PLANNED", startsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
    select: sessionSelect,
  });

  return sessions.map((session) => formatSession(session, currentUserId));
}

export async function listCircleSessions(circleId: string, currentUserId: string) {
  const circle = await prisma.studyCircle.findUnique({
    where: { id: circleId },
    select: { id: true },
  });

  if (!circle) {
    throw new AppError("Study circle not found", 404);
  }

  const sessions = await prisma.studySession.findMany({
    where: { circleId },
    orderBy: { startsAt: "asc" },
    select: sessionSelect,
  });

  return sessions.map((session) => formatSession(session, currentUserId));
}

/**
 * Circle sessions. Membership is the permission — the same rule the product had
 * before the rename, kept deliberately: any member can put a meeting on the
 * calendar, not only the owner.
 */
export async function createCircleSession(
  currentUserId: string,
  circleId: string,
  input: CreateSessionInput,
) {
  const circle = await prisma.studyCircle.findUnique({
    where: { id: circleId },
    select: {
      id: true,
      courseId: true,
      status: true,
      members: { where: { userId: currentUserId }, select: { id: true } },
    },
  });

  if (!circle) {
    throw new AppError("Study circle not found", 404);
  }

  if (circle.members.length === 0) {
    throw new AppError("Only circle members can schedule sessions", 403);
  }

  if (circle.status === "ARCHIVED") {
    throw new AppError("This circle is archived", 409);
  }

  const session = await prisma.studySession.create({
    data: {
      courseId: circle.courseId,
      circleId,
      organizerId: currentUserId,
      title: input.title,
      description: input.description,
      agenda: input.agenda,
      startsAt: new Date(input.startsAt),
      endsAt: new Date(input.endsAt),
      mode: input.mode,
      location: input.location,
      locationDetail: input.locationDetail,
      meetingLink: input.meetingLink,
      rsvps: { create: { userId: currentUserId, status: "GOING" } },
    },
    select: { id: true },
  });

  return reload(session.id, currentUserId);
}

export async function updateSession(
  currentUserId: string,
  sessionId: string,
  input: UpdateSessionInput,
) {
  const session = await loadSessionOr404(sessionId);
  requireOrganizer(session, currentUserId);

  if (session.status !== "PLANNED") {
    throw new AppError("Only a planned session can be edited", 409);
  }

  /* Times can be changed one at a time, so the ordering check has to run against
     the merged result rather than the payload alone. */
  const startsAt = input.startsAt ? new Date(input.startsAt) : session.startsAt;
  const endsAt = input.endsAt ? new Date(input.endsAt) : session.endsAt;

  if (endsAt <= startsAt) {
    throw new AppError("End time must be after start time", 400);
  }

  const mode = input.mode ?? session.mode;
  const meetingLink =
    input.meetingLink === undefined ? session.meetingLink : input.meetingLink;

  if (mode === "ONLINE" && !meetingLink) {
    throw new AppError("Online sessions need a meeting link", 400);
  }

  await prisma.studySession.update({
    where: { id: sessionId },
    data: {
      title: input.title,
      description: input.description,
      agenda: input.agenda === null ? null : input.agenda,
      startsAt,
      endsAt,
      mode,
      location: input.location,
      locationDetail: input.locationDetail === null ? null : input.locationDetail,
      meetingLink: meetingLink ?? null,
    },
  });

  return reload(sessionId, currentUserId);
}

export async function cancelSession(currentUserId: string, sessionId: string) {
  const session = await loadSessionOr404(sessionId);
  requireOrganizer(session, currentUserId);

  if (session.status === "COMPLETED") {
    throw new AppError("A completed session cannot be cancelled", 409);
  }

  await prisma.studySession.update({
    where: { id: sessionId },
    data: { status: "CANCELLED" },
  });

  return reload(sessionId, currentUserId);
}

/**
 * Completing a session, and optionally turning what the group could not solve
 * into a Course Question. Both writes share a transaction so a session is never
 * marked complete while its follow-up question fails to post.
 */
export async function completeSession(
  currentUserId: string,
  sessionId: string,
  input: CompleteSessionInput,
) {
  const session = await loadSessionOr404(sessionId);
  requireOrganizer(session, currentUserId);

  if (session.status === "CANCELLED") {
    throw new AppError("A cancelled session cannot be completed", 409);
  }

  const questionId = await prisma.$transaction(async (tx) => {
    await tx.studySession.update({
      where: { id: sessionId },
      data: {
        status: "COMPLETED",
        topicsCompleted: input.topicsCompleted,
        recap: input.recap,
      },
    });

    if (!input.saveAsQuestion || !input.unresolvedQuestion) {
      return null;
    }

    const question = await tx.courseQuestion.create({
      data: {
        courseId: session.courseId,
        authorId: currentUserId,
        title: input.unresolvedQuestion,
        body:
          input.unresolvedQuestionDetails ??
          `Came up during "${session.title}" and we did not get to a clear answer.`,
      },
      select: { id: true },
    });

    return question.id;
  });

  return { session: await reload(sessionId, currentUserId), questionId };
}

export async function setSessionRsvp(
  currentUserId: string,
  sessionId: string,
  status: RsvpStatusInput,
) {
  const session = await loadSessionOr404(sessionId);

  /* The same rule that gates the meeting link gates RSVP: if you cannot see the
     session's private half, you are not one of the people attending it. */
  if (!canAccessSession(session, currentUserId)) {
    throw new AppError("You are not part of this study session", 403);
  }

  if (session.status !== "PLANNED") {
    throw new AppError("This session is no longer taking RSVPs", 409);
  }

  await prisma.sessionRsvp.upsert({
    where: { sessionId_userId: { sessionId, userId: currentUserId } },
    update: { status },
    create: { sessionId, userId: currentUserId, status },
  });

  return reload(sessionId, currentUserId);
}
