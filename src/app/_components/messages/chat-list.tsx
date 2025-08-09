"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "~/trpc/react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { Input } from "~/components/ui/input";
import { SquarePen } from "lucide-react";
import { formatRelativeTime } from "~/lib/utils";
import { Search as SearchIcon } from "lucide-react";
import { ChevronDown, Plus } from "lucide-react";

function getInitials(name?: string | null) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

export default function ChatList({
  onCompose,
  title,
}: {
  onCompose?: () => void;
  title?: string;
}) {
  const pathname = usePathname();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    api.chat.getMyChats.useInfiniteQuery(
      { limit: 20 },
      { getNextPageParam: (last) => last.nextCursor },
    );

  const chats = (data?.pages ?? []).flatMap((p) => p.chats);

  // Infinite scroll on the scrollable area
  const onScroll: React.UIEventHandler<HTMLDivElement> = (e) => {
    const el = e.currentTarget;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
    if (nearBottom && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  };

  return (
    <div className="flex h-[calc(100vh-0px)] w-full flex-col">
      <div className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-neutral-800 bg-black px-4">
        <button className="flex items-center gap-1 text-base font-semibold text-white">
          <span className="max-w-[200px] truncate text-left">
            {title ?? "Direct"}
          </span>
          <ChevronDown className="h-4 w-4 text-neutral-400" />
        </button>
        <button
          onClick={onCompose}
          className="rounded-md p-2 text-blue-500 hover:bg-neutral-900"
          aria-label="New message"
        >
          <SquarePen className="h-5 w-5" />
        </button>
      </div>

      {/* Search */}
      <div className="sticky top-14 z-10 border-b border-neutral-800 bg-black p-3">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <Input
            placeholder="Search"
            className="h-9 w-full rounded-full border-neutral-800 bg-neutral-950 pl-9 text-sm placeholder:text-neutral-500"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="border-b border-neutral-800 px-4 py-3">
        <div className="flex gap-3 overflow-x-auto">
          {/* Your note */}
          <button className="flex w-16 shrink-0 flex-col items-center gap-2">
            <div className="relative">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-neutral-700">
                <Plus className="h-5 w-5 text-neutral-400" />
              </div>
            </div>
            <span className="truncate text-xs text-neutral-400">Your note</span>
          </button>
          {/* Friends notes (use first few chats as placeholders) */}
          {chats.slice(0, 6).map((c) => (
            <div
              key={`note-${c.id}`}
              className="flex w-16 shrink-0 flex-col items-center gap-2"
            >
              <div className="h-14 w-14 rounded-full border border-neutral-700 p-[2px]">
                <Avatar className="h-full w-full">
                  <AvatarImage src={c.image ?? ""} alt={c.name ?? ""} />
                  <AvatarFallback>{getInitials(c.name)}</AvatarFallback>
                </Avatar>
              </div>
              <span className="truncate text-xs text-neutral-400">
                {c.name ?? "User"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar: Messages / Requests */}
      <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-2">
        <span className="text-sm font-semibold text-white">Messages</span>
        <button className="text-sm font-medium text-blue-500 hover:text-blue-400">
          Requests
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-1" onScroll={onScroll}>
        {status === "pending" && (
          <div className="p-4 text-sm text-neutral-400">Loading…</div>
        )}
        {status === "success" && chats.length === 0 && (
          <div className="p-4 text-sm text-neutral-400">No chats yet</div>
        )}

        <ul className="space-y-1">
          {chats.map((chat) => {
            const href = `/messages/${chat.id}`;
            const active = pathname === href;
            return (
              <li key={chat.id}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-md p-3 hover:bg-neutral-900",
                    active && "bg-neutral-900",
                  )}
                >
                  <Avatar className="h-11 w-11">
                    <AvatarImage src={chat.image ?? ""} alt={chat.name ?? ""} />
                    <AvatarFallback>{getInitials(chat.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {chat.name ?? "Conversation"}
                    </p>
                    <p className="truncate text-xs leading-5 text-neutral-400">
                      {chat.latestMessage
                        ? `${chat.latestMessage.isOwnMessage ? "You: " : `${chat.latestMessage.senderUsername}: `}${chat.latestMessage.text} · ${formatRelativeTime(chat.latestMessage.createdAt)}`
                        : "Start the conversation"}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        {isFetchingNextPage && (
          <div className="py-3 text-center text-[12px] text-neutral-500">
            Loading…
          </div>
        )}
      </div>
    </div>
  );
}
