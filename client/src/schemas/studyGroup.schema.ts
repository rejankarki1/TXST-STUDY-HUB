import { z } from "zod";

export const studyGroupFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(5, "Title must be at least 5 characters")
      .max(160, "Title must be 160 characters or fewer"),
    description: z
      .string()
      .trim()
      .min(10, "Description must be at least 10 characters")
      .max(2000, "Description must be 2000 characters or fewer"),
    startDateTime: z.string().min(1, "Date and time are required"),
    mode: z.enum(["ONLINE", "IN_PERSON"]),
    location: z
      .string()
      .trim()
      .max(200, "Location must be 200 characters or fewer")
      .optional(),
    onlineDetails: z
      .string()
      .trim()
      .max(500, "Online details must be 500 characters or fewer")
      .optional(),
    maxMembers: z
      .number()
      .int("Maximum members must be a whole number")
      .min(2, "Study groups need at least 2 members")
      .max(100, "Maximum members must be 100 or fewer"),
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

export type StudyGroupFormValues = z.infer<typeof studyGroupFormSchema>;
