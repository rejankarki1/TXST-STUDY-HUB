import { z } from "zod";

export const askQuestionFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters")
    .max(160, "Title must be 160 characters or fewer"),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description must be 5000 characters or fewer"),
});

export const answerFormSchema = z.object({
  body: z
    .string()
    .trim()
    .min(10, "Answer must be at least 10 characters")
    .max(5000, "Answer must be 5000 characters or fewer"),
});

export type AskQuestionFormValues = z.infer<typeof askQuestionFormSchema>;
export type AnswerFormValues = z.infer<typeof answerFormSchema>;
