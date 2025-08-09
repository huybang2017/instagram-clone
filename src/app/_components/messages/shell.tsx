"use client";

import { useState } from "react";
import ChatList from "./chat-list";
import NewMessageDialog from "./new-message-dialog";
import EmptyMessagesState from "./empty-state";
import ChatWindow from "./chat-window";

export default function MessagesShell({
  mode,
  chatId,
  showListOnMobile = false,
  title,
}: {
  mode: "empty" | "chat";
  chatId?: string;
  showListOnMobile?: boolean;
  title?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex w-full">
      {/* Left: chat list */}
      <aside className="hidden w-[350px] border-r border-neutral-800 lg:block">
        <ChatList onCompose={() => setOpen(true)} title={title} />
      </aside>

      {/* Mobile: optionally show list full width */}
      {showListOnMobile && (
        <div className="flex w-full lg:hidden">
          <ChatList onCompose={() => setOpen(true)} title={title} />
        </div>
      )}

      {/* Right: content (hidden on mobile when showing list) */}
      <section
        className={`flex w-full items-center justify-center ${
          showListOnMobile ? "hidden lg:flex" : "flex"
        }`}
      >
        {mode === "empty" ? (
          <EmptyMessagesState onCompose={() => setOpen(true)} />
        ) : (
          chatId && <ChatWindow chatId={chatId} />
        )}
      </section>

      <NewMessageDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
