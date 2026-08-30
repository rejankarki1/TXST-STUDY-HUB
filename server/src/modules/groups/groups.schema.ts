import { z } from "zod";

export const groupPurposeSchema = z.enum([
  "Exam prep",
  "Homework",
  "Weekly studying",
  "Project work",
  "General study",
]);

export const meetingStyleSchema = z.enum(["in-person", "online", "flexible"]);

export type FrontendGroupPurpose = z.infer<typeof groupPurposeSchema>;
export type FrontendMeetingStyle = z.infer<typeof meetingStyleSchema>;

export const createGroupSchema = z.object({
  courseId: z.string().uuid(),
  name: z.string().trim().min(5).max(160),
  description: z.string().trim().min(10).max(2000),
  purpose: groupPurposeSchema,
  meetingStyle: meetingStyleSchema,
  maxMembers: z.coerce.number().int().min(3).max(12),
});

export const createGroupMessageSchema = z.object({
  body: z.string().trim().min(1).max(1000),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type CreateGroupMessageInput = z.infer<typeof createGroupMessageSchema>;
