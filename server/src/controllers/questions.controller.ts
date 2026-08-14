import type { RequestHandler } from "express";

import { prisma } from "../config/prisma.js";
import { PostType } from "../generated/prisma/enums.js";
import { acceptAnswerForQuestion } from "../services/questions.service.js";

const questionSelect = {
  id: true,
  title: true,
  body: true,
  status: true,
  acceptedAnswerId: true,
  courseId: true,
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
  author: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  answers: {
    orderBy: {
      createdAt: "asc" as const,
    },
    select: {
      id: true,
      body: true,
      postId: true,
      createdAt: true,
      updatedAt: true,
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },
};

const courseQuestionSelect = {
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
};

const answerSelect = {
  id: true,
  body: true,
  postId: true,
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

export const listCourseQuestions: RequestHandler = async (req, res) => {
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
    select: courseQuestionSelect,
  });

  res.json({
    success: true,
    data: {
      questions,
    },
  });
};

export const createQuestion: RequestHandler = async (req, res) => {
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

  const { title, body } = req.body as { title: string; body: string };

  const question = await prisma.post.create({
    data: {
      title,
      body,
      type: PostType.QUESTION,
      courseId,
      authorId: req.user.id,
    },
    select: courseQuestionSelect,
  });

  res.status(201).json({
    success: true,
    message: "Question created",
    data: {
      question,
    },
  });
};

export const getQuestionById: RequestHandler = async (req, res) => {
  const questionId = req.params.questionId;

  if (typeof questionId !== "string") {
    res.status(404).json({
      success: false,
      message: "Question not found",
    });
    return;
  }

  const question = await prisma.post.findFirst({
    where: {
      id: questionId,
      type: PostType.QUESTION,
    },
    select: questionSelect,
  });

  if (!question) {
    res.status(404).json({
      success: false,
      message: "Question not found",
    });
    return;
  }

  res.json({
    success: true,
    data: {
      question,
    },
  });
};

export const createAnswer: RequestHandler = async (req, res) => {
  const questionId = req.params.questionId;

  if (typeof questionId !== "string") {
    res.status(404).json({
      success: false,
      message: "Question not found",
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

  const question = await prisma.post.findFirst({
    where: {
      id: questionId,
      type: PostType.QUESTION,
    },
    select: {
      id: true,
    },
  });

  if (!question) {
    res.status(404).json({
      success: false,
      message: "Question not found",
    });
    return;
  }

  const { body } = req.body as { body: string };

  const answer = await prisma.answer.create({
    data: {
      body,
      postId: questionId,
      authorId: req.user.id,
    },
    select: answerSelect,
  });

  res.status(201).json({
    success: true,
    message: "Answer created",
    data: {
      answer,
    },
  });
};

export const acceptAnswer: RequestHandler = async (req, res) => {
  const questionId = req.params.questionId;
  const answerId = req.params.answerId;

  if (typeof questionId !== "string" || typeof answerId !== "string") {
    res.status(404).json({
      success: false,
      message: "Question not found",
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

  const result = await acceptAnswerForQuestion(questionId, answerId, req.user.id);

  if (!result.ok) {
    res.status(result.status).json({
      success: false,
      message: result.message,
    });
    return;
  }

  res.json({
    success: true,
    message: "Answer accepted",
    data: {
      question: result.question,
    },
  });
};
