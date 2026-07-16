import { prisma } from "../../config/prisma.js";
import type { CreateCommentInput, UpdateCommentInput, CommentQueryInput } from "./comment.schema.js";

const safeCommentSelect = {
  id: true,
  content: true,
  parent_id: true,
  created_at: true,
  updated_at: true,
  author: {
    select: { id: true, full_name: true, avatar: { select: { id: true, key: true } } },
  },
  _count: { select: { likes: true, replies: true } },
};

export async function createComment(postId: string, authorId: string, input: CreateCommentInput) {
  // Verify post exists
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new Error("POST_NOT_FOUND");
  if (post.deleted_at) throw new Error("POST_NOT_FOUND");

  // If replying to a comment, verify parent exists
  if (input.parent_id) {
    const parent = await prisma.comment.findUnique({ where: { id: input.parent_id } });
    if (!parent || parent.post_id !== postId) throw new Error("PARENT_NOT_FOUND");
  }

  const comment = await prisma.comment.create({
    data: {
      post_id: postId,
      author_id: authorId,
      content: input.content,
      parent_id: input.parent_id || null,
    },
    select: safeCommentSelect,
  });

  return comment;
}

export async function getCommentsByPost(postId: string, query: CommentQueryInput) {
  const { page, limit } = query;
  const skip = (page - 1) * limit;

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where: { post_id: postId, deleted_at: null, parent_id: null },
      select: safeCommentSelect,
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
    }),
    prisma.comment.count({
      where: { post_id: postId, deleted_at: null, parent_id: null },
    }),
  ]);

  // Fetch replies for each comment (top 3)
  const commentsWithReplies = await Promise.all(
    comments.map(async (comment) => {
      const replies = await prisma.comment.findMany({
        where: { parent_id: comment.id, deleted_at: null },
        select: safeCommentSelect,
        orderBy: { created_at: "asc" },
        take: 3,
      });
      const replyCount = await prisma.comment.count({
        where: { parent_id: comment.id, deleted_at: null },
      });
      return { ...comment, replies, reply_count: replyCount };
    }),
  );

  return {
    data: commentsWithReplies,
    meta: {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    },
  };
}

export async function updateComment(commentId: string, authorId: string, input: UpdateCommentInput) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new Error("NOT_FOUND");
  if (comment.author_id !== authorId) throw new Error("FORBIDDEN");

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: { content: input.content },
    select: safeCommentSelect,
  });

  return updated;
}

export async function deleteComment(commentId: string, authorId: string) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new Error("NOT_FOUND");
  if (comment.author_id !== authorId) throw new Error("FORBIDDEN");

  await prisma.comment.update({
    where: { id: commentId },
    data: { deleted_at: new Date() },
  });
}

export async function getReplies(commentId: string, query: CommentQueryInput) {
  const { page, limit } = query;
  const skip = (page - 1) * limit;

  const [replies, total] = await Promise.all([
    prisma.comment.findMany({
      where: { parent_id: commentId, deleted_at: null },
      select: safeCommentSelect,
      orderBy: { created_at: "asc" },
      skip,
      take: limit,
    }),
    prisma.comment.count({
      where: { parent_id: commentId, deleted_at: null },
    }),
  ]);

  return {
    data: replies,
    meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
  };
}
