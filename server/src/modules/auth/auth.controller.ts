import type { RequestHandler } from "express";

import { AppError } from "../../middleware/error.js";
import { currentUser } from "../../middleware/auth.js";
import {
  getCurrentUser,
  loginDemoUser,
  loginUser,
  logoutUser,
  refreshAuthSession,
  signupUser,
  updateCurrentUser,
} from "./auth.service.js";
import {
  clearRefreshTokenCookie,
  refreshTokenCookieName,
  setRefreshTokenCookie,
} from "../../utils/authCookies.js";
import type { LoginInput, SignupInput, UpdateMeInput } from "./auth.schema.js";

/**
 * Credentials and tokens live in auth.service — hashing, comparison, signing,
 * and refresh-token rotation are the one genuinely intricate area of this
 * backend. These handlers do request/response work only.
 */

export const signup: RequestHandler = async (req, res) => {
  const { user, accessToken, refreshToken } = await signupUser(req.body as SignupInput);

  setRefreshTokenCookie(res, refreshToken);

  res.status(201).json({
    success: true,
    message: "Account created",
    data: { user, accessToken },
  });
};

export const login: RequestHandler = async (req, res) => {
  const { user, accessToken, refreshToken } = await loginUser(req.body as LoginInput);

  setRefreshTokenCookie(res, refreshToken);

  res.json({
    success: true,
    message: "Login successful",
    data: { user, accessToken },
  });
};

export const demo: RequestHandler = async (_req, res) => {
  const { user, accessToken, refreshToken } = await loginDemoUser();

  setRefreshTokenCookie(res, refreshToken);
  res.json({
    success: true,
    message: "Demo session started",
    data: { user, accessToken },
  });
};

export const refresh: RequestHandler = async (req, res) => {
  const token = req.cookies?.[refreshTokenCookieName] as string | undefined;

  if (!token) {
    throw new AppError("Refresh token required", 401);
  }

  try {
    const session = await refreshAuthSession(token);
    setRefreshTokenCookie(res, session.refreshToken);

    res.json({
      success: true,
      message: "Access token refreshed",
      data: { user: session.user, accessToken: session.accessToken },
    });
  } catch (error) {
    /* A rejected refresh token is never usable again — drop the cookie so the
       browser stops presenting it on every load. */
    clearRefreshTokenCookie(res);
    throw error;
  }
};

export const logout: RequestHandler = async (req, res) => {
  await logoutUser(req.cookies?.[refreshTokenCookieName] as string | undefined);
  clearRefreshTokenCookie(res);

  res.json({ success: true, message: "Logout successful", data: { loggedOut: true } });
};

export const me: RequestHandler = async (req, res) => {
  const user = await getCurrentUser(currentUser(req).id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.json({ success: true, data: { user } });
};

export const updateMe: RequestHandler = async (req, res) => {
  const user = await updateCurrentUser(currentUser(req).id, req.body as UpdateMeInput);

  res.json({ success: true, message: "Profile updated", data: { user } });
};
