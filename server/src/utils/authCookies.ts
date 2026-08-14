import type { CookieOptions, Response } from "express";

import { refreshTokenMaxAgeMs } from "./authTokens.js";

export const refreshTokenCookieName =
  process.env.REFRESH_TOKEN_COOKIE_NAME ?? "refreshToken";

const refreshTokenCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/api/auth",
  maxAge: refreshTokenMaxAgeMs,
};

export function setRefreshTokenCookie(res: Response, refreshToken: string) {
  res.cookie(refreshTokenCookieName, refreshToken, refreshTokenCookieOptions);
}

export function clearRefreshTokenCookie(res: Response) {
  res.clearCookie(refreshTokenCookieName, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth",
  });
}
