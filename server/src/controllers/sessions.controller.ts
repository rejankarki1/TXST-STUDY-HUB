import type { RequestHandler } from "express";

import {
  createStudySession,
  getStudySession,
  listGroupSessions,
  listMySessions,
  setSessionRsvp,
} from "../services/sessions.service.js";

export const listGroupSessionsController: RequestHandler = async (req, res) => {
  const groupId = req.params.groupId;

  if (typeof groupId !== "string") {
    res.status(404).json({
      success: false,
      message: "Study group not found",
    });
    return;
  }

  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const result = await listGroupSessions(groupId, req.user.id);

  if (!result.ok) {
    res.status(result.status).json({
      success: false,
      message: result.message,
    });
    return;
  }

  res.json({
    success: true,
    data: {
      studySessions: result.studySessions,
    },
  });
};

export const listMySessionsController: RequestHandler = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const studySessions = await listMySessions(req.user.id);

  res.json({
    success: true,
    data: {
      studySessions,
    },
  });
};

export const getSessionByIdController: RequestHandler = async (req, res) => {
  const sessionId = req.params.sessionId;

  if (typeof sessionId !== "string") {
    res.status(404).json({
      success: false,
      message: "Study session not found",
    });
    return;
  }

  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const studySession = await getStudySession(sessionId, req.user.id);

  if (!studySession) {
    res.status(404).json({
      success: false,
      message: "Study session not found",
    });
    return;
  }

  res.json({
    success: true,
    data: {
      studySession,
    },
  });
};

export const createSessionController: RequestHandler = async (req, res) => {
  const groupId = req.params.groupId;

  if (typeof groupId !== "string") {
    res.status(404).json({
      success: false,
      message: "Study group not found",
    });
    return;
  }

  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const result = await createStudySession(groupId, req.user.id, req.body);

  if (!result.ok) {
    res.status(result.status).json({
      success: false,
      message: result.message,
    });
    return;
  }

  res.status(201).json({
    success: true,
    message: "Study session created",
    data: {
      studySession: result.studySession,
    },
  });
};

export const setSessionRsvpController: RequestHandler = async (req, res) => {
  const sessionId = req.params.sessionId;

  if (typeof sessionId !== "string") {
    res.status(404).json({
      success: false,
      message: "Study session not found",
    });
    return;
  }

  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const result = await setSessionRsvp(sessionId, req.user.id, req.body.status);

  if (!result.ok) {
    res.status(result.status).json({
      success: false,
      message: result.message,
    });
    return;
  }

  res.json({
    success: true,
    message: "RSVP updated",
    data: {
      studySession: result.studySession,
    },
  });
};
