import type { RequestHandler } from "express";
import type { ZodType } from "zod";

/**
 * The three validators below all do the same thing to a different part of the
 * request: parse it, replace it with the parsed value, and report failures in
 * the one response envelope the rest of the API uses. Controllers therefore
 * receive coerced, trimmed, normalised input and never re-validate.
 */
function parseInto(
  source: "body" | "query" | "params",
  schema: ZodType,
  invalidMessage: string,
): RequestHandler {
  return (req, res, next) => {
    const parsed = schema.safeParse(req[source]);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: invalidMessage,
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    /* Express 5 makes req.query a getter-only property, so it cannot be
       reassigned the way req.body can. Storing the parsed value alongside is
       the supported route, and controllers read it through validatedQuery(). */
    if (source === "query") {
      (req as { validatedQuery?: unknown }).validatedQuery = parsed.data;
      return next();
    }

    req[source] = parsed.data as never;
    next();
  };
}

export function validate(schema: ZodType, invalidMessage = "Invalid request data") {
  return parseInto("body", schema, invalidMessage);
}

export function validateQuery(schema: ZodType, invalidMessage = "Invalid query parameters") {
  return parseInto("query", schema, invalidMessage);
}

export function validateParams(schema: ZodType, invalidMessage = "Invalid route parameters") {
  return parseInto("params", schema, invalidMessage);
}

/** Reads what validateQuery stored. Typed at the call site by the same schema. */
export function validatedQuery<T>(req: unknown): T {
  return (req as { validatedQuery: T }).validatedQuery;
}
