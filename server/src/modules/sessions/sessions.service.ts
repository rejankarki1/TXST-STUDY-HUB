import { SessionMode, SessionRsvpStatus } from "../../generated/prisma/enums.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error.js";
import type {
  CreateSessionInput,
  FrontendRsvpStatus,
  FrontendSessionMode,
} from "./sessions.schema.js";

const modeToPrisma = {
  "in-person": SessionMode.IN_PERSON,
  online: SessionMode.ONLINE,
} satisfies Record<FrontendSessionMode, SessionMode>;

const modeFromPrisma = {
  [SessionMode.IN_PERSON]: "in-person",
  [SessionMode.ONLINE]: "online",
} satisfies Record<SessionMode, FrontendSessionMode>;

const rsvpToPrisma = {
  going: SessionRsvpStatus.GOING,
  maybe: SessionRsvpStatus.MAYBE,
  cant: SessionRsvpStatus.CANT,
} satisfies Record<FrontendRsvpStatus, SessionRsvpStatus>;

const rsvpFromPrisma = {
  [SessionRsvpStatus.GOING]: "going",
  [SessionRsvpStatus.MAYBE]: "maybe",
  [SessionRsvpStatus.CANT]: "cant",
} satisfies Record<SessionRsvpStatus, FrontendRsvpStatus>;

const sessionSelect = {
  id: true,
  groupId: true,
  organizerId: true,
  title: true,
  description: true,
  startsAt: true,
  endsAt: true,
  mode: true,
  location: true,
  locationDetail: true,
  meetingLink: true,
  createdAt: true,
  updatedAt: true,
  organizer: { select: { id: true, name: true, major: true, gradYear: true } },
  group: {
    select: {
      id: true,
      name: true,
      course: { select: { id: true, code: true, title: true } },
    },
  },
  rsvps: {
    orderBy: { updatedAt: "asc" as const },
    select: {
      id: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      user: { select: { id: true, name: true, major: true, gradYear: true } },
    },
  },
};

type SelectedSession = NonNullable<
  Awaited<ReturnType<typeof prisma.studySession.findFirst<{ select: typeof sessionSelect }>>>
>;

function formatSession(session: SelectedSession, currentUserId?: string) {
  const count = (status: SessionRsvpStatus) =>
    session.rsvps.filter((rsvp) => rsvp.status === status).length;

  const mine = currentUserId
    ? session.rsvps.find((rsvp) => rsvp.user.id === currentUserId)
    : undefined;

  return {
    id: session.id,
    groupId: session.groupId,
    organizerId: session.organizerId,
    title: session.title,
    description: session.description,
    startsAt: session.startsAt.toISOString(),
    endsAt: session.endsAt.toISOString(),
    mode: modeFromPrisma[session.mode],
    location: session.location,
    locationDetail: session.locationDetail,
    meetingLink: session.meetingLink,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    organizer: {
      id: session.organizer.id,
      name: session.organizer.name ?? "Student",
      major: session.organizer.major,
      gradYear: session.organizer.gradYear,
    },
    group: session.group,
    attendees: session.rsvps.map((rsvp) => ({
      id: rsvp.user.id,
      name: rsvp.user.name ?? "Student",
      major: rsvp.user.major,
      gradYear: rsvp.user.gradYear,
      status: rsvpFromPrisma[rsvp.status],
      rsvpUpdatedAt: rsvp.updatedAt.toISOString(),
    })),
    myRsvp: mine ? rsvpFromPrisma[mine.status] : undefined,
    goingCount: count(SessionRsvpStatus.GOING),
    maybeCount: count(SessionRsvpStatus.MAYBE),
    cantCount: count(SessionRsvpStatus.CANT),
  };
}

async function requireMembership(groupId: string, userId: string, action: string) {
  const membership = await prisma.studyGroupMember.findUnique({
    where: { studyGroupId_userId: { studyGroupId: groupId, userId } },
    select: { id: true },
  });

  if (!membership) {
    throw new AppError(`Only group members can ${action}`, 403);
  }
}

export async function listMySessions(currentUserId: string) {
  const sessions = await prisma.studySession.findMany({
    where: { group: { members: { some: { userId: currentUserId } } } },
    orderBy: { startsAt: "asc" },
    select: sessionSelect,
  });

  return sessions.map((session) => formatSession(session, currentUserId));
}

export async function getSession(currentUserId: string, sessionId: string) {
  const session = await prisma.studySession.findUnique({
    where: { id: sessionId },
    select: sessionSelect,
  });

  if (!session) {
    throw new AppError("Study session not found", 404);
  }

  return formatSession(session, currentUserId);
}

export async function listGroupSessions(currentUserId: string, groupId: string) {
  const group = await prisma.studyGroup.findUnique({
    where: { id: groupId },
    select: { id: true },
  });

  if (!group) {
    throw new AppError("Study group not found", 404);
  }

  const sessions = await prisma.studySession.findMany({
    where: { groupId },
    orderBy: { startsAt: "asc" },
    select: sessionSelect,
  });

  return sessions.map((session) => formatSession(session, currentUserId));
}

export async function createSession(
  currentUserId: string,
  groupId: string,
  input: CreateSessionInput,
) {
  const group = await prisma.studyGroup.findUnique({
    where: { id: groupId },
    select: { id: true },
  });

  if (!group) {
    throw new AppError("Study group not found", 404);
  }

  await requireMembership(groupId, currentUserId, "schedule sessions");

  const session = await prisma.studySession.create({
    data: {
      groupId,
      organizerId: currentUserId,
      title: input.title,
      description: input.description,
      startsAt: new Date(input.startsAt),
      endsAt: new Date(input.endsAt),
      mode: modeToPrisma[input.mode],
      location: input.location,
      locationDetail: input.locationDetail,
      meetingLink: input.meetingLink,
      rsvps: { create: { userId: currentUserId, status: SessionRsvpStatus.GOING } },
    },
    select: sessionSelect,
  });

  return formatSession(session, currentUserId);
}

export async function setSessionRsvp(
  currentUserId: string,
  sessionId: string,
  status: FrontendRsvpStatus,
) {
  const session = await prisma.studySession.findUnique({
    where: { id: sessionId },
    select: { id: true, groupId: true },
  });

  if (!session) {
    throw new AppError("Study session not found", 404);
  }

  await requireMembership(session.groupId, currentUserId, "RSVP to sessions");

  await prisma.sessionRsvp.upsert({
    where: { sessionId_userId: { sessionId, userId: currentUserId } },
    update: { status: rsvpToPrisma[status] },
    create: { sessionId, userId: currentUserId, status: rsvpToPrisma[status] },
  });

  const updated = await prisma.studySession.findUniqueOrThrow({
    where: { id: sessionId },
    select: sessionSelect,
  });

  return formatSession(updated, currentUserId);
}
