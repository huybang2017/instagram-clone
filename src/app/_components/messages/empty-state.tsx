"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "~/components/ui/button";

export default function EmptyMessagesState({
  onCompose,
}: {
  onCompose?: () => void;
}) {
  return (
    <div className="flex max-w-sm flex-col items-center text-center">
      <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full border-2 border-neutral-700">
        <MessageCircle className="h-12 w-12 text-neutral-400" />
      </div>
      <h2 className="mb-2 text-lg font-semibold">Your messages</h2>
      <p className="mb-6 text-sm text-neutral-400">
        Send a message to start a chat.
      </p>
      <Button
        onClick={onCompose}
        variant="default"
        className="bg-blue-600 hover:bg-blue-500"
      >
        Send message
      </Button>
    </div>
  );
}
