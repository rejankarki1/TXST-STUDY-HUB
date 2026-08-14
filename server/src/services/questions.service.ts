import { prisma } from "../config/prisma.js";
import { PostStatus, PostType } from "../generated/prisma/enums.js";

const acceptedQuestionSelect = {
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

export async function acceptAnswerForQuestion(
  questionId: string,
  answerId: string,
  userId: string,
) {
  return prisma.$transaction(async (tx) => {
    const question = await tx.post.findFirst({
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
      return {
        ok: false as const,
        status: 404,
        message: "Question not found",
      };
    }

    if (question.authorId !== userId) {
      return {
        ok: false as const,
        status: 403,
        message: "Only the question author can accept an answer",
      };
    }

    const answer = await tx.answer.findFirst({
      where: {
        id: answerId,
        postId: questionId,
      },
      select: {
        id: true,
      },
    });

    if (!answer) {
      return {
        ok: false as const,
        status: 404,
        message: "Answer not found",
      };
    }

    const updatedQuestion = await tx.post.update({
      where: {
        id: questionId,
      },
      data: {
        status: PostStatus.RESOLVED,
        acceptedAnswerId: answerId,
      },
      select: acceptedQuestionSelect,
    });

    return {
      ok: true as const,
      question: updatedQuestion,
    };
  });
}
