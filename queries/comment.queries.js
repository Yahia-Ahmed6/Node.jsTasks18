import { db } from "../db/index.js";
import {comments,users,posts} from "../db/schema.js";

import { eq } from "drizzle-orm";

export async function createComment({postId,userId,content,}) {
  return db.transaction(async (tx) => {
    const [post] = await tx
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.id, postId))
      .for("update");

    if (!post) {
      return null;
    }

    const [comment] = await tx
      .insert(comments)
      .values({
        postId,
        userId,
        content,
      })
      .returning({
        id: comments.id,
        content: comments.content,
        created_at: comments.createdAt,
      });

    const [author] = await tx
      .select({
        username: users.username,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return {
      ...comment,
      username: author.username,
    };
  });
}
