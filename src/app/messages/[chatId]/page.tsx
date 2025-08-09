import { HydrateClient, api } from "~/trpc/server";
import { auth } from "~/server/auth";
import { Navbar } from "../../_components/navbar";
import MessagesShell from "~/app/_components/messages/shell";
import { redirect } from "next/navigation";

export default async function ChatPage({
  params,
}: {
  params: { chatId: string };
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  void api.chat.getMyChats.prefetchInfinite({ limit: 20 });
  void api.chat.getChat.prefetch({ chatId: params.chatId });
  void api.chat.getMessages.prefetchInfinite({
    chatId: params.chatId,
    limit: 30,
  });

  return (
    <HydrateClient>
      <main className="flex min-h-screen bg-black text-white">
        <Navbar user={session.user} show={false} />

        <div className="ml-16 flex flex-1 justify-start">
          <MessagesShell
            mode="chat"
            chatId={params.chatId}
            title={session.user.name ?? "Messages"}
          />
        </div>
      </main>
    </HydrateClient>
  );
}
