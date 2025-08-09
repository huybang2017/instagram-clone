import { Navbar } from "~/app/_components/navbar";
import { HydrateClient, api } from "~/trpc/server";
import { auth } from "~/server/auth";
import { ReelsFeed } from "~/app/_components/reels-feed";

export default async function Reels() {
  const session = await auth();

  // Prefetch initial feed data for smoother hydration
  void api.post.feed.prefetch();

  return (
    <HydrateClient>
      <main className="flex min-h-screen bg-black text-white">
        <Navbar user={session?.user} />

        <div className="ml-16 flex w-full justify-center md:ml-64">
          <div className="w-full max-w-[720px] px-4 pt-6 pb-6">
            <ReelsFeed />
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
