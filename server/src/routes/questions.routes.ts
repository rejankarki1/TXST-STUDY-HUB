import { Router } from "express";

import {
  acceptAnswer,
  createAnswer,
  getQuestionById,
} from "../controllers/questions.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { createAnswerSchema } from "../schemas/questions.schema.js";

const router = Router();

router.get("/:questionId", getQuestionById);
router.post(
  "/:questionId/answers",
  requireAuth,
  validateBody(createAnswerSchema, "Invalid answer data"),
  createAnswer,
);
router.patch(
  "/:questionId/answers/:answerId/accept",
  requireAuth,
  acceptAnswer,
);

export default router;
