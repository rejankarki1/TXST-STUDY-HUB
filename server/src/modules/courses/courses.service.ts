import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error.js";
import { toPublicUser } from "../shared/publicUser.js";
import { getCurrentUser } from "../auth/auth.service.js";
import type { CreateCourseInput } from "./courses.schema.js";

const courseSelect = {
  id: true,
  code: true,
  title: true,
  description: true,
  department: { select: { id: true, code: true, name: true } },
};

export async function listCourses(search = "") {
  const where = search
    ? search.length <= 3
      ? { code: { contains: search, mode: "insensitive" as const } }
      : {
          OR: [
            { code: { contains: search, mode: "insensitive" as const } },
            { title: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        }
    : undefined;

  return prisma.course.findMany({
    where,
    orderBy: { code: "asc" },
    select: courseSelect,
  });
}

export async function listDepartments(search = "") {
  return prisma.department.findMany({
    where: search
      ? {
          OR: [
            { code: { contains: search, mode: "insensitive" as const } },
            { name: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : undefined,
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true },
  });
}

export async function getCourse(courseId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: courseSelect,
  });

  if (!course) {
    throw new AppError("Course not found", 404);
  }

  return course;
}

/** Throws 404 rather than returning null, for the many callers that only need the guard. */
export async function requireCourse(courseId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, code: true, title: true },
  });

  if (!course) {
    throw new AppError("Course not found", 404);
  }

  return course;
}

export async function createCourse(input: CreateCourseInput) {
  const { code, title, description, departmentId } = input;

  const existing = await prisma.course.findUnique({
    where: { code },
    select: courseSelect,
  });

  if (existing) {
    throw new AppError("A course with that code already exists.", 409, { course: existing });
  }

  const department = await prisma.department.findUnique({
    where: { id: departmentId },
    select: { id: true, code: true },
  });

  if (!department) {
    throw new AppError("Department not found.", 400);
  }

  if (department.code !== code.split(" ")[0]) {
    throw new AppError("Department code should match the course prefix.", 400);
  }

  return prisma.course.create({
    data: { code, title, description, departmentId: department.id },
    select: courseSelect,
  });
}

export async function joinCourse(userId: string, courseId: string) {
  await requireCourse(courseId);

  await prisma.userCourse.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: {},
    create: { userId, courseId },
  });

  return getCurrentUser(userId);
}

export async function leaveCourse(userId: string, courseId: string) {
  await prisma.userCourse.deleteMany({ where: { userId, courseId } });

  return getCurrentUser(userId);
}

/**
 * The Course Hub People tab.
 *
 * Two rules make this safe to show to any classmate: only students who opted in
 * with studyProfileVisible appear at all, and the selected fields carry nothing
 * private — no email, no contact route, no way to message anyone. Coordination
 * happens through Study Requests, which is why a name and a current intent is
 * all this needs to return.
 */
export async function listCoursePeople(courseId: string, currentUserId: string) {
  await requireCourse(courseId);

  const enrolments = await prisma.userCourse.findMany({
    where: {
      courseId,
      user: { studyProfileVisible: true, onboardingCompleted: true },
    },
    orderBy: { createdAt: "asc" },
    select: {
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          major: true,
          gradYear: true,
          createdRequests: {
            where: { courseId, status: "OPEN" },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { id: true, topic: true, intent: true },
          },
        },
      },
    },
  });

  return enrolments.map(({ user, createdAt }) => {
    const openRequest = user.createdRequests[0];

    return {
      ...toPublicUser(user),
      joinedCourseAt: createdAt.toISOString(),
      isMe: user.id === currentUserId,
      currentIntent: openRequest
        ? { requestId: openRequest.id, topic: openRequest.topic, intent: openRequest.intent }
        : null,
    };
  });
}
