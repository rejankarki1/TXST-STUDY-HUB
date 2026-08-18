import { prisma } from "../config/prisma.js";
import { getCurrentUser } from "./auth.service.js";

async function loadUpdatedUser(userId: string) {
  const user = await getCurrentUser(userId);

  if (!user) {
    throw new Error("Authenticated user could not be loaded");
  }

  return user;
}

export async function addCourseForCurrentUser(userId: string, courseId: string) {
  const course = await prisma.course.findUnique({
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

  await prisma.userCourse.upsert({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
    update: {},
    create: {
      userId,
      courseId,
    },
  });

  return {
    ok: true as const,
    user: await loadUpdatedUser(userId),
  };
}

export async function removeCourseForCurrentUser(
  userId: string,
  courseId: string,
) {
  await prisma.userCourse.deleteMany({
    where: {
      userId,
      courseId,
    },
  });

  return {
    ok: true as const,
    user: await loadUpdatedUser(userId),
  };
}
