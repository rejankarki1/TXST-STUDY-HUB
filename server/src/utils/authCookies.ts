import type { CookieOptions, Response } from "express";

import { env, isProduction } from "../config/env.js";
import { refreshTokenMaxAgeMs } from "./authTokens.js";

export const refreshTokenCookieName = env.REFRESH_TOKEN_COOKIE_NAME;

/**
 * A cross-site deployment (client on Vercel, API on Render) cannot use
 * SameSite=Lax — the browser drops the cookie on the API call entirely. Same-site
 * and local development keep Lax, which is the stronger default.
 */
const sameSite: CookieOptions["sameSite"] = env.CROSS_SITE_COOKIES ? "none" : "lax";
const secure = env.CROSS_SITE_COOKIES || isProduction;

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite,
  secure,
  path: "/api/auth",
};

export function setRefreshTokenCookie(res: Response, refreshToken: string) {
  res.cookie(refreshTokenCookieName, refreshToken, {
    ...baseCookieOptions,
    maxAge: refreshTokenMaxAgeMs,
  });
}

export function clearRefreshTokenCookie(res: Response) {
  res.clearCookie(refreshTokenCookieName, baseCookieOptions);
}
