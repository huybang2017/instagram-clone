import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          bio: true,
          gender: true,
          createdAt: true,
          _count: {
            select: {
              posts: true,
              followers: true,
              following: true,
            },
          },
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Người dùng không tồn tại",
        });
      }

      // Check if current user is following this user
      let isFollowing = false;
      if (ctx.session?.user?.id && ctx.session.user.id !== input.id) {
        const follow = await ctx.db.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: ctx.session.user.id,
              followingId: input.id,
            },
          },
        });
        isFollowing = !!follow;
      }

      return {
        ...user,
        isFollowing,
      };
    }),

  searchUsers: publicProcedure
    .input(
      z.object({
        query: z.string(),
        limit: z.number().min(1).max(50).default(10),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { query, limit, cursor } = input;

      const users = await ctx.db.user.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { username: { contains: query } },
          ],
        },
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          bio: true,
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          username: "asc",
        },
      });

      // Handle pagination
      let nextCursor: string | undefined;
      if (users.length > limit) {
        const nextItem = users.pop();
        nextCursor = nextItem?.id;
      }

      return {
        users,
        nextCursor,
      };
    }),

  getSuggestions: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(20).default(5),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 5;
      const userId = ctx.session.user.id;

      // Get users that the current user is following
      const following = await ctx.db.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });

      const followingIds = following.map((f) => f.followingId);
      followingIds.push(userId); // Add current user to exclude list

      // Find users not being followed by current user
      const suggestions = await ctx.db.user.findMany({
        where: {
          id: {
            notIn: followingIds,
          },
        },
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          _count: {
            select: {
              followers: true,
            },
          },
        },
        orderBy: [
          {
            followers: {
              _count: "desc",
            },
          },
          {
            createdAt: "desc",
          },
        ],
        take: limit,
      });

      return suggestions;
    }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        username: z.string().min(3).max(30).optional(),
        bio: z.string().max(150).optional(),
        image: z.string().optional(),
        gender: z.enum(["MALE", "FEMALE"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if username is already taken
      if (input.username) {
        const existingUser = await ctx.db.user.findUnique({
          where: {
            username: input.username,
            NOT: {
              id: ctx.session.user.id,
            },
          },
        });

        if (existingUser) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Tên người dùng đã được sử dụng",
          });
        }
      }

      return ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          name: input.name,
          username: input.username,
          bio: input.bio,
          image: input.image,
          gender: input.gender,
        },
      });
    }),

  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        bio: true,
        gender: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
    });
  }),
});
