"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { api } from "~/trpc/react";
import Image from "next/image";

export function ExploreGrid() {
  const { data } = api.post.feed.useQuery({
    limit: 30, // Get more posts for the grid
  });

  if (!data?.posts || data.posts.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center rounded-md border border-neutral-700 bg-black p-4 text-center">
        <p className="text-gray-400">No posts to explore.</p>
      </div>
    );
  }

  // Create chunks of posts for the layout
  const chunks = [];
  for (let i = 0; i < data.posts.length; i += 12) {
    chunks.push(data.posts.slice(i, Math.min(i + 12, data.posts.length)));
  }

  return (
    <div className="space-y-1 md:space-y-2">
      {chunks.map((chunk, chunkIndex) => (
        <div key={chunkIndex} className="space-y-1 md:space-y-2">
          {/* First pattern - big card on right */}
          {chunk.length > 0 && (
            <div className="grid h-auto grid-cols-3 gap-1 md:gap-2">
              {/* First column - always a regular post */}
              {chunk[0] && (
                <div>
                  <ExploreGridItem post={chunk[0]} />
                </div>
              )}

              {/* Second column - always a regular post */}
              {chunk[1] && (
                <div>
                  <ExploreGridItem post={chunk[1]} />
                </div>
              )}

              {/* Third column - Double height post */}
              {chunk[2] && (
                <div className="row-span-2">
                  <ExploreGridItem post={chunk[2]} largeItem={true} />
                </div>
              )}

              {/* Bottom row posts (only for first two columns) */}
              {chunk[3] && (
                <div>
                  <ExploreGridItem post={chunk[3]} />
                </div>
              )}

              {chunk[4] && (
                <div>
                  <ExploreGridItem post={chunk[4]} />
                </div>
              )}
            </div>
          )}

          {/* Second pattern - big card on left */}
          {chunk.length > 5 && (
            <div className="grid h-auto grid-cols-3 gap-1 md:gap-2">
              {/* First column - Double height post */}
              {chunk[5] && (
                <div className="row-span-2">
                  <ExploreGridItem post={chunk[5]} largeItem={true} />
                </div>
              )}

              {/* Top row - 2nd and 3rd columns */}
              {chunk[6] && (
                <div>
                  <ExploreGridItem post={chunk[6]} />
                </div>
              )}

              {chunk[7] && (
                <div>
                  <ExploreGridItem post={chunk[7]} />
                </div>
              )}

              {/* Bottom row - 2nd and 3rd columns */}
              {chunk[8] && (
                <div>
                  <ExploreGridItem post={chunk[8]} />
                </div>
              )}

              {chunk[9] && (
                <div>
                  <ExploreGridItem post={chunk[9]} />
                </div>
              )}
            </div>
          )}

          {/* Optional third pattern if needed */}
          {chunk.length > 10 && (
            <div className="grid h-auto grid-cols-3 gap-1 md:gap-2">
              {/* Custom layout for remaining items */}
              {chunk[10] && (
                <div>
                  <ExploreGridItem post={chunk[10]} />
                </div>
              )}

              {chunk[11] && (
                <div className="col-span-2">
                  <ExploreGridItem post={chunk[11]} wideItem={true} />
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

interface ExploreGridItemProps {
  post: {
    id: string;
    caption?: string | null;
    images: {
      id: string;
      imageUrl: string;
    }[];
    _count: {
      comments: number;
      likes: number;
    };
  };
  largeItem?: boolean;
  wideItem?: boolean;
}

function ExploreGridItem({
  post,
  largeItem = false,
  wideItem = false,
}: ExploreGridItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Get the primary image URL (first image in the array or placeholder)
  const imageUrl =
    post.images && post.images.length > 0
      ? post.images[0].imageUrl
      : "https://placehold.co/600x600/black/white?text=No+Image";

  return (
    <Link href={`/post/${post.id}`}>
      <div
        className={`group relative aspect-square w-full overflow-hidden bg-black ${
          largeItem ? "h-full" : ""
        } ${wideItem ? "aspect-[2/1]" : ""}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Image
          src={imageUrl}
          alt={post.caption ?? "Post image"}
          className="h-full w-full object-cover"
          fill
        />

        {/* Video/IGTV icon in the top right */}
        <div className="absolute top-2 right-2 text-white">
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 5.5C5 4.67157 5.67157 4 6.5 4H17.5C18.3284 4 19 4.67157 19 5.5V18.5C19 19.3284 18.3284 20 17.5 20H6.5C5.67157 20 5 19.3284 5 18.5V5.5Z"
              stroke="white"
              strokeWidth="2"
            />
          </svg>
        </div>

        {/* Hover overlay with stats */}
        <div className="bg-opacity-0 group-hover:bg-opacity-50 absolute inset-0 flex items-center justify-center bg-black opacity-0 transition-all duration-200 group-hover:opacity-100">
          <div className="flex items-center gap-4 text-white">
            <div className="flex items-center gap-1">
              <Heart className="h-5 w-5 fill-white text-white" />
              <span className="text-sm font-semibold">{post._count.likes}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="h-5 w-5 fill-transparent text-white" />
              <span className="text-sm font-semibold">
                {post._count.comments}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
