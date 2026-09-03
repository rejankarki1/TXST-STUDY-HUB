import { z } from "zod";

import { env } from "../../config/env.js";
import { courseCodeSchema } from "../courses/courses.schema.js";

const strongPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(200, "Password is too long")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/\d/, "Password must include a number")
  .regex(/[^A-Za-z0-9]/, "Password must include a symbol");

/**
 * Normalising here rather than in the service means every entry point — signup,
 * login, tests, seed — agrees on what "the same email" means. Without it
 * "Student@TXState.edu " and "student@txstate.edu" are two accounts.
 */
const normalizedEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address"));

const txstateEmailSchema = normalizedEmailSchema.refine(
  (email) => email.endsWith(`@${env.ALLOWED_EMAIL_DOMAIN}`),
  { message: `Use your @${env.ALLOWED_EMAIL_DOMAIN} email address` },
);

export const signupSchema = z.object({
  email: txstateEmailSchema,
  name: z.string().trim().min(1).max(120).optional(),
  password: strongPasswordSchema,
});

/* Login accepts any well-formed address: restricting the domain here would tell
   an attacker which addresses are even eligible to exist. */
export const loginSchema = z.object({
  email: normalizedEmailSchema,
  password: z.string().min(1),
});

const currentYear = new Date().getFullYear();

/**
 * PATCH /auth/me — the profile update that also completes onboarding.
 *
 * courseCodes replaces the whole enrolment set rather than appending, which is
 * what makes it safe to submit the onboarding picker repeatedly. It is optional
 * so the Profile screen can change a name or visibility without resending every
 * course the student is taking.
 */
export const updateMeSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  major: z.string().trim().min(2).max(120).optional(),
  gradYear: z.coerce.number().int().min(currentYear).max(currentYear + 8).optional(),
  studyProfileVisible: z.boolean().optional(),
  courseCodes: z.array(courseCodeSchema).min(1).max(12).optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateMeInput = z.infer<typeof updateMeSchema>;
