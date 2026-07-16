import { prisma } from "../../config/prisma.js";

export async function togglePostLike(postId: string, userId: string) {
  // Check if like exists
  const existing = await prisma.like.findUnique({
    where: { user_id_post_id: { user_id: userId, post_id: postId } },
  });

  if (existing) {
    // Unlike
    await prisma.like.delete({ where: { id: existing.id } });
    return { liked: false };
  } else {
    // Like
    await prisma.like.create({
      data: { user_id: userId, post_id: postId },
    });
    return { liked: true };
  }
}

export async function toggleCommentLike(commentId: string, userId: string) {
  const existing = await prisma.like.findUnique({
    where: { user_id_comment_id: { user_id: userId, comment_id: commentId } },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    return { liked: false };
  } else {
    await prisma.like.create({
      data: { user_id: userId, comment_id: commentId },
    });
    return { liked: true };
  }
}

export async function getPostLikeCount(postId: string) {
  return prisma.like.count({ where: { post_id: postId } });
}

export async function getCommentLikeCount(commentId: string) {
  return prisma.like.count({ where: { comment_id: commentId } });
}

export async function hasUserLikedPost(postId: string, userId: string) {
  const like = await prisma.like.findUnique({
    where: { user_id_post_id: { user_id: userId, post_id: postId } },
  });
  return !!like;
}

export async function hasUserLikedComment(commentId: string, userId: string) {
  const like = await prisma.like.findUnique({
    where: { user_id_comment_id: { user_id: userId, comment_id: commentId } },
  });
  return !!like;
}
