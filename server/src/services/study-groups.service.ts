import { prisma } from "../config/prisma.js";
import {
  GroupPurpose,
  MeetingStyle,
} from "../generated/prisma/enums.js";

export type FrontendGroupPurpose =
  | "Exam prep"
  | "Homework"
  | "Weekly studying"
  | "Project work"
  | "General study";

export type FrontendMeetingStyle = "in-person" | "online" | "flexible";

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

export const studyGroupSelect = {
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
      department: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
  },
  creator: {
    select: {
      id: true,
      name: true,
      major: true,
      gradYear: true,
    },
  },
  members: {
    orderBy: {
      joinedAt: "asc" as const,
    },
    select: {
      id: true,
      joinedAt: true,
      lastReadAt: true,
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
  _count: {
    select: {
      members: true,
    },
  },
};

type SelectedStudyGroup = Awaited<
  ReturnType<typeof prisma.studyGroup.findFirst<{ select: typeof studyGroupSelect }>>
>;

export type CreateStudyGroupInput = {
  name: string;
  description: string;
  purpose: FrontendGroupPurpose;
  meetingStyle: FrontendMeetingStyle;
  maxMembers: number;
};

export function formatStudyGroup(
  studyGroup: NonNullable<SelectedStudyGroup>,
  currentUserId?: string,
) {
  const memberCount = studyGroup._count.members;
  const spotsLeft = Math.max(studyGroup.maxMembers - memberCount, 0);

  return {
    id: studyGroup.id,
    name: studyGroup.name,
    description: studyGroup.description,
    purpose: purposeFromPrisma[studyGroup.purpose],
    meetingStyle: meetingStyleFromPrisma[studyGroup.meetingStyle],
    maxMembers: studyGroup.maxMembers,
    courseId: studyGroup.courseId,
    courseCode: studyGroup.course.code,
    creatorId: studyGroup.creatorId,
    createdAt: studyGroup.createdAt.toISOString(),
    updatedAt: studyGroup.updatedAt.toISOString(),
    course: studyGroup.course,
    creator: studyGroup.creator,
    members: studyGroup.members.map((member) => ({
      id: member.user.id,
      name: member.user.name ?? "Student",
      major: member.user.major,
      gradYear: member.user.gradYear,
      joinedAt: member.joinedAt.toISOString(),
    })),
    memberCount,
    spotsLeft,
    isFull: memberCount >= studyGroup.maxMembers,
    isMember: currentUserId
      ? studyGroup.members.some((member) => member.user.id === currentUserId)
      : false,
    isCreator: currentUserId ? studyGroup.creatorId === currentUserId : false,
  };
}

export async function listStudyGroups(input: {
  currentUserId?: string;
  courseId?: string;
  search?: string;
}) {
  const search = input.search?.trim();
  const studyGroups = await prisma.studyGroup.findMany({
    where: {
      courseId: input.courseId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
              { course: { code: { contains: search, mode: "insensitive" } } },
              { course: { title: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
    select: studyGroupSelect,
  });

  return studyGroups.map((studyGroup) =>
    formatStudyGroup(studyGroup, input.currentUserId),
  );
}

export async function listMyStudyGroups(userId: string) {
  const studyGroups = await prisma.studyGroup.findMany({
    where: {
      members: {
        some: {
          userId,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: studyGroupSelect,
  });

  return studyGroups.map((studyGroup) => formatStudyGroup(studyGroup, userId));
}

export async function getStudyGroup(groupId: string, currentUserId?: string) {
  const studyGroup = await prisma.studyGroup.findUnique({
    where: {
      id: groupId,
    },
    select: studyGroupSelect,
  });

  return studyGroup ? formatStudyGroup(studyGroup, currentUserId) : null;
}

export async function createStudyGroupForCourse(
  courseId: string,
  creatorId: string,
  input: CreateStudyGroupInput,
) {
  return prisma.$transaction(async (tx) => {
    const course = await tx.course.findUnique({
      where: {
        id: courseId,
      },
      select: {
        id: true,
      },
    });

    if (!course) {
      return {
        ok: false as const,
        status: 404,
        message: "Course not found",
      };
    }

    const studyGroup = await tx.studyGroup.create({
      data: {
        name: input.name,
        description: input.description,
        purpose: purposeToPrisma[input.purpose],
        meetingStyle: meetingStyleToPrisma[input.meetingStyle],
        maxMembers: input.maxMembers,
        courseId,
        creatorId,
        members: {
          create: {
            userId: creatorId,
          },
        },
      },
      select: studyGroupSelect,
    });

    await tx.userCourse.upsert({
      where: {
        userId_courseId: {
          userId: creatorId,
          courseId,
        },
      },
      update: {},
      create: {
        userId: creatorId,
        courseId,
      },
    });

    return {
      ok: true as const,
      studyGroup: formatStudyGroup(studyGroup, creatorId),
    };
  });
}

export async function joinStudyGroup(groupId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const studyGroup = await tx.studyGroup.findUnique({
      where: {
        id: groupId,
      },
      select: {
        id: true,
        courseId: true,
        maxMembers: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!studyGroup) {
      return {
        ok: false as const,
        status: 404,
        message: "Study group not found",
      };
    }

    const existingMembership = await tx.studyGroupMember.findUnique({
      where: {
        studyGroupId_userId: {
          studyGroupId: groupId,
          userId,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingMembership) {
      return {
        ok: false as const,
        status: 409,
        message: "You already joined this study group",
      };
    }

    if (studyGroup._count.members >= studyGroup.maxMembers) {
      return {
        ok: false as const,
        status: 409,
        message: "This study group is full",
      };
    }

    await tx.studyGroupMember.create({
      data: {
        studyGroupId: groupId,
        userId,
      },
    });

    await tx.userCourse.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId: studyGroup.courseId,
        },
      },
      update: {},
      create: {
        userId,
        courseId: studyGroup.courseId,
      },
    });

    const updatedStudyGroup = await tx.studyGroup.findUniqueOrThrow({
      where: {
        id: groupId,
      },
      select: studyGroupSelect,
    });

    return {
      ok: true as const,
      studyGroup: formatStudyGroup(updatedStudyGroup, userId),
    };
  });
}

export async function leaveStudyGroup(groupId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const studyGroup = await tx.studyGroup.findUnique({
      where: {
        id: groupId,
      },
      select: {
        id: true,
        creatorId: true,
      },
    });

    if (!studyGroup) {
      return {
        ok: false as const,
        status: 404,
        message: "Study group not found",
      };
    }

    if (studyGroup.creatorId === userId) {
      return {
        ok: false as const,
        status: 403,
        message: "Study group organizer cannot leave the group",
      };
    }

    const membership = await tx.studyGroupMember.findUnique({
      where: {
        studyGroupId_userId: {
          studyGroupId: groupId,
          userId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!membership) {
      return {
        ok: false as const,
        status: 404,
        message: "Membership not found",
      };
    }

    await tx.studyGroupMember.delete({
      where: {
        id: membership.id,
      },
    });

    const updatedStudyGroup = await tx.studyGroup.findUniqueOrThrow({
      where: {
        id: groupId,
      },
      select: studyGroupSelect,
    });

    return {
      ok: true as const,
      studyGroup: formatStudyGroup(updatedStudyGroup, userId),
    };
  });
}
