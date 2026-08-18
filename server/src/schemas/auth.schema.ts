import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).optional(),
  password: z.string().min(8),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function normalizeCourseCode(code: string) {
  return code
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ")
    .replace(/^([A-Z]+)\s*(\d)/, "$1 $2");
}

const currentYear = new Date().getFullYear();

export const completeOnboardingSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .optional()
    .transform((value) => (value ? value : undefined)),
  major: z.string().trim().min(2).max(120),
  gradYear: z.coerce.number().int().min(currentYear).max(currentYear + 8),
  courseCodes: z
    .array(
      z
        .string()
        .trim()
        .min(2)
        .max(16)
        .transform(normalizeCourseCode)
        .pipe(
          z
            .string()
            .regex(/^[A-Z]{2,5} \d{4}[A-Z]?$/, "Use a code like CS 2308"),
        ),
    )
    .min(1)
    .max(10),
});
