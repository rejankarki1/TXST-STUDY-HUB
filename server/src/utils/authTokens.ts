import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import crypto from "node:crypto";

import { env } from "../config/env.js";
import type { AccessTokenPayload } from "../types/auth.js";

export const refreshTokenMaxAgeMs = 1000 * 60 * 60 * 24 * 7;

/**
 * How long a just-rotated refresh token keeps working.
 *
 * Two tabs (or React StrictMode) can present the same cookie within a few
 * milliseconds of each other. Without a grace window the loser of that race is
 * signed out even though nothing is wrong. Reuse *after* the window is still
 * treated as theft — see refreshAuthSession.
 */
export const refreshTokenGraceMs = 30_000;

export function signAccessToken(payload: AccessTokenPayload) {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function createRefreshToken() {
  return crypto.randomBytes(64).toString("hex");
}

export function hashRefreshToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
