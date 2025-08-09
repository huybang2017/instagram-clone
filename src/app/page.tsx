import { Stories } from "~/app/_components/stories";
import { Posts } from "~/app/_components/posts";
import { Navbar } from "~/app/_components/navbar";
import { api, HydrateClient } from "~/trpc/server";
import { auth } from "~/server/auth";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import Link from "next/link";
import { Button } from "~/components/ui/button";

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    void api.post.feed.prefetchInfinite({ limit: 5 });
    void api.story.getActiveStories.prefetchInfinite({ limit: 16 });
  }

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Mock suggested accounts
  const suggestedAccounts = [
    {
      id: "1",
      name: "hythyangg",
      username: "hythyangg",
      image: null,
      followedBy: "prv.meobabil",
    },
    {
      id: "2",
      name: "haznill_",
      username: "haznill_",
      image: null,
      followedBy: null,
    },
    {
      id: "3",
      name: "duma_anh_bao_kia",
      username: "duma_anh_bao_kia",
      image: null,
      followedBy: "pzunnee",
    },
    {
      id: "4",
      name: "congchuangdtrongnhung",
      username: "congchuangdtrongnhung",
      image: null,
      followedBy: "prv.meobabil",
    },
    {
      id: "5",
      name: "meowsaymoahh",
      username: "meowsaymoahh",
      image: null,
      followedBy: "prv.meobabil",
    },
  ];

  return (
    <HydrateClient>
      <main className="flex min-h-screen bg-black text-white">
        <Navbar user={session?.user} />

        {/* Main content area with left offset matching Navbar width */}
        <div className="ml-16 flex flex-1 justify-center md:ml-64">
          {/* Feed column */}
          <div className="w-full max-w-[630px] px-4 pt-8 pb-20">
            {/* Stories */}
            <Stories currentUserId={session?.user?.id} />

            {/* Feed */}
            <Posts />

            {/* You're all caught up message */}
            <div className="mt-8 flex flex-col items-center justify-center rounded-md py-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-white">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M19 6L9 16L5 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">
                You&apos;re all caught up
              </h3>
              <p className="text-sm text-gray-400">
                You&apos;ve seen all new posts from the past 3 days.
              </p>
            </div>
          </div>

          {/* Suggestions sidebar - only visible on larger screens */}
          <div className="hidden lg:block lg:w-[320px] lg:px-4 lg:pt-8">
            {session?.user && (
              <div className="mb-6 flex items-center justify-between">
                <Link
                  href={`/profile/${session.user.id}`}
                  className="flex items-center gap-3"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={session.user.image ?? ""}
                      alt={session.user.name ?? ""}
                    />
                    <AvatarFallback>
                      {getInitials(session.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-white">
                      {session.user.name ?? "User"}
                    </span>
                    <span className="text-sm text-gray-400">
                      {session.user.name ?? "Nguyễn Huy"}
                    </span>
                  </div>
                </Link>
                <Button
                  variant="link"
                  size="sm"
                  className="text-xs font-semibold text-blue-500"
                >
                  Switch
                </Button>
              </div>
            )}

            {/* Suggested accounts */}
            <div className="rounded-md">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-400">
                  Suggested for you
                </h3>
                <Button
                  variant="link"
                  size="sm"
                  className="text-xs font-semibold text-white"
                >
                  See All
                </Button>
              </div>

              <div className="space-y-3">
                {suggestedAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between"
                  >
                    <Link
                      href={`/profile/${account.id}`}
                      className="flex items-center gap-3"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={account.image ?? ""}
                          alt={account.username ?? ""}
                        />
                        <AvatarFallback>
                          {getInitials(account.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-white">
                          {account.username}
                        </span>
                        <span className="text-xs text-gray-400">
                          {account.followedBy
                            ? `Followed by ${account.followedBy}`
                            : `+ 1 more`}
                        </span>
                      </div>
                    </Link>
                    <Button
                      variant="link"
                      size="sm"
                      className="text-xs font-semibold text-blue-500"
                    >
                      Follow
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer links */}
            <div className="mt-8">
              <div className="mb-4 flex flex-wrap gap-x-2 gap-y-1 text-xs text-gray-500">
                <a href="#" className="hover:underline">
                  About
                </a>
                <span>·</span>
                <a href="#" className="hover:underline">
                  Help
                </a>
                <span>·</span>
                <a href="#" className="hover:underline">
                  Press
                </a>
                <span>·</span>
                <a href="#" className="hover:underline">
                  API
                </a>
                <span>·</span>
                <a href="#" className="hover:underline">
                  Jobs
                </a>
                <span>·</span>
                <a href="#" className="hover:underline">
                  Privacy
                </a>
                <span>·</span>
                <a href="#" className="hover:underline">
                  Terms
                </a>
                <span>·</span>
                <a href="#" className="hover:underline">
                  Locations
                </a>
                <span>·</span>
                <a href="#" className="hover:underline">
                  Language
                </a>
                <span>·</span>
                <a href="#" className="hover:underline">
                  Meta Verified
                </a>
              </div>
              <p className="text-xs text-gray-500">
                © 2023 INSTAGRAM FROM META
              </p>
            </div>
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
