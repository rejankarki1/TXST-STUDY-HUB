import { api } from "./axios.ts";
import type {
  CourseResponse,
  CoursesResponse,
  CreateCoursePayload,
} from "../types/course.ts";

export async function getCourses(search?: string) {
  const response = await api.get<CoursesResponse>("/courses", {
    params: search ? { search } : undefined,
  });

  return response.data;
}

export async function getCourseById(id: string) {
  const response = await api.get<CourseResponse>(`/courses/${id}`);
  return response.data;
}

export async function createCourse(payload: CreateCoursePayload) {
  const response = await api.post<CourseResponse>("/courses", payload);
  return response.data;
}
