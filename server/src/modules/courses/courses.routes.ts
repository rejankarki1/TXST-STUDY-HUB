import { Router } from "express";

import * as courses from "./courses.controller.js";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { createCourseSchema } from "./courses.schema.js";

const router = Router();

router.get("/", courses.listCourses);
router.get("/departments", courses.listDepartments);
router.post("/", requireAuth, validate(createCourseSchema, "Invalid course data"), courses.createCourse);
router.get("/:courseId", courses.getCourse);
router.post("/:courseId/join", requireAuth, courses.joinCourse);
router.delete("/:courseId/leave", requireAuth, courses.leaveCourse);

export default router;
