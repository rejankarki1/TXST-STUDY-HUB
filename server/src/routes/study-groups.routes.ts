import { Router } from "express";

import {
  getStudyGroupById,
  joinStudyGroupById,
  leaveStudyGroupById,
} from "../controllers/study-groups.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/:groupId", getStudyGroupById);
router.post("/:groupId/join", requireAuth, joinStudyGroupById);
router.delete("/:groupId/membership", requireAuth, leaveStudyGroupById);

export default router;
