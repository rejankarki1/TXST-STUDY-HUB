import { z } from "zod";

export const experienceFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters")
    .max(160, "Title must be 160 characters or fewer"),
  body: z
    .string()
    .trim()
    .min(20, "Experience must be at least 20 characters")
    .max(5000, "Experience must be 5000 characters or fewer"),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  professorName: z
    .string()
    .trim()
    .max(120, "Professor name must be 120 characters or fewer")
    .optional(),
  term: z
    .string()
    .trim()
    .max(80, "Term must be 80 characters or fewer")
    .optional(),
});

export type ExperienceFormValues = z.infer<typeof experienceFormSchema>;
