import { api } from "./axios.ts";
import type {
  CourseStudyGroupsResponse,
  CreateStudyGroupPayload,
  StudyGroupResponse,
} from "../types/studyGroup.ts";

export async function getCourseStudyGroups(courseId: string) {
  const response = await api.get<CourseStudyGroupsResponse>(
    `/courses/${courseId}/study-groups`,
  );

  return response.data;
}

export async function createCourseStudyGroup(
  courseId: string,
  payload: CreateStudyGroupPayload,
) {
  const response = await api.post<StudyGroupResponse>(
    `/courses/${courseId}/study-groups`,
    payload,
  );

  return response.data;
}

export async function getStudyGroupById(groupId: string) {
  const response = await api.get<StudyGroupResponse>(
    `/study-groups/${groupId}`,
  );

  return response.data;
}

export async function joinStudyGroup(groupId: string) {
  const response = await api.post<StudyGroupResponse>(
    `/study-groups/${groupId}/join`,
  );

  return response.data;
}

export async function leaveStudyGroup(groupId: string) {
  const response = await api.delete<StudyGroupResponse>(
    `/study-groups/${groupId}/membership`,
  );

  return response.data;
}
