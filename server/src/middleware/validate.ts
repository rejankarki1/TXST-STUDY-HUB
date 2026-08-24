import type { RequestHandler } from "express";
import type { ZodTypeAny } from "zod";

/**
 * Parses the request body and replaces it with the parsed value, so controllers
 * receive coerced, trimmed, normalised input and never re-validate.
 */
export function validate(schema: ZodTypeAny, invalidMessage = "Invalid request data"): RequestHandler {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: invalidMessage,
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    req.body = parsed.data;
    next();
  };
}
