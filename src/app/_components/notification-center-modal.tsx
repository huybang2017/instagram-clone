"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Avatar } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { Loader2, MoreHorizontal } from "lucide-react";
import { api, type RouterOutputs } from "~/trpc/react";

// Types
type NotificationItem =
  RouterOutputs["notification"]["getMyNotifications"]["notifications"][number];
type SectionKey = "today" | "thisMonth" | "earlier";

// Relative time helper (lightweight)
function timeAgo(date: Date) {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo`;
  const y = Math.floor(mo / 12);
  return `${y}y`;
}

function getSectionLabel(key: SectionKey) {
  switch (key) {
    case "today":
      return "Today";
    case "thisMonth":
      return "This month";
    default:
      return "Earlier";
  }
}

function groupByTime(notifs: NotificationItem[]) {
  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const groups: Record<SectionKey, NotificationItem[]> = {
    today: [],
    thisMonth: [],
    earlier: [],
  };

  for (const n of notifs) {
    const created = n.createdAt;
    if (created >= startOfToday) groups.today.push(n);
    else if (created >= startOfMonth) groups.thisMonth.push(n);
    else groups.earlier.push(n);
  }
  return groups;
}

function getText(n: NotificationItem) {
  const name = n.sender.username ?? n.sender.name ?? "Người dùng";
  switch (n.notificationType) {
    case "FOLLOW":
      return `${name} đã bắt đầu theo dõi bạn.`;
    case "POST_LIKED":
      return `${name} đã thích bài viết của bạn.`;
    case "COMMENTED":
      return `${name} đã bình luận: ${n.message ?? ""}`;
    case "MENTIONED":
      return `${name} đã nhắc đến bạn.`;
    default:
      return n.message ?? "Thông báo";
  }
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: "left" | "right";
}

export function NotificationCenterModal({
  open,
  onOpenChange,
  side = "right",
}: Props) {
  const router = useRouter();

  const notifQuery = api.notification.getMyNotifications.useInfiniteQuery(
    { limit: 20 },
    {
      getNextPageParam: (last) => last.nextCursor,
      enabled: open,
      refetchOnWindowFocus: false,
    },
  );

  const unreadCountQuery = api.notification.getUnreadCount.useQuery(undefined, {
    enabled: open,
  });

  const markAsRead = api.notification.markAsRead.useMutation({
    onSuccess: () => {
      void unreadCountQuery.refetch();
      void notifQuery.refetch();
    },
  });
  const markAllAsRead = api.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      void unreadCountQuery.refetch();
      void notifQuery.refetch();
    },
  });
  const deleteNotif = api.notification.delete.useMutation({
    onSuccess: () => {
      void unreadCountQuery.refetch();
      void notifQuery.refetch();
    },
  });

  const notifications = useMemo(() => {
    return notifQuery.data?.pages.flatMap((p) => p.notifications) ?? [];
  }, [notifQuery.data]);

  const grouped = useMemo(() => groupByTime(notifications), [notifications]);

  const isEmpty = !notifQuery.isLoading && notifications.length === 0;

  const handleOpenChange = (v: boolean) => {
    onOpenChange(v);
  };

  const handleClickItem = (n: NotificationItem) => {
    if (!n.isRead) markAsRead.mutate({ id: n.id });
    if (n.post?.id) {
      router.push(`/post/${n.post.id}`);
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side={side}
        className="w-full border-neutral-800 bg-black p-0 text-white sm:max-w-md md:w-[420px]"
      >
        <SheetHeader className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
          <SheetTitle className="text-base font-semibold">
            Notifications
          </SheetTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="text-sm text-blue-500 hover:bg-transparent hover:text-blue-400"
              disabled={markAllAsRead.isPending}
              onClick={() => markAllAsRead.mutate()}
            >
              {markAllAsRead.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Đang đánh dấu
                </span>
              ) : (
                "Mark all as read"
              )}
            </Button>
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1">
          <ScrollArea className="h-full">
            {notifQuery.isLoading ? (
              <div className="flex h-60 items-center justify-center text-neutral-400">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang tải thông
                báo...
              </div>
            ) : isEmpty ? (
              <div className="flex h-60 flex-col items-center justify-center gap-2 text-neutral-400">
                <p className="text-sm">Bạn chưa có thông báo nào</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-900">
                {(["today", "thisMonth", "earlier"] as SectionKey[]).map(
                  (sectionKey) => {
                    const items = grouped[sectionKey] ?? [];
                    if (items.length === 0) return null;
                    return (
                      <div key={sectionKey}>
                        <div className="bg-black px-4 py-2 text-xs font-semibold text-neutral-400 uppercase">
                          {getSectionLabel(sectionKey)}
                        </div>
                        <ul className="px-2">
                          {items.map((n) => (
                            <li
                              key={n.id}
                              className="flex items-center gap-3 rounded-md px-2 py-3 hover:bg-neutral-900"
                            >
                              <button
                                type="button"
                                className="flex flex-1 items-center gap-3 text-left"
                                onClick={() => handleClickItem(n)}
                              >
                                <Avatar className="h-9 w-9">
                                  {n.sender.image ? (
                                    <Image
                                      src={n.sender.image}
                                      alt={
                                        n.sender.username ?? n.sender.name ?? ""
                                      }
                                      width={36}
                                      height={36}
                                    />
                                  ) : null}
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm">
                                    <span className="font-semibold">
                                      {n.sender.username ??
                                        n.sender.name ??
                                        "Người dùng"}
                                    </span>{" "}
                                    <span className="text-neutral-300">
                                      {getText(n)}
                                    </span>
                                  </p>
                                  <div className="mt-1 flex items-center gap-2 text-xs text-neutral-500">
                                    <span>{timeAgo(n.createdAt)}</span>
                                    {!n.isRead && (
                                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                    )}
                                  </div>
                                </div>
                              </button>

                              {n.post?.images?.[0]?.imageUrl ? (
                                <div className="relative h-12 w-12 overflow-hidden rounded-md">
                                  <Image
                                    src={n.post.images[0].imageUrl}
                                    alt="post"
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-neutral-400"
                                  onClick={() =>
                                    deleteNotif.mutate({ id: n.id })
                                  }
                                  title="Xóa thông báo"
                                >
                                  <MoreHorizontal className="h-5 w-5" />
                                </Button>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  },
                )}

                <Separator className="my-2 bg-neutral-900" />

                {notifQuery.hasNextPage ? (
                  <div className="px-4 py-3">
                    <Button
                      className="w-full"
                      variant="secondary"
                      onClick={() => notifQuery.fetchNextPage()}
                      disabled={notifQuery.isFetchingNextPage}
                    >
                      {notifQuery.isFetchingNextPage ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Đang
                          tải...
                        </span>
                      ) : (
                        "Tải thêm"
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="px-4 py-3 text-center text-xs text-neutral-500">
                    Hết thông báo
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default NotificationCenterModal;
