import { z } from "zod";

import { validateParams } from "./validate.js";

/**
 * Every :id route parameter is a UUID. Validating it at the edge means a service
 * never issues a query with a malformed id, and a typo returns 400 rather than a
 * confusing 404 or a Prisma error.
 */
export function uuidParams(...names: string[]) {
  const shape = Object.fromEntries(
    names.map((name) => [name, z.uuid(`${name} must be a valid id`)]),
  );

  return validateParams(z.object(shape), "Invalid route parameters");
}
