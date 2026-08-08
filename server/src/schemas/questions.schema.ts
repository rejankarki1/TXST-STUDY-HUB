import { z } from "zod";

export const createQuestionSchema = z.object({
  title: z.string().trim().min(5).max(160),
  body: z.string().trim().min(10).max(5000),
});

export const createAnswerSchema = z.object({
  body: z.string().trim().min(10).max(5000),
});
