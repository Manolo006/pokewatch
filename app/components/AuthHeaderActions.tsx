"use client";

import Link from "next/link";
import { useAuth } from "@/app/components/AuthProvider";

export default function AuthHeaderActions() {
  const { user, loading, logout } = useAuth();
  const username = user?.email?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9._-]/g, "") || "profile";
  const displayName = user?.displayName?.trim() || user?.email?.split("@")[0] || "Profilo";

  if (loading) {
    return <div className="text-xs text-white/60">Caricamento account...</div>;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="rounded border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/90 transition hover:bg-white/10"
        >
          Login
        </Link>
        <Link
          href="/register"
          className="rounded bg-white px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-white/90"
        >
          Registrati
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/profile/${username}`}
        className="max-w-42.5 truncate text-xs text-white/80 underline decoration-white/30 underline-offset-2 transition hover:text-white hover:decoration-white"
      >
        {displayName}
      </Link>
      <button
        type="button"
        onClick={() => void logout()}
        className="rounded border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/90 transition hover:bg-white/10"
      >
        Logout
      </button>
    </div>
  );
}
