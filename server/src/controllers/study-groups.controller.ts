import type { RequestHandler } from "express";

import { prisma } from "../config/prisma.js";
import type { StudyGroupMode } from "../generated/prisma/enums.js";
import {
  createStudyGroupForCourse,
  joinStudyGroup,
  leaveStudyGroup,
  studyGroupSelect,
} from "../services/study-groups.service.js";

export const listCourseStudyGroups: RequestHandler = async (req, res) => {
  const courseId = req.params.courseId;

  if (typeof courseId !== "string") {
    res.status(404).json({
      success: false,
      message: "Course not found",
    });
    return;
  }

  const course = await prisma.course.findUnique({
    where: {
      id: courseId,
    },
    select: {
      id: true,
    },
  });

  if (!course) {
    res.status(404).json({
      success: false,
      message: "Course not found",
    });
    return;
  }

  const studyGroups = await prisma.studyGroup.findMany({
    where: {
      courseId,
      startDateTime: {
        gte: new Date(),
      },
    },
    orderBy: {
      startDateTime: "asc",
    },
    select: studyGroupSelect,
  });

  res.json({
    success: true,
    data: {
      studyGroups,
    },
  });
};

export const createStudyGroup: RequestHandler = async (req, res) => {
  const courseId = req.params.courseId;

  if (typeof courseId !== "string") {
    res.status(404).json({
      success: false,
      message: "Course not found",
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

  const {
    description,
    location,
    maxMembers,
    mode,
    onlineDetails,
    startDateTime,
    title,
  } = req.body as {
    title: string;
    description: string;
    startDateTime: string;
    mode: StudyGroupMode;
    location?: string;
    onlineDetails?: string;
    maxMembers: number;
  };

  const result = await createStudyGroupForCourse(courseId, req.user.id, {
    title,
    description,
    startDateTime,
    mode,
    location,
    onlineDetails,
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

  const studyGroup = await prisma.studyGroup.findUnique({
    where: {
      id: groupId,
    },
    select: studyGroupSelect,
  });

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
