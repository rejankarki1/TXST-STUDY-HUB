import { z } from "zod";

export const circlePurposeSchema = z.enum([
  "EXAM_PREP",
  "HOMEWORK",
  "WEEKLY_STUDYING",
  "PROJECT_WORK",
  "GENERAL_STUDY",
]);

export const meetingStyleSchema = z.enum(["IN_PERSON", "ONLINE", "FLEXIBLE"]);
export const circleStatusSchema = z.enum(["ACTIVE", "ARCHIVED"]);

/** "Fall 2026" / "Spring 2027" — a Circle belongs to one term, not forever. */
const termSchema = z
  .string()
  .trim()
  .regex(/^(Spring|Summer|Fall|Winter) \d{4}$/, "Use a term like Fall 2026");

export const createCircleSchema = z.object({
  courseId: z.uuid(),
  name: z.string().trim().min(5).max(160),
  description: z.string().trim().min(10).max(2000),
  purpose: circlePurposeSchema,
  meetingStyle: meetingStyleSchema,
  maxMembers: z.coerce.number().int().min(2).max(12),
  term: termSchema,
  recurringSchedule: z.string().trim().max(200).optional(),
  /* Explicitly optional and validated: the product does not host chat, but it
     should not pretend a Circle has no way to talk between sessions either. */
  externalLink: z.url("Enter a valid link").optional(),
});

export const updateCircleSchema = z
  .object({
    name: z.string().trim().min(5).max(160).optional(),
    description: z.string().trim().min(10).max(2000).optional(),
    purpose: circlePurposeSchema.optional(),
    meetingStyle: meetingStyleSchema.optional(),
    maxMembers: z.coerce.number().int().min(2).max(12).optional(),
    term: termSchema.optional(),
    recurringSchedule: z.string().trim().max(200).nullish(),
    externalLink: z.url("Enter a valid link").nullish(),
  })
  .refine((input) => Object.keys(input).length > 0, { message: "Nothing to update" });

export const listCirclesQuerySchema = z.object({
  courseId: z.uuid().optional(),
  search: z.string().trim().max(120).optional(),
  status: circleStatusSchema.optional(),
});

export type CreateCircleInput = z.infer<typeof createCircleSchema>;
export type UpdateCircleInput = z.infer<typeof updateCircleSchema>;
export type ListCirclesQuery = z.infer<typeof listCirclesQuerySchema>;
