"use client";

import { useEffect, useMemo, useState } from "react";
import NextImage from "next/image";
import type { PokemonEpisode } from "@/app/data/pokemonCatalog";

type EpisodeFillerType = "non-filler" | "filler" | "misto";

type SeasonEpisodesListProps = {
  seasonNumber: number;
  episodes: PokemonEpisode[];
};

const fillerTypeLabels: Record<EpisodeFillerType, string> = {
  "non-filler": "Non filler",
  filler: "Filler",
  misto: "Misto",
};

const fillerTypeBadgeClasses: Record<EpisodeFillerType, string> = {
  "non-filler": "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
  filler: "bg-rose-500/20 text-rose-200 border-rose-400/30",
  misto: "bg-amber-500/20 text-amber-100 border-amber-400/30",
};

const COOKIE_PREFIX = "pokewatch-filler-season";
const WATCHED_COOKIE_PREFIX = "pokewatch-watched-season";

const getCookieName = (seasonNumber: number) => `${COOKIE_PREFIX}-${seasonNumber}`;
const getWatchedCookieName = (seasonNumber: number) => `${WATCHED_COOKIE_PREFIX}-${seasonNumber}`;

const parseFillerCookie = (rawValue: string | null): Record<number, EpisodeFillerType> => {
  if (!rawValue) return {};

  try {
    const parsed = JSON.parse(decodeURIComponent(rawValue)) as Record<string, string>;
    const result: Record<number, EpisodeFillerType> = {};

    Object.entries(parsed).forEach(([key, value]) => {
      const episodeNumber = Number(key);
      if (!Number.isInteger(episodeNumber)) return;

      if (value === "non-filler" || value === "filler" || value === "misto") {
        result[episodeNumber] = value;
      }
    });

    return result;
  } catch {
    return {};
  }
};

const getCookieValue = (cookieName: string) => {
  if (typeof document === "undefined") return null;

  const target = `${cookieName}=`;
  const parts = document.cookie.split(";");

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith(target)) {
      return trimmed.slice(target.length);
    }
  }

  return null;
};

const parseWatchedCookie = (rawValue: string | null): Record<number, boolean> => {
  if (!rawValue) return {};

  try {
    const parsed = JSON.parse(decodeURIComponent(rawValue)) as Record<string, boolean>;
    const result: Record<number, boolean> = {};

    Object.entries(parsed).forEach(([key, value]) => {
      const episodeNumber = Number(key);
      if (!Number.isInteger(episodeNumber)) return;
      result[episodeNumber] = Boolean(value);
    });

    return result;
  } catch {
    return {};
  }
};

export default function SeasonEpisodesList({ seasonNumber, episodes }: SeasonEpisodesListProps) {
  const [fillerByEpisode, setFillerByEpisode] = useState<Record<number, EpisodeFillerType>>(() => {
    const cookieName = getCookieName(seasonNumber);
    const storedValue = getCookieValue(cookieName);
    return parseFillerCookie(storedValue);
  });
  const [watchedByEpisode, setWatchedByEpisode] = useState<Record<number, boolean>>(() => {
    const cookieName = getWatchedCookieName(seasonNumber);
    const storedValue = getCookieValue(cookieName);
    return parseWatchedCookie(storedValue);
  });

  useEffect(() => {
    const cookieName = getCookieName(seasonNumber);
    const serialized = encodeURIComponent(JSON.stringify(fillerByEpisode));

    document.cookie = `${cookieName}=${serialized}; path=/; max-age=31536000; samesite=lax`;
  }, [seasonNumber, fillerByEpisode]);

  useEffect(() => {
    const cookieName = getWatchedCookieName(seasonNumber);
    const serialized = encodeURIComponent(JSON.stringify(watchedByEpisode));

    document.cookie = `${cookieName}=${serialized}; path=/; max-age=31536000; samesite=lax`;
  }, [seasonNumber, watchedByEpisode]);

  const stats = useMemo(() => {
    const initial = {
      "non-filler": 0,
      filler: 0,
      misto: 0,
      unclassified: 0,
    } as Record<EpisodeFillerType | "unclassified", number>;

    return episodes.reduce(
      (acc, episode) => {
        const value = fillerByEpisode[episode.number];

        if (!value) {
          acc.unclassified += 1;
          return acc;
        }

        acc[value] += 1;
        return acc;
      },
      initial
    );
  }, [episodes, fillerByEpisode]);

  const watchedCount = useMemo(
    () => episodes.reduce((count, episode) => count + (watchedByEpisode[episode.number] ? 1 : 0), 0),
    [episodes, watchedByEpisode]
  );

  const completionPercentage = episodes.length > 0 ? Math.round((watchedCount / episodes.length) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="space-y-2 rounded-lg border border-white/10 bg-zinc-900/60 p-3">
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-red-500 transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-white/70">
          <span>Completamento visione</span>
          <span>
            {watchedCount}/{episodes.length} episodi ({completionPercentage}%)
          </span>
        </div>
      </div>

      <h2 className="text-2xl font-bold">Episodi</h2>

      <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
        <span className="rounded-full border border-emerald-400/30 bg-emerald-500/20 px-3 py-1 text-emerald-200">
          Non filler: {stats["non-filler"]}
        </span>
        <span className="rounded-full border border-rose-400/30 bg-rose-500/20 px-3 py-1 text-rose-200">
          Filler: {stats.filler}
        </span>
        <span className="rounded-full border border-amber-400/30 bg-amber-500/20 px-3 py-1 text-amber-100">
          Misto: {stats.misto}
        </span>
        <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-white/80">
          Da classificare: {stats.unclassified}
        </span>
      </div>

      {episodes.map((episode) => {
        const selectedType = fillerByEpisode[episode.number];
        const isWatched = Boolean(watchedByEpisode[episode.number]);

        return (
          <article
            key={episode.number}
            className={`rounded-lg border p-4 transition-colors ${
              isWatched
                ? "border-blue-400/40 bg-blue-900/35"
                : "border-white/10 bg-zinc-900/80"
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="relative h-24 w-full overflow-hidden rounded-md border border-white/10 bg-black sm:h-20 sm:w-36 sm:shrink-0">
                {episode.thumbnailUrl ? (
                  <NextImage
                    src={episode.thumbnailUrl}
                    alt={episode.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 144px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-white/40">
                    Nessuna thumbnail
                  </div>
                )}
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white/90">
                {episode.number}
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-bold sm:text-lg">{episode.title}</h3>
                  <span className="text-xs text-white/60">{episode.duration}</span>
                </div>

                <p className="text-sm text-white/70">{episode.synopsis}</p>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-white/70">Tipo episodio:</span>

                  <div className="flex flex-wrap gap-1">
                    {(["non-filler", "filler", "misto"] as EpisodeFillerType[]).map((type) => {
                      const isActive = selectedType === type;

                      return (
                        <button
                          key={`${episode.number}-${type}`}
                          type="button"
                          onClick={() => {
                            setFillerByEpisode((prev) => ({ ...prev, [episode.number]: type }));
                          }}
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                            isActive
                              ? fillerTypeBadgeClasses[type]
                              : "border-white/20 bg-white/5 text-white/70 hover:bg-white/10"
                          }`}
                          aria-pressed={isActive}
                        >
                          {fillerTypeLabels[type]}
                        </button>
                      );
                    })}
                  </div>

                  <div className="ml-1 h-5 w-px bg-white/15" aria-hidden="true" />

                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                      selectedType
                        ? fillerTypeBadgeClasses[selectedType]
                        : "border-white/20 bg-white/5 text-white/75"
                    }`}
                  >
                    {selectedType ? fillerTypeLabels[selectedType] : "Non classificato"}
                  </span>
                </div>

                {episode.youtubeUrl ? (
                  <a
                    href={episode.youtubeUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => {
                      setWatchedByEpisode((prev) => ({ ...prev, [episode.number]: true }));
                    }}
                    className="inline-flex pt-1 text-xs font-semibold text-red-300 transition hover:text-red-200"
                  >
                    Guarda su YouTube
                  </a>
                ) : null}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
