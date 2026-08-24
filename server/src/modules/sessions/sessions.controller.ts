import type { RequestHandler } from "express";

import { currentUser } from "../../middleware/auth.js";
import * as sessions from "./sessions.service.js";
import type { CreateSessionInput, FrontendRsvpStatus } from "./sessions.schema.js";

export const listMySessions: RequestHandler = async (req, res) => {
  res.json({
    success: true,
    data: { studySessions: await sessions.listMySessions(currentUser(req).id) },
  });
};

export const getSession: RequestHandler<{ sessionId: string }> = async (req, res) => {
  res.json({
    success: true,
    data: { studySession: await sessions.getSession(currentUser(req).id, req.params.sessionId) },
  });
};

export const listGroupSessions: RequestHandler<{ groupId: string }> = async (req, res) => {
  res.json({
    success: true,
    data: {
      studySessions: await sessions.listGroupSessions(currentUser(req).id, req.params.groupId),
    },
  });
};

export const createSession: RequestHandler<{ groupId: string }> = async (req, res) => {
  const studySession = await sessions.createSession(
    currentUser(req).id,
    req.params.groupId,
    req.body as CreateSessionInput,
  );

  res.status(201).json({
    success: true,
    message: "Study session created",
    data: { studySession },
  });
};

export const setSessionRsvp: RequestHandler<{ sessionId: string }> = async (req, res) => {
  const { status } = req.body as { status: FrontendRsvpStatus };
  const studySession = await sessions.setSessionRsvp(
    currentUser(req).id,
    req.params.sessionId,
    status,
  );

  res.json({
    success: true,
    message: "RSVP updated",
    data: { studySession },
  });
};
