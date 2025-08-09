import { postRouter } from "~/server/api/routers/post";
import { commentRouter } from "~/server/api/routers/comment";
import { likeRouter } from "~/server/api/routers/like";
import { followRouter } from "~/server/api/routers/follow";
import { storyRouter } from "~/server/api/routers/story";
import { userRouter } from "~/server/api/routers/user";
import { notificationRouter } from "~/server/api/routers/notification";
import { chatRouter } from "~/server/api/routers/chat";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  comment: commentRouter,
  like: likeRouter,
  follow: followRouter,
  story: storyRouter,
  user: userRouter,
  notification: notificationRouter,
  chat: chatRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
