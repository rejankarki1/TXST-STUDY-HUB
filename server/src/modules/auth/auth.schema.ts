import { z } from "zod";

import { courseCodeSchema } from "../courses/courses.schema.js";

export const signupSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).optional(),
  password: z.string().min(8),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const currentYear = new Date().getFullYear();

/**
 * PATCH /auth/me — the profile update that also completes onboarding.
 *
 * courseCodes replaces the whole enrolment set rather than appending, which is
 * what makes it safe to submit the onboarding picker repeatedly.
 */
export const updateMeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .optional()
    .transform((value) => (value ? value : undefined)),
  major: z.string().trim().min(2).max(120),
  gradYear: z.coerce.number().int().min(currentYear).max(currentYear + 8),
  courseCodes: z.array(courseCodeSchema).min(1).max(10),
});

export type UpdateMeInput = z.infer<typeof updateMeSchema>;
