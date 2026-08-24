import { Router } from "express";

import * as sessions from "./sessions.controller.js";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { setRsvpSchema } from "./sessions.schema.js";

const router = Router();

router.get("/mine", requireAuth, sessions.listMySessions);
router.get("/:sessionId", requireAuth, sessions.getSession);
router.put(
  "/:sessionId/rsvp",
  requireAuth,
  validate(setRsvpSchema, "Invalid RSVP data"),
  sessions.setSessionRsvp,
);

export default router;
