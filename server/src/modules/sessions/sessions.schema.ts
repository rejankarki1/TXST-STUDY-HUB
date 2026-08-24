import { z } from "zod";

export const sessionModeSchema = z.enum(["in-person", "online"]);
export const rsvpStatusSchema = z.enum(["going", "maybe", "cant"]);

export type FrontendSessionMode = z.infer<typeof sessionModeSchema>;
export type FrontendRsvpStatus = z.infer<typeof rsvpStatusSchema>;

export const createSessionSchema = z
  .object({
    title: z.string().trim().min(3).max(160),
    description: z.string().trim().min(1).max(2000),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    mode: sessionModeSchema,
    location: z.string().trim().min(1).max(200),
    locationDetail: z.string().trim().max(200).optional(),
    meetingLink: z.string().trim().url().optional(),
  })
  .superRefine((input, ctx) => {
    if (new Date(input.endsAt) <= new Date(input.startsAt)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsAt"],
        message: "End time must be after start time.",
      });
    }

    if (input.mode === "online" && !input.meetingLink) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["meetingLink"],
        message: "Online sessions need a meeting link.",
      });
    }
  });

export type CreateSessionInput = z.infer<typeof createSessionSchema>;

export const setRsvpSchema = z.object({ status: rsvpStatusSchema });
