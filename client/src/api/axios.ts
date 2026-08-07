import axios from "axios";
import type {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

import type { AuthSuccessResponse } from "../types/auth.ts";

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const baseURL = import.meta.env.VITE_API_URL as string | undefined;

let accessToken: string | null = null;

export function setApiAccessToken(token: string | null) {
  accessToken = token;
}

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    const requestUrl = originalRequest?.url ?? "";
    const isAuthRefreshRequest = requestUrl.includes("/auth/refresh");

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isAuthRefreshRequest
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const response: AxiosResponse<AuthSuccessResponse> = await axios.post(
        `${baseURL}/auth/refresh`,
        {},
        { withCredentials: true },
      );

      setApiAccessToken(response.data.data.accessToken);
      originalRequest.headers.Authorization = `Bearer ${response.data.data.accessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      setApiAccessToken(null);
      return Promise.reject(refreshError);
    }
  },
);

