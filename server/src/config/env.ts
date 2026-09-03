import "dotenv/config";

import { z } from "zod";

/**
 * Every environment variable the server depends on, validated once at startup.
 *
 * The previous code read process.env at the point of use, so a missing or weak
 * JWT secret only surfaced when the first user tried to log in. Failing here
 * means a misconfigured deployment never accepts a request at all.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(5050),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  /* 32 chars is the floor for an HS256 secret worth signing with. A short
     secret is brute-forceable offline once any token leaks. */
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_ACCESS_EXPIRES_IN: z.string().min(1).default("15m"),

  REFRESH_TOKEN_COOKIE_NAME: z.string().min(1).default("refreshToken"),

  /* Comma-separated so a deployment can allow both the apex and preview
     domains without a code change. */
  CLIENT_URL: z.string().min(1).default("http://localhost:5173"),

  /* Set when the client is served from a different site than the API
     (Vercel + Render). Controls SameSite=None; Secure on the refresh cookie. */
  CROSS_SITE_COOKIES: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),

  /* Signup is restricted to this domain. Configurable so the test suite and a
     future non-TXST deployment do not need a code change. */
  ALLOWED_EMAIL_DOMAIN: z.string().min(1).default("txstate.edu"),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = Object.entries(parsed.error.flatten().fieldErrors)
      .map(([key, messages]) => `  - ${key}: ${messages?.join(", ")}`)
      .join("\n");

    throw new Error(
      `Invalid environment configuration:\n${issues}\n\nSee server/.env.example for the full list.`,
    );
  }

  return parsed.data;
}

export const env = loadEnv();

export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";

/** Every origin allowed to send credentialed requests to this API. */
export const allowedOrigins = env.CLIENT_URL.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

/**
 * Vite picks the next free port when 5173 is taken, so a second dev server (or
 * a browser tab left on 127.0.0.1 instead of localhost) sends an Origin the
 * allowlist has never heard of. In production that is exactly the request CORS
 * must refuse; in development it is only ever the developer's own machine.
 */
export function isOriginAllowed(origin: string) {
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  if (isProduction) {
    return false;
  }

  try {
    const { hostname } = new URL(origin);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
  } catch {
    return false;
  }
}
