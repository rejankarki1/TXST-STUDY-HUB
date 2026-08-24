import type { RequestHandler } from "express";

import { currentUser } from "../../middleware/auth.js";
import * as groups from "./groups.service.js";
import type { CreateGroupInput } from "./groups.schema.js";

export const listGroups: RequestHandler = async (req, res) => {
  const user = currentUser(req);
  const courseId = typeof req.query.courseId === "string" ? req.query.courseId : undefined;
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";

  res.json({
    success: true,
    data: { studyGroups: await groups.listGroups(user.id, { courseId, search }) },
  });
};

export const listMyGroups: RequestHandler = async (req, res) => {
  res.json({
    success: true,
    data: { studyGroups: await groups.listMyGroups(currentUser(req).id) },
  });
};

export const getGroup: RequestHandler<{ groupId: string }> = async (req, res) => {
  const user = currentUser(req);
  res.json({
    success: true,
    data: { studyGroup: await groups.findGroupOr404(req.params.groupId, user.id) },
  });
};

export const listGroupMembers: RequestHandler<{ groupId: string }> = async (req, res) => {
  const user = currentUser(req);
  res.json({
    success: true,
    data: { members: await groups.listGroupMembers(req.params.groupId, user.id) },
  });
};

export const createGroup: RequestHandler = async (req, res) => {
  const studyGroup = await groups.createGroup(currentUser(req).id, req.body as CreateGroupInput);
  res.status(201).json({
    success: true,
    message: "Study group created",
    data: { studyGroup },
  });
};

export const joinGroup: RequestHandler<{ groupId: string }> = async (req, res) => {
  const studyGroup = await groups.joinGroup(currentUser(req).id, req.params.groupId);
  res.json({
    success: true,
    message: "Joined study group",
    data: { studyGroup },
  });
};

export const leaveGroup: RequestHandler<{ groupId: string }> = async (req, res) => {
  const studyGroup = await groups.leaveGroup(currentUser(req).id, req.params.groupId);
  res.json({
    success: true,
    message: "Left study group",
    data: { studyGroup },
  });
};

export const deleteGroup: RequestHandler<{ groupId: string }> = async (req, res) => {
  const groupId = await groups.deleteGroup(currentUser(req).id, req.params.groupId);
  res.json({
    success: true,
    message: "Study group deleted",
    data: { groupId },
  });
};
