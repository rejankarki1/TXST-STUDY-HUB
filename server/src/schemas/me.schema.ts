import { z } from "zod";

export const addMyCourseSchema = z.object({
  courseId: z.string().uuid(),
});
