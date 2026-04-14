"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import NextImage from "next/image";
import type { PokemonEpisode } from "@/app/data/pokemonCatalog";
import { ref, get, set } from "firebase/database";
import { db } from "@/app/lib/firebase";
import { useAuth } from "@/app/components/AuthProvider";
import ashBadgeSeasonCards from "@/app/data/ashBadgeSeasonCards.json";
import {
  getUIText,
  normalizeUILanguage,
  UI_LANGUAGE_CHANGE_EVENT,
  UI_LANGUAGE_STORAGE_KEY,
  type UILanguage,
} from "@/app/lib/uiLanguage";

type EpisodeFillerType = "non-filler" | "filler" | "misto";
type BadgeUnlockMilestone = {
  key: string;
  title: string;
  itemName: string;
  badgeSpriteId?: number;
  unlockTarget: {
    season: number;
    episode: number;
  };
};

type CommunityEpisodeStats = {
  "non-filler": number;
  filler: number;
  misto: number;
  total: number;
  consensus: EpisodeFillerType | null;
};

type SeasonEpisodesListProps = {
  seasonNumber: number;
  episodes: PokemonEpisode[];
  localizedEpisodesByLanguage?: Partial<Record<"it" | "en", PokemonEpisode[]>>;
};

const fillerTypeBadgeClasses: Record<EpisodeFillerType, string> = {
  "non-filler": "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
  filler: "bg-rose-500/20 text-rose-200 border-rose-400/30",
  misto: "bg-amber-500/20 text-amber-100 border-amber-400/30",
};

const FILLER_STORAGE_PREFIX = "pokewatch-filler-season";
const WATCHED_STORAGE_PREFIX = "pokewatch-watched-season";
const LAST_WATCHED_STORAGE_KEY = "pokewatch-last-watched";

const BADGE_UNLOCK_MILESTONES: BadgeUnlockMilestone[] = (
  ashBadgeSeasonCards as Array<{ badges: BadgeUnlockMilestone[] }>
).flatMap((card) => card.badges);

const getPokeApiItemSpriteUrl = (itemName: string) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${itemName}.png`;

const getPokeApiBadgeSpriteUrl = (badgeId: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/badges/${badgeId}.png`;

const getBadgeImageUrl = (badge: BadgeUnlockMilestone) =>
  badge.badgeSpriteId ? getPokeApiBadgeSpriteUrl(badge.badgeSpriteId) : getPokeApiItemSpriteUrl(badge.itemName);

const BADGES_BY_TARGET = BADGE_UNLOCK_MILESTONES.reduce<Record<string, BadgeUnlockMilestone[]>>((acc, badge) => {
  const key = `${badge.unlockTarget.season}-${badge.unlockTarget.episode}`;
  if (!acc[key]) acc[key] = [];
  acc[key].push(badge);
  return acc;
}, {});

const getFillerStorageKey = (seasonNumber: number) => `${FILLER_STORAGE_PREFIX}-${seasonNumber}`;
const getWatchedStorageKey = (seasonNumber: number) => `${WATCHED_STORAGE_PREFIX}-${seasonNumber}`;

const extractYouTubeVideoId = (youtubeUrl?: string) => {
  if (!youtubeUrl) return null;

  try {
    const parsedUrl = new URL(youtubeUrl);

    if (parsedUrl.hostname.includes("youtu.be")) {
      return parsedUrl.pathname.replace("/", "") || null;
    }

    if (parsedUrl.hostname.includes("youtube.com")) {
      return parsedUrl.searchParams.get("v");
    }

    return null;
  } catch {
    return null;
  }
};

const getYouTubeEmbedUrl = (videoId: string) => {
  const params = new URLSearchParams({
    autoplay: "1",
    rel: "0",
    controls: "1",
    fs: "1",
    playsinline: "1",
    iv_load_policy: "3",
    color: "white",
    hl: "it",
    enablejsapi: "1",
  });

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
};

const parseFillerStoredValue = (rawValue: string | null): Record<number, EpisodeFillerType> => {
  if (!rawValue) return {};

  try {
    const parsed = JSON.parse(rawValue) as Record<string, string>;
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

const parseWatchedStoredValue = (rawValue: string | null): Record<number, boolean> => {
  if (!rawValue) return {};

  try {
    const parsed = JSON.parse(rawValue) as Record<string, boolean>;
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

const normalizeWatchedRecord = (value: unknown): Record<number, boolean> => {
  if (!value || typeof value !== "object") return {};

  const result: Record<number, boolean> = {};

  Object.entries(value as Record<string, unknown>).forEach(([key, entry]) => {
    const episodeNumber = Number(key);
    if (!Number.isInteger(episodeNumber)) return;
    result[episodeNumber] = Boolean(entry);
  });

  return result;
};

const buildCommunityStats = (value: unknown): Record<number, CommunityEpisodeStats> => {
  if (!value || typeof value !== "object") {
    return {};
  }

  const byEpisode: Record<number, CommunityEpisodeStats> = {};

  Object.entries(value as Record<string, unknown>).forEach(([episodeKey, episodeValue]) => {
    const episodeNumber = Number(episodeKey);
    if (!Number.isInteger(episodeNumber) || !episodeValue || typeof episodeValue !== "object") {
      return;
    }

    const votesValue = (episodeValue as Record<string, unknown>).votes;
    if (!votesValue || typeof votesValue !== "object") {
      byEpisode[episodeNumber] = {
        "non-filler": 0,
        filler: 0,
        misto: 0,
        total: 0,
        consensus: null,
      };
      return;
    }

    const stats: CommunityEpisodeStats = {
      "non-filler": 0,
      filler: 0,
      misto: 0,
      total: 0,
      consensus: null,
    };

    Object.values(votesValue as Record<string, unknown>).forEach((vote) => {
      if (vote === "non-filler" || vote === "filler" || vote === "misto") {
        stats[vote] += 1;
        stats.total += 1;
      }
    });

    let consensus: EpisodeFillerType | null = null;
    let maxVotes = 0;
    (["non-filler", "filler", "misto"] as EpisodeFillerType[]).forEach((type) => {
      if (stats[type] > maxVotes) {
        maxVotes = stats[type];
        consensus = type;
      }
    });

    stats.consensus = stats.total > 0 ? consensus : null;
    byEpisode[episodeNumber] = stats;
  });

  return byEpisode;
};

export default function SeasonEpisodesList({
  seasonNumber,
  episodes,
  localizedEpisodesByLanguage,
}: SeasonEpisodesListProps) {
  const { user } = useAuth();
  const [episodeTitleLanguage, setEpisodeTitleLanguage] = useState<UILanguage>("it");
  const [fillerByEpisode, setFillerByEpisode] = useState<Record<number, EpisodeFillerType>>({});
  const [watchedByEpisode, setWatchedByEpisode] = useState<Record<number, boolean>>({});
  const [communityByEpisode, setCommunityByEpisode] = useState<Record<number, CommunityEpisodeStats>>({});
  const [openEpisodeNumber, setOpenEpisodeNumber] = useState<number | null>(null);
  const [openEpisodeMenuNumber, setOpenEpisodeMenuNumber] = useState<number | null>(null);
  const isFillerLoadedRef = useRef(false);
  const canPersistWatchedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const applyLanguageFromStorage = () => {
      setEpisodeTitleLanguage(normalizeUILanguage(window.localStorage.getItem(UI_LANGUAGE_STORAGE_KEY)));
    };

    applyLanguageFromStorage();
    window.addEventListener("storage", applyLanguageFromStorage);
    window.addEventListener(UI_LANGUAGE_CHANGE_EVENT, applyLanguageFromStorage);

    return () => {
      window.removeEventListener("storage", applyLanguageFromStorage);
      window.removeEventListener(UI_LANGUAGE_CHANGE_EVENT, applyLanguageFromStorage);
    };
  }, []);

  const renderedEpisodes = useMemo(() => {
    const localizedEpisodes = localizedEpisodesByLanguage?.[episodeTitleLanguage];
    if (localizedEpisodes && localizedEpisodes.length > 0) {
      return localizedEpisodes;
    }

    return episodes;
  }, [episodeTitleLanguage, episodes, localizedEpisodesByLanguage]);

  const loadCommunityVotes = useCallback(async () => {
    if (!db) {
      setCommunityByEpisode({});
      return;
    }

    try {
      const communityRef = ref(db, `community/fillerVotesBySeason/${seasonNumber}`);
      const snapshot = await get(communityRef);
      const raw = snapshot.val();
      setCommunityByEpisode(buildCommunityStats(raw));

      if (user && raw && typeof raw === "object") {
        const userSelections: Record<number, EpisodeFillerType> = {};

        Object.entries(raw as Record<string, unknown>).forEach(([episodeKey, episodeValue]) => {
          const episodeNumber = Number(episodeKey);
          if (!Number.isInteger(episodeNumber) || !episodeValue || typeof episodeValue !== "object") return;

          const votesValue = (episodeValue as Record<string, unknown>).votes;
          if (!votesValue || typeof votesValue !== "object") return;

          const userVote = (votesValue as Record<string, unknown>)[user.uid];
          if (userVote === "non-filler" || userVote === "filler" || userVote === "misto") {
            userSelections[episodeNumber] = userVote;
          }
        });

        if (Object.keys(userSelections).length > 0) {
          setFillerByEpisode((prev) => ({ ...prev, ...userSelections }));
        }
      }
    } catch {
      setCommunityByEpisode({});
    }
  }, [seasonNumber, user]);

  useEffect(() => {
    isFillerLoadedRef.current = false;

    if (typeof window === "undefined") return;

    const storageKey = getFillerStorageKey(seasonNumber);
    const storedValue = window.localStorage.getItem(storageKey);
    setFillerByEpisode(parseFillerStoredValue(storedValue));
    isFillerLoadedRef.current = true;
  }, [seasonNumber]);

  useEffect(() => {
    if (!isFillerLoadedRef.current || typeof window === "undefined") return;

    const storageKey = getFillerStorageKey(seasonNumber);
    window.localStorage.setItem(storageKey, JSON.stringify(fillerByEpisode));
  }, [seasonNumber, fillerByEpisode]);

  useEffect(() => {
    void loadCommunityVotes();
  }, [loadCommunityVotes]);

  useEffect(() => {
    let isActive = true;
    canPersistWatchedRef.current = false;

    const loadWatchedState = async () => {
      if (!user || !db) {
        if (typeof window === "undefined") return;
        const storageKey = getWatchedStorageKey(seasonNumber);
        const storedValue = window.localStorage.getItem(storageKey);
        if (isActive) {
          setWatchedByEpisode(parseWatchedStoredValue(storedValue));
          canPersistWatchedRef.current = true;
        }
        return;
      }

      const watchedRef = ref(db, `users/${user.uid}/watchedBySeason/${seasonNumber}`);

      try {
        const snapshot = await get(watchedRef);
        if (isActive) {
          setWatchedByEpisode(normalizeWatchedRecord(snapshot.val()));
        }
      } catch {
        if (!isActive) return;
        if (typeof window === "undefined") return;
        const storageKey = getWatchedStorageKey(seasonNumber);
        const storedValue = window.localStorage.getItem(storageKey);
        setWatchedByEpisode(parseWatchedStoredValue(storedValue));
      } finally {
        if (isActive) {
          canPersistWatchedRef.current = true;
        }
      }
    };

    void loadWatchedState();

    return () => {
      isActive = false;
    };
  }, [seasonNumber, user]);

  useEffect(() => {
    if (!canPersistWatchedRef.current || typeof window === "undefined") return;

    if (!user || !db) {
      const storageKey = getWatchedStorageKey(seasonNumber);
      window.localStorage.setItem(storageKey, JSON.stringify(watchedByEpisode));
      return;
    }

    const watchedRef = ref(db, `users/${user.uid}/watchedBySeason/${seasonNumber}`);
    void set(watchedRef, watchedByEpisode).catch(() => {
      const storageKey = getWatchedStorageKey(seasonNumber);
      window.localStorage.setItem(storageKey, JSON.stringify(watchedByEpisode));
    });
  }, [seasonNumber, watchedByEpisode, user]);

  const stats = useMemo(() => {
    const initial = {
      "non-filler": 0,
      filler: 0,
      misto: 0,
      unclassified: 0,
    } as Record<EpisodeFillerType | "unclassified", number>;

    return renderedEpisodes.reduce(
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
  }, [renderedEpisodes, fillerByEpisode]);

  const watchedCount = useMemo(
    () => renderedEpisodes.reduce((count, episode) => count + (watchedByEpisode[episode.number] ? 1 : 0), 0),
    [renderedEpisodes, watchedByEpisode]
  );

  const completionPercentage =
    renderedEpisodes.length > 0 ? Math.round((watchedCount / renderedEpisodes.length) * 100) : 0;

  const fillerTypeLabelByLanguage: Record<EpisodeFillerType, string> = {
    "non-filler": getUIText("nonFiller", episodeTitleLanguage),
    filler: getUIText("filler", episodeTitleLanguage),
    misto: getUIText("mixed", episodeTitleLanguage),
  };

  const voteEpisodeType = (episodeNumber: number, type: EpisodeFillerType) => {
    setFillerByEpisode((prev) => ({ ...prev, [episodeNumber]: type }));

    if (!user || !db) return;

    const voteRef = ref(db, `community/fillerVotesBySeason/${seasonNumber}/${episodeNumber}/votes/${user.uid}`);
    void set(voteRef, type).then(() => {
      void loadCommunityVotes();
    });
  };

  const markEpisodeAsWatched = (episodeNumber: number) => {
    setWatchedByEpisode((prev) => ({ ...prev, [episodeNumber]: true }));

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        LAST_WATCHED_STORAGE_KEY,
        JSON.stringify({
          seasonNumber,
          episodeNumber,
          updatedAt: Date.now(),
        })
      );
    }

    if (user && db) {
      const lastWatchedRef = ref(db, `users/${user.uid}/lastWatched`);
      void set(lastWatchedRef, {
        seasonNumber,
        episodeNumber,
        updatedAt: Date.now(),
      });
    }
  };

  const unmarkEpisodeAsWatched = (episodeNumber: number) => {
    setWatchedByEpisode((prev) => ({ ...prev, [episodeNumber]: false }));
    setOpenEpisodeMenuNumber(null);
  };

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
          <span>{getUIText("completion", episodeTitleLanguage)}</span>
          <span>
            {watchedCount}/{renderedEpisodes.length} {getUIText("episodes", episodeTitleLanguage)} ({completionPercentage}%)
          </span>
        </div>
      </div>

      <h2 className="text-2xl font-bold">{getUIText("episodes", episodeTitleLanguage)}</h2>

      <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
        <span className="rounded-full border border-emerald-400/30 bg-emerald-500/20 px-3 py-1 text-emerald-200">
          {getUIText("nonFiller", episodeTitleLanguage)}: {stats["non-filler"]}
        </span>
        <span className="rounded-full border border-rose-400/30 bg-rose-500/20 px-3 py-1 text-rose-200">
          {getUIText("filler", episodeTitleLanguage)}: {stats.filler}
        </span>
        <span className="rounded-full border border-amber-400/30 bg-amber-500/20 px-3 py-1 text-amber-100">
          {getUIText("mixed", episodeTitleLanguage)}: {stats.misto}
        </span>
        <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-white/80">
          {getUIText("classifyPending", episodeTitleLanguage)}: {stats.unclassified}
        </span>
      </div>

      {renderedEpisodes.map((episode) => {
        const selectedType = fillerByEpisode[episode.number];
        const isWatched = Boolean(watchedByEpisode[episode.number]);
        const unlockedBadges = BADGES_BY_TARGET[`${seasonNumber}-${episode.number}`] ?? [];
        const community = communityByEpisode[episode.number];
        const youtubeVideoId = extractYouTubeVideoId(episode.youtubeUrl);
        const isPlayerOpen = openEpisodeNumber === episode.number;
        const communityPercent =
          community && community.consensus && community.total > 0
            ? Math.round((community[community.consensus] / community.total) * 100)
            : 0;

        return (
          <article
            key={episode.number}
            id={`episodio-${episode.number}`}
            className={`rounded-lg border p-4 transition-colors ${
              isWatched
                ? "border-blue-400/40 bg-blue-900/35"
                : "border-white/10 bg-zinc-900/80"
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="relative h-32 w-full overflow-hidden rounded-md border border-white/10 bg-black sm:h-28 sm:w-48 sm:shrink-0">
                {episode.thumbnailUrl ? (
                  <NextImage
                    src={episode.thumbnailUrl}
                    alt={episode.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 192px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-white/40">
                    {getUIText("noThumbnail", episodeTitleLanguage)}
                  </div>
                )}
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white/90">
                {episode.number}
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-bold sm:text-lg">{episode.title}</h3>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/60">{episode.duration}</span>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenEpisodeMenuNumber((prev) => (prev === episode.number ? null : episode.number))
                          }
                          className="rounded border border-white/20 bg-white/5 px-2 py-1 text-sm leading-none text-white/80 transition hover:bg-white/10"
                          aria-label={getUIText("episodeActions", episodeTitleLanguage)}
                        >
                          ⋯
                        </button>

                        {openEpisodeMenuNumber === episode.number ? (
                          <div className="absolute right-0 top-full z-10 mt-1 w-44 rounded border border-white/15 bg-zinc-900 p-1.5 shadow-xl">
                            <button
                              type="button"
                              onClick={() => unmarkEpisodeAsWatched(episode.number)}
                              disabled={!isWatched}
                              className="w-full rounded px-2 py-1.5 text-left text-xs text-white/85 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
                            >
                              {getUIText("removeFromWatched", episodeTitleLanguage)}
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {unlockedBadges.length > 0 ? (
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {unlockedBadges.map((badge) => (
                          <div key={badge.key} className="group relative inline-flex">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={getBadgeImageUrl(badge)}
                              alt={badge.title}
                              className="h-8 w-8 object-contain"
                              loading="lazy"
                            />
                            <span className="pointer-events-none absolute bottom-full right-0 z-20 mb-1 hidden min-w-max rounded bg-black px-2 py-1 text-[10px] font-semibold text-white shadow-lg group-hover:block">
                              {badge.title} · S{badge.unlockTarget.season} E{badge.unlockTarget.episode}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                <p className="text-sm text-white/70">{episode.synopsis}</p>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-white/70">{getUIText("episodeType", episodeTitleLanguage)}</span>

                  <div className="flex flex-wrap gap-1">
                    {(["non-filler", "filler", "misto"] as EpisodeFillerType[]).map((type) => {
                      const isActive = selectedType === type;

                      return (
                        <button
                          key={`${episode.number}-${type}`}
                          type="button"
                          onClick={() => {
                            voteEpisodeType(episode.number, type);
                          }}
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                            isActive
                              ? fillerTypeBadgeClasses[type]
                              : "border-white/20 bg-white/5 text-white/70 hover:bg-white/10"
                          }`}
                          aria-pressed={isActive}
                        >
                          {fillerTypeLabelByLanguage[type]}
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
                    {selectedType ? fillerTypeLabelByLanguage[selectedType] : getUIText("notClassified", episodeTitleLanguage)}
                  </span>

                  <span className="rounded-full border border-sky-400/30 bg-sky-500/15 px-2 py-0.5 text-[11px] font-semibold text-sky-100">
                    {getUIText("community", episodeTitleLanguage)}: {community?.consensus ? fillerTypeLabelByLanguage[community.consensus] : getUIText("noData", episodeTitleLanguage)}
                    {community?.consensus ? ` · ${communityPercent}%` : ""}
                    {community ? ` (${community.total} ${getUIText("votes", episodeTitleLanguage)})` : ""}
                  </span>
                </div>

                {youtubeVideoId ? (
                  <div className="space-y-2 pt-1">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setOpenEpisodeNumber((prev) => (prev === episode.number ? null : episode.number));
                          markEpisodeAsWatched(episode.number);
                        }}
                        className="inline-flex items-center rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-500"
                      >
                        {isPlayerOpen ? getUIText("closePlayer", episodeTitleLanguage) : getUIText("watch", episodeTitleLanguage)}
                      </button>

                    </div>

                    {isPlayerOpen ? (
                      <div className="overflow-hidden rounded-2xl border border-red-500/30 bg-gradient-to-b from-zinc-900 to-black shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_10px_40px_rgba(0,0,0,0.6)]">
                        <div className="flex items-center justify-between border-b border-white/10 bg-black/60 px-3 py-2 text-[11px]">
                          <div className="flex items-center gap-2 text-white/85">
                            <span className="inline-block h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
                            <span className="font-semibold tracking-wide">POKÉWATCH PLAYER</span>
                          </div>
                          <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-white/70">
                            {getUIText("episodeN", episodeTitleLanguage)} {episode.number}
                          </span>
                        </div>

                        <div className="aspect-video w-full">
                          <iframe
                            src={getYouTubeEmbedUrl(youtubeVideoId)}
                            title={`${getUIText("playerTitle", episodeTitleLanguage)} ${getUIText("episodeN", episodeTitleLanguage)} ${episode.number}: ${episode.title}`}
                            className="h-full w-full"
                            loading="lazy"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        </div>
                        <div className="border-t border-white/10 bg-black/40 px-3 py-2 text-[11px] text-white/65">
                          {getUIText("audioTrackHint", episodeTitleLanguage)}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
