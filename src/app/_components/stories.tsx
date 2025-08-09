"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { api } from "~/trpc/react";
import { Dialog, DialogContent } from "~/components/ui/dialog";

interface StoriesProps {
  currentUserId?: string | null;
}

export function Stories({ currentUserId }: StoriesProps) {
  const [selectedUserIndex, setSelectedUserIndex] = useState<number | null>(
    null,
  );
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    api.story.getActiveStories.useInfiniteQuery(
      { limit: 16 },
      {
        getNextPageParam: (last) => last.nextCursor,
        refetchOnWindowFocus: false,
      },
    );

  useEffect(() => {
    setMounted(true);
  }, []);

  const storiesToShow = (data?.pages.flatMap((p) => p.stories) ?? []) as Array<{
    user: {
      id: string;
      name: string | null;
      username: string | null;
      image: string | null;
    };
    stories: Array<{
      id: string;
      imageUrl: string;
      text: string | null;
      createdAt: Date;
      expiresAt: Date;
    }>;
  }>;

  // Auto-fetch next page when scrolled near the end of the horizontal list
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      const nearEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 100;
      if (nearEnd && hasNextPage && !isFetchingNextPage) {
        void fetchNextPage();
      }
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleStoryClick = (userIndex: number) => {
    setSelectedUserIndex(userIndex);
    setCurrentStoryIndex(0);
  };

  const handleClose = () => {
    setSelectedUserIndex(null);
    setCurrentStoryIndex(0);
  };

  const handleNext = () => {
    if (selectedUserIndex === null) return;

    const currentUserStories = storiesToShow[selectedUserIndex]?.stories;
    if (!currentUserStories) return;

    if (currentStoryIndex < currentUserStories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      // Move to next user if available
      if (selectedUserIndex < storiesToShow.length - 1) {
        setSelectedUserIndex(selectedUserIndex + 1);
        setCurrentStoryIndex(0);
      } else {
        handleClose();
      }
    }
  };

  const handlePrevious = () => {
    if (selectedUserIndex === null) return;

    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    } else {
      // Move to previous user if available
      if (selectedUserIndex > 0) {
        setSelectedUserIndex(selectedUserIndex - 1);
        const prevUserStories = storiesToShow[selectedUserIndex - 1]?.stories;
        setCurrentStoryIndex(prevUserStories ? prevUserStories.length - 1 : 0);
      }
    }
  };

  // Client-side only function for initials to ensure consistency
  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
    return initials;
  };

  return (
    <>
      <div
        ref={scrollRef}
        className="mb-4 flex w-full gap-4 overflow-x-auto px-0 py-2"
      >
        {mounted && isLoading && (
          <div className="px-2 text-sm text-neutral-400">
            Loading stories...
          </div>
        )}

        {storiesToShow.map((userStories, index) => (
          <div
            key={userStories.user.id}
            className="flex cursor-pointer flex-col items-center"
            onClick={() => handleStoryClick(index)}
          >
            <div className="rounded-full bg-gradient-to-br from-yellow-400 to-pink-600 p-[2px]">
              <div className="rounded-full border-2 border-black bg-black">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={userStories.user.image ?? ""} />
                  <AvatarFallback className="bg-neutral-800 text-white">
                    {getInitials(userStories.user.name)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            <span className="mt-1 max-w-16 truncate text-xs text-white">
              {userStories.user.username ?? userStories.user.name}
            </span>
          </div>
        ))}

        {currentUserId && (
          <Link href="/create/story" className="flex flex-col items-center">
            <div className="rounded-full p-[2px]">
              <div className="rounded-full border-2 border-neutral-700">
                <Avatar className="h-14 w-14 bg-black">
                  <AvatarFallback className="text-2xl text-white">
                    +
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            <span className="mt-1 text-xs text-white">Your story</span>
          </Link>
        )}

        {/* No explicit load button; auto-fetch triggers on horizontal scroll end */}
      </div>

      {selectedUserIndex !== null && (
        <Dialog
          open={selectedUserIndex !== null}
          onOpenChange={() => handleClose()}
        >
          <DialogContent
            className="max-w-md border-none bg-black p-0"
            showCloseButton={false}
          >
            <div className="relative h-[80vh]">
              {/* Story content */}
              {storiesToShow[selectedUserIndex]?.stories[currentStoryIndex] && (
                <>
                  {/* Header */}
                  <div className="absolute top-0 right-0 left-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent p-4">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={
                            storiesToShow[selectedUserIndex]?.user.image ?? ""
                          }
                        />
                        <AvatarFallback className="bg-neutral-800 text-white">
                          {getInitials(
                            storiesToShow[selectedUserIndex]?.user.name,
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-white">
                        {storiesToShow[selectedUserIndex]?.user.username ??
                          storiesToShow[selectedUserIndex]?.user.name}
                      </span>
                    </div>
                  </div>

                  {/* Image */}
                  <div className="relative h-full w-full">
                    <Image
                      src={
                        storiesToShow[selectedUserIndex]?.stories[
                          currentStoryIndex
                        ]?.imageUrl ?? ""
                      }
                      alt="Story"
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 600px"
                      priority
                    />
                    {storiesToShow[selectedUserIndex]?.stories[
                      currentStoryIndex
                    ]?.text && (
                      <span className="absolute top-20 left-1/2 -translate-x-1/2 rounded bg-black/50 p-2 text-white">
                        {
                          storiesToShow[selectedUserIndex].stories[
                            currentStoryIndex
                          ].text
                        }
                      </span>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="absolute inset-0 flex justify-between">
                    <div
                      className="h-full w-1/2 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrevious();
                      }}
                    />
                    <div
                      className="h-full w-1/2 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNext();
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
