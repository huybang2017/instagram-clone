"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "~/trpc/react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  ArrowLeft,
  Send,
  Phone,
  Video,
  Info,
  Smile,
  Mic,
  Image as ImageIcon,
  Heart,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { formatRelativeTime } from "~/lib/utils";

function getInitials(name?: string | null) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

export default function ChatWindow({ chatId }: { chatId: string }) {
  const { data: session } = useSession();
  const utils = api.useUtils();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrolledInitially = useRef(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const { data: chat } = api.chat.getChat.useQuery({ chatId });

  const messagesQuery = api.chat.getMessages.useInfiniteQuery(
    { chatId, limit: 30 },
    { getNextPageParam: (last) => last.nextCursor },
  );

  const messages = useMemo(() => {
    const list = (messagesQuery.data?.pages ?? []).flatMap((p) => p.messages);
    return [...list].reverse();
  }, [messagesQuery.data]);

  // Scroll to bottom once after initial load
  useEffect(() => {
    if (!scrolledInitially.current && messagesQuery.status === "success") {
      scrolledInitially.current = true;
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messagesQuery.status]);

  const sendMutation = api.chat.sendMessage.useMutation({
    onSuccess: async () => {
      setText("");
      await utils.chat.getMessages.invalidate({ chatId });
      await utils.chat.getMyChats.invalidate();
      // Wait a tick for list to update then scroll to bottom
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 50);
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sendMutation.isPending) return;
    sendMutation.mutate({ chatId, text: text.trim() });
  };

  // Helper: day label
  const dayLabel = (d: Date) => {
    const now = new Date();
    const date = new Date(d);
    const diff = Math.floor(
      (now.setHours(0, 0, 0, 0) -
        new Date(date.setHours(0, 0, 0, 0)).getTime()) /
        86400000,
    );
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(new Date(d));
  };

  // Infinite scroll: fetch older when near top
  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    if (
      el.scrollTop < 48 &&
      messagesQuery.hasNextPage &&
      !messagesQuery.isFetchingNextPage
    ) {
      void messagesQuery.fetchNextPage();
    }
  };

  return (
    <div className="flex h-[calc(100vh-0px)] w-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 p-3">
        <div className="flex items-center gap-3">
          <div className="lg:hidden">
            <Link
              href="/messages"
              className="rounded-full p-2 hover:bg-neutral-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </div>
          <Avatar className="h-8 w-8">
            <AvatarImage src={chat?.image ?? ""} alt={chat?.name ?? ""} />
            <AvatarFallback>{getInitials(chat?.name)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">
              {chat?.name ?? "Conversation"}
            </span>
            <span className="text-xs text-neutral-400">
              {chat?.participants?.length ?? 0} member
              {(chat?.participants?.length ?? 0) > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Header actions */}
        <div className="flex items-center gap-1">
          <button
            className="rounded-full p-2 text-neutral-300 hover:bg-neutral-900"
            aria-label="Audio call"
          >
            <Phone className="h-5 w-5" />
          </button>
          <button
            className="rounded-full p-2 text-neutral-300 hover:bg-neutral-900"
            aria-label="Video call"
          >
            <Video className="h-5 w-5" />
          </button>
          <button
            className="rounded-full p-2 text-neutral-300 hover:bg-neutral-900"
            aria-label="Chat info"
          >
            <Info className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto p-4"
      >
        {messagesQuery.status === "pending" && (
          <p className="text-sm text-neutral-400">Loading…</p>
        )}
        {messagesQuery.status === "success" && messages.length === 0 && (
          <div className="text-center text-sm text-neutral-400">Say hi 👋</div>
        )}

        {messagesQuery.isFetchingNextPage && (
          <div className="mb-2 flex justify-center text-xs text-neutral-500">
            Loading earlier…
          </div>
        )}

        {/* Message list with day separators */}
        <div className="space-y-3">
          {messages.map((m, idx) => {
            const isOwn = m.isOwnMessage || m.senderId === session?.user?.id;
            const prev = messages[idx - 1];
            const showDay =
              !prev ||
              new Date(prev.createdAt).toDateString() !==
                new Date(m.createdAt).toDateString();
            return (
              <div key={m.id}>
                {showDay && (
                  <div className="mb-3 flex items-center justify-center">
                    <span className="rounded-full bg-neutral-900 px-3 py-1 text-[11px] text-neutral-400">
                      {dayLabel(new Date(m.createdAt))}
                    </span>
                  </div>
                )}
                <div className="space-y-1">
                  <div
                    className={`flex items-end gap-2 ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    {!isOwn && (
                      <Avatar className="h-7 w-7">
                        <AvatarImage
                          src={m.sender.image ?? ""}
                          alt={m.sender.username ?? m.sender.name ?? ""}
                        />
                        <AvatarFallback>
                          {getInitials(m.sender.name ?? m.sender.username)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${isOwn ? "bg-neutral-800 text-white" : "bg-neutral-900 text-white"}`}
                    >
                      {m.messageText}
                    </div>
                  </div>
                  <div
                    className={`px-2 text-[10px] text-neutral-500 ${isOwn ? "text-right" : "text-left"}`}
                  >
                    {formatRelativeTime(m.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2 border-t border-neutral-800 p-3"
      >
        <button
          type="button"
          className="rounded-full p-2 text-neutral-300 hover:bg-neutral-900"
          aria-label="Emoji"
        >
          <Smile className="h-5 w-5" />
        </button>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message…"
          className="flex-1 border-neutral-800 bg-black text-white placeholder:text-neutral-500"
        />
        <button
          type="button"
          className="hidden rounded-full p-2 text-neutral-300 hover:bg-neutral-900 sm:block"
          aria-label="Microphone"
        >
          <Mic className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="rounded-full p-2 text-neutral-300 hover:bg-neutral-900"
          aria-label="Attach image"
        >
          <ImageIcon className="h-5 w-5" />
        </button>
        {text.trim() ? (
          <Button
            type="submit"
            disabled={!text.trim() || sendMutation.isPending}
            className="bg-blue-600 hover:bg-blue-500"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </Button>
        ) : (
          <button
            type="button"
            className="rounded-full p-2 text-neutral-300 hover:bg-neutral-900"
            aria-label="Quick like"
          >
            <Heart className="h-5 w-5" />
          </button>
        )}
      </form>
    </div>
  );
}
