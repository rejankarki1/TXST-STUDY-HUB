import { z } from "zod";

export const groupPurposeSchema = z.enum([
  "Exam prep",
  "Homework",
  "Weekly studying",
  "Project work",
  "General study",
]);

export const meetingStyleSchema = z.enum(["in-person", "online", "flexible"]);

export const createStudyGroupSchema = z.object({
  courseId: z.string().uuid().optional(),
  name: z.string().trim().min(5).max(160),
  description: z.string().trim().min(10).max(2000),
  purpose: groupPurposeSchema,
  meetingStyle: meetingStyleSchema,
  maxMembers: z.coerce.number().int().min(3).max(12),
});
