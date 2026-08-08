import type { RequestHandler } from "express";

import { prisma } from "../config/prisma.js";
import { PostStatus, PostType } from "../generated/prisma/enums.js";
import { createAnswerSchema } from "../schemas/questions.schema.js";

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

export const getQuestionById: RequestHandler = async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
};

export const createQuestionAnswer: RequestHandler = async (req, res, next) => {
  try {
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

    const parsed = createAnswerSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid answer data",
        errors: parsed.error.flatten().fieldErrors,
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

    const answer = await prisma.answer.create({
      data: {
        body: parsed.data.body,
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
  } catch (error) {
    next(error);
  }
};

export const acceptQuestionAnswer: RequestHandler = async (req, res, next) => {
  try {
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

    const question = await prisma.post.findFirst({
      where: {
        id: questionId,
        type: PostType.QUESTION,
      },
      select: {
        id: true,
        authorId: true,
      },
    });

    if (!question) {
      res.status(404).json({
        success: false,
        message: "Question not found",
      });
      return;
    }

    if (question.authorId !== req.user.id) {
      res.status(403).json({
        success: false,
        message: "Only the question author can accept an answer",
      });
      return;
    }

    const answer = await prisma.answer.findFirst({
      where: {
        id: answerId,
        postId: questionId,
      },
      select: {
        id: true,
      },
    });

    if (!answer) {
      res.status(404).json({
        success: false,
        message: "Answer not found",
      });
      return;
    }

    const updatedQuestion = await prisma.post.update({
      where: {
        id: questionId,
      },
      data: {
        status: PostStatus.RESOLVED,
        acceptedAnswerId: answerId,
      },
      select: questionSelect,
    });

    res.json({
      success: true,
      message: "Answer accepted",
      data: {
        question: updatedQuestion,
      },
    });
  } catch (error) {
    next(error);
  }
};
