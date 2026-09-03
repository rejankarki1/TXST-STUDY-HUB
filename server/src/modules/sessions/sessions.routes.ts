import { Router } from "express";

import * as sessions from "./sessions.controller.js";
import { requireAuth } from "../../middleware/auth.js";
import { uuidParams } from "../../middleware/params.js";
import { validate } from "../../middleware/validate.js";
import {
  completeSessionSchema,
  setRsvpSchema,
  updateSessionSchema,
} from "./sessions.schema.js";

const router = Router();

router.use(requireAuth);

router.get("/mine", sessions.listMySessions);

router.get("/:sessionId", uuidParams("sessionId"), sessions.getSession);
router.patch(
  "/:sessionId",
  uuidParams("sessionId"),
  validate(updateSessionSchema, "Invalid session data"),
  sessions.updateSession,
);
router.put(
  "/:sessionId/rsvp",
  uuidParams("sessionId"),
  validate(setRsvpSchema, "Invalid RSVP data"),
  sessions.setSessionRsvp,
);
router.patch(
  "/:sessionId/complete",
  uuidParams("sessionId"),
  validate(completeSessionSchema, "Invalid completion data"),
  sessions.completeSession,
);
router.patch("/:sessionId/cancel", uuidParams("sessionId"), sessions.cancelSession);

export default router;
