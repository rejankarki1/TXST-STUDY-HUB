import { z } from "zod";

export const createStudyGroupSchema = z
  .object({
    title: z.string().trim().min(5).max(160),
    description: z.string().trim().min(10).max(2000),
    startDateTime: z
      .string()
      .trim()
      .refine((value) => !Number.isNaN(Date.parse(value)), {
        message: "Start date and time must be valid",
      }),
    mode: z.enum(["ONLINE", "IN_PERSON"]),
    location: z.string().trim().max(200).optional(),
    onlineDetails: z.string().trim().max(500).optional(),
    maxMembers: z.coerce.number().int().min(2).max(100),
  })
  .superRefine((values, ctx) => {
    if (values.mode === "IN_PERSON" && !values.location) {
      ctx.addIssue({
        code: "custom",
        path: ["location"],
        message: "Location is required for in-person groups",
      });
    }

    if (values.mode === "ONLINE" && !values.onlineDetails) {
      ctx.addIssue({
        code: "custom",
        path: ["onlineDetails"],
        message: "Online details are required for online groups",
      });
    }
  });
