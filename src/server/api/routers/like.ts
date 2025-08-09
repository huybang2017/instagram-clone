import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const likeRouter = createTRPCRouter({
  getLikeCount: publicProcedure
    .input(z.object({ postId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.like.count({
        where: { postId: input.postId },
      });
    }),

  getLikeStatus: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .query(async ({ ctx, input }) => {
      const like = await ctx.db.like.findUnique({
        where: {
          postId_userId: {
            postId: input.postId,
            userId: ctx.session.user.id,
          },
        },
      });

      return !!like;
    }),

  toggleLike: protectedProcedure
    .input(z.object({ postId: z.string() }))
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

      const existingLike = await ctx.db.like.findUnique({
        where: {
          postId_userId: {
            postId: input.postId,
            userId: ctx.session.user.id,
          },
        },
      });

      // If already liked, remove like
      if (existingLike) {
        await ctx.db.like.delete({
          where: {
            id: existingLike.id,
          },
        });
        return { liked: false };
      }
      // Otherwise, create new like
      else {
        await ctx.db.like.create({
          data: {
            post: { connect: { id: input.postId } },
            user: { connect: { id: ctx.session.user.id } },
          },
        });

        // Create notification for post owner (if not liking own post)
        if (post.userId !== ctx.session.user.id) {
          await ctx.db.notification.create({
            data: {
              notificationType: "POST_LIKED",
              message: `${ctx.session.user.name ?? "Someone"} đã thích bài viết của bạn`,
              receiver: { connect: { id: post.userId } },
              sender: { connect: { id: ctx.session.user.id } },
              post: { connect: { id: input.postId } },
            },
          });
        }

        return { liked: true };
      }
    }),

  getLikesByPostId: publicProcedure
    .input(
      z.object({
        postId: z.string(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, postId } = input;

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

      // Fetch likes with pagination
      const likes = await ctx.db.like.findMany({
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
      if (likes.length > limit) {
        const nextItem = likes.pop();
        nextCursor = nextItem?.id;
      }

      // Check if current user follows each of these users
      let followStatus: Record<string, boolean> = {};

      if (ctx.session?.user?.id) {
        const userIds = likes
          .map((like) => like.user.id)
          .filter((id) => ctx.session?.user?.id && id !== ctx.session.user.id); // Exclude self

        if (userIds.length > 0) {
          const follows = await ctx.db.follow.findMany({
            where: {
              followerId: ctx.session.user.id,
              followingId: {
                in: userIds,
              },
            },
            select: {
              followingId: true,
            },
          });

          followStatus = follows.reduce(
            (acc, follow) => {
              acc[follow.followingId] = true;
              return acc;
            },
            {} as Record<string, boolean>,
          );
        }
      }

      return {
        likes: likes.map((like) => ({
          ...like,
          user: {
            ...like.user,
            isFollowing: !!followStatus[like.user.id],
          },
        })),
        nextCursor,
      };
    }),
});
