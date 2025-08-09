import { auth } from "~/server/auth";
import { Navbar } from "../_components/navbar";
import { ExploreGrid } from "../_components/explore-grid";
import { api, HydrateClient } from "~/trpc/server";

export default async function Explore() {
  const session = await auth();

  // Prefetch post data for the explore page
  if (session?.user) {
    await api.post.feed.prefetch({ limit: 30 });
  }

  return (
    <main className="flex min-h-screen bg-black text-white">
      <Navbar user={session?.user} />

      <div className="ml-16 flex-1 md:ml-64">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <HydrateClient>
            <ExploreGrid />
          </HydrateClient>
        </div>
      </div>
    </main>
  );
}
