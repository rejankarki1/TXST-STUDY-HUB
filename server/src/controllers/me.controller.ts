import type { RequestHandler } from "express";

import {
  addCourseForCurrentUser,
  removeCourseForCurrentUser,
} from "../services/me.service.js";

export const addMyCourse: RequestHandler = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const result = await addCourseForCurrentUser(req.user.id, req.body.courseId);

  if (!result.ok) {
    res.status(result.status).json({
      success: false,
      message: result.message,
    });
    return;
  }

  res.status(201).json({
    success: true,
    message: "Course added",
    data: {
      user: result.user,
    },
  });
};

export const removeMyCourse: RequestHandler = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const courseId = req.params.courseId;

  if (typeof courseId !== "string") {
    res.status(404).json({
      success: false,
      message: "Course not found",
    });
    return;
  }

  const result = await removeCourseForCurrentUser(req.user.id, courseId);

  res.json({
    success: true,
    message: "Course removed",
    data: {
      user: result.user,
    },
  });
};
