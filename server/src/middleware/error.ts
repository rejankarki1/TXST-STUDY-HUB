import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

/**
 * The one way a controller reports a failed request.
 *
 * Express 5 forwards rejected async handlers to the error middleware on its own,
 * so a controller can simply `throw new AppError(404, "Group not found")` — no
 * try/catch, and no passing result objects back up for the caller to unwrap.
 */
export class AppError extends Error {
  status: number;
  /** Extra payload sent as `data`, e.g. the existing course behind a 409. */
  data?: unknown;

  constructor(message: string, status = 400, data?: unknown) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.data = data;
  }
}

type BodyParserError = Error & { type: string; status?: number };

function isBodyParserError(err: unknown): err is BodyParserError {
  return (
    err instanceof Error &&
    typeof (err as BodyParserError).type === "string" &&
    (err as BodyParserError).type.startsWith("entity.")
  );
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({
      success: false,
      message: err.message,
      ...(err.data === undefined ? {} : { data: err.data }),
    });
    return;
  }

  /* A schema parsed outside validate() — surfaced in the same shape. */
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Invalid request data",
      errors: err.flatten().fieldErrors,
    });
    return;
  }

  /* express.json() rejects a body before any route sees it: unparseable JSON,
     or one past the 100kb ceiling. Both are the caller's mistake, and reporting
     them as 500 sends people hunting for a server fault that does not exist. */
  if (isBodyParserError(err)) {
    res.status(err.type === "entity.too.large" ? 413 : 400).json({
      success: false,
      message:
        err.type === "entity.too.large"
          ? "Request body is too large"
          : "Request body is not valid JSON",
    });
    return;
  }

  /* Anything unrecognised is a bug, not a client mistake: log it in full and
     tell the client nothing about our internals. */
  console.error(err);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
