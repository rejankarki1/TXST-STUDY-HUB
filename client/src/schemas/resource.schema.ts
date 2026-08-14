import { z } from "zod";

export const resourceFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters")
    .max(160, "Title must be 160 characters or fewer"),
  url: z
    .string()
    .trim()
    .url("Enter a valid URL")
    .max(2000, "URL must be 2000 characters or fewer"),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be 2000 characters or fewer"),
  resourceType: z.enum([
    "VIDEO",
    "PRACTICE",
    "DOCUMENTATION",
    "GUIDE",
    "TOOL",
    "OFFICIAL",
  ]),
});

export type ResourceFormValues = z.infer<typeof resourceFormSchema>;
