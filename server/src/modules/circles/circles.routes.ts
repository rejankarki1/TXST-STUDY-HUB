import { Router } from "express";

import * as circles from "./circles.controller.js";
import * as sessions from "../sessions/sessions.controller.js";
import { requireAuth } from "../../middleware/auth.js";
import { uuidParams } from "../../middleware/params.js";
import { validate, validateQuery } from "../../middleware/validate.js";
import { createCircleSchema, listCirclesQuerySchema, updateCircleSchema } from "./circles.schema.js";
import { createSessionSchema } from "../sessions/sessions.schema.js";

const router = Router();

router.use(requireAuth);

router.get("/", validateQuery(listCirclesQuerySchema), circles.listCircles);
router.get("/mine", circles.listMyCircles);
router.post("/", validate(createCircleSchema, "Invalid study circle data"), circles.createCircle);

router.get("/:circleId", uuidParams("circleId"), circles.getCircle);
router.patch(
  "/:circleId",
  uuidParams("circleId"),
  validate(updateCircleSchema, "Invalid study circle data"),
  circles.updateCircle,
);
router.delete("/:circleId", uuidParams("circleId"), circles.deleteCircle);
router.patch("/:circleId/archive", uuidParams("circleId"), circles.archiveCircle);
router.get("/:circleId/members", uuidParams("circleId"), circles.listCircleMembers);
router.post("/:circleId/join", uuidParams("circleId"), circles.joinCircle);
router.delete("/:circleId/leave", uuidParams("circleId"), circles.leaveCircle);

/* Circle sessions are sessions; only their permission rule is circle-specific,
   so the handlers stay in the sessions module. */
router.get("/:circleId/sessions", uuidParams("circleId"), sessions.listCircleSessions);
router.post(
  "/:circleId/sessions",
  uuidParams("circleId"),
  validate(createSessionSchema, "Invalid session data"),
  sessions.createCircleSession,
);

export default router;
