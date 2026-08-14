import { api } from "./axios.ts";
import type {
  CourseExperiencesResponse,
  CreateExperiencePayload,
  CreateExperienceResponse,
  ExperienceResponse,
} from "../types/experience.ts";

export async function getCourseExperiences(courseId: string) {
  const response = await api.get<CourseExperiencesResponse>(
    `/courses/${courseId}/experiences`,
  );

  return response.data;
}

export async function createCourseExperience(
  courseId: string,
  payload: CreateExperiencePayload,
) {
  const response = await api.post<CreateExperienceResponse>(
    `/courses/${courseId}/experiences`,
    payload,
  );

  return response.data;
}

export async function getExperienceById(experienceId: string) {
  const response = await api.get<ExperienceResponse>(
    `/experiences/${experienceId}`,
  );

  return response.data;
}
