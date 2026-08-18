import { Router } from "express";

import {
  getSessionByIdController,
  listMySessionsController,
  setSessionRsvpController,
} from "../controllers/sessions.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { setRsvpSchema } from "../schemas/sessions.schema.js";

const router = Router();

router.get("/mine", requireAuth, listMySessionsController);
router.get("/:sessionId", requireAuth, getSessionByIdController);
router.put(
  "/:sessionId/rsvp",
  requireAuth,
  validateBody(setRsvpSchema, "Invalid RSVP data"),
  setSessionRsvpController,
);

export default router;
