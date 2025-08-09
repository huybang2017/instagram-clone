"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export function SessionStatus() {
  const { data: session } = useSession();

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center text-2xl text-white">
        {session && <span>Logged in as {session.user?.name}</span>}
      </p>
      {session ? (
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
        >
          Sign out
        </button>
      ) : (
        <Link
          href="/auth/signin"
          className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
        >
          Sign in
        </Link>
      )}
    </div>
  );
}
