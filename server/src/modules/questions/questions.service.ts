import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error.js";
import { toPublicUser } from "../shared/publicUser.js";
import { requireCourse } from "../courses/courses.service.js";
import type {
  CreateAnswerInput,
  CreateQuestionInput,
  ListQuestionsQuery,
  UpdateQuestionInput,
} from "./questions.schema.js";

const questionSelect = {
  id: true,
  courseId: true,
  authorId: true,
  title: true,
  body: true,
  status: true,
  acceptedAnswerId: true,
  createdAt: true,
  updatedAt: true,
  course: { select: { id: true, code: true, title: true } },
  author: { select: { id: true, name: true, major: true, gradYear: true } },
  answers: {
    orderBy: { createdAt: "asc" as const },
    select: {
      id: true,
      body: true,
      authorId: true,
      createdAt: true,
      updatedAt: true,
      author: { select: { id: true, name: true, major: true, gradYear: true } },
    },
  },
  _count: { select: { answers: true } },
} satisfies Prisma.CourseQuestionSelect;

type SelectedQuestion = NonNullable<
  Awaited<ReturnType<typeof prisma.courseQuestion.findFirst<{ select: typeof questionSelect }>>>
>;

function formatQuestion(question: SelectedQuestion, currentUserId: string) {
  return {
    id: question.id,
    courseId: question.courseId,
    course: question.course,
    authorId: question.authorId,
    author: toPublicUser(question.author),
    title: question.title,
    body: question.body,
    status: question.status,
    acceptedAnswerId: question.acceptedAnswerId,
    answerCount: question._count.answers,
    /* The accepted answer is sorted to the top rather than being a separate
       field the UI has to splice back in. */
    answers: question.answers
      .toSorted((a, b) => {
        if (a.id === question.acceptedAnswerId) return -1;
        if (b.id === question.acceptedAnswerId) return 1;
        return a.createdAt.getTime() - b.createdAt.getTime();
      })
      .map((answer) => ({
        id: answer.id,
        questionId: question.id,
        body: answer.body,
        authorId: answer.authorId,
        author: toPublicUser(answer.author),
        isAccepted: answer.id === question.acceptedAnswerId,
        isMine: answer.authorId === currentUserId,
        createdAt: answer.createdAt.toISOString(),
        updatedAt: answer.updatedAt.toISOString(),
      })),
    isAuthor: question.authorId === currentUserId,
    createdAt: question.createdAt.toISOString(),
    updatedAt: question.updatedAt.toISOString(),
  };
}

export type FormattedQuestion = ReturnType<typeof formatQuestion>;

async function findQuestionOr404(questionId: string, currentUserId: string) {
  const question = await prisma.courseQuestion.findUnique({
    where: { id: questionId },
    select: questionSelect,
  });

  if (!question) {
    throw new AppError("Question not found", 404);
  }

  return formatQuestion(question, currentUserId);
}

export const getQuestion = findQuestionOr404;

export async function listCourseQuestions(
  courseId: string,
  currentUserId: string,
  query: ListQuestionsQuery,
) {
  await requireCourse(courseId);
  const search = query.search?.trim();

  const questions = await prisma.courseQuestion.findMany({
    where: {
      courseId,
      ...(query.status ? { status: query.status } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" as const } },
              { body: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    select: questionSelect,
  });

  return questions.map((question) => formatQuestion(question, currentUserId));
}

/** Home: the student's own questions that someone has since answered. */
export async function listMyAnsweredQuestions(currentUserId: string) {
  const questions = await prisma.courseQuestion.findMany({
    where: { authorId: currentUserId, answers: { some: {} } },
    orderBy: { updatedAt: "desc" },
    take: 5,
    select: questionSelect,
  });

  return questions.map((question) => formatQuestion(question, currentUserId));
}

export async function createQuestion(
  currentUserId: string,
  courseId: string,
  input: CreateQuestionInput,
) {
  await requireCourse(courseId);

  const question = await prisma.courseQuestion.create({
    data: { courseId, authorId: currentUserId, title: input.title, body: input.body },
    select: { id: true },
  });

  return findQuestionOr404(question.id, currentUserId);
}

async function requireQuestionAuthor(questionId: string, currentUserId: string) {
  const question = await prisma.courseQuestion.findUnique({
    where: { id: questionId },
    select: { id: true, authorId: true, acceptedAnswerId: true },
  });

  if (!question) {
    throw new AppError("Question not found", 404);
  }

  if (question.authorId !== currentUserId) {
    throw new AppError("Only the person who asked can change this question", 403);
  }

  return question;
}

export async function updateQuestion(
  currentUserId: string,
  questionId: string,
  input: UpdateQuestionInput,
) {
  await requireQuestionAuthor(questionId, currentUserId);

  await prisma.courseQuestion.update({
    where: { id: questionId },
    data: { title: input.title, body: input.body },
  });

  return findQuestionOr404(questionId, currentUserId);
}

export async function deleteQuestion(currentUserId: string, questionId: string) {
  await requireQuestionAuthor(questionId, currentUserId);

  await prisma.courseQuestion.delete({ where: { id: questionId } });

  return questionId;
}

export async function createAnswer(
  currentUserId: string,
  questionId: string,
  input: CreateAnswerInput,
) {
  const question = await prisma.courseQuestion.findUnique({
    where: { id: questionId },
    select: { id: true },
  });

  if (!question) {
    throw new AppError("Question not found", 404);
  }

  await prisma.courseAnswer.create({
    data: { questionId, authorId: currentUserId, body: input.body },
  });

  return findQuestionOr404(questionId, currentUserId);
}

async function requireOwnAnswer(questionId: string, answerId: string, currentUserId: string) {
  const answer = await prisma.courseAnswer.findUnique({
    where: { id: answerId },
    select: { id: true, questionId: true, authorId: true },
  });

  if (!answer || answer.questionId !== questionId) {
    throw new AppError("Answer not found", 404);
  }

  if (answer.authorId !== currentUserId) {
    throw new AppError("Only the author can change this answer", 403);
  }

  return answer;
}

export async function updateAnswer(
  currentUserId: string,
  questionId: string,
  answerId: string,
  input: CreateAnswerInput,
) {
  await requireOwnAnswer(questionId, answerId, currentUserId);

  await prisma.courseAnswer.update({ where: { id: answerId }, data: { body: input.body } });

  return findQuestionOr404(questionId, currentUserId);
}

export async function deleteAnswer(currentUserId: string, questionId: string, answerId: string) {
  await requireOwnAnswer(questionId, answerId, currentUserId);

  /* Deleting the accepted answer would leave the question marked SOLVED with
     nothing to point at, so it reopens in the same transaction. */
  await prisma.$transaction(async (tx) => {
    const question = await tx.courseQuestion.findUniqueOrThrow({
      where: { id: questionId },
      select: { acceptedAnswerId: true },
    });

    if (question.acceptedAnswerId === answerId) {
      await tx.courseQuestion.update({
        where: { id: questionId },
        data: { acceptedAnswerId: null, status: "OPEN" },
      });
    }

    await tx.courseAnswer.delete({ where: { id: answerId } });
  });

  return findQuestionOr404(questionId, currentUserId);
}

/**
 * Accepting is the only thing that marks a question solved, and only the asker
 * can do it — an answer author marking their own answer correct is the failure
 * mode this guards against.
 */
export async function setAcceptedAnswer(
  currentUserId: string,
  questionId: string,
  answerId: string,
  accepted: boolean,
) {
  await requireQuestionAuthor(questionId, currentUserId);

  const answer = await prisma.courseAnswer.findUnique({
    where: { id: answerId },
    select: { id: true, questionId: true },
  });

  if (!answer) {
    throw new AppError("Answer not found", 404);
  }

  /* An answer id from a different question would otherwise attach one course's
     answer to another course's question. */
  if (answer.questionId !== questionId) {
    throw new AppError("That answer belongs to a different question", 400);
  }

  await prisma.courseQuestion.update({
    where: { id: questionId },
    data: accepted
      ? { acceptedAnswerId: answerId, status: "SOLVED" }
      : { acceptedAnswerId: null, status: "OPEN" },
  });

  return findQuestionOr404(questionId, currentUserId);
}
