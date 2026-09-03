import type { RequestHandler } from "express";

import { currentUser } from "../../middleware/auth.js";
import * as sessions from "./sessions.service.js";
import type {
  CompleteSessionInput,
  CreateSessionInput,
  RsvpStatusInput,
  UpdateSessionInput,
} from "./sessions.schema.js";

export const listMySessions: RequestHandler = async (req, res) => {
  res.json({
    success: true,
    data: { sessions: await sessions.listMySessions(currentUser(req).id) },
  });
};

export const getSession: RequestHandler<{ sessionId: string }> = async (req, res) => {
  res.json({
    success: true,
    data: { session: await sessions.getSession(currentUser(req).id, req.params.sessionId) },
  });
};

export const listCourseSessions: RequestHandler<{ courseId: string }> = async (req, res) => {
  res.json({
    success: true,
    data: {
      sessions: await sessions.listCourseSessions(req.params.courseId, currentUser(req).id),
    },
  });
};

export const listCircleSessions: RequestHandler<{ circleId: string }> = async (req, res) => {
  res.json({
    success: true,
    data: {
      sessions: await sessions.listCircleSessions(req.params.circleId, currentUser(req).id),
    },
  });
};

export const createCircleSession: RequestHandler<{ circleId: string }> = async (req, res) => {
  const session = await sessions.createCircleSession(
    currentUser(req).id,
    req.params.circleId,
    req.body as CreateSessionInput,
  );

  res.status(201).json({ success: true, message: "Session scheduled", data: { session } });
};

export const updateSession: RequestHandler<{ sessionId: string }> = async (req, res) => {
  const session = await sessions.updateSession(
    currentUser(req).id,
    req.params.sessionId,
    req.body as UpdateSessionInput,
  );

  res.json({ success: true, message: "Session updated", data: { session } });
};

export const cancelSession: RequestHandler<{ sessionId: string }> = async (req, res) => {
  const session = await sessions.cancelSession(currentUser(req).id, req.params.sessionId);

  res.json({ success: true, message: "Session cancelled", data: { session } });
};

export const completeSession: RequestHandler<{ sessionId: string }> = async (req, res) => {
  const { session, questionId } = await sessions.completeSession(
    currentUser(req).id,
    req.params.sessionId,
    req.body as CompleteSessionInput,
  );

  res.json({
    success: true,
    message: questionId ? "Session completed and question posted" : "Session completed",
    data: { session, questionId },
  });
};

export const setSessionRsvp: RequestHandler<{ sessionId: string }> = async (req, res) => {
  const { status } = req.body as { status: RsvpStatusInput };
  const session = await sessions.setSessionRsvp(currentUser(req).id, req.params.sessionId, status);

  res.json({ success: true, message: "RSVP updated", data: { session } });
};
