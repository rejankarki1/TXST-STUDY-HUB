import type { RequestHandler } from "express";

import { prisma } from "../config/prisma.js";
import type { ExperienceDifficulty } from "../generated/prisma/enums.js";

const courseExperienceSelect = {
  id: true,
  title: true,
  body: true,
  difficulty: true,
  professorName: true,
  term: true,
  courseId: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
};

const experienceDetailsSelect = {
  ...courseExperienceSelect,
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
};

export const listCourseExperiences: RequestHandler = async (req, res) => {
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

  const experiences = await prisma.courseExperience.findMany({
    where: {
      courseId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: courseExperienceSelect,
  });

  res.json({
    success: true,
    data: {
      experiences,
    },
  });
};

export const createExperience: RequestHandler = async (req, res) => {
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

  const { body, difficulty, professorName, term, title } = req.body as {
    title: string;
    body: string;
    difficulty: ExperienceDifficulty;
    professorName?: string;
    term?: string;
  };

  const experience = await prisma.courseExperience.create({
    data: {
      title,
      body,
      difficulty,
      professorName,
      term,
      courseId,
      authorId: req.user.id,
    },
    select: courseExperienceSelect,
  });

  res.status(201).json({
    success: true,
    message: "Experience created",
    data: {
      experience,
    },
  });
};

export const getExperienceById: RequestHandler = async (req, res) => {
  const experienceId = req.params.experienceId;

  if (typeof experienceId !== "string") {
    res.status(404).json({
      success: false,
      message: "Experience not found",
    });
    return;
  }

  const experience = await prisma.courseExperience.findUnique({
    where: {
      id: experienceId,
    },
    select: experienceDetailsSelect,
  });

  if (!experience) {
    res.status(404).json({
      success: false,
      message: "Experience not found",
    });
    return;
  }

  res.json({
    success: true,
    data: {
      experience,
    },
  });
};
