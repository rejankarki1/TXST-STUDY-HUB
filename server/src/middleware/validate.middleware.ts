import type { RequestHandler } from "express";
import type { ZodTypeAny } from "zod";

export function validateBody(
  schema: ZodTypeAny,
  invalidMessage: string,
): RequestHandler {
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
