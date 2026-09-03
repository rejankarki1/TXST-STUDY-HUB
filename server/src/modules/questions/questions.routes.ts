import { Router } from "express";

import * as questions from "./questions.controller.js";
import { requireAuth } from "../../middleware/auth.js";
import { uuidParams } from "../../middleware/params.js";
import { validate } from "../../middleware/validate.js";
import {
  acceptAnswerSchema,
  createAnswerSchema,
  updateAnswerSchema,
  updateQuestionSchema,
} from "./questions.schema.js";

const router = Router();

router.use(requireAuth);

router.get("/mine", questions.listMyAnsweredQuestions);

router.get("/:questionId", uuidParams("questionId"), questions.getQuestion);
router.patch(
  "/:questionId",
  uuidParams("questionId"),
  validate(updateQuestionSchema, "Invalid question data"),
  questions.updateQuestion,
);
router.delete("/:questionId", uuidParams("questionId"), questions.deleteQuestion);

router.post(
  "/:questionId/answers",
  uuidParams("questionId"),
  validate(createAnswerSchema, "Invalid answer"),
  questions.createAnswer,
);
router.patch(
  "/:questionId/answers/:answerId",
  uuidParams("questionId", "answerId"),
  validate(updateAnswerSchema, "Invalid answer"),
  questions.updateAnswer,
);
router.delete(
  "/:questionId/answers/:answerId",
  uuidParams("questionId", "answerId"),
  questions.deleteAnswer,
);
router.patch(
  "/:questionId/answers/:answerId/accept",
  uuidParams("questionId", "answerId"),
  validate(acceptAnswerSchema, "Invalid request"),
  questions.acceptAnswer,
);

export default router;
