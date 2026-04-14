'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/components/AuthProvider";
import { db } from "@/app/lib/firebase";
import { get, ref } from "firebase/database";
import {
  getUIText,
  normalizeUILanguage,
  type UILanguage,
  UI_LANGUAGE_CHANGE_EVENT,
  UI_LANGUAGE_STORAGE_KEY,
} from "@/app/lib/uiLanguage";

type PublicProfileSettings = {
  profileImageUrl?: string | null;
  profileImageBgColor?: string | null;
};

export default function AuthHeaderActions() {
  const { user, loading, logout } = useAuth();
  const displayName = user?.displayName?.trim() || user?.email?.split("@")[0] || "Profilo";
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [profileImageBgColor, setProfileImageBgColor] = useState("#e50914");
  const [episodeTitleLanguage, setEpisodeTitleLanguage] = useState<UILanguage>("it");

  useEffect(() => {
    const readLanguage = () => {
      if (typeof window === "undefined") return;

      const fromStorage = normalizeUILanguage(window.localStorage.getItem(UI_LANGUAGE_STORAGE_KEY));
      setEpisodeTitleLanguage(fromStorage);

      const fromCookie = document.cookie
        .split(";")
        .map((entry) => entry.trim())
        .find((entry) => entry.startsWith(`${UI_LANGUAGE_STORAGE_KEY}=`))
        ?.split("=")[1]
        ?.toLowerCase();

      if (fromCookie === "it" || fromCookie === "en") {
        setEpisodeTitleLanguage(fromCookie);
      }
    };

    readLanguage();
    window.addEventListener(UI_LANGUAGE_CHANGE_EVENT, readLanguage);

    return () => {
      window.removeEventListener(UI_LANGUAGE_CHANGE_EVENT, readLanguage);
    };
  }, []);

  const toggleEpisodeTitleLanguage = () => {
    const nextLanguage: UILanguage = episodeTitleLanguage === "it" ? "en" : "it";
    setEpisodeTitleLanguage(nextLanguage);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(UI_LANGUAGE_STORAGE_KEY, nextLanguage);
      document.cookie = `${UI_LANGUAGE_STORAGE_KEY}=${nextLanguage}; path=/; max-age=31536000; samesite=lax`;
      window.dispatchEvent(new Event(UI_LANGUAGE_CHANGE_EVENT));

      if (window.location.pathname.startsWith("/stagione/")) {
        window.location.reload();
      }
    }
  };

  const currentLanguageCode = episodeTitleLanguage === "it" ? "IT" : "EN";
  const currentLanguageFlagUrl =
    episodeTitleLanguage === "it"
      ? "https://flagcdn.com/w40/it.png"
      : "https://flagcdn.com/w40/gb.png";

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
    return <div className="ml-auto text-xs text-white/60">{getUIText("loadingAccount", episodeTitleLanguage)}</div>;
  }

  if (!user) {
    return (
      <div className="ml-auto flex items-center gap-2">
        <Link
          href="/login"
          className="rounded border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/90 transition hover:bg-white/10"
        >
          {getUIText("login", episodeTitleLanguage)}
        </Link>
        <Link
          href="/register"
          className="rounded bg-white px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-white/90"
        >
          {getUIText("register", episodeTitleLanguage)}
        </Link>
        <button
          type="button"
          onClick={toggleEpisodeTitleLanguage}
          className="inline-flex items-center gap-1.5 rounded border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/90 transition hover:bg-white/10"
          aria-label="Cambia lingua titoli episodio"
        >
          <img src={currentLanguageFlagUrl} alt={currentLanguageCode} className="h-3.5 w-5 rounded-[2px] object-cover" />
          <span>{currentLanguageCode}</span>
        </button>
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
        {getUIText("logout", episodeTitleLanguage)}
      </button>
      <button
        type="button"
        onClick={toggleEpisodeTitleLanguage}
        className="inline-flex items-center gap-1.5 rounded border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/90 transition hover:bg-white/10"
        aria-label="Cambia lingua titoli episodio"
      >
        <img src={currentLanguageFlagUrl} alt={currentLanguageCode} className="h-3.5 w-5 rounded-[2px] object-cover" />
        <span>{currentLanguageCode}</span>
      </button>
    </div>
  );
}
