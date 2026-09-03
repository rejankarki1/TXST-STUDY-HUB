import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error.js";
import { toPublicUser } from "../shared/publicUser.js";
import type { CreateCircleInput, ListCirclesQuery, UpdateCircleInput } from "./circles.schema.js";

const circleSelect = {
  id: true,
  name: true,
  description: true,
  purpose: true,
  meetingStyle: true,
  maxMembers: true,
  recurringSchedule: true,
  externalLink: true,
  term: true,
  status: true,
  courseId: true,
  creatorId: true,
  createdAt: true,
  updatedAt: true,
  course: {
    select: {
      id: true,
      code: true,
      title: true,
      description: true,
      department: { select: { id: true, code: true, name: true } },
    },
  },
  creator: { select: { id: true, name: true, major: true, gradYear: true } },
  members: {
    orderBy: { joinedAt: "asc" as const },
    select: {
      id: true,
      role: true,
      joinedAt: true,
      user: { select: { id: true, name: true, major: true, gradYear: true } },
    },
  },
  _count: { select: { members: true } },
} satisfies Prisma.StudyCircleSelect;

type SelectedCircle = NonNullable<
  Awaited<ReturnType<typeof prisma.studyCircle.findFirst<{ select: typeof circleSelect }>>>
>;

function formatCircle(circle: SelectedCircle, currentUserId: string) {
  const memberCount = circle._count.members;

  return {
    id: circle.id,
    name: circle.name,
    description: circle.description,
    purpose: circle.purpose,
    meetingStyle: circle.meetingStyle,
    maxMembers: circle.maxMembers,
    recurringSchedule: circle.recurringSchedule,
    externalLink: circle.externalLink,
    term: circle.term,
    status: circle.status,
    courseId: circle.courseId,
    course: circle.course,
    creatorId: circle.creatorId,
    creator: toPublicUser(circle.creator),
    members: circle.members.map((member) => ({
      ...toPublicUser(member.user),
      role: member.role,
      joinedAt: member.joinedAt.toISOString(),
    })),
    memberCount,
    spotsLeft: Math.max(circle.maxMembers - memberCount, 0),
    isFull: memberCount >= circle.maxMembers,
    isMember: circle.members.some((member) => member.user.id === currentUserId),
    isOwner: circle.creatorId === currentUserId,
    createdAt: circle.createdAt.toISOString(),
    updatedAt: circle.updatedAt.toISOString(),
  };
}

export type FormattedCircle = ReturnType<typeof formatCircle>;

export async function findCircleOr404(circleId: string, currentUserId: string) {
  const circle = await prisma.studyCircle.findUnique({
    where: { id: circleId },
    select: circleSelect,
  });

  if (!circle) {
    throw new AppError("Study circle not found", 404);
  }

  return formatCircle(circle, currentUserId);
}

export async function listCircles(currentUserId: string, query: ListCirclesQuery) {
  const search = query.search?.trim();

  const circles = await prisma.studyCircle.findMany({
    where: {
      ...(query.courseId ? { courseId: query.courseId } : {}),
      /* Archived circles are history: they stay reachable by id but never show
         up as something to join. */
      status: query.status ?? "ACTIVE",
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { description: { contains: search, mode: "insensitive" as const } },
              { course: { code: { contains: search, mode: "insensitive" as const } } },
              { course: { title: { contains: search, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    select: circleSelect,
  });

  return circles.map((circle) => formatCircle(circle, currentUserId));
}

export async function listMyCircles(currentUserId: string) {
  const circles = await prisma.studyCircle.findMany({
    where: { members: { some: { userId: currentUserId } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: circleSelect,
  });

  return circles.map((circle) => formatCircle(circle, currentUserId));
}

export async function listCircleMembers(circleId: string, currentUserId: string) {
  const circle = await findCircleOr404(circleId, currentUserId);
  return circle.members;
}

export async function createCircle(currentUserId: string, input: CreateCircleInput) {
  const circleId = await prisma.$transaction(async (tx) => {
    const course = await tx.course.findUnique({
      where: { id: input.courseId },
      select: { id: true },
    });

    if (!course) {
      throw new AppError("Course not found", 404);
    }

    const created = await tx.studyCircle.create({
      data: {
        name: input.name,
        description: input.description,
        purpose: input.purpose,
        meetingStyle: input.meetingStyle,
        maxMembers: input.maxMembers,
        term: input.term,
        recurringSchedule: input.recurringSchedule,
        externalLink: input.externalLink,
        courseId: course.id,
        creatorId: currentUserId,
        members: { create: { userId: currentUserId, role: "OWNER" } },
      },
      select: { id: true },
    });

    /* Starting a circle for a course is a statement that you are taking it. */
    await tx.userCourse.upsert({
      where: { userId_courseId: { userId: currentUserId, courseId: course.id } },
      update: {},
      create: { userId: currentUserId, courseId: course.id },
    });

    return created.id;
  });

  return findCircleOr404(circleId, currentUserId);
}

async function requireOwner(circleId: string, currentUserId: string) {
  const circle = await prisma.studyCircle.findUnique({
    where: { id: circleId },
    select: { id: true, creatorId: true, status: true },
  });

  if (!circle) {
    throw new AppError("Study circle not found", 404);
  }

  if (circle.creatorId !== currentUserId) {
    throw new AppError("Only the circle owner can do that", 403);
  }

  return circle;
}

export async function updateCircle(
  currentUserId: string,
  circleId: string,
  input: UpdateCircleInput,
) {
  await requireOwner(circleId, currentUserId);

  if (input.maxMembers !== undefined) {
    const memberCount = await prisma.studyCircleMember.count({ where: { circleId } });

    if (input.maxMembers < memberCount) {
      throw new AppError(
        `${memberCount} people are already in this circle — the limit cannot go below that`,
        409,
      );
    }
  }

  await prisma.studyCircle.update({
    where: { id: circleId },
    data: {
      name: input.name,
      description: input.description,
      purpose: input.purpose,
      meetingStyle: input.meetingStyle,
      maxMembers: input.maxMembers,
      term: input.term,
      recurringSchedule: input.recurringSchedule === null ? null : input.recurringSchedule,
      externalLink: input.externalLink === null ? null : input.externalLink,
    },
  });

  return findCircleOr404(circleId, currentUserId);
}

export async function setCircleArchived(
  currentUserId: string,
  circleId: string,
  archived: boolean,
) {
  await requireOwner(circleId, currentUserId);

  await prisma.studyCircle.update({
    where: { id: circleId },
    data: { status: archived ? "ARCHIVED" : "ACTIVE" },
  });

  return findCircleOr404(circleId, currentUserId);
}

export async function joinCircle(currentUserId: string, circleId: string) {
  await prisma.$transaction(async (tx) => {
    const circle = await tx.studyCircle.findUnique({
      where: { id: circleId },
      select: {
        id: true,
        courseId: true,
        status: true,
        maxMembers: true,
        _count: { select: { members: true } },
      },
    });

    if (!circle) {
      throw new AppError("Study circle not found", 404);
    }

    if (circle.status === "ARCHIVED") {
      throw new AppError("This circle is archived", 409);
    }

    const existing = await tx.studyCircleMember.findUnique({
      where: { circleId_userId: { circleId, userId: currentUserId } },
      select: { id: true },
    });

    if (existing) {
      throw new AppError("You are already in this circle", 409);
    }

    /* Capacity is checked and the row inserted inside the same transaction, so
       two people racing for the last spot cannot both get it. */
    if (circle._count.members >= circle.maxMembers) {
      throw new AppError("This circle is full", 409);
    }

    await tx.studyCircleMember.create({ data: { circleId, userId: currentUserId } });

    await tx.userCourse.upsert({
      where: { userId_courseId: { userId: currentUserId, courseId: circle.courseId } },
      update: {},
      create: { userId: currentUserId, courseId: circle.courseId },
    });
  });

  return findCircleOr404(circleId, currentUserId);
}

export async function leaveCircle(currentUserId: string, circleId: string) {
  const circle = await prisma.studyCircle.findUnique({
    where: { id: circleId },
    select: { id: true, creatorId: true },
  });

  if (!circle) {
    throw new AppError("Study circle not found", 404);
  }

  /* An owner walking out would leave a circle nobody can edit or archive.
     Archiving or deleting are the two honest exits, and both are owner-only. */
  if (circle.creatorId === currentUserId) {
    throw new AppError(
      "You own this circle — archive or delete it instead of leaving",
      403,
    );
  }

  const membership = await prisma.studyCircleMember.findUnique({
    where: { circleId_userId: { circleId, userId: currentUserId } },
    select: { id: true },
  });

  if (!membership) {
    throw new AppError("You are not in this circle", 404);
  }

  await prisma.studyCircleMember.delete({ where: { id: membership.id } });

  return findCircleOr404(circleId, currentUserId);
}

export async function deleteCircle(currentUserId: string, circleId: string) {
  await requireOwner(circleId, currentUserId);

  /* Sessions survive on purpose: StudySession.circleId is SET NULL, so a meeting
     people already RSVP'd to does not vanish from their Schedule because the
     circle was tidied up. */
  await prisma.studyCircle.delete({ where: { id: circleId } });

  return circleId;
}
