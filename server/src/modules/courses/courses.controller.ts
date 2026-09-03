import type { RequestHandler } from "express";

import { currentUser } from "../../middleware/auth.js";
import { validatedQuery } from "../../middleware/validate.js";
import * as courses from "./courses.service.js";
import type { CourseSearchInput, CreateCourseInput } from "./courses.schema.js";

export const listCourses: RequestHandler = async (req, res) => {
  const { search } = validatedQuery<CourseSearchInput>(req);

  res.json({ success: true, data: { courses: await courses.listCourses(search) } });
};

export const listDepartments: RequestHandler = async (req, res) => {
  const { search } = validatedQuery<CourseSearchInput>(req);

  res.json({ success: true, data: { departments: await courses.listDepartments(search) } });
};

export const getCourse: RequestHandler<{ courseId: string }> = async (req, res) => {
  res.json({ success: true, data: { course: await courses.getCourse(req.params.courseId) } });
};

export const createCourse: RequestHandler = async (req, res) => {
  const course = await courses.createCourse(req.body as CreateCourseInput);

  res.status(201).json({ success: true, message: "Course added", data: { course } });
};

export const joinCourse: RequestHandler<{ courseId: string }> = async (req, res) => {
  const user = await courses.joinCourse(currentUser(req).id, req.params.courseId);

  res.status(201).json({ success: true, message: "Course added", data: { user } });
};

export const leaveCourse: RequestHandler<{ courseId: string }> = async (req, res) => {
  const user = await courses.leaveCourse(currentUser(req).id, req.params.courseId);

  res.json({ success: true, message: "Course removed", data: { user } });
};

export const listCoursePeople: RequestHandler<{ courseId: string }> = async (req, res) => {
  const people = await courses.listCoursePeople(req.params.courseId, currentUser(req).id);

  res.json({ success: true, data: { people } });
};
