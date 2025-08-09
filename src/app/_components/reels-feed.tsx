"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Volume2,
  VolumeX,
} from "lucide-react";
import { api } from "~/trpc/react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { formatRelativeTime } from "~/lib/utils";

function isVideoUrl(url?: string) {
  if (!url) return false;
  return /(\.mp4|\.webm|\.ogg)(\?.*)?$/i.test(url);
}

function getInitials(name?: string | null) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

export function ReelsFeed() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = api.post.feed.useInfiniteQuery(
    { limit: 8 },
    {
      getNextPageParam: (last) => last.nextCursor,
      refetchOnWindowFocus: false,
    },
  );

  const posts = useMemo(() => {
    return data?.pages.flatMap((p) => p.posts) ?? [];
  }, [data]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const itemsRef = useRef<Array<HTMLDivElement | null>>([]);
  const mediaRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const lastTapRef = useRef<number[]>([]);

  const [muted, setMuted] = useState(true);
  const [heartVis, setHeartVis] = useState<Record<string, boolean>>({});

  const utils = api.useUtils();
  const { mutate: toggleLike } = api.like.toggleLike.useMutation({
    onSuccess: (_res, vars) => {
      void utils.like.getLikeStatus.invalidate({ postId: vars.postId });
      void utils.post.feed.invalidate();
    },
  });

  // IntersectionObserver to auto play/pause videos
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const idx = Number((entry.target as HTMLElement).dataset.index);
          const video = mediaRefs.current[idx];
          if (!video) continue;

          if (entry.isIntersecting && entry.intersectionRatio >= 0.75) {
            video.muted = muted;
            void video.play().catch(() => undefined);
          } else {
            video.pause();
          }
        }
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    const nodes = itemsRef.current.filter(Boolean) as HTMLDivElement[];
    nodes.forEach((n) => observer.observe(n));

    return () => observer.disconnect();
  }, [posts.length, muted]);

  // Auto-load next page when reaching the bottom sentinel inside the scroll container
  useEffect(() => {
    const root = containerRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel) return;

    const io = new IntersectionObserver(
      (entries) => {
        const anyIntersecting = entries.some((e) => e.isIntersecting);
        if (anyIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { root, rootMargin: "200px" },
    );

    io.observe(sentinel);
    return () => io.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleMediaClick = (idx: number, postId: string) => {
    const now = Date.now();
    const last = lastTapRef.current[idx] ?? 0;
    lastTapRef.current[idx] = now;

    // Double-tap within 300ms
    if (now - last < 300) {
      if (!currentUserId) return;
      // Show heart animation
      setHeartVis((prev) => ({ ...prev, [postId]: true }));
      setTimeout(() => {
        setHeartVis((prev) => ({ ...prev, [postId]: false }));
      }, 800);
      // Toggle like
      toggleLike({ postId });
    } else {
      // Single tap toggles mute
      setMuted((m) => {
        const newMuted = !m;
        const video = mediaRefs.current[idx];
        if (video) video.muted = newMuted;
        return newMuted;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-gray-400">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-red-400">
        Failed to load reels.
      </div>
    );
  }

  if (!posts.length) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-gray-400">
        No reels available yet.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="mx-auto flex h-[calc(100vh-32px)] w-full max-w-[520px] snap-y snap-mandatory flex-col overflow-y-auto py-4"
    >
      {posts.map((post, idx) => {
        const mediaUrl = post.images?.[0]?.imageUrl;
        const isVideo = isVideoUrl(mediaUrl);

        return (
          <div
            key={post.id}
            ref={(el) => {
              itemsRef.current[idx] = el;
            }}
            data-index={idx}
            className="relative mb-6 flex min-h-[80vh] snap-center items-center justify-center"
          >
            <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl border border-neutral-800 bg-black shadow-2xl">
              {/* Gradient overlays */}
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-32 bg-gradient-to-b from-black/70 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-40 bg-gradient-to-t from-black/70 to-transparent" />

              {/* Header */}
              <div className="pointer-events-auto absolute top-0 left-0 z-20 flex w-full items-center justify-between p-3">
                <Link
                  href={`/profile/${post.user.id}`}
                  className="flex items-center gap-2"
                >
                  <Avatar className="h-8 w-8 ring-2 ring-white/20">
                    <AvatarImage src={post.user.image ?? ""} />
                    <AvatarFallback className="bg-neutral-800 text-white">
                      {getInitials(post.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-semibold text-white drop-shadow">
                    {post.user.username ?? "user"}
                  </span>
                </Link>
                <span className="text-xs text-gray-300 drop-shadow">
                  {formatRelativeTime(post.createdAt as unknown as Date)}
                </span>
              </div>

              {/* Media */}
              <button
                type="button"
                onClick={() => handleMediaClick(idx, post.id)}
                className="absolute inset-0"
                aria-label="Toggle mute / like"
              >
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                  {isVideo ? (
                    <video
                      ref={(el) => {
                        mediaRefs.current[idx] = el;
                      }}
                      className="h-full w-full object-cover"
                      src={mediaUrl}
                      playsInline
                      loop
                      muted={muted}
                      controls={false}
                    />
                  ) : (
                    <img
                      className="h-full w-full object-cover"
                      src={
                        mediaUrl ??
                        "https://placehold.co/720x1280/000/FFF?text=No+Media"
                      }
                      alt={post.caption ?? "Reel"}
                    />
                  )}
                </div>
              </button>

              {/* Heart animation on double tap */}
              {heartVis[post.id] && (
                <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
                  <Heart className="h-24 w-24 animate-[ping_0.8s_ease-out] fill-white/90 text-white/90 drop-shadow" />
                </div>
              )}

              {/* Right actions */}
              <div className="pointer-events-auto absolute right-2 bottom-24 z-30 flex flex-col items-center gap-4">
                <div className="transition-transform hover:scale-110">
                  <LikeButton
                    postId={post.id}
                    initialLiked={false}
                    refreshFeedKey={post.id}
                    count={post._count.likes}
                    enabled={!!currentUserId}
                  />
                </div>
                <Link
                  href={`/post/${post.id}`}
                  className="flex flex-col items-center text-white transition-transform hover:scale-110"
                >
                  <div className="rounded-full bg-black/50 p-2 shadow">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  <span className="mt-1 text-xs text-white/80">
                    {post._count.comments}
                  </span>
                </Link>
                <div className="rounded-full bg-black/50 p-2 text-white shadow transition-transform hover:scale-110">
                  <Send className="h-6 w-6" />
                </div>
                <div className="rounded-full bg-black/50 p-2 text-white shadow transition-transform hover:scale-110">
                  <Bookmark className="h-6 w-6" />
                </div>
              </div>

              {/* Mute toggle button */}
              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                className="absolute bottom-6 left-4 z-30 rounded-full bg-black/50 p-2 text-white shadow transition-transform hover:scale-110"
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted ? (
                  <VolumeX className="h-6 w-6" />
                ) : (
                  <Volume2 className="h-6 w-6" />
                )}
              </button>

              {/* Caption */}
              {post.caption && (
                <div className="pointer-events-none absolute right-24 bottom-4 left-4 z-20">
                  <p className="line-clamp-3 text-sm text-white drop-shadow">
                    <span className="pointer-events-auto mr-1 font-semibold">
                      {post.user.username ?? "user"}
                    </span>
                    {post.caption}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Infinite loader sentinel */}
      <div
        ref={sentinelRef}
        className="pb-10 text-center text-sm text-gray-400"
      >
        {isFetchingNextPage ? (
          <div className="mx-auto mt-2 h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : hasNextPage ? (
          ""
        ) : (
          ""
        )}
      </div>
    </div>
  );
}

function LikeButton(props: {
  postId: string;
  count: number;
  enabled: boolean;
  initialLiked: boolean;
  refreshFeedKey: string;
}) {
  const { postId, count, enabled } = props;
  const utils = api.useUtils();

  const { data: likeStatus } = api.like.getLikeStatus.useQuery(
    { postId },
    { enabled },
  );

  const { mutate: toggleLike, isPending } = api.like.toggleLike.useMutation({
    onSuccess: () => {
      void utils.like.getLikeStatus.invalidate({ postId });
      void utils.post.feed.invalidate();
    },
  });

  return (
    <button
      disabled={!enabled || isPending}
      onClick={() => toggleLike({ postId })}
      className="flex flex-col items-center text-white"
      aria-label="Like"
    >
      <div className="rounded-full bg-black/50 p-2 shadow">
        <Heart
          className={`h-6 w-6 ${likeStatus ? "fill-red-500 text-red-500" : ""}`}
        />
      </div>
      <span className="mt-1 text-xs text-white/80">{count}</span>
    </button>
  );
}
