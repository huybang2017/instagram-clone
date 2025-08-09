"use client";

import { useEffect, useRef } from "react";
import { PostCard } from "~/app/_components/post-card";
import { api } from "~/trpc/react";
import { useSession } from "next-auth/react";

export function Posts() {
  const { data: session } = useSession();

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    api.post.feed.useInfiniteQuery(
      { limit: 5 },
      {
        getNextPageParam: (last) => last.nextCursor,
        refetchOnWindowFocus: false,
      },
    );

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const anyIntersecting = entries.some((e) => e.isIntersecting);
        if (anyIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const allPosts = data?.pages.flatMap((p) => p.posts) ?? [];
  const currentUserId = session?.user?.id;

  if (isLoading) {
    return (
      <div className="rounded-md border border-neutral-700 bg-black p-8 text-center">
        <p className="text-gray-400">Loading posts...</p>
      </div>
    );
  }

  if (!allPosts.length) {
    return (
      <div className="rounded-md border border-neutral-700 bg-black p-8 text-center">
        <p className="text-gray-400">No posts yet.</p>
        {session?.user && (
          <a
            href="/create"
            className="mt-4 inline-block rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Create your first post
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {allPosts.map((post) => (
        <PostCard key={post.id} post={post} currentUserId={currentUserId} />
      ))}

      {/* Infinite loader sentinel */}
      <div
        ref={loadMoreRef}
        className="py-4 text-center text-xs text-neutral-400"
      >
        {isFetchingNextPage ? (
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : hasNextPage ? (
          ""
        ) : (
          ""
        )}
      </div>
    </div>
  );
}
