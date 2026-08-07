import { api } from "./axios.ts";
import type {
  AuthSuccessResponse,
  BasicSuccessResponse,
  CurrentUserResponse,
  LoginPayload,
  SignupPayload,
} from "../types/auth.ts";

export async function signup(payload: SignupPayload) {
  const response = await api.post<AuthSuccessResponse>("/auth/signup", payload);
  return response.data;
}

export async function login(payload: LoginPayload) {
  const response = await api.post<AuthSuccessResponse>("/auth/login", payload);
  return response.data;
}

export async function getCurrentUser() {
  const response = await api.get<CurrentUserResponse>("/auth/me");
  return response.data;
}

export async function refreshAccessToken() {
  const response = await api.post<AuthSuccessResponse>("/auth/refresh");
  return response.data;
}

export async function logout() {
  const response = await api.post<BasicSuccessResponse>("/auth/logout");
  return response.data;
}

