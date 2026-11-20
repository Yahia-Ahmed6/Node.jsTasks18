
import  express  from "express";
import { unlink } from "node:fs/promises";
import { z } from "zod";

import { checkAuth } from "../middleware/checkAuth.js";
import { validateBody } from "../middleware/validateBody.js";
import { uploadImage } from "../middleware/upload.js";
import { createPostSchema } from "../validation-schemas/posts.js";

import {getAllPosts,getPostById,createPost,getPostComments,togglePostLike} from "../queries/post.queries.js";

import {createCommentSchema} from "../validation-schemas/posts.js";
import {createComment} from "../queries/comment.queries.js";
export const postRouter = express.Router();

postRouter.use("/api/posts", checkAuth);

postRouter.get("/api/posts", async (req, res) => {
  const posts = await getAllPosts(req.user.id);
  return res.status(200).json({
    data: posts,
  });
});

postRouter.post("/api/posts",uploadImage("image"),(req, res, next) => {
    const result = createPostSchema.safeParse(req.body);

    if (!result.success) {
      if (req.file) {
        return unlink(req.file.path)
          .then(() => {
            res.status(422).json({
              errors:
                z.treeifyError(result.error).properties ?? {},
            });
          })
          .catch(next);
      }

      return res.status(422).json({
        errors:
          z.treeifyError(result.error).properties ?? {},
      });
    }

    req.body = result.data;
    next();
  },

  async (req, res, next) => {
    try {
      const post = await createPost({
        userId: req.user.id,
        content: req.body.content,
        image: req.file?.filename ?? null,
      });
      return res.status(201).json({
        message: "post created successfully",
        data: post,
      });
    } catch (error) {
      if (req.file) {
        try {
          await unlink(req.file.path);
        } catch (cleanupError) {
          console.error(
            "Image cleanup failed:",
            cleanupError
          );
        }
      }
      next(error);
    }
  }
);

postRouter.get("/api/posts/:id", async (req, res) => {
  const postId = Number(req.params.id);
  if (!Number.isSafeInteger(postId) ||postId <= 0 ||postId > 2147483647) {
    return res.status(404).json({
      error: "post not found",
    });
  }

  const post = await getPostById(postId,req.user.id);

  if (!post) {
    return res.status(404).json({
      error: "post not found",
    });
  }

  const comments = await getPostComments(postId);

  return res.status(200).json({
    data: {
      post,
      comments,
    },
  });
}
);



postRouter.post("/api/posts/:id/comments",validateBody(createCommentSchema),async (req, res) => {
    const postId = Number(req.params.id);

    if (!Number.isSafeInteger(postId) ||postId <= 0 ||postId > 20000000) {
      return res.status(404).json({
        error: "post not found",
      });
    }

    const comment = await createComment({
      postId,
      userId: req.user.id,
      content: req.body.content,
    });

    if (!comment) {
      return res.status(404).json({
        error: "post not found",
      });
    }

    return res.status(201).json({
      message: "comment created successfully",
      data: comment,
    });
  }
);



postRouter.post("/api/posts/:id/like",async (req, res) => {
    const postId = Number(req.params.id);

    if (
      !Number.isSafeInteger(postId) ||
      postId <= 0 ||
      postId > 2147483647
    ) {
      return res.status(404).json({
        error: "post not found",
      });
    }

    const result = await togglePostLike(
      postId,
      req.user.id
    );

    if (!result) {
      return res.status(404).json({
        error: "post not found",
      });
    }

    return res.status(200).json({
      data: result,
    });
  }
);
