import { z } from "zod";

export const sessionModeSchema = z.enum(["in-person", "online"]);
export const rsvpStatusSchema = z.enum(["going", "maybe", "cant"]);

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
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);

    if (endsAt <= startsAt) {
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

    if (input.mode === "in-person" && !input.location) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["location"],
        message: "In-person sessions need a location.",
      });
    }
  });

export const setRsvpSchema = z.object({
  status: rsvpStatusSchema,
});
