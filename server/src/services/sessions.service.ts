import { prisma } from "../config/prisma.js";
import {
  SessionMode,
  SessionRsvpStatus,
} from "../generated/prisma/enums.js";

export type FrontendSessionMode = "in-person" | "online";
export type FrontendRsvpStatus = "going" | "maybe" | "cant";

const sessionModeToPrisma = {
  "in-person": SessionMode.IN_PERSON,
  online: SessionMode.ONLINE,
} satisfies Record<FrontendSessionMode, SessionMode>;

const sessionModeFromPrisma = {
  [SessionMode.IN_PERSON]: "in-person",
  [SessionMode.ONLINE]: "online",
} satisfies Record<SessionMode, FrontendSessionMode>;

const rsvpStatusToPrisma = {
  going: SessionRsvpStatus.GOING,
  maybe: SessionRsvpStatus.MAYBE,
  cant: SessionRsvpStatus.CANT,
} satisfies Record<FrontendRsvpStatus, SessionRsvpStatus>;

const rsvpStatusFromPrisma = {
  [SessionRsvpStatus.GOING]: "going",
  [SessionRsvpStatus.MAYBE]: "maybe",
  [SessionRsvpStatus.CANT]: "cant",
} satisfies Record<SessionRsvpStatus, FrontendRsvpStatus>;

export const studySessionSelect = {
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
  organizer: {
    select: {
      id: true,
      name: true,
      major: true,
      gradYear: true,
    },
  },
  group: {
    select: {
      id: true,
      name: true,
      course: {
        select: {
          id: true,
          code: true,
          title: true,
        },
      },
    },
  },
  rsvps: {
    orderBy: {
      updatedAt: "asc" as const,
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          name: true,
          major: true,
          gradYear: true,
        },
      },
    },
  },
};

type SelectedStudySession = Awaited<
  ReturnType<typeof prisma.studySession.findFirst<{ select: typeof studySessionSelect }>>
>;

export type CreateStudySessionInput = {
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  mode: FrontendSessionMode;
  location: string;
  locationDetail?: string;
  meetingLink?: string;
};

function countRsvps(
  rsvps: NonNullable<SelectedStudySession>["rsvps"],
  status: SessionRsvpStatus,
) {
  return rsvps.filter((rsvp) => rsvp.status === status).length;
}

export function formatStudySession(
  session: NonNullable<SelectedStudySession>,
  currentUserId?: string,
) {
  const myRsvp = currentUserId
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
    mode: sessionModeFromPrisma[session.mode],
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
      status: rsvpStatusFromPrisma[rsvp.status],
      rsvpUpdatedAt: rsvp.updatedAt.toISOString(),
    })),
    myRsvp: myRsvp ? rsvpStatusFromPrisma[myRsvp.status] : undefined,
    goingCount: countRsvps(session.rsvps, SessionRsvpStatus.GOING),
    maybeCount: countRsvps(session.rsvps, SessionRsvpStatus.MAYBE),
    cantCount: countRsvps(session.rsvps, SessionRsvpStatus.CANT),
  };
}

export async function listGroupSessions(groupId: string, currentUserId: string) {
  const group = await prisma.studyGroup.findUnique({
    where: {
      id: groupId,
    },
    select: {
      id: true,
    },
  });

  if (!group) {
    return {
      ok: false as const,
      status: 404,
      message: "Study group not found",
    };
  }

  const sessions = await prisma.studySession.findMany({
    where: {
      groupId,
    },
    orderBy: {
      startsAt: "asc",
    },
    select: studySessionSelect,
  });

  return {
    ok: true as const,
    studySessions: sessions.map((session) =>
      formatStudySession(session, currentUserId),
    ),
  };
}

export async function listMySessions(userId: string) {
  const sessions = await prisma.studySession.findMany({
    where: {
      group: {
        members: {
          some: {
            userId,
          },
        },
      },
    },
    orderBy: {
      startsAt: "asc",
    },
    select: studySessionSelect,
  });

  return sessions.map((session) => formatStudySession(session, userId));
}

export async function getStudySession(sessionId: string, currentUserId: string) {
  const session = await prisma.studySession.findUnique({
    where: {
      id: sessionId,
    },
    select: studySessionSelect,
  });

  return session ? formatStudySession(session, currentUserId) : null;
}

export async function createStudySession(
  groupId: string,
  organizerId: string,
  input: CreateStudySessionInput,
) {
  return prisma.$transaction(async (tx) => {
    const group = await tx.studyGroup.findUnique({
      where: {
        id: groupId,
      },
      select: {
        id: true,
        members: {
          where: {
            userId: organizerId,
          },
          select: {
            id: true,
          },
        },
      },
    });

    if (!group) {
      return {
        ok: false as const,
        status: 404,
        message: "Study group not found",
      };
    }

    if (group.members.length === 0) {
      return {
        ok: false as const,
        status: 403,
        message: "Only group members can schedule sessions",
      };
    }

    const session = await tx.studySession.create({
      data: {
        groupId,
        organizerId,
        title: input.title,
        description: input.description,
        startsAt: new Date(input.startsAt),
        endsAt: new Date(input.endsAt),
        mode: sessionModeToPrisma[input.mode],
        location: input.location,
        locationDetail: input.locationDetail,
        meetingLink: input.meetingLink,
        rsvps: {
          create: {
            userId: organizerId,
            status: SessionRsvpStatus.GOING,
          },
        },
      },
      select: studySessionSelect,
    });

    return {
      ok: true as const,
      studySession: formatStudySession(session, organizerId),
    };
  });
}

export async function setSessionRsvp(
  sessionId: string,
  userId: string,
  status: FrontendRsvpStatus,
) {
  return prisma.$transaction(async (tx) => {
    const session = await tx.studySession.findUnique({
      where: {
        id: sessionId,
      },
      select: {
        id: true,
        groupId: true,
        group: {
          select: {
            members: {
              where: {
                userId,
              },
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      return {
        ok: false as const,
        status: 404,
        message: "Study session not found",
      };
    }

    if (session.group.members.length === 0) {
      return {
        ok: false as const,
        status: 403,
        message: "Only group members can RSVP to sessions",
      };
    }

    await tx.sessionRsvp.upsert({
      where: {
        sessionId_userId: {
          sessionId,
          userId,
        },
      },
      update: {
        status: rsvpStatusToPrisma[status],
      },
      create: {
        sessionId,
        userId,
        status: rsvpStatusToPrisma[status],
      },
    });

    const updatedSession = await tx.studySession.findUniqueOrThrow({
      where: {
        id: sessionId,
      },
      select: studySessionSelect,
    });

    return {
      ok: true as const,
      studySession: formatStudySession(updatedSession, userId),
    };
  });
}
