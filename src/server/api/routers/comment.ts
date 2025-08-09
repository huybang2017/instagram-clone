import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const commentRouter = createTRPCRouter({
  getByPostId: publicProcedure
    .input(
      z.object({
        postId: z.string(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { postId, limit, cursor } = input;

      // Verify post exists
      const post = await ctx.db.post.findUnique({
        where: { id: postId },
        select: { id: true },
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bài đăng không tồn tại",
        });
      }

      // Fetch comments with pagination
      const comments = await ctx.db.comment.findMany({
        where: { postId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
      });

      // Handle pagination
      let nextCursor: string | undefined;
      if (comments.length > limit) {
        const nextItem = comments.pop();
        nextCursor = nextItem?.id;
      }

      return {
        comments,
        nextCursor,
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
        content: z.string().min(1).max(500),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify post exists
      const post = await ctx.db.post.findUnique({
        where: { id: input.postId },
        select: { id: true, userId: true },
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bài đăng không tồn tại",
        });
      }

      // Create comment
      const comment = await ctx.db.comment.create({
        data: {
          content: input.content,
          post: { connect: { id: input.postId } },
          user: { connect: { id: ctx.session.user.id } },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
        },
      });

      // Create notification if commenting on someone else's post
      if (post.userId !== ctx.session.user.id) {
        await ctx.db.notification.create({
          data: {
            notificationType: "COMMENTED",
            message: `${ctx.session.user.name ?? "Someone"} đã bình luận về bài viết của bạn`,
            receiver: { connect: { id: post.userId } },
            sender: { connect: { id: ctx.session.user.id } },
            post: { connect: { id: input.postId } },
          },
        });
      }

      return comment;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        content: z.string().min(1).max(500),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.db.comment.findUnique({
        where: { id: input.id },
      });

      if (!comment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bình luận không tồn tại",
        });
      }

      if (comment.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Không được phép chỉnh sửa bình luận này",
        });
      }

      return ctx.db.comment.update({
        where: { id: input.id },
        data: {
          content: input.content,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.db.comment.findUnique({
        where: { id: input.id },
        include: {
          post: {
            select: { userId: true },
          },
        },
      });

      if (!comment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bình luận không tồn tại",
        });
      }

      // Allow comment deletion by the comment author or the post owner
      if (
        comment.userId !== ctx.session.user.id &&
        comment.post.userId !== ctx.session.user.id
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Không được phép xóa bình luận này",
        });
      }

      return ctx.db.comment.delete({
        where: { id: input.id },
      });
    }),
});
