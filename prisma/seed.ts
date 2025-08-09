import { PrismaClient, Gender, NotificationType } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

// Configuration
const USERS_COUNT = 20;
const POSTS_PER_USER = 5;
const COMMENTS_PER_POST = 3;
const LIKES_PER_POST = 5;
const STORIES_PER_USER = 2;
const FOLLOWS_PER_USER = 5;
const CHATS_COUNT = 10;
const MESSAGES_PER_CHAT = 10;

// Helper to add random time (up to maxDays in the past)
const randomDate = (maxDays = 30) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * maxDays));
  return date;
};

// Helper to get a random future date (for story expiration)
const getFutureDate = (minHours = 1, maxHours = 24) => {
  const date = new Date();
  const hoursToAdd =
    Math.floor(Math.random() * (maxHours - minHours)) + minHours;
  date.setHours(date.getHours() + hoursToAdd);
  return date;
};

// Helper to get random items from an array
const getRandomItems = (array: any[], count: number) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

async function main() {
  console.log("🌱 Starting seed process...");

  // Clear existing data
  await prisma.verificationToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.message.deleteMany();
  await prisma.chatUser.deleteMany();
  await prisma.chat.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.story.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.postImage.deleteMany();
  await prisma.post.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.log("✅ Database cleared");

  // Create users
  console.log(`Creating ${USERS_COUNT} users...`);
  const users = [];

  for (let i = 0; i < USERS_COUNT; i++) {
    const gender = Math.random() > 0.5 ? Gender.MALE : Gender.FEMALE;
    const firstName = faker.person.firstName(
      gender === Gender.MALE ? "male" : "female",
    );
    const lastName = faker.person.lastName();
    const fullName = `${firstName} ${lastName}`;

    const user = await prisma.user.create({
      data: {
        name: fullName,
        username: faker.internet
          .userName({ firstName, lastName })
          .toLowerCase(),
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        gender,
        bio: faker.lorem.paragraph(),
        image: faker.image.avatar(),
        createdAt: randomDate(60),
        updatedAt: new Date(),
      },
    });

    users.push(user);
  }

  // Create posts with images
  console.log(`Creating posts with images...`);
  const posts = [];

  for (const user of users) {
    const postsCount = Math.floor(Math.random() * POSTS_PER_USER) + 1;

    for (let i = 0; i < postsCount; i++) {
      const post = await prisma.post.create({
        data: {
          caption: Math.random() > 0.2 ? faker.lorem.paragraph() : null,
          location: Math.random() > 0.7 ? faker.location.city() : null,
          createdAt: randomDate(30),
          updatedAt: new Date(),
          userId: user.id,
        },
      });

      posts.push(post);

      // Add 1-3 images to each post
      const imagesCount = Math.floor(Math.random() * 3) + 1;

      for (let j = 0; j < imagesCount; j++) {
        await prisma.postImage.create({
          data: {
            imageUrl: faker.image.url({ width: 1080, height: 1080 }),
            cloudinaryId: faker.string.uuid(),
            postId: post.id,
            userId: user.id,
          },
        });
      }
    }
  }

  // Create comments
  console.log("Creating comments...");

  for (const post of posts) {
    const commentsCount = Math.floor(Math.random() * COMMENTS_PER_POST) + 1;
    const commenters = getRandomItems(users, commentsCount);

    for (const commenter of commenters) {
      if (commenter.id !== post.userId) {
        await prisma.comment.create({
          data: {
            content: faker.lorem.sentence(),
            createdAt: randomDate(15),
            updatedAt: new Date(),
            postId: post.id,
            userId: commenter.id,
          },
        });
      }
    }
  }

  // Create likes
  console.log("Creating likes...");

  for (const post of posts) {
    const likesCount = Math.floor(Math.random() * LIKES_PER_POST) + 1;
    const likers = getRandomItems(users, likesCount);

    for (const liker of likers) {
      if (liker.id !== post.userId) {
        try {
          await prisma.like.create({
            data: {
              createdAt: randomDate(15),
              postId: post.id,
              userId: liker.id,
            },
          });
        } catch (error) {
          // Skip if the user already liked the post
          continue;
        }
      }
    }
  }

  // Create follows
  console.log("Creating follows...");

  for (const user of users) {
    const followsCount = Math.floor(Math.random() * FOLLOWS_PER_USER) + 1;
    const followingUsers = getRandomItems(users, followsCount);

    for (const followingUser of followingUsers) {
      if (followingUser.id !== user.id) {
        try {
          await prisma.follow.create({
            data: {
              createdAt: randomDate(30),
              followerId: user.id,
              followingId: followingUser.id,
              accept: true,
            },
          });
        } catch (error) {
          // Skip if the follow relationship already exists
          continue;
        }
      }
    }
  }

  // Create stories
  console.log("Creating stories...");

  for (const user of users) {
    if (Math.random() > 0.3) {
      // Only 70% of users have stories
      const storiesCount = Math.floor(Math.random() * STORIES_PER_USER) + 1;

      for (let i = 0; i < storiesCount; i++) {
        await prisma.story.create({
          data: {
            imageUrl: faker.image.url({ width: 1080, height: 1920 }),
            text: Math.random() > 0.5 ? faker.lorem.sentence() : null,
            createdAt: randomDate(1), // Stories are recent
            expiresAt: getFutureDate(1, 24), // Expires in 1-24 hours
            userId: user.id,
          },
        });
      }
    }
  }

  // Create notifications
  console.log("Creating notifications...");

  // Follow notifications
  for (const user of users) {
    const follows = await prisma.follow.findMany({
      where: { followingId: user.id },
      take: 5, // Limit to 5 follow notifications per user
    });

    for (const follow of follows) {
      await prisma.notification.create({
        data: {
          notificationType: NotificationType.FOLLOW,
          message: `started following you`,
          isRead: Math.random() > 0.7,
          createdAt: randomDate(7),
          receiverId: user.id,
          senderId: follow.followerId,
        },
      });
    }
  }

  // Like notifications
  for (const post of posts) {
    const likes = await prisma.like.findMany({
      where: { postId: post.id },
      take: 3, // Limit to 3 like notifications per post
    });

    for (const like of likes) {
      await prisma.notification.create({
        data: {
          notificationType: NotificationType.POST_LIKED,
          message: `liked your post`,
          isRead: Math.random() > 0.7,
          createdAt: randomDate(7),
          receiverId: post.userId,
          senderId: like.userId,
          postId: post.id,
        },
      });
    }
  }

  // Comment notifications
  const comments = await prisma.comment.findMany({
    take: 20, // Limit to 20 comment notifications
  });

  for (const comment of comments) {
    const post = await prisma.post.findUnique({
      where: { id: comment.postId },
    });

    if (post && post.userId !== comment.userId) {
      await prisma.notification.create({
        data: {
          notificationType: NotificationType.COMMENTED,
          message: `commented on your post`,
          isRead: Math.random() > 0.7,
          createdAt: randomDate(7),
          receiverId: post.userId,
          senderId: comment.userId,
          postId: post.id,
        },
      });
    }
  }

  // Create chats and messages
  console.log("Creating chats and messages...");

  // Create direct message chats
  for (let i = 0; i < CHATS_COUNT; i++) {
    const chatUsers = getRandomItems(users, 2); // Get 2 random users

    const chat = await prisma.chat.create({
      data: {
        isGroup: false,
        createdAt: randomDate(30),
      },
    });

    // Add users to chat
    for (const user of chatUsers) {
      await prisma.chatUser.create({
        data: {
          chatId: chat.id,
          userId: user.id,
        },
      });
    }

    // Create messages
    const messagesCount = Math.floor(Math.random() * MESSAGES_PER_CHAT) + 5;

    for (let j = 0; j < messagesCount; j++) {
      const sender = chatUsers[j % 2]; // Alternate between the two users

      await prisma.message.create({
        data: {
          messageText: faker.lorem.sentence(),
          createdAt: randomDate(30),
          chatId: chat.id,
          senderId: sender.id,
        },
      });
    }
  }

  // Create 2 group chats
  for (let i = 0; i < 2; i++) {
    const chatUsers = getRandomItems(users, Math.floor(Math.random() * 5) + 3); // 3-7 users

    const chat = await prisma.chat.create({
      data: {
        isGroup: true,
        groupName: faker.lorem.words({ min: 1, max: 3 }),
        groupImage: faker.image.avatar(),
        createdAt: randomDate(30),
      },
    });

    // Add users to chat
    for (const user of chatUsers) {
      await prisma.chatUser.create({
        data: {
          chatId: chat.id,
          userId: user.id,
        },
      });
    }

    // Create messages
    const messagesCount = Math.floor(Math.random() * MESSAGES_PER_CHAT) + 10;

    for (let j = 0; j < messagesCount; j++) {
      const sender = chatUsers[Math.floor(Math.random() * chatUsers.length)]; // Random sender

      await prisma.message.create({
        data: {
          messageText: faker.lorem.sentence(),
          createdAt: randomDate(30),
          chatId: chat.id,
          senderId: sender.id,
        },
      });
    }
  }

  console.log("✅ Seed completed successfully!");
  console.log(`Created: ${USERS_COUNT} users, ${posts.length} posts, and more`);
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
