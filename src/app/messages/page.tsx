import { HydrateClient, api } from "~/trpc/server";
import { auth } from "~/server/auth";
import { Navbar } from "~/app/_components/navbar";
import MessagesShell from "~/app/_components/messages/shell";
import { redirect } from "next/navigation";

export default async function MessagesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  void api.chat.getMyChats.prefetchInfinite({ limit: 20 });

  return (
    <HydrateClient>
      <main className="flex min-h-screen bg-black text-white">
        <Navbar user={session.user} show={false} />

        <div className="ml-16 flex flex-1 justify-start">
          <MessagesShell
            showListOnMobile
            mode="empty"
            title={session.user.name ?? "Messages"}
          />
        </div>
      </main>
    </HydrateClient>
  );
}
