import type { RequestHandler } from "express";

import {
  loginUser,
  logoutUser,
  refreshAuthSession,
  signupUser,
} from "../services/auth.service.js";
import {
  clearRefreshTokenCookie,
  refreshTokenCookieName,
  setRefreshTokenCookie,
} from "../utils/authCookies.js";

export const signup: RequestHandler = async (req, res) => {
  const result = await signupUser(
    req.body as { email: string; name?: string; password: string },
  );

  if (!result.ok) {
    res.status(result.status).json({
      success: false,
      message: result.message,
    });
    return;
  }

  setRefreshTokenCookie(res, result.refreshToken);

  res.status(201).json({
    success: true,
    message: "User created",
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
};

export const login: RequestHandler = async (req, res) => {
  const result = await loginUser(
    req.body as { email: string; password: string },
  );

  if (!result.ok) {
    res.status(result.status).json({
      success: false,
      message: result.message,
    });
    return;
  }

  setRefreshTokenCookie(res, result.refreshToken);

  res.json({
    success: true,
    message: "Login successful",
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
};

export const refresh: RequestHandler = async (req, res) => {
  const refreshToken = req.cookies?.[refreshTokenCookieName] as
    | string
    | undefined;

  if (!refreshToken) {
    res.status(401).json({
      success: false,
      message: "Refresh token required",
    });
    return;
  }

  const result = await refreshAuthSession(refreshToken);

  if (!result.ok) {
    if (result.clearCookie) {
      clearRefreshTokenCookie(res);
    }

    res.status(result.status).json({
      success: false,
      message: result.message,
    });
    return;
  }

  setRefreshTokenCookie(res, result.refreshToken);

  res.json({
    success: true,
    message: "Access token refreshed",
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
};

export const logout: RequestHandler = async (req, res) => {
  const refreshToken = req.cookies?.[refreshTokenCookieName] as
    | string
    | undefined;

  await logoutUser(refreshToken);
  clearRefreshTokenCookie(res);

  res.json({
    success: true,
    message: "Logout successful",
  });
};
