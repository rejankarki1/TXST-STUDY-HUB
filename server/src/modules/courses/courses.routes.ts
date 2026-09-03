import { Router } from "express";

import * as courses from "./courses.controller.js";
import * as questions from "../questions/questions.controller.js";
import * as sessions from "../sessions/sessions.controller.js";
import * as studyRequests from "../study-requests/study-requests.controller.js";
import { requireAuth } from "../../middleware/auth.js";
import { uuidParams } from "../../middleware/params.js";
import { validate, validateQuery } from "../../middleware/validate.js";
import { courseSearchSchema, createCourseSchema } from "./courses.schema.js";
import { createQuestionSchema, listQuestionsQuerySchema } from "../questions/questions.schema.js";
import {
  createStudyRequestSchema,
  listStudyRequestsQuerySchema,
} from "../study-requests/study-requests.schema.js";

const router = Router();

/* The catalog is readable signed out — the landing page and the signup course
   picker both need it before there is a session. */
router.get("/", validateQuery(courseSearchSchema), courses.listCourses);
router.get("/departments", validateQuery(courseSearchSchema), courses.listDepartments);
router.post("/", requireAuth, validate(createCourseSchema, "Invalid course data"), courses.createCourse);

router.get("/:courseId", uuidParams("courseId"), courses.getCourse);
router.post("/:courseId/join", requireAuth, uuidParams("courseId"), courses.joinCourse);
router.delete("/:courseId/leave", requireAuth, uuidParams("courseId"), courses.leaveCourse);
router.get("/:courseId/people", requireAuth, uuidParams("courseId"), courses.listCoursePeople);

/* Course-scoped collections. The handlers live in their own modules; only the
   URL shape belongs to the Course Hub. */
router.get(
  "/:courseId/study-requests",
  requireAuth,
  uuidParams("courseId"),
  validateQuery(listStudyRequestsQuerySchema),
  studyRequests.listCourseStudyRequests,
);
router.post(
  "/:courseId/study-requests",
  requireAuth,
  uuidParams("courseId"),
  validate(createStudyRequestSchema, "Invalid study request data"),
  studyRequests.createStudyRequest,
);
router.get(
  "/:courseId/questions",
  requireAuth,
  uuidParams("courseId"),
  validateQuery(listQuestionsQuerySchema),
  questions.listCourseQuestions,
);
router.post(
  "/:courseId/questions",
  requireAuth,
  uuidParams("courseId"),
  validate(createQuestionSchema, "Invalid question data"),
  questions.createQuestion,
);
router.get("/:courseId/sessions", requireAuth, uuidParams("courseId"), sessions.listCourseSessions);

export default router;
