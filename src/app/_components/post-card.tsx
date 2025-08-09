"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
  Bookmark,
  MoreHorizontal,
  Send,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { formatRelativeTime } from "~/lib/utils";

interface PostCardProps {
  post: {
    id: string;
    caption?: string | null;
    createdAt: Date;
    images: {
      id: string;
      imageUrl: string;
    }[];
    user: {
      id: string;
      name?: string | null;
      username?: string | null;
      image?: string | null;
    };
    _count: {
      comments: number;
      likes: number;
    };
  };
  currentUserId?: string | null;
}

export function PostCard({ post, currentUserId }: PostCardProps) {
  const [comment, setComment] = useState("");
  // Get the primary image URL (first image in the array or placeholder)
  const imageUrl =
    post.images && post.images.length > 0
      ? post.images?.[0]?.imageUrl
      : "https://placehold.co/600x600/black/white?text=No+Image";

  const utils = api.useUtils();

  const { data: likeStatus, isLoading: likeStatusLoading } =
    api.like.getLikeStatus.useQuery(
      { postId: post.id },
      { enabled: !!currentUserId },
    );

  const { mutate: toggleLike } = api.like.toggleLike.useMutation({
    onSuccess: () => {
      void utils.like.getLikeStatus.invalidate({ postId: post.id });
      void utils.post.feed.invalidate();
    },
  });

  const { mutate: addComment, isLoading: isAddingComment } =
    api.comment.create.useMutation({
      onSuccess: () => {
        setComment("");
        void utils.post.feed.invalidate();
      },
    });

  const handleToggleLike = () => {
    if (!currentUserId) return;
    toggleLike({ postId: post.id });
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !currentUserId) return;

    addComment({
      postId: post.id,
      content: comment,
    });
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="mb-6 border-b border-neutral-800 bg-black pb-2 md:rounded-md md:border">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <Link
          href={`/profile/${post.user.id}`}
          className="flex items-center gap-2"
        >
          <div className="rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={post.user.image ?? ""}
                alt={post.user.name ?? ""}
              />
              <AvatarFallback className="bg-neutral-800 text-white">
                {getInitials(post.user.name)}
              </AvatarFallback>
            </Avatar>
          </div>
          <span className="text-sm font-semibold text-white">
            {post.user.username || "prv.meobabil"}
          </span>
          <span className="text-sm font-light text-gray-400">• 1d</span>
        </Link>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-white">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </div>

      {/* Image */}
      <div className="relative w-full">
        <img
          src={imageUrl}
          alt={post.caption ?? "Post image"}
          sizes="(max-width: 768px) 100vw, 600px"
          className="object-cover"
        />
      </div>

      {/* Actions */}
      <div className="p-3">
        <div className="flex justify-between">
          <div className="flex gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleLike}
              disabled={likeStatusLoading}
              className="h-8 w-8 p-0 text-white"
            >
              <Heart
                className={`h-6 w-6 ${
                  likeStatus ? "fill-red-500 text-red-500" : ""
                }`}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-0 text-white"
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-0 text-white"
            >
              <Send className="h-6 w-6" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 p-0 text-white"
          >
            <Bookmark className="h-6 w-6" />
          </Button>
        </div>

        {/* Likes count */}
        <p className="mt-2 text-sm font-semibold text-white">
          {post._count.likes} likes
        </p>

        {/* Caption */}
        {post.caption && (
          <p className="mt-1 text-sm text-white">
            <Link
              href={`/profile/${post.user.id}`}
              className="mr-1 font-semibold"
            >
              {post.user.username ?? "prv.meobabil"}
            </Link>
            {post.caption}
          </p>
        )}

        {/* Comments */}
        {post._count.comments > 0 && (
          <Link
            href={`/post/${post.id}`}
            className="mt-1 block text-sm text-gray-400"
          >
            View all {post._count.comments} comments
          </Link>
        )}

        {/* Timestamp */}
        <p className="mt-1 text-xs text-gray-400 uppercase">
          {formatRelativeTime(post.createdAt)}
        </p>
      </div>

      {/* Add comment - Always visible */}
      <div className="border-t border-neutral-800 px-3 py-2">
        <form onSubmit={handleSubmitComment} className="flex items-center">
          <input
            type="text"
            placeholder="Add a comment..."
            className="flex-1 border-none bg-transparent text-sm text-white placeholder:text-gray-500 focus:outline-none"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          {comment.trim() && (
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="px-0 font-semibold text-blue-500"
              disabled={isAddingComment}
            >
              Post
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}
