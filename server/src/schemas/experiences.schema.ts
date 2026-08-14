import { z } from "zod";

const optionalTrimmedText = (maxLength: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === ""
        ? undefined
        : value,
    z.string().trim().max(maxLength).optional(),
  );

export const createExperienceSchema = z.object({
  title: z.string().trim().min(5).max(160),
  body: z.string().trim().min(20).max(5000),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  professorName: optionalTrimmedText(120),
  term: optionalTrimmedText(80),
});
