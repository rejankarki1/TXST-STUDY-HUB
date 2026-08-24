import type { Request, RequestHandler } from "express";

import { prisma } from "../lib/prisma.js";
import { AppError } from "./error.js";
import type { AuthUser } from "../types/auth.js";
import { verifyAccessToken } from "../utils/authTokens.js";

/** Rejects the request unless it carries a valid access token for a real user. */
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    throw new AppError("Authentication required", 401);
  }

  let payload;
  try {
    payload = verifyAccessToken(authHeader.slice("Bearer ".length));
  } catch {
    throw new AppError("Invalid or expired token", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!user) {
    throw new AppError("Authentication required", 401);
  }

  req.user = user;
  next();
};

/**
 * The authenticated user, for handlers mounted behind requireAuth.
 *
 * `req.user` is optional on the Express type, so without this every controller
 * repeats the same null check purely to satisfy TypeScript.
 */
export function currentUser(req: Request): AuthUser {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  return req.user;
}
