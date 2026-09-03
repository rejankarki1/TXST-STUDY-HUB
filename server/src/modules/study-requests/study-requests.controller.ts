import type { RequestHandler } from "express";

import { currentUser } from "../../middleware/auth.js";
import { validatedQuery } from "../../middleware/validate.js";
import * as requests from "./study-requests.service.js";
import type {
  ConvertToSessionInput,
  CreateStudyRequestInput,
  JoinStudyRequestInput,
  ListStudyRequestsQuery,
  UpdateStudyRequestInput,
} from "./study-requests.schema.js";

export const listCourseStudyRequests: RequestHandler<{ courseId: string }> = async (req, res) => {
  const studyRequests = await requests.listCourseStudyRequests(
    req.params.courseId,
    currentUser(req).id,
    validatedQuery<ListStudyRequestsQuery>(req),
  );

  res.json({ success: true, data: { studyRequests } });
};

export const listMyStudyRequests: RequestHandler = async (req, res) => {
  res.json({
    success: true,
    data: { studyRequests: await requests.listMyStudyRequests(currentUser(req).id) },
  });
};

export const listOpportunities: RequestHandler = async (req, res) => {
  res.json({
    success: true,
    data: {
      studyRequests: await requests.listStudyRequestsForMyCourses(currentUser(req).id),
    },
  });
};

export const getStudyRequest: RequestHandler<{ requestId: string }> = async (req, res) => {
  res.json({
    success: true,
    data: { studyRequest: await requests.getStudyRequest(req.params.requestId, currentUser(req).id) },
  });
};

export const createStudyRequest: RequestHandler<{ courseId: string }> = async (req, res) => {
  const studyRequest = await requests.createStudyRequest(
    currentUser(req).id,
    req.params.courseId,
    req.body as CreateStudyRequestInput,
  );

  res.status(201).json({
    success: true,
    message: "Study request posted",
    data: { studyRequest },
  });
};

export const updateStudyRequest: RequestHandler<{ requestId: string }> = async (req, res) => {
  const studyRequest = await requests.updateStudyRequest(
    currentUser(req).id,
    req.params.requestId,
    req.body as UpdateStudyRequestInput,
  );

  res.json({ success: true, message: "Study request updated", data: { studyRequest } });
};

export const joinStudyRequest: RequestHandler<{ requestId: string }> = async (req, res) => {
  const studyRequest = await requests.joinStudyRequest(
    currentUser(req).id,
    req.params.requestId,
    req.body as JoinStudyRequestInput,
  );

  res.status(201).json({ success: true, message: "You joined this request", data: { studyRequest } });
};

export const setMyAvailability: RequestHandler<{ requestId: string }> = async (req, res) => {
  const studyRequest = await requests.setMyAvailability(
    currentUser(req).id,
    req.params.requestId,
    req.body as JoinStudyRequestInput,
  );

  res.json({ success: true, message: "Availability updated", data: { studyRequest } });
};

export const withdrawFromStudyRequest: RequestHandler<{ requestId: string }> = async (req, res) => {
  const studyRequest = await requests.withdrawFromStudyRequest(
    currentUser(req).id,
    req.params.requestId,
  );

  res.json({ success: true, message: "You left this request", data: { studyRequest } });
};

export const cancelStudyRequest: RequestHandler<{ requestId: string }> = async (req, res) => {
  const studyRequest = await requests.cancelStudyRequest(
    currentUser(req).id,
    req.params.requestId,
  );

  res.json({ success: true, message: "Study request cancelled", data: { studyRequest } });
};

export const convertToSession: RequestHandler<{ requestId: string }> = async (req, res) => {
  const { session, request } = await requests.convertStudyRequestToSession(
    currentUser(req).id,
    req.params.requestId,
    req.body as ConvertToSessionInput,
  );

  res.status(201).json({
    success: true,
    message: "Study session confirmed",
    data: { session, studyRequest: request },
  });
};
