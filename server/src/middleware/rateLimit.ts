import rateLimit from "express-rate-limit";

import { isTest } from "../config/env.js";

/**
 * Credential endpoints only. Signup, login, and refresh are the three routes
 * where an unlimited request rate turns into password guessing or refresh-token
 * grinding; everything else is already behind requireAuth.
 *
 * Disabled under NODE_ENV=test so the integration suite can hammer login
 * without tripping a limit that has nothing to do with what it is asserting.
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: () => isTest,
  message: {
    success: false,
    message: "Too many attempts. Try again in a few minutes.",
  },
});

/** Wider limit for the whole API, so one client cannot monopolise the server. */
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: () => isTest,
  message: {
    success: false,
    message: "Too many requests. Slow down and try again shortly.",
  },
});
