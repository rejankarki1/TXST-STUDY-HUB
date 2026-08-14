import { z } from "zod";

function normalizeCourseCode(code: string) {
  return code
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ")
    .replace(/^([A-Z]+)\s*(\d)/, "$1 $2");
}

function normalizeDepartmentCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export const createCourseSchema = z
  .object({
    code: z
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
    title: z.string().trim().min(3).max(160),
    description: z
      .string()
      .trim()
      .max(1000)
      .optional()
      .transform((value) => (value ? value : undefined)),
    departmentId: z.string().uuid().optional(),
    departmentCode: z
      .string()
      .trim()
      .min(2)
      .max(8)
      .transform(normalizeDepartmentCode)
      .pipe(z.string().regex(/^[A-Z]{2,8}$/))
      .optional(),
    departmentName: z
      .string()
      .trim()
      .min(2)
      .max(120)
      .optional()
      .transform((value) => (value ? value : undefined)),
  })
  .superRefine((data, context) => {
    if (data.departmentId) {
      return;
    }

    if (!data.departmentCode || !data.departmentName) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["departmentCode"],
        message: "Select a department or add a new department.",
      });
      return;
    }

    const coursePrefix = data.code.split(" ")[0];
    if (data.departmentCode !== coursePrefix) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["departmentCode"],
        message: "Department code should match the course prefix.",
      });
    }
  });
