import { db } from "../db/index.js";
import {posts,users,likes,comments} from "../db/schema.js";

import {eq,desc,sql,and,count} from "drizzle-orm";

const postFields = {
  id: posts.id,
  content: posts.content,
  image: posts.image,
  created_at: posts.createdAt,
  username: users.username,

  like_count: sql`
    (SELECT COUNT(*)::int
     FROM ${likes}
     WHERE ${likes.postId} = ${posts.id})
  `.mapWith(Number),

  comment_count: sql`
    (SELECT COUNT(*)::int
     FROM ${comments}
     WHERE ${comments.postId} = ${posts.id})
  `.mapWith(Number),
};

function withLikedByMe(userId) {
  return {
    ...postFields,
    liked_by_me: sql`
      EXISTS (
        SELECT 1 FROM ${likes}
        WHERE ${likes.postId} = ${posts.id}
          AND ${likes.userId} = ${userId}
      )
    `.mapWith(Boolean),
  };
}

export async function getAllPosts(userId) {
  return db
    .select(withLikedByMe(userId))
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .orderBy(desc(posts.createdAt), desc(posts.id));
}

export async function getPostById(postId, userId) {
  const [post] = await db
    .select(withLikedByMe(userId))
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .where(eq(posts.id, postId))
    .limit(1);

  return post ?? null;
}

export async function createPost({userId,content,image}) {
  const [post] = await db
    .insert(posts)
    .values({
      userId,
      content,
      image: image ?? null,
    })
    .returning({
      id: posts.id,
      user_id: posts.userId,
      content: posts.content,
      image: posts.image,
      created_at: posts.createdAt,
    });

  return post;
}

export async function getPostComments(postId) {
  return db
    .select({
      id: comments.id,
      content: comments.content,
      created_at: comments.createdAt,
      username: users.username,
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.postId, postId))
    .orderBy(comments.createdAt, comments.id);
}


export async function togglePostLike(postId, userId) {
  return db.transaction(async (tx) => {
    const [post] = await tx
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.id, postId))
      .for("update");

    if (!post) {
      return null;
    }

    const [existingLike] = await tx
      .select({
        userId: likes.userId,
      })
      .from(likes)
      .where(
        and(
          eq(likes.postId, postId),
          eq(likes.userId, userId)
        )
      )
      .limit(1);

    let liked;

    if (existingLike) {
      await tx
        .delete(likes)
        .where(
          and(
            eq(likes.postId, postId),
            eq(likes.userId, userId)
          )
        );

      liked = false;
    } else {
      await tx
        .insert(likes)
        .values({
          postId,
          userId,
        });

      liked = true;
    }

    const [result] = await tx
      .select({
        total: count(),
      })
      .from(likes)
      .where(eq(likes.postId, postId));

    return {
      liked,
      like_count: result.total,
    };
  });
}
