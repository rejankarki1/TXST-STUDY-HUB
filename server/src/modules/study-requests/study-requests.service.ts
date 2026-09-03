import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { toPublicUser } from "../shared/publicUser.js";
import { requireCourse } from "../courses/courses.service.js";
import { formatSession, sessionSelect } from "../sessions/sessions.format.js";
import type {
  ConvertToSessionInput,
  CreateStudyRequestInput,
  JoinStudyRequestInput,
  ListStudyRequestsQuery,
  UpdateStudyRequestInput,
} from "./study-requests.schema.js";

const requestSelect = {
  id: true,
  courseId: true,
  creatorId: true,
  topic: true,
  details: true,
  intent: true,
  meetingStyle: true,
  location: true,
  maxParticipants: true,
  status: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true,
  course: {
    select: {
      id: true,
      code: true,
      title: true,
      department: { select: { id: true, code: true, name: true } },
    },
  },
  creator: { select: { id: true, name: true, major: true, gradYear: true } },
  session: { select: { id: true, startsAt: true, status: true } },
  timeOptions: {
    orderBy: { startsAt: "asc" as const },
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      availability: { select: { participant: { select: { userId: true } } } },
    },
  },
  participants: {
    orderBy: { joinedAt: "asc" as const },
    select: {
      id: true,
      joinedAt: true,
      user: { select: { id: true, name: true, major: true, gradYear: true } },
      availability: { select: { timeOptionId: true } },
    },
  },
} satisfies Prisma.StudyRequestSelect;

type SelectedRequest = NonNullable<
  Awaited<ReturnType<typeof prisma.studyRequest.findFirst<{ select: typeof requestSelect }>>>
>;

function formatRequest(request: SelectedRequest, currentUserId: string) {
  const participantCount = request.participants.length;
  const isFull = participantCount >= request.maxParticipants;

  return {
    id: request.id,
    courseId: request.courseId,
    course: request.course,
    creatorId: request.creatorId,
    creator: toPublicUser(request.creator),
    topic: request.topic,
    details: request.details,
    intent: request.intent,
    meetingStyle: request.meetingStyle,
    location: request.location,
    maxParticipants: request.maxParticipants,
    status: request.status,
    expiresAt: request.expiresAt?.toISOString() ?? null,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    timeOptions: request.timeOptions.map((option) => ({
      id: option.id,
      startsAt: option.startsAt.toISOString(),
      endsAt: option.endsAt.toISOString(),
      availableCount: option.availability.length,
      /* Whether *I* said I can make this one, so the UI can render the
         checkboxes without a second request. */
      selectedByMe: option.availability.some(
        (entry) => entry.participant.userId === currentUserId,
      ),
    })),
    participants: request.participants.map((participant) => ({
      ...toPublicUser(participant.user),
      joinedAt: participant.joinedAt.toISOString(),
      isCreator: participant.user.id === request.creatorId,
      timeOptionIds: participant.availability.map((entry) => entry.timeOptionId),
    })),
    participantCount,
    spotsLeft: Math.max(request.maxParticipants - participantCount, 0),
    isFull,
    isCreator: request.creatorId === currentUserId,
    hasJoined: request.participants.some(
      (participant) => participant.user.id === currentUserId,
    ),
    /* Converted requests keep pointing at what they became, so the detail page
       can show "this happened" instead of a dead end. */
    sessionId: request.session?.id ?? null,
    /* One derived flag rather than five status comparisons repeated in the UI. */
    isOpen: request.status === "OPEN" && !isFull,
  };
}

export type FormattedStudyRequest = ReturnType<typeof formatRequest>;

/**
 * Flip requests whose window has passed before anything reads them.
 *
 * Doing it lazily on read keeps the stored status honest without a scheduler,
 * and the [status, expiresAt] index makes it a cheap no-op the vast majority of
 * the time.
 */
async function expireStaleRequests() {
  await prisma.studyRequest.updateMany({
    where: { status: "OPEN", expiresAt: { lt: new Date() } },
    data: { status: "EXPIRED" },
  });
}

async function findRequestOr404(requestId: string, currentUserId: string) {
  const request = await prisma.studyRequest.findUnique({
    where: { id: requestId },
    select: requestSelect,
  });

  if (!request) {
    throw new AppError("Study request not found", 404);
  }

  return formatRequest(request, currentUserId);
}

export async function getStudyRequest(requestId: string, currentUserId: string) {
  await expireStaleRequests();
  return findRequestOr404(requestId, currentUserId);
}

function buildWhere(
  query: ListStudyRequestsQuery,
  currentUserId: string,
): Prisma.StudyRequestWhereInput {
  const search = query.search?.trim();

  return {
    /* Default view is opportunities: anything already converted, cancelled or
       expired is history and must not read as something you can still join. */
    status: query.status ?? "OPEN",
    ...(query.intent ? { intent: query.intent } : {}),
    ...(query.meetingStyle ? { meetingStyle: query.meetingStyle } : {}),
    ...(query.mine ? { participants: { some: { userId: currentUserId } } } : {}),
    ...(search
      ? {
          OR: [
            { topic: { contains: search, mode: "insensitive" as const } },
            { details: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(query.from || query.to
      ? {
          timeOptions: {
            some: {
              ...(query.from ? { startsAt: { gte: new Date(query.from) } } : {}),
              ...(query.to ? { endsAt: { lte: new Date(query.to) } } : {}),
            },
          },
        }
      : {}),
  };
}

export async function listCourseStudyRequests(
  courseId: string,
  currentUserId: string,
  query: ListStudyRequestsQuery,
) {
  await requireCourse(courseId);
  await expireStaleRequests();

  const requests = await prisma.studyRequest.findMany({
    where: { courseId, ...buildWhere(query, currentUserId) },
    orderBy: { createdAt: "desc" },
    select: requestSelect,
  });

  const formatted = requests.map((request) => formatRequest(request, currentUserId));

  /* Capacity is a count over the joined rows, so it cannot be expressed in the
     Prisma where clause without a raw query. Filtering here keeps one source of
     truth for "full" — formatRequest. */
  return query.openSpotsOnly ? formatted.filter((request) => !request.isFull) : formatted;
}

/** Home: open requests in the courses the student actually takes. */
export async function listStudyRequestsForMyCourses(currentUserId: string) {
  await expireStaleRequests();

  const requests = await prisma.studyRequest.findMany({
    where: {
      status: "OPEN",
      course: { selectedBy: { some: { userId: currentUserId } } },
      creatorId: { not: currentUserId },
      participants: { none: { userId: currentUserId } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: requestSelect,
  });

  return requests
    .map((request) => formatRequest(request, currentUserId))
    .filter((request) => !request.isFull);
}

/** Home: requests the student created or joined, newest first. */
export async function listMyStudyRequests(currentUserId: string) {
  await expireStaleRequests();

  const requests = await prisma.studyRequest.findMany({
    where: { participants: { some: { userId: currentUserId } } },
    orderBy: { createdAt: "desc" },
    select: requestSelect,
  });

  return requests.map((request) => formatRequest(request, currentUserId));
}

export async function createStudyRequest(
  currentUserId: string,
  courseId: string,
  input: CreateStudyRequestInput,
) {
  await requireCourse(courseId);

  const created = await prisma.$transaction(async (tx) => {
    const request = await tx.studyRequest.create({
      data: {
        courseId,
        creatorId: currentUserId,
        topic: input.topic,
        details: input.details,
        intent: input.intent,
        meetingStyle: input.meetingStyle,
        location: input.location,
        maxParticipants: input.maxParticipants,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        timeOptions: {
          create: input.timeOptions.map((option) => ({
            startsAt: new Date(option.startsAt),
            endsAt: new Date(option.endsAt),
          })),
        },
        /* The creator is a participant from the start — they are one of the
           people who will be at this session, not an administrator of it. */
        participants: { create: { userId: currentUserId } },
      },
      select: { id: true, timeOptions: { select: { id: true } }, participants: { select: { id: true } } },
    });

    /* The creator proposed every window, so they are available for all of them.
       Making that explicit keeps availableCount honest from the first render. */
    const participantId = request.participants[0]!.id;
    await tx.studyRequestAvailability.createMany({
      data: request.timeOptions.map((option) => ({
        participantId,
        timeOptionId: option.id,
      })),
    });

    /* Posting a request for a course is a statement that you are taking it. */
    await tx.userCourse.upsert({
      where: { userId_courseId: { userId: currentUserId, courseId } },
      update: {},
      create: { userId: currentUserId, courseId },
    });

    return request.id;
  });

  return findRequestOr404(created, currentUserId);
}

async function requireOwnedRequest(requestId: string, currentUserId: string) {
  const request = await prisma.studyRequest.findUnique({
    where: { id: requestId },
    select: { id: true, creatorId: true, status: true, maxParticipants: true },
  });

  if (!request) {
    throw new AppError("Study request not found", 404);
  }

  if (request.creatorId !== currentUserId) {
    throw new AppError("Only the person who posted this request can change it", 403);
  }

  return request;
}

export async function updateStudyRequest(
  currentUserId: string,
  requestId: string,
  input: UpdateStudyRequestInput,
) {
  const existing = await requireOwnedRequest(requestId, currentUserId);

  if (existing.status !== "OPEN") {
    throw new AppError("Only an open request can be edited", 409);
  }

  await prisma.$transaction(async (tx) => {
    if (input.maxParticipants !== undefined) {
      const participantCount = await tx.studyRequestParticipant.count({ where: { requestId } });

      if (input.maxParticipants < participantCount) {
        throw new AppError(
          `${participantCount} people have already joined — the limit cannot go below that`,
          409,
        );
      }
    }

    await tx.studyRequest.update({
      where: { id: requestId },
      data: {
        topic: input.topic,
        details: input.details === null ? null : input.details,
        intent: input.intent,
        meetingStyle: input.meetingStyle,
        location: input.location === null ? null : input.location,
        maxParticipants: input.maxParticipants,
        expiresAt:
          input.expiresAt === undefined
            ? undefined
            : input.expiresAt === null
              ? null
              : new Date(input.expiresAt),
      },
    });

    /* Replacing the windows invalidates every availability answer, because the
       options people agreed to no longer exist. Cascade handles the join rows;
       participants stay and are re-prompted. */
    if (input.timeOptions) {
      await tx.studyRequestTimeOption.deleteMany({ where: { requestId } });
      await tx.studyRequestTimeOption.createMany({
        data: input.timeOptions.map((option) => ({
          requestId,
          startsAt: new Date(option.startsAt),
          endsAt: new Date(option.endsAt),
        })),
      });
    }
  });

  return findRequestOr404(requestId, currentUserId);
}

export async function cancelStudyRequest(currentUserId: string, requestId: string) {
  const existing = await requireOwnedRequest(requestId, currentUserId);

  if (existing.status === "CONVERTED") {
    throw new AppError("This request already became a session", 409);
  }

  if (existing.status === "CANCELLED") {
    return findRequestOr404(requestId, currentUserId);
  }

  await prisma.studyRequest.update({
    where: { id: requestId },
    data: { status: "CANCELLED" },
  });

  return findRequestOr404(requestId, currentUserId);
}

/**
 * Join, or update which windows you can make.
 *
 * Everything here runs in one transaction because capacity is checked against a
 * count that a second concurrent join would otherwise invalidate between the
 * check and the insert.
 */
export async function joinStudyRequest(
  currentUserId: string,
  requestId: string,
  input: JoinStudyRequestInput,
) {
  await expireStaleRequests();

  await prisma.$transaction(async (tx) => {
    const request = await tx.studyRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        courseId: true,
        status: true,
        maxParticipants: true,
        timeOptions: { select: { id: true } },
        participants: { select: { id: true, userId: true } },
      },
    });

    if (!request) {
      throw new AppError("Study request not found", 404);
    }

    if (request.status !== "OPEN") {
      throw new AppError("This request is no longer open to join", 409);
    }

    const existing = request.participants.find(
      (participant) => participant.userId === currentUserId,
    );

    if (existing) {
      throw new AppError("You already joined this request", 409);
    }

    if (request.participants.length >= request.maxParticipants) {
      throw new AppError("This request is full", 409);
    }

    const validOptionIds = new Set(request.timeOptions.map((option) => option.id));
    const selected = [...new Set(input.timeOptionIds)];

    if (selected.some((id) => !validOptionIds.has(id))) {
      throw new AppError("Those times do not belong to this request", 400);
    }

    const participant = await tx.studyRequestParticipant.create({
      data: { requestId, userId: currentUserId },
      select: { id: true },
    });

    await tx.studyRequestAvailability.createMany({
      data: selected.map((timeOptionId) => ({ participantId: participant.id, timeOptionId })),
    });

    /* Once two people are in, the request has done its matching job. */
    if (request.participants.length + 1 >= 2) {
      await tx.studyRequest.update({ where: { id: requestId }, data: { status: "OPEN" } });
    }

    await tx.userCourse.upsert({
      where: { userId_courseId: { userId: currentUserId, courseId: request.courseId } },
      update: {},
      create: { userId: currentUserId, courseId: request.courseId },
    });
  });

  return findRequestOr404(requestId, currentUserId);
}

/** Change which windows you can make, without leaving and rejoining. */
export async function setMyAvailability(
  currentUserId: string,
  requestId: string,
  input: JoinStudyRequestInput,
) {
  await prisma.$transaction(async (tx) => {
    const participant = await tx.studyRequestParticipant.findUnique({
      where: { requestId_userId: { requestId, userId: currentUserId } },
      select: { id: true, request: { select: { status: true, timeOptions: { select: { id: true } } } } },
    });

    if (!participant) {
      throw new AppError("Join the request before choosing times", 404);
    }

    if (participant.request.status !== "OPEN") {
      throw new AppError("This request is no longer open", 409);
    }

    const validOptionIds = new Set(participant.request.timeOptions.map((option) => option.id));
    const selected = [...new Set(input.timeOptionIds)];

    if (selected.some((id) => !validOptionIds.has(id))) {
      throw new AppError("Those times do not belong to this request", 400);
    }

    await tx.studyRequestAvailability.deleteMany({ where: { participantId: participant.id } });
    await tx.studyRequestAvailability.createMany({
      data: selected.map((timeOptionId) => ({ participantId: participant.id, timeOptionId })),
    });
  });

  return findRequestOr404(requestId, currentUserId);
}

export async function withdrawFromStudyRequest(currentUserId: string, requestId: string) {
  const request = await prisma.studyRequest.findUnique({
    where: { id: requestId },
    select: { id: true, creatorId: true, status: true },
  });

  if (!request) {
    throw new AppError("Study request not found", 404);
  }

  /* The creator withdrawing would leave a request nobody owns. Cancelling is
     the honest action, and it is one click away in the same menu. */
  if (request.creatorId === currentUserId) {
    throw new AppError("Cancel the request instead of withdrawing from it", 403);
  }

  const participant = await prisma.studyRequestParticipant.findUnique({
    where: { requestId_userId: { requestId, userId: currentUserId } },
    select: { id: true },
  });

  if (!participant) {
    throw new AppError("You have not joined this request", 404);
  }

  await prisma.studyRequestParticipant.delete({ where: { id: participant.id } });

  return findRequestOr404(requestId, currentUserId);
}

/**
 * The heart of the product: an agreed time turns a request into a real session.
 *
 * Everything below happens in one transaction so a failure at any step leaves no
 * half-built session behind, and the unique index on
 * StudySession.studyRequestId means a duplicate conversion is impossible even if
 * two requests race past the status check.
 */
export async function convertStudyRequestToSession(
  currentUserId: string,
  requestId: string,
  input: ConvertToSessionInput,
) {
  const sessionId = await prisma.$transaction(async (tx) => {
    const request = await tx.studyRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        courseId: true,
        creatorId: true,
        topic: true,
        details: true,
        status: true,
        session: { select: { id: true } },
        timeOptions: { select: { id: true, startsAt: true, endsAt: true } },
        participants: { select: { userId: true } },
      },
    });

    if (!request) {
      throw new AppError("Study request not found", 404);
    }

    if (request.creatorId !== currentUserId) {
      throw new AppError("Only the person who posted this request can confirm a time", 403);
    }

    if (request.session) {
      throw new AppError("This request already became a session", 409, {
        sessionId: request.session.id,
      });
    }

    if (request.status !== "OPEN") {
      throw new AppError("Only an open request can be turned into a session", 409);
    }

    const timeOption = request.timeOptions.find((option) => option.id === input.timeOptionId);

    if (!timeOption) {
      throw new AppError("That time is not one of the proposed options", 400);
    }

    const session = await tx.studySession.create({
      data: {
        courseId: request.courseId,
        studyRequestId: request.id,
        organizerId: currentUserId,
        title: input.title ?? request.topic,
        description: input.description ?? request.details ?? request.topic,
        agenda: input.agenda,
        startsAt: timeOption.startsAt,
        endsAt: timeOption.endsAt,
        mode: input.mode,
        location: input.location,
        locationDetail: input.locationDetail,
        meetingLink: input.meetingLink,
        rsvps: {
          create: request.participants.map((participant) => ({
            userId: participant.userId,
            /* The organiser confirmed this time, so they are going. Everyone
               else said only that they *could* make it — MAYBE until they
               actually RSVP. */
            status: participant.userId === currentUserId ? "GOING" : "MAYBE",
          })),
        },
      },
      select: { id: true },
    });

    await tx.studyRequest.update({
      where: { id: requestId },
      data: { status: "CONVERTED" },
    });

    return session.id;
  });

  const session = await prisma.studySession.findUniqueOrThrow({
    where: { id: sessionId },
    select: sessionSelect,
  });

  return {
    session: formatSession(session, currentUserId),
    request: await findRequestOr404(requestId, currentUserId),
  };
}
