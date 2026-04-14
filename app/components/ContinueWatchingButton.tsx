"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IoPlay } from "react-icons/io5";
import { ref, get } from "firebase/database";
import { useAuth } from "@/app/components/AuthProvider";
import { db } from "@/app/lib/firebase";
import { allSeasons, getEpisodesForSeason, getSeasonByNumber } from "@/app/data/pokemonCatalog";

type LastWatchedPayload = {
  seasonNumber: number;
  episodeNumber: number;
};

type NextEpisodeTarget = {
  seasonNumber: number;
  episodeNumber: number;
};

type WatchedBySeason = Record<number, Record<number, boolean>>;

const LAST_WATCHED_STORAGE_KEY = "pokewatch-last-watched";

const normalizeLastWatched = (value: unknown): LastWatchedPayload | null => {
  if (!value || typeof value !== "object") return null;

  const seasonNumber = Number((value as Record<string, unknown>).seasonNumber);
  const episodeNumber = Number((value as Record<string, unknown>).episodeNumber);

  if (!Number.isInteger(seasonNumber) || seasonNumber <= 0) return null;
  if (!Number.isInteger(episodeNumber) || episodeNumber <= 0) return null;

  return { seasonNumber, episodeNumber };
};

const getLocalLastWatched = () => {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(LAST_WATCHED_STORAGE_KEY);
  if (!raw) return null;

  try {
    return normalizeLastWatched(JSON.parse(raw));
  } catch {
    return null;
  }
};

const getLocalWatchedBySeason = (): WatchedBySeason => {
  if (typeof window === "undefined") return {};

  const result: WatchedBySeason = {};

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key || !key.startsWith("pokewatch-watched-season-")) continue;

    const seasonNumber = Number(key.replace("pokewatch-watched-season-", ""));
    if (!Number.isInteger(seasonNumber) || seasonNumber <= 0) continue;

    const raw = window.localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const byEpisode: Record<number, boolean> = {};

      Object.entries(parsed).forEach(([episodeKey, watched]) => {
        const episodeNumber = Number(episodeKey);
        if (!Number.isInteger(episodeNumber) || episodeNumber <= 0) return;
        byEpisode[episodeNumber] = Boolean(watched);
      });

      result[seasonNumber] = byEpisode;
    } catch {
      // ignore invalid local storage values
    }
  }

  return result;
};

const normalizeWatchedBySeason = (value: unknown): WatchedBySeason => {
  if (!value || typeof value !== "object") return {};

  const result: WatchedBySeason = {};

  Object.entries(value as Record<string, unknown>).forEach(([seasonKey, seasonValue]) => {
    const seasonNumber = Number(seasonKey);
    if (!Number.isInteger(seasonNumber) || seasonNumber <= 0 || !seasonValue || typeof seasonValue !== "object") return;

    const byEpisode: Record<number, boolean> = {};
    Object.entries(seasonValue as Record<string, unknown>).forEach(([episodeKey, watched]) => {
      const episodeNumber = Number(episodeKey);
      if (!Number.isInteger(episodeNumber) || episodeNumber <= 0) return;
      byEpisode[episodeNumber] = Boolean(watched);
    });

    result[seasonNumber] = byEpisode;
  });

  return result;
};

const getLastWatchedFromSeasonProgress = (watchedBySeason: WatchedBySeason): LastWatchedPayload | null => {
  const watchedSeasons = Object.entries(watchedBySeason)
    .map(([seasonKey, episodes]) => {
      const seasonNumber = Number(seasonKey);
      const watchedEpisodes = Object.entries(episodes)
        .filter(([, watched]) => Boolean(watched))
        .map(([episodeKey]) => Number(episodeKey))
        .filter((episodeNumber) => Number.isInteger(episodeNumber) && episodeNumber > 0)
        .sort((a, b) => b - a);

      if (!Number.isInteger(seasonNumber) || seasonNumber <= 0 || watchedEpisodes.length === 0) {
        return null;
      }

      return {
        seasonNumber,
        lastEpisodeWatchedInSeason: watchedEpisodes[0],
      };
    })
    .filter((entry): entry is { seasonNumber: number; lastEpisodeWatchedInSeason: number } => entry !== null)
    .sort((a, b) => b.seasonNumber - a.seasonNumber);

  if (watchedSeasons.length === 0) return null;

  return {
    seasonNumber: watchedSeasons[0].seasonNumber,
    episodeNumber: watchedSeasons[0].lastEpisodeWatchedInSeason,
  };
};

const getOrderedSeasons = () => {
  const unique = new Map<number, (typeof allSeasons)[number]>();

  allSeasons.forEach((season) => {
    if (!unique.has(season.season)) {
      unique.set(season.season, season);
    }
  });

  return [...unique.values()].sort((a, b) => a.season - b.season);
};

const getNextEpisodeTarget = (lastWatched: LastWatchedPayload): NextEpisodeTarget => {
  const orderedSeasons = getOrderedSeasons();
  const currentSeason = getSeasonByNumber(lastWatched.seasonNumber);

  if (!currentSeason || orderedSeasons.length === 0) {
    return lastWatched;
  }

  const totalEpisodes = getEpisodesForSeason(currentSeason).length;
  if (lastWatched.episodeNumber < totalEpisodes) {
    return {
      seasonNumber: lastWatched.seasonNumber,
      episodeNumber: lastWatched.episodeNumber + 1,
    };
  }

  const currentIndex = orderedSeasons.findIndex((season) => season.season === lastWatched.seasonNumber);
  const nextSeason = orderedSeasons[(currentIndex + 1) % orderedSeasons.length] ?? orderedSeasons[0];

  return {
    seasonNumber: nextSeason.season,
    episodeNumber: 1,
  };
};

export default function ContinueWatchingButton() {
  const { user } = useAuth();
  const [lastWatched, setLastWatched] = useState<LastWatchedPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      if (!user || !db) {
        if (isActive) {
          const localProgress = getLastWatchedFromSeasonProgress(getLocalWatchedBySeason());
          setLastWatched(localProgress ?? getLocalLastWatched());
          setLoading(false);
        }
        return;
      }

      try {
        const [watchedBySeasonSnapshot, lastWatchedSnapshot] = await Promise.all([
          get(ref(db, `users/${user.uid}/watchedBySeason`)),
          get(ref(db, `users/${user.uid}/lastWatched`)),
        ]);

        const fromDbProgress = getLastWatchedFromSeasonProgress(normalizeWatchedBySeason(watchedBySeasonSnapshot.val()));
        const fromDbLastWatched = normalizeLastWatched(lastWatchedSnapshot.val());
        const fromLocalProgress = getLastWatchedFromSeasonProgress(getLocalWatchedBySeason());

        if (!isActive) return;
        setLastWatched(fromDbProgress ?? fromDbLastWatched ?? fromLocalProgress ?? getLocalLastWatched());
      } catch {
        if (!isActive) return;
        const fromLocalProgress = getLastWatchedFromSeasonProgress(getLocalWatchedBySeason());
        setLastWatched(fromLocalProgress ?? getLocalLastWatched());
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      isActive = false;
    };
  }, [user]);

  if (loading || !lastWatched) return null;

  const nextTarget = getNextEpisodeTarget(lastWatched);

  return (
    <Link
      href={`/stagione/${nextTarget.seasonNumber}#episodio-${nextTarget.episodeNumber}`}
      className="inline-flex items-center gap-2 rounded bg-red-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-red-500"
    >
      <IoPlay className="text-base" aria-hidden="true" />
      <span>
        Continua S{nextTarget.seasonNumber} · E{nextTarget.episodeNumber}
      </span>
    </Link>
  );
}
