import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Bookmark, Contact, Grid3X3, MenuSquare, Square } from "lucide-react";

import { Navbar } from "~/app/_components/navbar";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { api, HydrateClient } from "~/trpc/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";

interface ProfilePageProps {
  params: {
    id: string;
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const session = await auth();
  const { id } = params;

  try {
    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        bio: true,
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
      console.error(`User with ID ${id} not found`);
      return notFound();
    }

    // Truy vấn bài viết của người dùng
    const posts = await db.post.findMany({
      where: { userId: id },
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

    // Fetch post images separately
    const postIds = posts.map((post) => post.id);
    const postImages = await db.postImage.findMany({
      where: {
        postId: {
          in: postIds,
        },
      },
    });

    // Group images by postId
    const imagesByPostId = postImages.reduce(
      (acc, image) => {
        if (!acc[image.postId]) {
          acc[image.postId] = [];
        }
        acc[image.postId].push(image);
        return acc;
      },
      {} as Record<string, typeof postImages>,
    );

    // Merge images with posts
    const postsWithImages = posts.map((post) => ({
      ...post,
      images: imagesByPostId[post.id] || [],
      // Add a convenience property for the first image URL or a placeholder
      primaryImageUrl:
        imagesByPostId[post.id]?.[0]?.imageUrl ||
        "https://placehold.co/600x600/black/white?text=No+Image",
    }));

    const isCurrentUser = session?.user?.id === id;

    let followStatus = null;
    if (session?.user && !isCurrentUser) {
      await api.follow.getFollowStatus.prefetch({ userId: id });
    }

    // Story highlights based on the image
    const storyHighlights = [
      { id: 1, title: "", image: "https://via.placeholder.com/65" },
      { id: 2, title: "", image: "https://via.placeholder.com/65" },
      { id: 3, title: "", image: "https://via.placeholder.com/65" },
      { id: 4, title: "", image: "https://via.placeholder.com/65" },
      { id: 5, title: "", image: "https://via.placeholder.com/65" },
      { id: 6, title: "", image: "https://via.placeholder.com/65" },
      { id: 7, title: "", image: "https://via.placeholder.com/65" },
    ];

    return (
      <div className="flex h-screen bg-black text-white">
        {/* Sidebar - fixed on the left */}
        <Navbar user={session?.user} />

        {/* Main content area */}
        <div className="ml-16 flex-1 overflow-y-auto md:ml-64">
          {/* Profile header */}
          <div className="mx-auto max-w-[935px] px-4 pt-6">
            <div className="flex items-center justify-start gap-20">
              {/* Avatar */}
              <div className="gap mb-6 flex items-center justify-center">
                <div className="relative h-[150px] w-[150px]">
                  <Avatar className="h-full w-full">
                    <AvatarImage
                      src={
                        user.image ??
                        "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=500&h=500&fit=crop"
                      }
                      alt="Profile picture"
                      className="object-cover"
                    />
                    <AvatarFallback>123</AvatarFallback>
                  </Avatar>
                </div>
              </div>

              {/* User info */}
              <div className="flex-1">
                {/* Username and action buttons */}
                <div className="mb-5 flex flex-col md:flex-row md:items-center">
                  <h2 className="mb-4 text-center text-xl font-normal md:mb-0 md:text-left">
                    pzunnee
                  </h2>

                  <div className="flex justify-center space-x-2 md:ml-4 md:justify-start">
                    {isCurrentUser ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-md border-neutral-700 bg-transparent text-sm font-medium hover:bg-neutral-800"
                      >
                        Chỉnh sửa trang cá nhân
                      </Button>
                    ) : (
                      <>
                        <Button className="rounded-md bg-blue-500 text-sm font-medium hover:bg-blue-600">
                          Theo dõi
                        </Button>
                        <Button
                          variant="outline"
                          className="rounded-md border-neutral-700 bg-transparent text-sm font-medium hover:bg-neutral-800"
                        >
                          Nhắn tin
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="mb-5 flex justify-center space-x-10 md:justify-start">
                  <div>
                    <span className="font-semibold">36</span>
                    <span className="ml-1">posts</span>
                  </div>
                  <div>
                    <span className="font-semibold">611</span>
                    <span className="ml-1">followers</span>
                  </div>
                  <div>
                    <span className="font-semibold">236</span>
                    <span className="ml-1">following</span>
                  </div>
                </div>

                {/* Bio */}
                <div className="text-center md:text-left">
                  <div className="font-semibold">Mi Mi</div>
                  <div className="flex items-center justify-center text-sm md:justify-start md:text-left">
                    <span className="mr-1 inline-block">🔴</span>
                    <span>pzunnee</span>
                  </div>
                  <div className="text-sm">cọng chưa ngủ 15 tiếng 🌹</div>
                  <div className="text-sm">stitch & bé mèo</div>
                  <div className="text-sm">since 2004❤️</div>
                  <div className="text-sm">@prv.meobibi</div>
                  <div className="text-sm text-blue-500">
                    www.instagram.com/young_wolf_2554?igsh=W1ZhG0JOazZCDl4
                  </div>
                  <div className="mt-2 text-xs text-neutral-400">
                    Followed by prv.meobibi
                  </div>
                </div>
              </div>
            </div>

            {/* Story highlights */}
            <div className="hide-scrollbar overflow-x-auto pb-8">
              <div className="flex space-x-4">
                {storyHighlights.map((story) => (
                  <div key={story.id} className="flex flex-col items-center">
                    <div className="flex h-[65px] w-[65px] items-center justify-center overflow-hidden rounded-full border border-neutral-700">
                      <Image
                        src={story.image}
                        alt=""
                        width={65}
                        height={65}
                        className="object-cover"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Post/Tagged navigation */}
            <div className="border-t border-neutral-800">
              <div className="mx-auto w-1/2">
                <div className="flex justify-between">
                  <button className="-mt-px flex items-center border-t border-white px-4 py-2 text-xs font-semibold">
                    <Grid3X3 className="mr-1 h-6 w-6" />
                  </button>
                  <button className="flex items-center px-4 py-2 text-xs font-semibold text-neutral-500">
                    <Bookmark className="mr-1 h-6 w-6" />
                  </button>
                  <button className="flex items-center px-4 py-2 text-xs font-semibold text-neutral-500">
                    <Contact className="mr-1 h-6 w-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* Posts grid */}
            <div className="mt-1 grid grid-cols-3 gap-1">
              {postsWithImages.map((post) => (
                <Link
                  key={post.id}
                  href={`/post/${post.id}`}
                  className="relative aspect-square bg-neutral-800"
                >
                  <Image
                    src={post.primaryImageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 33vw, 300px"
                    className="object-cover"
                  />
                </Link>
              ))}
            </div>

            {/* Empty state */}
            {posts.length === 0 && (
              <div className="py-20 text-center">
                <div className="mb-6 flex justify-center">
                  <div className="rounded-full border-2 border-white p-6">
                    <svg
                      className="h-12 w-12"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 15.75C14.0711 15.75 15.75 14.0711 15.75 12C15.75 9.92893 14.0711 8.25 12 8.25C9.92893 8.25 8.25 9.92893 8.25 12C8.25 14.0711 9.92893 15.75 12 15.75Z"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeMiterlimit="10"
                      />
                      <path
                        d="M16.5 4.5H7.5C5.84315 4.5 4.5 5.84315 4.5 7.5V16.5C4.5 18.1569 5.84315 19.5 7.5 19.5H16.5C18.1569 19.5 19.5 18.1569 19.5 16.5V7.5C19.5 5.84315 18.1569 4.5 16.5 4.5Z"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M17.25 8.25C17.6642 8.25 18 7.91421 18 7.5C18 7.08579 17.6642 6.75 17.25 6.75C16.8358 6.75 16.5 7.08579 16.5 7.5C16.5 7.91421 16.8358 8.25 17.25 8.25Z"
                        fill="white"
                      />
                    </svg>
                  </div>
                </div>
                <h2 className="mb-2 text-2xl font-normal">Chia sẻ bức ảnh</h2>
                <p className="mb-6 text-neutral-400">
                  Khi bạn chia sẻ ảnh, chúng sẽ xuất hiện trên trang cá nhân của
                  bạn.
                </p>
                {isCurrentUser && (
                  <Link href="/create">
                    <Button className="bg-blue-500 hover:bg-blue-600">
                      Chia sẻ bức ảnh đầu tiên
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Profile page error:", error);
    return notFound();
  }
}

// function ProfileActionButtons({ userId }: { userId: string }) {
//   return (
//     <HydrateClient>
//       <ProfileActionButtonsClient userId={userId} />
//     </HydrateClient>
//   );
// }

// function ProfileActionButtonsClient({ userId }: { userId: string }) {
//   const utils = api.useUtils();

//   const { data: followStatus, isLoading } = api.follow.getFollowStatus.useQuery(
//     { userId },
//   );

//   const { mutate: toggleFollow, isPending } =
//     api.follow.toggleFollow.useMutation({
//       onSuccess: () => {
//         void utils.follow.getFollowStatus.invalidate({ userId });
//       },
//     });

//   const handleToggleFollow = () => {
//     toggleFollow({ userId });
//   };

//   return (
//     <div className="flex justify-center gap-2">
//       <Button
//         onClick={handleToggleFollow}
//         disabled={isLoading || isPending}
//         variant={followStatus ? "outline" : "default"}
//         className={`h-8 ${
//           followStatus
//             ? "border-gray-800 bg-transparent text-white hover:bg-gray-900"
//             : "bg-blue-500 text-white hover:bg-blue-600"
//         }`}
//       >
//         {followStatus ? "Đang theo dõi" : "Theo dõi"}
//       </Button>
//       <Button
//         variant="outline"
//         className="h-8 border-gray-800 bg-transparent text-white hover:bg-gray-900"
//       >
//         Nhắn tin
//       </Button>
//       <Button
//         variant="outline"
//         className="flex h-8 w-8 items-center justify-center border-gray-800 bg-transparent p-0 hover:bg-gray-900"
//       >
//         <MenuSquare className="h-4 w-4" />
//       </Button>
//     </div>
//   );
// }
