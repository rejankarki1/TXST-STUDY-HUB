import { prisma } from "../config/prisma.js";
import {
  StudyGroupMode,
  StudyGroupStatus,
} from "../generated/prisma/enums.js";

export const studyGroupSelect = {
  id: true,
  title: true,
  description: true,
  startDateTime: true,
  mode: true,
  location: true,
  onlineDetails: true,
  maxMembers: true,
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
      email: true,
    },
  },
  members: {
    orderBy: {
      joinedAt: "asc" as const,
    },
    select: {
      id: true,
      joinedAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
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

export type CreateStudyGroupInput = {
  title: string;
  description: string;
  startDateTime: string;
  mode: StudyGroupMode;
  location?: string;
  onlineDetails?: string;
  maxMembers: number;
};

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
        title: input.title,
        description: input.description,
        startDateTime: new Date(input.startDateTime),
        mode: input.mode,
        location: input.mode === StudyGroupMode.IN_PERSON ? input.location : null,
        onlineDetails:
          input.mode === StudyGroupMode.ONLINE ? input.onlineDetails : null,
        maxMembers: input.maxMembers,
        status: StudyGroupStatus.OPEN,
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

    return {
      ok: true as const,
      studyGroup,
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
        maxMembers: true,
        status: true,
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

    if (studyGroup.status === StudyGroupStatus.CANCELLED) {
      return {
        ok: false as const,
        status: 409,
        message: "This study group is cancelled",
      };
    }

    if (studyGroup.status === StudyGroupStatus.FULL) {
      return {
        ok: false as const,
        status: 409,
        message: "This study group is full",
      };
    }

    if (studyGroup._count.members >= studyGroup.maxMembers) {
      await tx.studyGroup.update({
        where: {
          id: groupId,
        },
        data: {
          status: StudyGroupStatus.FULL,
        },
      });

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

    const memberCount = studyGroup._count.members + 1;
    const status =
      memberCount >= studyGroup.maxMembers
        ? StudyGroupStatus.FULL
        : StudyGroupStatus.OPEN;

    const updatedStudyGroup = await tx.studyGroup.update({
      where: {
        id: groupId,
      },
      data: {
        status,
      },
      select: studyGroupSelect,
    });

    return {
      ok: true as const,
      studyGroup: updatedStudyGroup,
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
        maxMembers: true,
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

    const memberCount = await tx.studyGroupMember.count({
      where: {
        studyGroupId: groupId,
      },
    });

    const updatedStudyGroup = await tx.studyGroup.update({
      where: {
        id: groupId,
      },
      data: {
        status:
          memberCount >= studyGroup.maxMembers
            ? StudyGroupStatus.FULL
            : StudyGroupStatus.OPEN,
      },
      select: studyGroupSelect,
    });

    return {
      ok: true as const,
      studyGroup: updatedStudyGroup,
    };
  });
}
