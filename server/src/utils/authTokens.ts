import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";

import type { AccessTokenPayload } from "../types/auth.js";

function getAccessTokenSecret() {
  const accessTokenSecret = process.env.JWT_ACCESS_SECRET;

  if (!accessTokenSecret) {
    throw new Error("JWT_ACCESS_SECRET is not configured");
  }

  return accessTokenSecret;
}

export function signAccessToken(payload: AccessTokenPayload) {
  const expiresIn = (process.env.JWT_ACCESS_EXPIRES_IN ??
    "15m") as SignOptions["expiresIn"];
  const options: SignOptions = { expiresIn };

  return jwt.sign(payload, getAccessTokenSecret(), options);
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, getAccessTokenSecret()) as AccessTokenPayload;
}
