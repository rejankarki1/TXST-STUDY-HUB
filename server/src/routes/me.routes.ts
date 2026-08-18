import { Router } from "express";

import { addMyCourse, removeMyCourse } from "../controllers/me.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { addMyCourseSchema } from "../schemas/me.schema.js";

const router = Router();

router.post(
  "/courses",
  requireAuth,
  validateBody(addMyCourseSchema, "Invalid course data"),
  addMyCourse,
);
router.delete("/courses/:courseId", requireAuth, removeMyCourse);

export default router;
