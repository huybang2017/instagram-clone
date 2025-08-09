"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Home,
  Search,
  PlusSquare,
  Heart,
  User,
  MessageCircle,
  Compass,
  Film,
  LogOut,
  Instagram,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { CreatePostModal } from "./create-post-modal";
import { NotificationCenterModal } from "./notification-center-modal";
import { api } from "~/trpc/react";

interface NavbarProps {
  user?: {
    id: string;
    name?: string | null;
    image?: string | null;
    username?: string | null;
  } | null;
  show?: boolean;
}

export function Navbar({ user, show = true }: NavbarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const unreadQuery = api.notification.getUnreadCount.useQuery(undefined, {
    refetchInterval: 15000,
  });

  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Search", href: "/search", icon: Search },
    { label: "Explore", href: "/explore", icon: Compass },
    { label: "Reels", href: "/reels", icon: Film },
    { label: "Messages", href: "/messages", icon: MessageCircle },
    {
      label: "Notifications",
      href: "#",
      icon: Heart,
      onClick: () => setIsNotifOpen(true),
    },
    {
      label: "Create",
      href: "#",
      icon: PlusSquare,
      onClick: () => setIsOpen(true),
    },
    {
      label: "Profile",
      href: user ? `/profile/${user.id}` : "/api/auth/signin",
      icon: User,
    },
  ];

  return (
    <>
      <nav
        className={cn(
          // Use lower z-index so dialogs/modals (z-50) appear above the navbar
          // Make width responsive: collapsed w-16 on all screens, expanded w-16 on mobile and w-64 on md+
          "fixed left-0 z-40 flex h-screen flex-col border-r border-neutral-800 bg-black py-8 transition-all duration-200",
          show ? "w-16 md:w-64" : "w-16",
        )}
      >
        <div className="px-3 pb-5">
          <Link href="/" className="my-3 flex items-center gap-4 rounded-md">
            {/* Show icon on mobile; show wordmark on md+ only when expanded */}
            {show ? (
              <>
                <span className="instagram-logo-font hidden py-5 pl-3 text-xl text-white md:block">
                  Instagram
                </span>
              </>
            ) : (
              <div className="px-2 py-5 text-gray-300 transition-colors hover:bg-neutral-800">
                <Instagram size={24} />
              </div>
            )}
          </Link>
        </div>

        <div className="flex h-full flex-col justify-between">
          <div className="space-y-1 px-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={(e) => {
                    if (item.onClick) {
                      e.preventDefault();
                      item.onClick();
                    }
                  }}
                  className={cn(
                    "flex items-center gap-4 rounded-md px-2 py-3 transition-colors hover:bg-neutral-800",
                    isActive
                      ? "font-semibold text-white"
                      : "font-normal text-gray-300",
                  )}
                >
                  {item.label === "Notifications" ? (
                    <span className="relative inline-block">
                      <item.icon size={24} />
                      {(unreadQuery.data ?? 0) > 0 && (
                        <span className="absolute -top-1 -right-1 inline-block h-2 w-2 rounded-full bg-blue-500" />
                      )}
                    </span>
                  ) : (
                    <item.icon size={24} />
                  )}
                  {show && (
                    <span className="hidden md:inline">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="mt-auto px-3">
            <Link
              href="/api/auth/signout"
              className="flex items-center gap-4 rounded-md px-2 py-3 text-gray-300 transition-colors hover:bg-neutral-800"
            >
              <LogOut size={24} />
              {show && <span className="hidden md:inline">Log Out</span>}
            </Link>
          </div>
        </div>
      </nav>

      <CreatePostModal open={isOpen} onOpenChange={setIsOpen} />
      <NotificationCenterModal
        open={isNotifOpen}
        onOpenChange={setIsNotifOpen}
      />
    </>
  );
}
