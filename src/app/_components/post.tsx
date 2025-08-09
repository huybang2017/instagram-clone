"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, Suspense } from "react";
import {
  Heart,
  MessageCircle,
  Bookmark,
  Send,
  MoreHorizontal,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { formatRelativeTime } from "~/lib/utils";
import { useSession } from "next-auth/react";
import { Loading, CommentsLoading } from "./loading";
import { useRouter } from "next/navigation";

export function PostDetail({ postId }: { postId: string }) {
  const [comment, setComment] = useState("");
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const router = useRouter();

  const [post] = api.post.getById.useSuspenseQuery({ id: postId });
  const utils = api.useUtils();

  const { data: likeStatus } = api.like.getLikeStatus.useQuery(
    { postId },
    { enabled: !!currentUserId },
  );

  const { mutate: toggleLike } = api.like.toggleLike.useMutation({
    onSuccess: () => {
      void utils.like.getLikeStatus.invalidate({ postId });
      void utils.post.getById.invalidate({ id: postId });
    },
  });

  const { mutate: addComment, isLoading: isAddingComment } =
    api.comment.create.useMutation({
      onSuccess: () => {
        setComment("");
        void utils.post.getById.invalidate({ id: postId });
      },
    });

  const { mutate: deleteComment } = api.comment.delete.useMutation({
    onSuccess: () => {
      void utils.post.getById.invalidate({ id: postId });
    },
  });

  const handleToggleLike = () => {
    if (!currentUserId) return;
    toggleLike({ postId });
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !currentUserId) return;

    addComment({
      postId,
      content: comment,
    });
  };

  const handleDeleteComment = (commentId: string) => {
    deleteComment({ id: commentId });
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

  const imageUrl =
    post.images && post.images.length > 0
      ? post.images[0].imageUrl
      : "https://placehold.co/600x600/black/white?text=No+Image";

  const handleClose = () => {
    router.back();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="flex h-full w-full max-w-screen-xl overflow-hidden">
        {/* Image Section */}
        <div className="relative hidden md:block md:w-[60%]">
          <Image
            src={imageUrl}
            alt={post.caption ?? "Post image"}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 60vw"
          />
        </div>

        {/* Content Section */}
        <div className="flex w-full flex-col bg-[#121212] md:w-[40%]">
          {/* Header */}
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={post.user.image ?? ""}
                  alt={post.user.name ?? ""}
                />
                <AvatarFallback>{getInitials(post.user.name)}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-semibold text-white">
                {post.user.username ?? post.user.name}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-white hover:bg-transparent"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Post Content - Mobile only */}
          <div className="relative aspect-square w-full md:hidden">
            <Image
              src={imageUrl}
              alt={post.caption ?? "Post image"}
              fill
              className="object-cover"
              sizes="100vw"
            />
          </div>

          {/* Caption */}
          <div className="flex gap-3 p-4">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={post.user.image ?? ""}
                alt={post.user.name ?? ""}
              />
              <AvatarFallback>{getInitials(post.user.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm text-white">
                <span className="mr-2 font-semibold">
                  {post.user.username ?? post.user.name}
                </span>
                {post.caption}
              </p>
              <p className="mt-1 text-[11px] text-gray-400">
                {formatRelativeTime(post.createdAt)}
              </p>
            </div>
          </div>

          {/* Comments */}
          <div className="flex-1 overflow-y-auto p-4">
            <Suspense fallback={<CommentsLoading />}>
              <div className="space-y-4">
                {post.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={comment.user.image ?? ""}
                        alt={comment.user.name ?? ""}
                      />
                      <AvatarFallback>
                        {getInitials(comment.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm text-white">
                        <span className="mr-2 font-semibold">
                          {comment.user.username ?? comment.user.name}
                        </span>
                        {comment.content}
                      </p>
                      <div className="mt-1 flex gap-4 text-[11px] text-gray-400">
                        <span>{formatRelativeTime(comment.createdAt)}</span>
                        {currentUserId === comment.user.id && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Suspense>
          </div>

          {/* Actions */}
          <div className="p-4">
            <div className="flex justify-between">
              <div className="flex gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleLike}
                  className="h-6 w-6 p-0 text-white hover:bg-transparent"
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
                  className="h-6 w-6 p-0 text-white hover:bg-transparent"
                >
                  <MessageCircle className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 p-0 text-white hover:bg-transparent"
                >
                  <Send className="h-6 w-6" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0 text-white hover:bg-transparent"
              >
                <Bookmark className="h-6 w-6" />
              </Button>
            </div>

            {/* Likes count */}
            <p className="mt-2 text-sm font-semibold text-white">
              {post._count.likes} lượt thích
            </p>

            {/* Timestamp */}
            <p className="mt-1 text-[11px] text-gray-400">
              {formatRelativeTime(post.createdAt)}
            </p>
          </div>

          {/* Add comment */}
          {currentUserId && (
            <div className="p-4">
              <form onSubmit={handleSubmitComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Thêm bình luận..."
                  className="flex-1 border-none bg-transparent text-sm text-white placeholder:text-gray-400 focus:outline-none"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  disabled={!comment.trim() || isAddingComment}
                  className="text-sm font-medium text-blue-500 hover:bg-transparent hover:text-blue-400 disabled:text-gray-500"
                >
                  {isAddingComment ? <Loading size="small" text="" /> : "Đăng"}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
