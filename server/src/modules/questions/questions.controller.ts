import type { RequestHandler } from "express";

import { currentUser } from "../../middleware/auth.js";
import { validatedQuery } from "../../middleware/validate.js";
import * as questions from "./questions.service.js";
import type {
  AcceptAnswerInput,
  CreateAnswerInput,
  CreateQuestionInput,
  ListQuestionsQuery,
  UpdateQuestionInput,
} from "./questions.schema.js";

type QuestionParams = { questionId: string };
type AnswerParams = { questionId: string; answerId: string };

export const listCourseQuestions: RequestHandler<{ courseId: string }> = async (req, res) => {
  const result = await questions.listCourseQuestions(
    req.params.courseId,
    currentUser(req).id,
    validatedQuery<ListQuestionsQuery>(req),
  );

  res.json({ success: true, data: { questions: result } });
};

export const listMyAnsweredQuestions: RequestHandler = async (req, res) => {
  res.json({
    success: true,
    data: { questions: await questions.listMyAnsweredQuestions(currentUser(req).id) },
  });
};

export const getQuestion: RequestHandler<QuestionParams> = async (req, res) => {
  res.json({
    success: true,
    data: { question: await questions.getQuestion(req.params.questionId, currentUser(req).id) },
  });
};

export const createQuestion: RequestHandler<{ courseId: string }> = async (req, res) => {
  const question = await questions.createQuestion(
    currentUser(req).id,
    req.params.courseId,
    req.body as CreateQuestionInput,
  );

  res.status(201).json({ success: true, message: "Question posted", data: { question } });
};

export const updateQuestion: RequestHandler<QuestionParams> = async (req, res) => {
  const question = await questions.updateQuestion(
    currentUser(req).id,
    req.params.questionId,
    req.body as UpdateQuestionInput,
  );

  res.json({ success: true, message: "Question updated", data: { question } });
};

export const deleteQuestion: RequestHandler<QuestionParams> = async (req, res) => {
  const questionId = await questions.deleteQuestion(currentUser(req).id, req.params.questionId);

  res.json({ success: true, message: "Question deleted", data: { questionId } });
};

export const createAnswer: RequestHandler<QuestionParams> = async (req, res) => {
  const question = await questions.createAnswer(
    currentUser(req).id,
    req.params.questionId,
    req.body as CreateAnswerInput,
  );

  res.status(201).json({ success: true, message: "Answer posted", data: { question } });
};

export const updateAnswer: RequestHandler<AnswerParams> = async (req, res) => {
  const question = await questions.updateAnswer(
    currentUser(req).id,
    req.params.questionId,
    req.params.answerId,
    req.body as CreateAnswerInput,
  );

  res.json({ success: true, message: "Answer updated", data: { question } });
};

export const deleteAnswer: RequestHandler<AnswerParams> = async (req, res) => {
  const question = await questions.deleteAnswer(
    currentUser(req).id,
    req.params.questionId,
    req.params.answerId,
  );

  res.json({ success: true, message: "Answer deleted", data: { question } });
};

export const acceptAnswer: RequestHandler<AnswerParams> = async (req, res) => {
  const { accepted } = req.body as AcceptAnswerInput;
  const question = await questions.setAcceptedAnswer(
    currentUser(req).id,
    req.params.questionId,
    req.params.answerId,
    accepted,
  );

  res.json({
    success: true,
    message: accepted ? "Answer accepted" : "Answer unaccepted",
    data: { question },
  });
};
