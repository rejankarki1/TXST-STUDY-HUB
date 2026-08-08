import type { RequestHandler } from "express";

import { prisma } from "../config/prisma.js";
import { PostType } from "../generated/prisma/enums.js";
import { createQuestionSchema } from "../schemas/questions.schema.js";

const courseSelect = {
  id: true,
  code: true,
  title: true,
  description: true,
};

export const listCourses: RequestHandler = async (req, res, next) => {
  try {
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
      select: courseSelect,
    });

    res.json({
      success: true,
      data: {
        courses,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCourseById: RequestHandler = async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
};

export const listCourseQuestions: RequestHandler = async (req, res, next) => {
  try {
    const courseId = req.params.courseId;

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
      select: {
        id: true,
      },
    });

    if (!course) {
      res.status(404).json({
        success: false,
        message: "Course not found",
      });
      return;
    }

    const questions = await prisma.post.findMany({
      where: {
        courseId,
        type: PostType.QUESTION,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        body: true,
        status: true,
        acceptedAnswerId: true,
        courseId: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            answers: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: {
        questions,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createCourseQuestion: RequestHandler = async (req, res, next) => {
  try {
    const courseId = req.params.courseId;

    if (typeof courseId !== "string") {
      res.status(404).json({
        success: false,
        message: "Course not found",
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const parsed = createQuestionSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid question data",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
      },
      select: {
        id: true,
      },
    });

    if (!course) {
      res.status(404).json({
        success: false,
        message: "Course not found",
      });
      return;
    }

    const question = await prisma.post.create({
      data: {
        title: parsed.data.title,
        body: parsed.data.body,
        type: PostType.QUESTION,
        courseId,
        authorId: req.user.id,
      },
      select: {
        id: true,
        title: true,
        body: true,
        status: true,
        acceptedAnswerId: true,
        courseId: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            answers: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Question created",
      data: {
        question,
      },
    });
  } catch (error) {
    next(error);
  }
};
