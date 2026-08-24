import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error.js";
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

export async function createCourse(input: CreateCourseInput) {
  const { code, title, description, departmentId } = input;

  const existing = await prisma.course.findUnique({
    where: { code },
    select: courseSelect,
  });

  if (existing) {
    throw new AppError("A course with that code already exists.", 409, {
      course: existing,
    });
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
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true },
  });

  if (!course) {
    throw new AppError("Course not found", 404);
  }

  await prisma.userCourse.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: {},
    create: { userId, courseId },
  });

  return getCurrentUser(userId);
}

export async function leaveCourse(userId: string, courseId: string) {
  await prisma.userCourse.deleteMany({
    where: { userId, courseId },
  });

  return getCurrentUser(userId);
}
