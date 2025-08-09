"use client";

import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";

import { Navbar } from "~/app/_components/navbar";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { useSession } from "next-auth/react";
import { Input } from "~/components/ui/input";

export default function SearchPage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on page load
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Mock story circles data
  const storyCircles = [
    {
      id: "1",
      name: "prv.meobabil",
      image: null,
    },
    {
      id: "2",
      name: "pzunnee",
      image: null,
    },
  ];

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <main className="flex min-h-screen bg-black">
      {/* Left sidebar with navigation */}
      <Navbar user={session?.user} show={false} />

      <div className="ml-16 flex flex-1">
        <div className="w-[375px] border-r border-neutral-800">
          <div className="flex flex-col p-6">
            {/* Search input */}
            <div className="relative mb-6">
              <div className="relative rounded-lg bg-neutral-800">
                <Input
                  ref={inputRef}
                  placeholder="Search"
                  className="h-9 border-none bg-neutral-800 pr-8 pl-4 text-sm text-white placeholder:text-neutral-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    className="absolute top-1/2 right-3 -translate-y-1/2"
                    onClick={handleClearSearch}
                  >
                    <X className="h-4 w-4 text-neutral-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Recent header with clear all */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Recent</span>
              <button className="text-sm text-blue-500">Clear all</button>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center pt-8">
          {/* Stories circles */}
          <div className="mb-16 flex justify-center gap-8">
            {storyCircles.map((story) => (
              <div key={story.id} className="flex flex-col items-center gap-2">
                <div className="rounded-full bg-gradient-to-br from-yellow-500 via-pink-500 to-purple-500 p-[2px]">
                  <div className="rounded-full border-2 border-black bg-black">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={story.image ?? ""} alt={story.name} />
                      <AvatarFallback>{getInitials(story.name)}</AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <span className="text-xs text-white">{story.name}</span>
              </div>
            ))}
          </div>

          {/* You're all caught up message */}
          <div className="flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19 6L9 16L5 12"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <div className="mt-4 text-center text-white">
            <h3 className="text-lg font-semibold">You&apos;re all caught up</h3>
            <p className="mt-1 text-sm text-gray-400">
              You&apos;ve seen all new posts from the past 3 days.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
