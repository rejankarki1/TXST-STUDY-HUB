import type { RequestHandler } from "express";

import {
  createStudyGroupForCourse,
  getStudyGroup,
  joinStudyGroup,
  leaveStudyGroup,
  listMyStudyGroups,
  listStudyGroups,
} from "../services/study-groups.service.js";

function currentUserId(req: Parameters<RequestHandler>[0]) {
  return req.user?.id;
}

export const listStudyGroupsController: RequestHandler = async (req, res) => {
  const courseId =
    typeof req.query.courseId === "string" ? req.query.courseId : undefined;
  const search =
    typeof req.query.search === "string" ? req.query.search : undefined;

  const studyGroups = await listStudyGroups({
    currentUserId: currentUserId(req),
    courseId,
    search,
  });

  res.json({
    success: true,
    data: {
      studyGroups,
    },
  });
};

export const listMyStudyGroupsController: RequestHandler = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const studyGroups = await listMyStudyGroups(req.user.id);

  res.json({
    success: true,
    data: {
      studyGroups,
    },
  });
};

export const listCourseStudyGroups: RequestHandler = async (req, res) => {
  const courseId = req.params.courseId;

  if (typeof courseId !== "string") {
    res.status(404).json({
      success: false,
      message: "Course not found",
    });
    return;
  }

  const studyGroups = await listStudyGroups({
    currentUserId: currentUserId(req),
    courseId,
  });

  res.json({
    success: true,
    data: {
      studyGroups,
    },
  });
};

export const createStudyGroup: RequestHandler = async (req, res) => {
  const courseIdFromParams =
    typeof req.params.courseId === "string" ? req.params.courseId : undefined;

  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const {
    courseId: courseIdFromBody,
    description,
    maxMembers,
    meetingStyle,
    name,
    purpose,
  } = req.body as {
    courseId?: string;
    name: string;
    description: string;
    purpose: "Exam prep" | "Homework" | "Weekly studying" | "Project work" | "General study";
    meetingStyle: "in-person" | "online" | "flexible";
    maxMembers: number;
  };

  const courseId = courseIdFromParams ?? courseIdFromBody;

  if (!courseId) {
    res.status(400).json({
      success: false,
      message: "Course is required",
    });
    return;
  }

  const result = await createStudyGroupForCourse(courseId, req.user.id, {
    name,
    description,
    purpose,
    meetingStyle,
    maxMembers,
  });

  if (!result.ok) {
    res.status(result.status).json({
      success: false,
      message: result.message,
    });
    return;
  }

  res.status(201).json({
    success: true,
    message: "Study group created",
    data: {
      studyGroup: result.studyGroup,
    },
  });
};

export const getStudyGroupById: RequestHandler = async (req, res) => {
  const groupId = req.params.groupId;

  if (typeof groupId !== "string") {
    res.status(404).json({
      success: false,
      message: "Study group not found",
    });
    return;
  }

  const studyGroup = await getStudyGroup(groupId, currentUserId(req));

  if (!studyGroup) {
    res.status(404).json({
      success: false,
      message: "Study group not found",
    });
    return;
  }

  res.json({
    success: true,
    data: {
      studyGroup,
    },
  });
};

export const listStudyGroupMembers: RequestHandler = async (req, res) => {
  const groupId = req.params.groupId;

  if (typeof groupId !== "string") {
    res.status(404).json({
      success: false,
      message: "Study group not found",
    });
    return;
  }

  const studyGroup = await getStudyGroup(groupId, currentUserId(req));

  if (!studyGroup) {
    res.status(404).json({
      success: false,
      message: "Study group not found",
    });
    return;
  }

  res.json({
    success: true,
    data: {
      members: studyGroup.members,
    },
  });
};

export const joinStudyGroupById: RequestHandler = async (req, res) => {
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

  const result = await joinStudyGroup(groupId, req.user.id);

  if (!result.ok) {
    res.status(result.status).json({
      success: false,
      message: result.message,
    });
    return;
  }

  res.json({
    success: true,
    message: "Study group joined",
    data: {
      studyGroup: result.studyGroup,
    },
  });
};

export const leaveStudyGroupById: RequestHandler = async (req, res) => {
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

  const result = await leaveStudyGroup(groupId, req.user.id);

  if (!result.ok) {
    res.status(result.status).json({
      success: false,
      message: result.message,
    });
    return;
  }

  res.json({
    success: true,
    message: "Study group left",
    data: {
      studyGroup: result.studyGroup,
    },
  });
};
