import { Router } from "express";

import * as requests from "./study-requests.controller.js";
import { requireAuth } from "../../middleware/auth.js";
import { uuidParams } from "../../middleware/params.js";
import { validate } from "../../middleware/validate.js";
import {
  convertToSessionSchema,
  joinStudyRequestSchema,
  setAvailabilitySchema,
  updateStudyRequestSchema,
} from "./study-requests.schema.js";

const router = Router();

router.use(requireAuth);

/* Home's two feeds. Declared before /:requestId so the literal wins the match. */
router.get("/mine", requests.listMyStudyRequests);
router.get("/opportunities", requests.listOpportunities);

router.get("/:requestId", uuidParams("requestId"), requests.getStudyRequest);
router.patch(
  "/:requestId",
  uuidParams("requestId"),
  validate(updateStudyRequestSchema, "Invalid study request data"),
  requests.updateStudyRequest,
);
router.post(
  "/:requestId/join",
  uuidParams("requestId"),
  validate(joinStudyRequestSchema, "Pick at least one time you can make"),
  requests.joinStudyRequest,
);
router.put(
  "/:requestId/availability",
  uuidParams("requestId"),
  validate(setAvailabilitySchema, "Pick at least one time you can make"),
  requests.setMyAvailability,
);
router.delete("/:requestId/join", uuidParams("requestId"), requests.withdrawFromStudyRequest);
router.patch("/:requestId/cancel", uuidParams("requestId"), requests.cancelStudyRequest);
router.post(
  "/:requestId/convert-to-session",
  uuidParams("requestId"),
  validate(convertToSessionSchema, "Invalid session details"),
  requests.convertToSession,
);

export default router;
