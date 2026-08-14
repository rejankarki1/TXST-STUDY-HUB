import { api } from "./axios.ts";
import type { DepartmentsResponse } from "../types/department.ts";

export async function getDepartments(search?: string) {
  const response = await api.get<DepartmentsResponse>("/departments", {
    params: search ? { search } : undefined,
  });

  return response.data;
}
