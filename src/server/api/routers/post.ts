import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const postRouter = createTRPCRouter({
  feed: publicProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(50).default(20),
          cursor: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;
      const cursor = input?.cursor;

      const posts = await ctx.db.post.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
        },
      });

      // Handle pagination
      let nextCursor: string | undefined;
      if (posts.length > limit) {
        const nextItem = posts.pop();
        nextCursor = nextItem?.id;
      }

      // Fetch images for all posts in a single query
      const postIds = posts.map((post) => post.id);
      const postImages = await ctx.db.postImage.findMany({
        where: {
          postId: {
            in: postIds,
          },
        },
      });

      // Group images by postId
      const imagesByPostId = postImages.reduce(
        (acc, image) => {
          acc[image.postId] ??= [];
          (acc[image.postId] ??= []).push(image);
          return acc;
        },
        {} as Record<string, typeof postImages>,
      );

      // Add like status if user is authenticated
      let userLikes: Record<string, boolean> = {};

      if (ctx.session?.user?.id) {
        const likes = await ctx.db.like.findMany({
          where: {
            userId: ctx.session.user.id,
            postId: {
              in: postIds,
            },
          },
          select: {
            postId: true,
          },
        });

        userLikes = likes.reduce(
          (acc, like) => {
            acc[like.postId] = true;
            return acc;
          },
          {} as Record<string, boolean>,
        );
      }

      // Merge images and like status with posts
      return {
        posts: posts.map((post) => ({
          ...post,
          images: imagesByPostId[post.id] ?? [],
          isLiked: !!userLikes[post.id],
        })),
        nextCursor,
      };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Fetch the post without images first
      const post = await ctx.db.post.findUnique({
        where: { id: input.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
        },
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bài đăng không tồn tại",
        });
      }

      // Fetch the images separately
      const postImages = await ctx.db.postImage.findMany({
        where: {
          postId: input.id,
        },
      });

      // Fetch comments for the post
      const comments = await ctx.db.comment.findMany({
        where: {
          postId: input.id,
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
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      });

      // Check if authenticated user liked the post
      let isLiked = false;
      if (ctx.session?.user?.id) {
        const like = await ctx.db.like.findUnique({
          where: {
            postId_userId: {
              postId: input.id,
              userId: ctx.session.user.id,
            },
          },
        });
        isLiked = !!like;
      }

      // Return the post with images, comments, and like status
      return {
        ...post,
        images: postImages,
        comments,
        isLiked,
      };
    }),

  getByUserId: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { userId, limit, cursor } = input;

      // Fetch posts with pagination
      const posts = await ctx.db.post.findMany({
        where: { userId },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
        },
      });

      // Handle pagination
      let nextCursor: string | undefined;
      if (posts.length > limit) {
        const nextItem = posts.pop();
        nextCursor = nextItem?.id;
      }

      // Fetch all post images for these posts
      const postIds = posts.map((post) => post.id);
      const postImages = await ctx.db.postImage.findMany({
        where: {
          postId: {
            in: postIds,
          },
        },
      });

      const imagesByPostId = postImages.reduce(
        (acc, image) => {
          acc[image.postId] ??= [];
          (acc[image.postId] ??= []).push(image);
          return acc;
        },
        {} as Record<string, typeof postImages>,
      );

      return {
        posts: posts.map((post) => ({
          ...post,
          images: imagesByPostId[post.id] ?? [],
        })),
        nextCursor,
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        caption: z.string().optional(),
        location: z.string().optional(),
        images: z
          .array(
            z.object({
              url: z.string(),
              cloudinaryId: z.string().optional(),
            }),
          )
          .min(1)
          .max(10),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Create post first
      const post = await ctx.db.post.create({
        data: {
          caption: input.caption,
          location: input.location,
          user: { connect: { id: ctx.session.user.id } },
        },
      });

      // Create all post images in a transaction
      const postImages = await ctx.db.$transaction(
        input.images.map((img) =>
          ctx.db.postImage.create({
            data: {
              imageUrl: img.url,
              cloudinaryId: img.cloudinaryId,
              post: { connect: { id: post.id } },
              user: { connect: { id: ctx.session.user.id } },
            },
          }),
        ),
      );

      // Return post with the newly created images
      return {
        ...post,
        images: postImages,
      };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.db.post.findUnique({
        where: { id: input.id },
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bài đăng không tồn tại",
        });
      }

      if (post.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Không được phép xóa bài đăng này",
        });
      }

      return ctx.db.post.delete({
        where: { id: input.id },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        caption: z.string().optional(),
        location: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.db.post.findUnique({
        where: { id: input.id },
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bài đăng không tồn tại",
        });
      }

      if (post.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Không được phép cập nhật bài đăng này",
        });
      }

      return ctx.db.post.update({
        where: { id: input.id },
        data: {
          caption: input.caption,
          location: input.location,
        },
      });
    }),
});
