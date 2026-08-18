import { Router } from "express";

import {
  createStudyGroup,
  getStudyGroupById,
  joinStudyGroupById,
  leaveStudyGroupById,
  listMyStudyGroupsController,
  listStudyGroupMembers,
  listStudyGroupsController,
} from "../controllers/study-groups.controller.js";
import {
  createSessionController,
  listGroupSessionsController,
} from "../controllers/sessions.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { createSessionSchema } from "../schemas/sessions.schema.js";
import { createStudyGroupSchema } from "../schemas/study-groups.schema.js";

const router = Router();

router.get("/", requireAuth, listStudyGroupsController);
router.post(
  "/",
  requireAuth,
  validateBody(createStudyGroupSchema, "Invalid study group data"),
  createStudyGroup,
);
router.get("/mine", requireAuth, listMyStudyGroupsController);
router.get("/:groupId", requireAuth, getStudyGroupById);
router.get("/:groupId/members", requireAuth, listStudyGroupMembers);
router.get("/:groupId/sessions", requireAuth, listGroupSessionsController);
router.post(
  "/:groupId/sessions",
  requireAuth,
  validateBody(createSessionSchema, "Invalid session data"),
  createSessionController,
);
router.post("/:groupId/join", requireAuth, joinStudyGroupById);
router.delete("/:groupId/membership", requireAuth, leaveStudyGroupById);

export default router;
