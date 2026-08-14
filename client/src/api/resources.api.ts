import { api } from "./axios.ts";
import type {
  CourseResourcesResponse,
  CreateResourcePayload,
  CreateResourceResponse,
  ResourceResponse,
} from "../types/resource.ts";

export async function getCourseResources(courseId: string) {
  const response = await api.get<CourseResourcesResponse>(
    `/courses/${courseId}/resources`,
  );

  return response.data;
}

export async function createCourseResource(
  courseId: string,
  payload: CreateResourcePayload,
) {
  const response = await api.post<CreateResourceResponse>(
    `/courses/${courseId}/resources`,
    payload,
  );

  return response.data;
}

export async function getResourceById(resourceId: string) {
  const response = await api.get<ResourceResponse>(`/resources/${resourceId}`);

  return response.data;
}
