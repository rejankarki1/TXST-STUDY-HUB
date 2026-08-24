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

  /* Anything unrecognised is a bug, not a client mistake: log it in full and
     tell the client nothing about our internals. */
  console.error(err);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
