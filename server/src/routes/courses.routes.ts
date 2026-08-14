import { Router } from "express";

import {
  createCourse,
  getCourseById,
  listCourses,
} from "../controllers/courses.controller.js";
import {
  createExperience,
  listCourseExperiences,
} from "../controllers/experiences.controller.js";
import {
  createQuestion,
  listCourseQuestions,
} from "../controllers/questions.controller.js";
import {
  createResource,
  listCourseResources,
} from "../controllers/resources.controller.js";
import {
  createStudyGroup,
  listCourseStudyGroups,
} from "../controllers/study-groups.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { createExperienceSchema } from "../schemas/experiences.schema.js";
import { createCourseSchema } from "../schemas/courses.schema.js";
import { createQuestionSchema } from "../schemas/questions.schema.js";
import { createResourceSchema } from "../schemas/resources.schema.js";
import { createStudyGroupSchema } from "../schemas/study-groups.schema.js";

const router = Router();

router.get("/", listCourses);
router.post(
  "/",
  requireAuth,
  validateBody(createCourseSchema, "Invalid course data"),
  createCourse,
);
router.get("/:courseId/experiences", listCourseExperiences);
router.post(
  "/:courseId/experiences",
  requireAuth,
  validateBody(createExperienceSchema, "Invalid experience data"),
  createExperience,
);
router.get("/:courseId/resources", listCourseResources);
router.post(
  "/:courseId/resources",
  requireAuth,
  validateBody(createResourceSchema, "Invalid resource data"),
  createResource,
);
router.get("/:courseId/study-groups", listCourseStudyGroups);
router.post(
  "/:courseId/study-groups",
  requireAuth,
  validateBody(createStudyGroupSchema, "Invalid study group data"),
  createStudyGroup,
);
router.get("/:courseId/questions", listCourseQuestions);
router.post(
  "/:courseId/questions",
  requireAuth,
  validateBody(createQuestionSchema, "Invalid question data"),
  createQuestion,
);
router.get("/:id", getCourseById);

export default router;
