import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { posts } from "../db/schema.js";

export const createPostSchema = createInsertSchema(posts, {
  content: z
    .string()
    .trim()
    .min(1, "post content cannot be empty")
    .max(5000, "post content must be at most 5000 characters"),
})
  .pick({
    content: true,
  });

export const createCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "comment content cannot be empty")
    .max(2000, "comment content must be at most 2000 characters"),
});
