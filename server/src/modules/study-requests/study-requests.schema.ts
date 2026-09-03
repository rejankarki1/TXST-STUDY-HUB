import { z } from "zod";

export const studyRequestIntentSchema = z.enum(["NEED_HELP", "CAN_HELP", "REVIEW_TOGETHER"]);
export const meetingStyleSchema = z.enum(["IN_PERSON", "ONLINE", "FLEXIBLE"]);
export const studyRequestStatusSchema = z.enum([
  "OPEN",
  "MATCHED",
  "CONVERTED",
  "CANCELLED",
  "EXPIRED",
]);

const isoDateTime = z.iso.datetime({ offset: true });

/**
 * One proposed window. Bounded at 8 hours because a "study window" wider than
 * that is really an availability range, and matching on it tells nobody when to
 * actually show up.
 */
const timeOptionSchema = z
  .object({
    startsAt: isoDateTime,
    endsAt: isoDateTime,
  })
  .superRefine((option, ctx) => {
    const start = new Date(option.startsAt).getTime();
    const end = new Date(option.endsAt).getTime();

    if (end <= start) {
      ctx.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "End time must be after start time.",
      });
    }

    if (end - start > 8 * 60 * 60 * 1000) {
      ctx.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "A study window should be at most 8 hours.",
      });
    }
  });

/* One to three windows: fewer than one is not a proposal, more than three turns
   picking a time into a survey nobody finishes. */
const timeOptionsSchema = z.array(timeOptionSchema).min(1, "Propose at least one time").max(3);

export const createStudyRequestSchema = z
  .object({
    topic: z.string().trim().min(3, "Say what you want to study").max(160),
    details: z
      .string()
      .trim()
      .max(2000)
      .optional()
      .transform((value) => (value ? value : undefined)),
    intent: studyRequestIntentSchema,
    meetingStyle: meetingStyleSchema.default("FLEXIBLE"),
    location: z
      .string()
      .trim()
      .max(200)
      .optional()
      .transform((value) => (value ? value : undefined)),
    maxParticipants: z.coerce.number().int().min(2).max(12),
    timeOptions: timeOptionsSchema,
    expiresAt: isoDateTime.optional(),
  })
  .superRefine((input, ctx) => {
    if (input.meetingStyle === "IN_PERSON" && !input.location) {
      ctx.addIssue({
        code: "custom",
        path: ["location"],
        message: "In-person requests need a campus location.",
      });
    }
  });

/** Editing never changes the course or the creator, so neither is accepted. */
export const updateStudyRequestSchema = z
  .object({
    topic: z.string().trim().min(3).max(160).optional(),
    details: z.string().trim().max(2000).nullish(),
    intent: studyRequestIntentSchema.optional(),
    meetingStyle: meetingStyleSchema.optional(),
    location: z.string().trim().max(200).nullish(),
    maxParticipants: z.coerce.number().int().min(2).max(12).optional(),
    timeOptions: timeOptionsSchema.optional(),
    expiresAt: isoDateTime.nullish(),
  })
  .refine((input) => Object.keys(input).length > 0, {
    message: "Nothing to update",
  });

/** Joining is the act of saying which proposed windows you can make. */
export const joinStudyRequestSchema = z.object({
  timeOptionIds: z.array(z.uuid()).min(1, "Pick at least one time you can make"),
});

export const setAvailabilitySchema = joinStudyRequestSchema;

export const convertToSessionSchema = z
  .object({
    timeOptionId: z.uuid(),
    title: z.string().trim().min(3).max(160).optional(),
    description: z.string().trim().max(2000).optional(),
    agenda: z.string().trim().max(2000).optional(),
    mode: z.enum(["IN_PERSON", "ONLINE"]),
    location: z.string().trim().min(1, "Where are you meeting?").max(200),
    locationDetail: z.string().trim().max(200).optional(),
    meetingLink: z.url("Enter a valid link").optional(),
  })
  .superRefine((input, ctx) => {
    if (input.mode === "ONLINE" && !input.meetingLink) {
      ctx.addIssue({
        code: "custom",
        path: ["meetingLink"],
        message: "Online sessions need a meeting link.",
      });
    }
  });

const booleanish = z
  .enum(["true", "false"])
  .optional()
  .transform((value) => value === "true");

export const listStudyRequestsQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  intent: studyRequestIntentSchema.optional(),
  meetingStyle: meetingStyleSchema.optional(),
  status: studyRequestStatusSchema.optional(),
  /* Bounds on the proposed windows, so "this week" is a real filter rather than
     something the client has to post-filter after downloading everything. */
  from: z.iso.datetime({ offset: true }).optional(),
  to: z.iso.datetime({ offset: true }).optional(),
  openSpotsOnly: booleanish,
  mine: booleanish,
});

export type CreateStudyRequestInput = z.infer<typeof createStudyRequestSchema>;
export type UpdateStudyRequestInput = z.infer<typeof updateStudyRequestSchema>;
export type JoinStudyRequestInput = z.infer<typeof joinStudyRequestSchema>;
export type ConvertToSessionInput = z.infer<typeof convertToSessionSchema>;
export type ListStudyRequestsQuery = z.infer<typeof listStudyRequestsQuerySchema>;
