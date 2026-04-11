import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/components/AuthProvider";
import { db } from "@/app/lib/firebase";
import { get, ref } from "firebase/database";

type PublicProfileSettings = {
  profileImageUrl?: string | null;
  profileImageBgColor?: string | null;
};

export default function AuthHeaderActions() {
  const { user, loading, logout } = useAuth();
  const displayName = user?.displayName?.trim() || user?.email?.split("@")[0] || "Profilo";
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [profileImageBgColor, setProfileImageBgColor] = useState("#e50914");

  useEffect(() => {
    let active = true;

    if (!user) {
      return () => {
        active = false;
      };
    }

    const loadProfile = async () => {
      const cacheKey = `pokewatch-profile-settings-${user.uid}`;

      if (typeof window !== "undefined") {
        try {
          const raw = window.localStorage.getItem(cacheKey);
          if (raw && active) {
            const cached = JSON.parse(raw) as PublicProfileSettings;
            setProfileImageUrl(cached.profileImageUrl ?? null);
            setProfileImageBgColor(cached.profileImageBgColor ?? "#e50914");
          }
        } catch {
          // ignore cache read errors
        }
      }

      if (!db) return;

      try {
        const snapshot = await get(ref(db, `users/${user.uid}/publicProfile`));
        if (!active || !snapshot.exists()) return;

        const value = snapshot.val() as PublicProfileSettings;
        setProfileImageUrl(value.profileImageUrl ?? null);
        setProfileImageBgColor(value.profileImageBgColor ?? "#e50914");
      } catch {
        // keep cached/default avatar on read errors
      }
    };

    void loadProfile();

    return () => {
      active = false;
    };
  }, [user]);

  if (loading) {
    return <div className="ml-auto text-xs text-white/60">Caricamento account...</div>;
  }

  if (!user) {
    return (
      <div className="ml-auto flex items-center gap-2">
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
    <div className="ml-auto flex items-center gap-2">
      <Link
        href="/profile"
        className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-white/25 text-[10px] font-black text-white/90 transition hover:border-white/60"
        style={{ backgroundColor: profileImageBgColor }}
        aria-label="Vai al profilo"
      >
        {profileImageUrl ? (
          <img src={profileImageUrl} alt="Avatar utente" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          displayName.charAt(0).toUpperCase()
        )}
      </Link>
      <Link
        href="/profile"
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
