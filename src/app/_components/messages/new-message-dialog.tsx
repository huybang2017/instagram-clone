"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { ScrollArea } from "~/components/ui/scroll-area";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";

function getInitials(name?: string | null) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

export default function NewMessageDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const search = api.user.searchUsers.useInfiniteQuery(
    { query, limit: 10 },
    {
      getNextPageParam: (last) => last.nextCursor,
      enabled: query.trim().length > 1,
      staleTime: 30_000,
    },
  );

  const users = useMemo(
    () => (search.data?.pages ?? []).flatMap((p) => p.users),
    [search.data],
  );

  const createDirect = api.chat.createDirectChat.useMutation({
    onSuccess: (res) => {
      onOpenChange(false);
      router.push(`/messages/${res.chatId}`);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-neutral-950 text-white sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>New message</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users"
            className="border-neutral-800 bg-black text-white placeholder:text-neutral-500"
          />

          <ScrollArea className="h-72 rounded-md border border-neutral-900">
            {query.trim().length <= 1 ? (
              <div className="p-4 text-sm text-neutral-400">
                Type at least 2 characters
              </div>
            ) : search.status === "pending" ? (
              <div className="p-4 text-sm text-neutral-400">Searching…</div>
            ) : users.length === 0 ? (
              <div className="p-4 text-sm text-neutral-400">No results</div>
            ) : (
              <ul className="divide-y divide-neutral-900">
                {users.map((u) => (
                  <li key={u.id} className="flex items-center gap-3 p-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={u.image ?? ""}
                        alt={u.name ?? u.username ?? ""}
                      />
                      <AvatarFallback>
                        {getInitials(u.name ?? u.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {u.username ?? u.name}
                      </p>
                      {u.bio && (
                        <p className="truncate text-xs text-neutral-500">
                          {u.bio}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-500"
                      disabled={createDirect.isPending}
                      onClick={() => createDirect.mutate({ userId: u.id })}
                    >
                      {createDirect.isPending ? "Starting…" : "Chat"}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
