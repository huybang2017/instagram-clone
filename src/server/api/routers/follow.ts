import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const followRouter = createTRPCRouter({
  getFollowerCount: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.follow.count({
        where: { followingId: input.userId },
      });
    }),

  getFollowingCount: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.follow.count({
        where: { followerId: input.userId },
      });
    }),

  getFollowStatus: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.userId === ctx.session.user.id) {
        return null; // Cannot follow yourself
      }

      const follow = await ctx.db.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: ctx.session.user.id,
            followingId: input.userId,
          },
        },
      });

      return !!follow;
    }),

  toggleFollow: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Không thể follow chính mình",
        });
      }

      // Verify target user exists
      const targetUser = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: { id: true },
      });

      if (!targetUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Người dùng không tồn tại",
        });
      }

      const existingFollow = await ctx.db.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: ctx.session.user.id,
            followingId: input.userId,
          },
        },
      });

      // If already following, unfollow
      if (existingFollow) {
        await ctx.db.follow.delete({
          where: {
            id: existingFollow.id,
          },
        });
        return { following: false };
      }
      // Otherwise, create new follow
      else {
        await ctx.db.follow.create({
          data: {
            follower: { connect: { id: ctx.session.user.id } },
            following: { connect: { id: input.userId } },
          },
        });

        // Create notification for followed user
        await ctx.db.notification.create({
          data: {
            notificationType: "FOLLOW",
            message: `${ctx.session.user.name ?? "Someone"} đã bắt đầu theo dõi bạn`,
            receiver: { connect: { id: input.userId } },
            sender: { connect: { id: ctx.session.user.id } },
          },
        });

        return { following: true };
      }
    }),

  getFollowers: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, userId } = input;

      // Verify user exists
      const user = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Người dùng không tồn tại",
        });
      }

      // Fetch followers with pagination
      const followers = await ctx.db.follow.findMany({
        where: { followingId: userId },
        include: {
          follower: {
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
      if (followers.length > limit) {
        const nextItem = followers.pop();
        nextCursor = nextItem?.id;
      }

      // Check if authenticated user follows these followers
      let followStatus: Record<string, boolean> = {};

      if (ctx.session?.user?.id) {
        const followerIds = followers
          .map((follow) => follow.follower.id)
          .filter((id) => ctx.session?.user?.id && id !== ctx.session.user.id); // Exclude self

        if (followerIds.length > 0) {
          const follows = await ctx.db.follow.findMany({
            where: {
              followerId: ctx.session.user.id,
              followingId: {
                in: followerIds,
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
        followers: followers.map((follow) => ({
          ...follow.follower,
          isFollowing: !!followStatus[follow.follower.id],
        })),
        nextCursor,
      };
    }),

  getFollowing: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, userId } = input;

      // Verify user exists
      const user = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Người dùng không tồn tại",
        });
      }

      // Fetch following with pagination
      const following = await ctx.db.follow.findMany({
        where: { followerId: userId },
        include: {
          following: {
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
      if (following.length > limit) {
        const nextItem = following.pop();
        nextCursor = nextItem?.id;
      }

      // Check if authenticated user follows these users
      let followStatus: Record<string, boolean> = {};

      if (ctx.session?.user?.id && ctx.session.user.id !== userId) {
        const followingIds = following
          .map((follow) => follow.following.id)
          .filter((id) => ctx.session?.user?.id && id !== ctx.session.user.id); // Exclude self

        if (followingIds.length > 0) {
          const follows = await ctx.db.follow.findMany({
            where: {
              followerId: ctx.session.user.id,
              followingId: {
                in: followingIds,
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
      } else if (ctx.session?.user?.id === userId) {
        // If viewing own following list, all are followed
        followStatus = following.reduce(
          (acc, follow) => {
            acc[follow.following.id] = true;
            return acc;
          },
          {} as Record<string, boolean>,
        );
      }

      return {
        following: following.map((follow) => ({
          ...follow.following,
          isFollowing: !!followStatus[follow.following.id],
        })),
        nextCursor,
      };
    }),
});
