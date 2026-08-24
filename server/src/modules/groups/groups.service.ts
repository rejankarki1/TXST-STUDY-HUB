import { GroupPurpose, MeetingStyle } from "../../generated/prisma/enums.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error.js";
import type {
  CreateGroupInput,
  FrontendGroupPurpose,
  FrontendMeetingStyle,
} from "./groups.schema.js";

const purposeToPrisma = {
  "Exam prep": GroupPurpose.EXAM_PREP,
  Homework: GroupPurpose.HOMEWORK,
  "Weekly studying": GroupPurpose.WEEKLY_STUDYING,
  "Project work": GroupPurpose.PROJECT_WORK,
  "General study": GroupPurpose.GENERAL_STUDY,
} satisfies Record<FrontendGroupPurpose, GroupPurpose>;

const purposeFromPrisma = {
  [GroupPurpose.EXAM_PREP]: "Exam prep",
  [GroupPurpose.HOMEWORK]: "Homework",
  [GroupPurpose.WEEKLY_STUDYING]: "Weekly studying",
  [GroupPurpose.PROJECT_WORK]: "Project work",
  [GroupPurpose.GENERAL_STUDY]: "General study",
} satisfies Record<GroupPurpose, FrontendGroupPurpose>;

const meetingStyleToPrisma = {
  "in-person": MeetingStyle.IN_PERSON,
  online: MeetingStyle.ONLINE,
  flexible: MeetingStyle.FLEXIBLE,
} satisfies Record<FrontendMeetingStyle, MeetingStyle>;

const meetingStyleFromPrisma = {
  [MeetingStyle.IN_PERSON]: "in-person",
  [MeetingStyle.ONLINE]: "online",
  [MeetingStyle.FLEXIBLE]: "flexible",
} satisfies Record<MeetingStyle, FrontendMeetingStyle>;

const groupSelect = {
  id: true,
  name: true,
  description: true,
  purpose: true,
  meetingStyle: true,
  maxMembers: true,
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
      joinedAt: true,
      lastReadAt: true,
      user: { select: { id: true, name: true, major: true, gradYear: true } },
    },
  },
  _count: { select: { members: true } },
};

type SelectedGroup = NonNullable<
  Awaited<ReturnType<typeof prisma.studyGroup.findFirst<{ select: typeof groupSelect }>>>
>;

function formatGroup(group: SelectedGroup, currentUserId?: string) {
  const memberCount = group._count.members;

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    purpose: purposeFromPrisma[group.purpose],
    meetingStyle: meetingStyleFromPrisma[group.meetingStyle],
    maxMembers: group.maxMembers,
    courseId: group.courseId,
    courseCode: group.course.code,
    creatorId: group.creatorId,
    createdAt: group.createdAt.toISOString(),
    updatedAt: group.updatedAt.toISOString(),
    course: group.course,
    creator: group.creator,
    members: group.members.map((member) => ({
      id: member.user.id,
      name: member.user.name ?? "Student",
      major: member.user.major,
      gradYear: member.user.gradYear,
      joinedAt: member.joinedAt.toISOString(),
    })),
    memberCount,
    spotsLeft: Math.max(group.maxMembers - memberCount, 0),
    isFull: memberCount >= group.maxMembers,
    isMember: currentUserId
      ? group.members.some((member) => member.user.id === currentUserId)
      : false,
    isCreator: currentUserId ? group.creatorId === currentUserId : false,
  };
}

export async function findGroupOr404(groupId: string, currentUserId: string) {
  const group = await prisma.studyGroup.findUnique({
    where: { id: groupId },
    select: groupSelect,
  });

  if (!group) {
    throw new AppError("Study group not found", 404);
  }

  return formatGroup(group, currentUserId);
}

export async function listGroups(
  currentUserId: string,
  input: { courseId?: string; search?: string },
) {
  const search = input.search?.trim() ?? "";
  const groups = await prisma.studyGroup.findMany({
    where: {
      courseId: input.courseId,
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
    select: groupSelect,
  });

  return groups.map((group) => formatGroup(group, currentUserId));
}

export async function listMyGroups(currentUserId: string) {
  const groups = await prisma.studyGroup.findMany({
    where: { members: { some: { userId: currentUserId } } },
    orderBy: { createdAt: "desc" },
    select: groupSelect,
  });

  return groups.map((group) => formatGroup(group, currentUserId));
}

export async function listGroupMembers(groupId: string, currentUserId: string) {
  const group = await findGroupOr404(groupId, currentUserId);
  return group.members;
}

export async function createGroup(currentUserId: string, input: CreateGroupInput) {
  const group = await prisma.$transaction(async (tx) => {
    const course = await tx.course.findUnique({
      where: { id: input.courseId },
      select: { id: true },
    });

    if (!course) {
      throw new AppError("Course not found", 404);
    }

    const created = await tx.studyGroup.create({
      data: {
        name: input.name,
        description: input.description,
        purpose: purposeToPrisma[input.purpose],
        meetingStyle: meetingStyleToPrisma[input.meetingStyle],
        maxMembers: input.maxMembers,
        courseId: course.id,
        creatorId: currentUserId,
        members: {
          create: { userId: currentUserId, role: "OWNER" },
        },
      },
      select: groupSelect,
    });

    await tx.userCourse.upsert({
      where: { userId_courseId: { userId: currentUserId, courseId: course.id } },
      update: {},
      create: { userId: currentUserId, courseId: course.id },
    });

    return created;
  });

  return formatGroup(group, currentUserId);
}

export async function joinGroup(currentUserId: string, groupId: string) {
  const group = await prisma.$transaction(async (tx) => {
    const target = await tx.studyGroup.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        courseId: true,
        maxMembers: true,
        _count: { select: { members: true } },
      },
    });

    if (!target) {
      throw new AppError("Study group not found", 404);
    }

    const existing = await tx.studyGroupMember.findUnique({
      where: { studyGroupId_userId: { studyGroupId: groupId, userId: currentUserId } },
      select: { id: true },
    });

    if (existing) {
      throw new AppError("You already joined this study group", 409);
    }

    if (target._count.members >= target.maxMembers) {
      throw new AppError("This study group is full", 409);
    }

    await tx.studyGroupMember.create({
      data: { studyGroupId: groupId, userId: currentUserId },
    });

    await tx.userCourse.upsert({
      where: { userId_courseId: { userId: currentUserId, courseId: target.courseId } },
      update: {},
      create: { userId: currentUserId, courseId: target.courseId },
    });

    return tx.studyGroup.findUniqueOrThrow({
      where: { id: groupId },
      select: groupSelect,
    });
  });

  return formatGroup(group, currentUserId);
}

export async function leaveGroup(currentUserId: string, groupId: string) {
  const group = await prisma.$transaction(async (tx) => {
    const target = await tx.studyGroup.findUnique({
      where: { id: groupId },
      select: { id: true, creatorId: true },
    });

    if (!target) {
      throw new AppError("Study group not found", 404);
    }

    if (target.creatorId === currentUserId) {
      throw new AppError("Study group organizer cannot leave the group", 403);
    }

    const membership = await tx.studyGroupMember.findUnique({
      where: { studyGroupId_userId: { studyGroupId: groupId, userId: currentUserId } },
      select: { id: true },
    });

    if (!membership) {
      throw new AppError("Membership not found", 404);
    }

    await tx.studyGroupMember.delete({ where: { id: membership.id } });

    return tx.studyGroup.findUniqueOrThrow({
      where: { id: groupId },
      select: groupSelect,
    });
  });

  return formatGroup(group, currentUserId);
}

export async function deleteGroup(currentUserId: string, groupId: string) {
  const group = await prisma.studyGroup.findUnique({
    where: { id: groupId },
    select: { id: true, creatorId: true },
  });

  if (!group) {
    throw new AppError("Study group not found", 404);
  }

  if (group.creatorId !== currentUserId) {
    throw new AppError("Only the study group creator can delete this group", 403);
  }

  await prisma.studyGroup.delete({ where: { id: groupId } });
  return groupId;
}
