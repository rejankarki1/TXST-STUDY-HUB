import type { RequestHandler } from "express";

import { prisma } from "../config/prisma.js";
import { PostType } from "../generated/prisma/enums.js";

const courseSelect = {
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
};

const courseListSelect = {
  ...courseSelect,
  _count: {
    select: {
      posts: {
        where: {
          type: PostType.QUESTION,
        },
      },
    },
  },
};

export const listCourses: RequestHandler = async (req, res) => {
  const search =
    typeof req.query.search === "string" ? req.query.search.trim() : "";
  const where = search
    ? search.length <= 3
      ? {
          code: { contains: search, mode: "insensitive" as const },
        }
      : {
          OR: [
            { code: { contains: search, mode: "insensitive" as const } },
            { title: { contains: search, mode: "insensitive" as const } },
            {
              description: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
    : undefined;

  const courses = await prisma.course.findMany({
    where,
    orderBy: {
      code: "asc",
    },
    select: courseListSelect,
  });

  res.json({
    success: true,
    data: {
      courses: courses.map((course) => ({
        id: course.id,
        code: course.code,
        title: course.title,
        description: course.description,
        department: course.department,
        questionCount: course._count.posts,
      })),
    },
  });
};

export const createCourse: RequestHandler = async (req, res) => {
  const {
    code,
    title,
    description,
    departmentId,
    departmentCode,
    departmentName,
  } = req.body as {
    code: string;
    title: string;
    description?: string;
    departmentId?: string;
    departmentCode?: string;
    departmentName?: string;
  };

  const existingCourse = await prisma.course.findUnique({
    where: {
      code,
    },
    select: courseSelect,
  });

  if (existingCourse) {
    res.status(409).json({
      success: false,
      message: "A course with that code already exists.",
      data: {
        course: existingCourse,
      },
    });
    return;
  }

  const coursePrefix = code.split(" ")[0];
  let resolvedDepartmentId = departmentId;

  if (resolvedDepartmentId) {
    const department = await prisma.department.findUnique({
      where: {
        id: resolvedDepartmentId,
      },
      select: {
        id: true,
        code: true,
      },
    });

    if (!department) {
      res.status(400).json({
        success: false,
        message: "Department not found.",
      });
      return;
    }

    if (department.code !== coursePrefix) {
      res.status(400).json({
        success: false,
        message: "Department code should match the course prefix.",
      });
      return;
    }
  } else {
    if (!departmentCode || !departmentName) {
      res.status(400).json({
        success: false,
        message: "Select a department or add a new department.",
      });
      return;
    }

    const department = await prisma.department.upsert({
      where: {
        code: departmentCode,
      },
      update: {
        name: departmentName,
      },
      create: {
        code: departmentCode,
        name: departmentName,
      },
      select: {
        id: true,
      },
    });

    resolvedDepartmentId = department.id;
  }

  const course = await prisma.course.create({
    data: {
      code,
      title,
      description,
      departmentId: resolvedDepartmentId,
    },
    select: courseSelect,
  });

  res.status(201).json({
    success: true,
    data: {
      course,
    },
  });
};

export const getCourseById: RequestHandler = async (req, res) => {
  const courseId = req.params.id;

  if (typeof courseId !== "string") {
    res.status(404).json({
      success: false,
      message: "Course not found",
    });
    return;
  }

  const course = await prisma.course.findUnique({
    where: {
      id: courseId,
    },
    select: courseSelect,
  });

  if (!course) {
    res.status(404).json({
      success: false,
      message: "Course not found",
    });
    return;
  }

  res.json({
    success: true,
    data: {
      course,
    },
  });
};
