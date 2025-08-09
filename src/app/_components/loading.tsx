"use client";

import { Loader2 } from "lucide-react";

interface LoadingProps {
  size?: "small" | "medium" | "large";
  text?: string;
  fullScreen?: boolean;
}

export function Loading({
  size = "medium",
  text = "Loading...",
  fullScreen = false,
}: LoadingProps) {
  const sizeClass = {
    small: "h-4 w-4",
    medium: "h-8 w-8",
    large: "h-12 w-12",
  };

  const container = fullScreen
    ? "fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
    : "flex flex-col items-center justify-center p-8";

  return (
    <div className={container}>
      <div className="flex flex-col items-center justify-center gap-4 rounded-md bg-black p-6 text-center text-white">
        <Loader2 className={`animate-spin ${sizeClass[size]}`} />
        {text && <p className="text-sm font-medium text-gray-400">{text}</p>}
      </div>
    </div>
  );
}

// Specialized loading components for different contexts
export function PostsLoading() {
  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-md border border-neutral-700 bg-black p-8 text-center">
        <Loading text="Loading posts..." />
      </div>
    </div>
  );
}

export function StoriesLoading() {
  return (
    <div className="overflow-x-auto">
      <div className="flex items-center gap-4 py-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="h-16 w-16 animate-pulse rounded-full bg-neutral-800"></div>
            <div className="h-3 w-12 animate-pulse rounded bg-neutral-800"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfileLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6">
        <div className="h-20 w-20 animate-pulse rounded-full bg-neutral-800"></div>
        <div className="space-y-2">
          <div className="h-6 w-36 animate-pulse rounded bg-neutral-800"></div>
          <div className="h-4 w-24 animate-pulse rounded bg-neutral-800"></div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square animate-pulse bg-neutral-800"
          ></div>
        ))}
      </div>
    </div>
  );
}

export function CommentsLoading() {
  return (
    <div className="space-y-4 p-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <div className="h-8 w-8 animate-pulse rounded-full bg-neutral-800"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-800"></div>
            <div className="h-3 w-1/4 animate-pulse rounded bg-neutral-800"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
