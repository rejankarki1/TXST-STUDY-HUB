import { Router } from "express";

import {
  createCourseQuestion,
  getCourseById,
  listCourseQuestions,
  listCourses,
} from "../controllers/courses.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", listCourses);
router.get("/:courseId/questions", listCourseQuestions);
router.post("/:courseId/questions", requireAuth, createCourseQuestion);
router.get("/:id", getCourseById);

export default router;
