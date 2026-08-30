import { Router } from "express";

import * as groups from "./groups.controller.js";
import * as sessions from "../sessions/sessions.controller.js";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { createGroupMessageSchema, createGroupSchema } from "./groups.schema.js";
import { createSessionSchema } from "../sessions/sessions.schema.js";

const router = Router();

router.get("/", requireAuth, groups.listGroups);
router.get("/mine", requireAuth, groups.listMyGroups);
router.post("/", requireAuth, validate(createGroupSchema, "Invalid study group data"), groups.createGroup);
router.get("/:groupId", requireAuth, groups.getGroup);
router.delete("/:groupId", requireAuth, groups.deleteGroup);
router.get("/:groupId/members", requireAuth, groups.listGroupMembers);
router.get("/:groupId/messages", requireAuth, groups.listGroupMessages);
router.post(
  "/:groupId/messages",
  requireAuth,
  validate(createGroupMessageSchema, "Invalid message data"),
  groups.createGroupMessage,
);
router.post("/:groupId/join", requireAuth, groups.joinGroup);
router.delete("/:groupId/leave", requireAuth, groups.leaveGroup);
router.get("/:groupId/sessions", requireAuth, sessions.listGroupSessions);
router.post(
  "/:groupId/sessions",
  requireAuth,
  validate(createSessionSchema, "Invalid session data"),
  sessions.createSession,
);

export default router;
