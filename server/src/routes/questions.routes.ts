import { Router } from "express";

import {
  acceptQuestionAnswer,
  createQuestionAnswer,
  getQuestionById,
} from "../controllers/questions.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/:questionId", getQuestionById);
router.post("/:questionId/answers", requireAuth, createQuestionAnswer);
router.post(
  "/:questionId/answers/:answerId/accept",
  requireAuth,
  acceptQuestionAnswer,
);

export default router;
