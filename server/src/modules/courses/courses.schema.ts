import { z } from "zod";

/** "cs2308" / "  cs  2308 " -> "CS 2308". Mirrored client-side in AddCourse.tsx. */
function normalizeCourseCode(code: string) {
  return code
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ")
    .replace(/^([A-Z]+)\s*(\d)/, "$1 $2");
}

export const courseCodeSchema = z
  .string()
  .trim()
  .min(2)
  .max(16)
  .transform(normalizeCourseCode)
  .pipe(z.string().regex(/^[A-Z]{2,5} \d{4}[A-Z]?$/, "Use a code like CS 2308"));

/**
 * departmentId is required: a student may add a missing course, but may not
 * invent a department. The prefix/department match is checked in the service,
 * where the department record is already loaded.
 */
export const createCourseSchema = z.object({
  code: courseCodeSchema,
  title: z.string().trim().min(3).max(160),
  description: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((value) => (value ? value : undefined)),
  departmentId: z.uuid(),
});

export const courseSearchSchema = z.object({
  search: z.string().trim().max(120).optional(),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type CourseSearchInput = z.infer<typeof courseSearchSchema>;
