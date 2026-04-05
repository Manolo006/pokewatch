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
          setLastWatched(getLocalLastWatched());
          setLoading(false);
        }
        return;
      }

      try {
        const snapshot = await get(ref(db, `users/${user.uid}/lastWatched`));
        const fromDb = normalizeLastWatched(snapshot.val());

        if (!isActive) return;
        setLastWatched(fromDb ?? getLocalLastWatched());
      } catch {
        if (!isActive) return;
        setLastWatched(getLocalLastWatched());
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
