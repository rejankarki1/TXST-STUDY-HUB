import type { RequestHandler } from "express";

import { currentUser } from "../../middleware/auth.js";
import { validatedQuery } from "../../middleware/validate.js";
import * as circles from "./circles.service.js";
import type { CreateCircleInput, ListCirclesQuery, UpdateCircleInput } from "./circles.schema.js";

export const listCircles: RequestHandler = async (req, res) => {
  const result = await circles.listCircles(
    currentUser(req).id,
    validatedQuery<ListCirclesQuery>(req),
  );

  res.json({ success: true, data: { circles: result } });
};

export const listMyCircles: RequestHandler = async (req, res) => {
  res.json({
    success: true,
    data: { circles: await circles.listMyCircles(currentUser(req).id) },
  });
};

export const getCircle: RequestHandler<{ circleId: string }> = async (req, res) => {
  res.json({
    success: true,
    data: { circle: await circles.findCircleOr404(req.params.circleId, currentUser(req).id) },
  });
};

export const listCircleMembers: RequestHandler<{ circleId: string }> = async (req, res) => {
  res.json({
    success: true,
    data: { members: await circles.listCircleMembers(req.params.circleId, currentUser(req).id) },
  });
};

export const createCircle: RequestHandler = async (req, res) => {
  const circle = await circles.createCircle(currentUser(req).id, req.body as CreateCircleInput);

  res.status(201).json({ success: true, message: "Study circle created", data: { circle } });
};

export const updateCircle: RequestHandler<{ circleId: string }> = async (req, res) => {
  const circle = await circles.updateCircle(
    currentUser(req).id,
    req.params.circleId,
    req.body as UpdateCircleInput,
  );

  res.json({ success: true, message: "Study circle updated", data: { circle } });
};

export const archiveCircle: RequestHandler<{ circleId: string }> = async (req, res) => {
  const { archived } = (req.body ?? {}) as { archived?: boolean };
  const circle = await circles.setCircleArchived(
    currentUser(req).id,
    req.params.circleId,
    archived ?? true,
  );

  res.json({
    success: true,
    message: circle.status === "ARCHIVED" ? "Study circle archived" : "Study circle reopened",
    data: { circle },
  });
};

export const joinCircle: RequestHandler<{ circleId: string }> = async (req, res) => {
  const circle = await circles.joinCircle(currentUser(req).id, req.params.circleId);

  res.status(201).json({ success: true, message: `Joined ${circle.name}`, data: { circle } });
};

export const leaveCircle: RequestHandler<{ circleId: string }> = async (req, res) => {
  const circle = await circles.leaveCircle(currentUser(req).id, req.params.circleId);

  res.json({ success: true, message: `Left ${circle.name}`, data: { circle } });
};

export const deleteCircle: RequestHandler<{ circleId: string }> = async (req, res) => {
  const circleId = await circles.deleteCircle(currentUser(req).id, req.params.circleId);

  res.json({ success: true, message: "Study circle deleted", data: { circleId } });
};
