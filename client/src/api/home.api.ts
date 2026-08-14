import { api } from "./axios.ts";
import type { HomeOverviewResponse } from "../types/home.ts";

export async function getHomeOverview() {
  const response = await api.get<HomeOverviewResponse>("/home");

  return response.data;
}
