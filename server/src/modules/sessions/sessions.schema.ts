import { z } from "zod";

export const sessionModeSchema = z.enum(["IN_PERSON", "ONLINE"]);
export const rsvpStatusSchema = z.enum(["GOING", "MAYBE", "CANT"]);
export const sessionStatusSchema = z.enum(["PLANNED", "COMPLETED", "CANCELLED"]);

const isoDateTime = z.iso.datetime({ offset: true });

const sessionShape = {
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(1).max(2000),
  agenda: z.string().trim().max(2000).optional(),
  startsAt: isoDateTime,
  endsAt: isoDateTime,
  mode: sessionModeSchema,
  location: z.string().trim().min(1).max(200),
  locationDetail: z.string().trim().max(200).optional(),
  meetingLink: z.url("Enter a valid link").optional(),
};

function checkTimesAndLink(
  input: { startsAt?: string; endsAt?: string; mode?: string; meetingLink?: string | null },
  ctx: z.RefinementCtx,
) {
  if (input.startsAt && input.endsAt && new Date(input.endsAt) <= new Date(input.startsAt)) {
    ctx.addIssue({
      code: "custom",
      path: ["endsAt"],
      message: "End time must be after start time.",
    });
  }

  if (input.mode === "ONLINE" && !input.meetingLink) {
    ctx.addIssue({
      code: "custom",
      path: ["meetingLink"],
      message: "Online sessions need a meeting link.",
    });
  }
}

export const createSessionSchema = z.object(sessionShape).superRefine(checkTimesAndLink);

export const updateSessionSchema = z
  .object({
    title: sessionShape.title.optional(),
    description: sessionShape.description.optional(),
    agenda: z.string().trim().max(2000).nullish(),
    startsAt: isoDateTime.optional(),
    endsAt: isoDateTime.optional(),
    mode: sessionModeSchema.optional(),
    location: sessionShape.location.optional(),
    locationDetail: z.string().trim().max(200).nullish(),
    meetingLink: z.url("Enter a valid link").nullish(),
  })
  .refine((input) => Object.keys(input).length > 0, { message: "Nothing to update" })
  .superRefine((input, ctx) => {
    if (input.startsAt && input.endsAt && new Date(input.endsAt) <= new Date(input.startsAt)) {
      ctx.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "End time must be after start time.",
      });
    }
  });

export const setRsvpSchema = z.object({ status: rsvpStatusSchema });

/**
 * Completing a session is where a study group's work becomes reusable. The
 * unresolved question is optional and never posted silently — saveAsQuestion has
 * to be explicitly true, which is the confirmation step.
 */
export const completeSessionSchema = z
  .object({
    topicsCompleted: z.string().trim().max(2000).optional(),
    recap: z.string().trim().max(2000).optional(),
    unresolvedQuestion: z.string().trim().min(5).max(160).optional(),
    unresolvedQuestionDetails: z.string().trim().max(2000).optional(),
    saveAsQuestion: z.boolean().default(false),
  })
  .superRefine((input, ctx) => {
    if (input.saveAsQuestion && !input.unresolvedQuestion) {
      ctx.addIssue({
        code: "custom",
        path: ["unresolvedQuestion"],
        message: "Write the question before posting it to the course.",
      });
    }
  });

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
export type CompleteSessionInput = z.infer<typeof completeSessionSchema>;
export type RsvpStatusInput = z.infer<typeof rsvpStatusSchema>;
