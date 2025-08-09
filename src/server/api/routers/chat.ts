import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const chatRouter = createTRPCRouter({
  getMyChats: protectedProcedure
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

      // Find chats where the current user is a participant
      const chatUsers = await ctx.db.chatUser.findMany({
        where: {
          userId: ctx.session.user.id,
        },
        select: {
          chatId: true,
        },
      });

      const chatIds = chatUsers.map((cu) => cu.chatId);

      // Fetch chats with pagination
      const chats = await ctx.db.chat.findMany({
        where: {
          id: {
            in: chatIds,
          },
        },
        include: {
          users: {
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
          },
          messages: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
        },
        orderBy: [
          {
            messages: {
              _count: "desc",
            },
          },
          {
            createdAt: "desc",
          },
        ],
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
      });

      // Handle pagination
      let nextCursor: string | undefined;
      if (chats.length > limit) {
        const nextItem = chats.pop();
        nextCursor = nextItem?.id;
      }

      // Format chat data for client
      const formattedChats = chats.map((chat) => {
        // For 1:1 chats, get the other user's info
        let chatName = chat.groupName;
        let chatImage = chat.groupImage;

        if (!chat.isGroup) {
          const otherUser = chat.users.find(
            (cu) => cu.user.id !== ctx.session.user.id,
          )?.user;

          if (otherUser) {
            chatName = otherUser.name ?? otherUser.username ?? "User";
            chatImage = otherUser.image;
          }
        }

        // Get latest message preview
        const latestMessage = chat.messages[0];

        return {
          id: chat.id,
          name: chatName,
          image: chatImage,
          isGroup: chat.isGroup,
          participants: chat.users.map((u) => u.user),
          latestMessage: latestMessage
            ? {
                id: latestMessage.id,
                text:
                  latestMessage.messageText.length > 30
                    ? `${latestMessage.messageText.substring(0, 30)}...`
                    : latestMessage.messageText,
                senderId: latestMessage.senderId,
                senderUsername: latestMessage.sender.username,
                createdAt: latestMessage.createdAt,
                isOwnMessage: latestMessage.senderId === ctx.session.user.id,
              }
            : null,
          createdAt: chat.createdAt,
        };
      });

      return {
        chats: formattedChats,
        nextCursor,
      };
    }),

  getChat: protectedProcedure
    .input(z.object({ chatId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify current user is a participant of this chat
      const chatUser = await ctx.db.chatUser.findUnique({
        where: {
          chatId_userId: {
            chatId: input.chatId,
            userId: ctx.session.user.id,
          },
        },
      });

      if (!chatUser) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Bạn không phải là thành viên của cuộc trò chuyện này",
        });
      }

      // Fetch chat with participants
      const chat = await ctx.db.chat.findUnique({
        where: { id: input.chatId },
        include: {
          users: {
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
          },
        },
      });

      if (!chat) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cuộc trò chuyện không tồn tại",
        });
      }

      // Format chat for client
      let chatName = chat.groupName;
      let chatImage = chat.groupImage;

      if (!chat.isGroup) {
        const otherUser = chat.users.find(
          (cu) => cu.user.id !== ctx.session.user.id,
        )?.user;

        if (otherUser) {
          chatName = otherUser.name ?? otherUser.username ?? "User";
          chatImage = otherUser.image;
        }
      }

      return {
        id: chat.id,
        name: chatName,
        image: chatImage,
        isGroup: chat.isGroup,
        participants: chat.users.map((u) => u.user),
        createdAt: chat.createdAt,
      };
    }),

  getMessages: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { chatId, limit, cursor } = input;

      // Verify current user is a participant of this chat
      const chatUser = await ctx.db.chatUser.findUnique({
        where: {
          chatId_userId: {
            chatId,
            userId: ctx.session.user.id,
          },
        },
      });

      if (!chatUser) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Bạn không phải là thành viên của cuộc trò chuyện này",
        });
      }

      // Fetch messages with pagination
      const messages = await ctx.db.message.findMany({
        where: { chatId },
        include: {
          sender: {
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
      if (messages.length > limit) {
        const nextItem = messages.pop();
        nextCursor = nextItem?.id;
      }

      return {
        messages: messages.map((message) => ({
          ...message,
          isOwnMessage: message.senderId === ctx.session.user.id,
        })),
        nextCursor,
      };
    }),

  createDirectChat: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
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

      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Không thể tạo cuộc trò chuyện với chính mình",
        });
      }

      // Check if a chat already exists between these users
      const existingChatUsers = await ctx.db.chatUser.findMany({
        where: {
          userId: {
            in: [ctx.session.user.id, input.userId],
          },
        },
        include: {
          chat: {
            include: {
              users: {
                select: {
                  userId: true,
                },
              },
            },
          },
        },
      });

      // Group by chatId
      const chatsByIdMap = existingChatUsers.reduce<
        Record<
          string,
          {
            chatId: string;
            userIds: string[];
            isGroup: boolean;
          }
        >
      >(
        (acc, cu) => {
          const chatId = cu.chatId;

          if (!acc[chatId]) {
            acc[chatId] = {
              chatId: chatId,
              userIds: [],
              isGroup: cu.chat.isGroup,
            };

            const uniqueUserIds = [
              ...new Set(cu.chat.users.map((u) => u.userId)),
            ];
            acc[chatId].userIds = uniqueUserIds;
          }

          return acc;
        },
        {} as Record<
          string,
          {
            chatId: string;
            userIds: string[];
            isGroup: boolean;
          }
        >,
      );

      const chatValues = Object.values(chatsByIdMap);
      for (const chat of chatValues) {
        if (
          !chat.isGroup &&
          chat.userIds.includes(ctx.session.user.id) &&
          chat.userIds.includes(input.userId) &&
          chat.userIds.length === 2
        ) {
          // Return existing chat
          return { chatId: chat.chatId, isNew: false };
        }
      }

      // Create new chat if none exists
      const newChat = await ctx.db.chat.create({
        data: {
          isGroup: false,
          users: {
            create: [
              { user: { connect: { id: ctx.session.user.id } } },
              { user: { connect: { id: input.userId } } },
            ],
          },
        },
      });

      return { chatId: newChat.id, isNew: true };
    }),

  createGroupChat: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(50),
        image: z.string().optional(),
        userIds: z.array(z.string()).min(2).max(20),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { name, image, userIds } = input;

      // Always include current user
      if (!userIds.includes(ctx.session.user.id)) {
        userIds.push(ctx.session.user.id);
      }

      // Verify all users exist
      const users = await ctx.db.user.findMany({
        where: {
          id: {
            in: userIds,
          },
        },
        select: { id: true },
      });

      if (users.length !== userIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Một hoặc nhiều người dùng không tồn tại",
        });
      }

      // Create group chat
      const chat = await ctx.db.chat.create({
        data: {
          isGroup: true,
          groupName: name,
          groupImage: image,
          users: {
            create: userIds.map((userId) => ({
              user: { connect: { id: userId } },
            })),
          },
        },
      });

      return { chatId: chat.id };
    }),

  sendMessage: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
        text: z.string().min(1).max(1000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { chatId, text } = input;

      // Verify current user is a participant of this chat
      const chatUser = await ctx.db.chatUser.findUnique({
        where: {
          chatId_userId: {
            chatId,
            userId: ctx.session.user.id,
          },
        },
      });

      if (!chatUser) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Bạn không phải là thành viên của cuộc trò chuyện này",
        });
      }

      // Create message
      const message = await ctx.db.message.create({
        data: {
          messageText: text,
          chat: { connect: { id: chatId } },
          sender: { connect: { id: ctx.session.user.id } },
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
        },
      });

      return {
        ...message,
        isOwnMessage: true,
      };
    }),

  leaveGroupChat: protectedProcedure
    .input(z.object({ chatId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify chat exists and is a group chat
      const chat = await ctx.db.chat.findUnique({
        where: { id: input.chatId },
        select: { id: true, isGroup: true },
      });

      if (!chat) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cuộc trò chuyện không tồn tại",
        });
      }

      if (!chat.isGroup) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Không thể rời khỏi cuộc trò chuyện 1:1",
        });
      }

      // Remove user from chat
      await ctx.db.chatUser.delete({
        where: {
          chatId_userId: {
            chatId: input.chatId,
            userId: ctx.session.user.id,
          },
        },
      });

      return { success: true };
    }),
});
