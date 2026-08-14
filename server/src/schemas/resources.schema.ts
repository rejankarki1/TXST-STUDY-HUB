import { z } from "zod";

export const createResourceSchema = z.object({
  title: z.string().trim().min(5).max(160),
  description: z.string().trim().min(10).max(2000),
  url: z.string().trim().url().max(2000),
  resourceType: z.enum([
    "VIDEO",
    "PRACTICE",
    "DOCUMENTATION",
    "GUIDE",
    "TOOL",
    "OFFICIAL",
  ]),
});
