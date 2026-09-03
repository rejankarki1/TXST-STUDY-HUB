import { z } from "zod";

export const questionStatusSchema = z.enum(["OPEN", "SOLVED"]);

export const createQuestionSchema = z.object({
  title: z.string().trim().min(8, "Give the question a clear title").max(160),
  body: z.string().trim().min(10, "Add enough detail for someone to answer").max(5000),
});

export const updateQuestionSchema = z
  .object({
    title: z.string().trim().min(8).max(160).optional(),
    body: z.string().trim().min(10).max(5000).optional(),
  })
  .refine((input) => Object.keys(input).length > 0, { message: "Nothing to update" });

export const createAnswerSchema = z.object({
  body: z.string().trim().min(2, "Write an answer").max(5000),
});

export const updateAnswerSchema = createAnswerSchema;

/**
 * PATCH .../accept toggles rather than only setting, so unaccepting an answer is
 * the same endpoint. Defaults to accepting, which is what the button does.
 */
export const acceptAnswerSchema = z.object({
  accepted: z.boolean().default(true),
});

export const listQuestionsQuerySchema = z.object({
  search: z.string().trim().max(160).optional(),
  status: questionStatusSchema.optional(),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type CreateAnswerInput = z.infer<typeof createAnswerSchema>;
export type AcceptAnswerInput = z.infer<typeof acceptAnswerSchema>;
export type ListQuestionsQuery = z.infer<typeof listQuestionsQuerySchema>;
