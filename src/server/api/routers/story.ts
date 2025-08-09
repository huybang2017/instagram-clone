import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { add24Hours } from "~/lib/utils";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const storyRouter = createTRPCRouter({
  getActiveStories: publicProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(50).default(20),
          cursor: z.string().optional(), // cursor = last userId from previous page
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;
      const cursor = input?.cursor;
      const now = new Date();

      let followingIds: string[] = [];
      if (ctx.session?.user?.id) {
        const following = await ctx.db.follow.findMany({
          where: { followerId: ctx.session.user.id },
          select: { followingId: true },
        });
        followingIds = following.map((f) => f.followingId);
      }

      const where = ctx.session?.user?.id
        ? {
            expiresAt: { gt: now },
            OR: [
              { userId: { in: followingIds } },
              { userId: ctx.session.user.id },
            ],
          }
        : { expiresAt: { gt: now } };

      const stories = await ctx.db.story.findMany({
        where,
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
      });

      // Group stories by user
      const storyByUser = stories.reduce(
        (acc, story) => {
          const userId = story.userId;
          acc[userId] ??= {
            user: story.user,
            stories: [],
          };
          acc[userId]?.stories.push(story);
          return acc;
        },
        {} as Record<
          string,
          { user: (typeof stories)[number]["user"]; stories: typeof stories }
        >,
      );

      const sortedUserStories = Object.values(storyByUser).sort((a, b) => {
        const latestA = a.stories.length
          ? Math.max(...a.stories.map((s) => s.createdAt.getTime()))
          : 0;
        const latestB = b.stories.length
          ? Math.max(...b.stories.map((s) => s.createdAt.getTime()))
          : 0;
        return latestB - latestA;
      });

      // Cursor pagination over users
      let startIndex = 0;
      if (cursor) {
        const idx = sortedUserStories.findIndex((u) => u.user.id === cursor);
        if (idx >= 0) startIndex = idx + 1;
      }

      const pageItems = sortedUserStories.slice(startIndex, startIndex + limit);
      const hasMore = startIndex + limit < sortedUserStories.length;
      const nextCursor = hasMore
        ? pageItems[pageItems.length - 1]?.user.id
        : undefined;

      return {
        stories: pageItems,
        nextCursor,
      };
    }),

  getUserStories: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const now = new Date();

      // Verify user exists
      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: { id: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Người dùng không tồn tại",
        });
      }

      return ctx.db.story.findMany({
        where: {
          userId: input.userId,
          expiresAt: { gt: now },
        },
        orderBy: { createdAt: "asc" },
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

  create: protectedProcedure
    .input(
      z.object({
        imageUrl: z.string().min(1),
        text: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.story.create({
        data: {
          imageUrl: input.imageUrl,
          text: input.text,
          expiresAt: add24Hours(new Date()),
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
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const story = await ctx.db.story.findUnique({
        where: { id: input.id },
      });

      if (!story) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Story không tồn tại",
        });
      }

      if (story.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Không được phép xóa story này",
        });
      }

      return ctx.db.story.delete({
        where: { id: input.id },
      });
    }),

  getMyStories: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();

    return ctx.db.story.findMany({
      where: {
        userId: ctx.session.user.id,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: "desc" },
    });
  }),
});
