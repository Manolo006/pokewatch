"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { get, ref } from "firebase/database";
import AuthHeaderActions from "@/app/components/AuthHeaderActions";
import { useAuth } from "@/app/components/AuthProvider";
import LanguageText from "@/app/components/LanguageText";
import { allSeasons, getEpisodesForSeason, getSeasonByNumber } from "@/app/data/pokemonCatalog";
import { db } from "@/app/lib/firebase";
import { getUIText } from "@/app/lib/uiLanguage";
import { useUILanguage } from "@/app/lib/useUILanguage";

type Era = "Original" | "Advanced" | "DiamondPearl" | "XY";

type FilmTimelineBlock = {
  key: string;
  filmTitle: string;
  era: Era;
  beforeEpisode?: string;
  afterEpisode?: string;
  beforeEpisodeYoutubeUrl: string;
  afterEpisodeYoutubeUrl: string;
  filmImageBase: string;
};

const EP_IMG =
  "https://pokenerd.altervista.org/wp-content/uploads/2018/03/222-Il-pokemon-misterioso.mkv_snapshot_11.40.png";
const FILM_IMG =
  "https://pokenerd.altervista.org/wp-content/uploads/2015/01/oolho-copy.png";
const FILM_EXTENSIONS = ["webp", "jpg", "jpeg", "png"] as const;

const FALLBACK_EPISODE_YOUTUBE = "https://www.youtube.com/watch?v=JuYeHPFR3f0";

const getYouTubeThumbnailFromUrl = (youtubeUrl?: string) => {
  if (!youtubeUrl) return null;

  try {
    const parsedUrl = new URL(youtubeUrl);
    let videoId: string | null = null;

    if (parsedUrl.hostname.includes("youtu.be")) {
      videoId = parsedUrl.pathname.split("/").filter(Boolean)[0] ?? null;
    } else if (parsedUrl.hostname.includes("youtube.com")) {
      videoId = parsedUrl.searchParams.get("v");
      if (!videoId && parsedUrl.pathname.includes("/embed/")) {
        videoId = parsedUrl.pathname.split("/embed/")[1]?.split("/")[0] ?? null;
      }
    }

    if (!videoId) return null;
    return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  } catch {
    return null;
  }
};

const getFilmImageFromBase = (baseName: string, extensionIndex = 0) => {
  const ext = FILM_EXTENSIONS[extensionIndex];
  if (!ext) return FILM_IMG;
  return `/film/${baseName}.${ext}`;
};

const placements: FilmTimelineBlock[] = [
  {
    key: "mewtwo",
    filmTitle: "Mewtwo Strikes Back",
    era: "Original",
    beforeEpisode: "La Grande onda",
    afterEpisode: "Insidia Verde",
    beforeEpisodeYoutubeUrl: FALLBACK_EPISODE_YOUTUBE,
    afterEpisodeYoutubeUrl: FALLBACK_EPISODE_YOUTUBE,
    filmImageBase: "f1",
  },
  {
    key: "film2",
    filmTitle: "Pokémon 2 - La forza di 1",
    era: "Original",
    beforeEpisode: "Un nuovo sfidante",
    afterEpisode: "L’alga curativa",
    beforeEpisodeYoutubeUrl: FALLBACK_EPISODE_YOUTUBE,
    afterEpisodeYoutubeUrl: FALLBACK_EPISODE_YOUTUBE,
    filmImageBase: "f2",
  },
  {
    key: "unown",
    filmTitle: "L'incantesimo degli Unown",
    era: "Original",
    beforeEpisode: "Ride bene chi ride ultimo",
    afterEpisode: "Ma che bel castello",
    beforeEpisodeYoutubeUrl: FALLBACK_EPISODE_YOUTUBE,
    afterEpisodeYoutubeUrl: FALLBACK_EPISODE_YOUTUBE,
    filmImageBase: "f3",
  },
  {
    key: "pokemon4ever",
    filmTitle: "Pokémon 4Ever",
    era: "Original",
    beforeEpisode: "Un nuovo inizio",
    afterEpisode: "Un amico ritrovato",
    beforeEpisodeYoutubeUrl: FALLBACK_EPISODE_YOUTUBE,
    afterEpisodeYoutubeUrl: FALLBACK_EPISODE_YOUTUBE,
    filmImageBase: "f4",
  },
  {
    key: "heroes",
    filmTitle: "Pokémon Heroes",
    era: "Original",
    beforeEpisode: "Un nuovo piano",
    afterEpisode: "La ricercatrice",
    beforeEpisodeYoutubeUrl: FALLBACK_EPISODE_YOUTUBE,
    afterEpisodeYoutubeUrl: FALLBACK_EPISODE_YOUTUBE,
    filmImageBase: "f5",
  },
  {
    key: "jirachi",
    filmTitle: "Jirachi Wish Maker",
    era: "Advanced",
    beforeEpisode: "Il relitto",
    afterEpisode: "Una gara pazzesca",
    beforeEpisodeYoutubeUrl: FALLBACK_EPISODE_YOUTUBE,
    afterEpisodeYoutubeUrl: FALLBACK_EPISODE_YOUTUBE,
    filmImageBase: "f6",
  },
  {
    key: "deoxys",
    filmTitle: "Destiny Deoxys",
    era: "Advanced",
    beforeEpisode: "Cinema per tutti",
    afterEpisode: "Il negozio di Pokémelle",
    beforeEpisodeYoutubeUrl: FALLBACK_EPISODE_YOUTUBE,
    afterEpisodeYoutubeUrl: FALLBACK_EPISODE_YOUTUBE,
    filmImageBase: "f7",
  },
  {
    key: "lucario",
    filmTitle: "Lucario e il mistero di Mew",
    era: "Advanced",
    beforeEpisode: "Fascino e mistero sul Monte Luna",
    afterEpisode: "La farmacia",
    beforeEpisodeYoutubeUrl: FALLBACK_EPISODE_YOUTUBE,
    afterEpisodeYoutubeUrl: FALLBACK_EPISODE_YOUTUBE,
    filmImageBase: "f8",
  },
  {
    key: "darkrai",
    filmTitle: "L'ascesa di Darkrai",
    era: "DiamondPearl",
    beforeEpisode: "La famiglia cresce",
    afterEpisode: "La gara di doppia performance",
    beforeEpisodeYoutubeUrl: FALLBACK_EPISODE_YOUTUBE,
    afterEpisodeYoutubeUrl: FALLBACK_EPISODE_YOUTUBE,
    filmImageBase: "f10",
  },
  {
    key: "giratina",
    filmTitle: "Giratina e il Guerriero dei cieli",
    era: "DiamondPearl",
    beforeEpisode: "Combattere la paura con la paura!",
    afterEpisode: "Dare una mano al nemico",
    beforeEpisodeYoutubeUrl: FALLBACK_EPISODE_YOUTUBE,
    afterEpisodeYoutubeUrl: FALLBACK_EPISODE_YOUTUBE,
    filmImageBase: "f11",
  },
  {
    key: "arceus",
    filmTitle: "Arceus e il Gioiello della Vita",
    era: "DiamondPearl",
    beforeEpisode: "Salviamo la foresta",
    afterEpisode: "Una nuova gara",
    beforeEpisodeYoutubeUrl: FALLBACK_EPISODE_YOUTUBE,
    afterEpisodeYoutubeUrl: FALLBACK_EPISODE_YOUTUBE,
    filmImageBase: "f12",
  },
  {
    key: "zoroark",
    filmTitle: "Il Re delle Illusioni: Zoroark",
    era: "DiamondPearl",
    beforeEpisode: "L’alba di un giorno regale",
    afterEpisode: "L’ottava meraviglia del mondo di Sinnoh",
    beforeEpisodeYoutubeUrl: FALLBACK_EPISODE_YOUTUBE,
    afterEpisodeYoutubeUrl: FALLBACK_EPISODE_YOUTUBE,
    filmImageBase: "f13",
  },
  {
    key: "diancie",
    filmTitle: "Diancie e il Bozzolo della Distruzione",
    era: "XY",
    beforeEpisode: "Lotte Aeree",
    afterEpisode: "Sognando un futuro da Performer Pokémon",
    beforeEpisodeYoutubeUrl: FALLBACK_EPISODE_YOUTUBE,
    afterEpisodeYoutubeUrl: FALLBACK_EPISODE_YOUTUBE,
    filmImageBase: "f14",
  },
  {
    key: "hoopa",
    filmTitle: "Hoopa e lo scontro epocale",
    era: "XY",
    beforeEpisode: "Un decollo difficile",
    afterEpisode: "Una foto leggendaria",
    beforeEpisodeYoutubeUrl: FALLBACK_EPISODE_YOUTUBE,
    afterEpisodeYoutubeUrl: FALLBACK_EPISODE_YOUTUBE,
    filmImageBase: "f15",
  },
  {
    key: "volcanion",
    filmTitle: "Volcanion e la meraviglia meccanica",
    era: "XY",
    beforeEpisode: "Il ghiaccio si è rotto!",
    afterEpisode: "Una lega a parte!",
    beforeEpisodeYoutubeUrl: FALLBACK_EPISODE_YOUTUBE,
    afterEpisodeYoutubeUrl: FALLBACK_EPISODE_YOUTUBE,
    filmImageBase: "f16",
  },
];

type TimelineEpisodeUrls = {
  beforeSeason: number;
  beforeEpisode: number;
  beforeEpisodeTitle: string | null;
  beforeEpisodeYoutubeUrl: string | null;
  afterSeason: number;
  afterEpisode: number;
  afterEpisodeTitle: string | null;
  afterEpisodeYoutubeUrl: string | null;
};

type WatchedBySeason = Record<number, Record<number, boolean>>;

const WATCHED_STORAGE_PREFIX = "pokewatch-watched-season-";
const WATCHED_FILMS_STORAGE_KEY = "pokewatch-watched-films";

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

const getLocalWatchedBySeason = (): WatchedBySeason => {
  if (typeof window === "undefined") return {};

  const result: WatchedBySeason = {};

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key || !key.startsWith(WATCHED_STORAGE_PREFIX)) continue;

    const seasonNumber = Number(key.replace(WATCHED_STORAGE_PREFIX, ""));
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

const formatSeasonEpisode = (season: number, episode: number) =>
  `S${season}E${String(episode).padStart(2, "0")}`;

export default function TimelineFilmPage() {
  const { user } = useAuth();
  const language = useUILanguage();
  const [episodeUrlsByFilmKey, setEpisodeUrlsByFilmKey] = useState<Record<string, TimelineEpisodeUrls>>({});
  const [watchedBySeason, setWatchedBySeason] = useState<WatchedBySeason>({});
  const [watchedFilmsByKey, setWatchedFilmsByKey] = useState<Record<string, boolean>>({});

  const seasonEpisodeCountBySeason = useMemo(() => {
    const map: Record<number, number> = {};
    const seasonNumbers = [...new Set(allSeasons.map((season) => season.season))].sort((a, b) => a - b);

    seasonNumbers.forEach((seasonNumber) => {
      const season = getSeasonByNumber(seasonNumber);
      map[seasonNumber] = season ? getEpisodesForSeason(season).length : 0;
    });

    return map;
  }, []);

  const getAbsoluteEpisodeIndex = useCallback((seasonNumber: number, episodeNumber: number) => {
    const orderedSeasonNumbers = Object.keys(seasonEpisodeCountBySeason)
      .map(Number)
      .sort((a, b) => a - b);

    let offset = 0;
    for (const currentSeason of orderedSeasonNumbers) {
      if (currentSeason === seasonNumber) {
        return offset + episodeNumber;
      }
      if (currentSeason > seasonNumber) break;
      offset += seasonEpisodeCountBySeason[currentSeason] ?? 0;
    }

    return seasonNumber * 1000 + episodeNumber;
  }, [seasonEpisodeCountBySeason]);

  const toggleFilmWatched = (filmKey: string) => {
    setWatchedFilmsByKey((current) => {
      const next = {
        ...current,
        [filmKey]: !current[filmKey],
      };

      if (typeof window !== "undefined") {
        window.localStorage.setItem(WATCHED_FILMS_STORAGE_KEY, JSON.stringify(next));
      }

      return next;
    });
  };

  useEffect(() => {
    let isMounted = true;

    const loadTimelineEpisodeUrls = async () => {
      try {
        const response = await fetch("/api/timeline-episodes");
        if (!response.ok) return;

        const payload = (await response.json()) as {
          urlsByFilmKey?: Record<string, TimelineEpisodeUrls>;
        };

        if (isMounted && payload.urlsByFilmKey) {
          setEpisodeUrlsByFilmKey(payload.urlsByFilmKey);
        }
      } catch {
        // keep fallback episode URLs
      }
    };

    void loadTimelineEpisodeUrls();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadWatchedState = async () => {
      const localWatched = getLocalWatchedBySeason();
      let resolvedWatched = localWatched;

      if (user?.uid && db) {
        try {
          const snapshot = await get(ref(db, `users/${user.uid}/watchedBySeason`));
          const dbWatched = normalizeWatchedBySeason(snapshot.val());
          const hasDbProgress = Object.keys(dbWatched).length > 0;

          // Priorità al DB quando disponibile: evita che vecchi dati locali
          // (es. browser precedente) sballino la progressione timeline.
          resolvedWatched = hasDbProgress ? dbWatched : localWatched;
        } catch {
          // fallback to local watched data only
        }
      }

      if (!isMounted) return;
      setWatchedBySeason(resolvedWatched);

      if (typeof window !== "undefined") {
        try {
          const raw = window.localStorage.getItem(WATCHED_FILMS_STORAGE_KEY);
          if (!raw) {
            setWatchedFilmsByKey({});
            return;
          }

          const parsed = JSON.parse(raw) as Record<string, unknown>;
          const normalized: Record<string, boolean> = {};
          Object.entries(parsed).forEach(([filmKey, watched]) => {
            normalized[filmKey] = Boolean(watched);
          });
          setWatchedFilmsByKey(normalized);
        } catch {
          setWatchedFilmsByKey({});
        }
      }
    };

    void loadWatchedState();

    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  const visible = placements;

  const progressToNextFilm = useMemo(() => {
    const anchors = placements
      .map((item) => {
        const resolved = episodeUrlsByFilmKey[item.key];
        if (!resolved) return null;

        return {
          title: item.filmTitle,
          absoluteBefore: getAbsoluteEpisodeIndex(resolved.beforeSeason, resolved.beforeEpisode),
        };
      })
      .filter((item): item is { title: string; absoluteBefore: number } => item !== null)
      .sort((a, b) => a.absoluteBefore - b.absoluteBefore);

    if (anchors.length === 0) return null;

    let lastWatchedAbsolute = 0;
    Object.entries(watchedBySeason).forEach(([seasonKey, episodes]) => {
      const seasonNumber = Number(seasonKey);
      Object.entries(episodes).forEach(([episodeKey, watched]) => {
        if (!watched) return;
        const absolute = getAbsoluteEpisodeIndex(seasonNumber, Number(episodeKey));
        if (absolute > lastWatchedAbsolute) lastWatchedAbsolute = absolute;
      });
    });

    const nextAnchor = anchors.find((anchor) => anchor.absoluteBefore > lastWatchedAbsolute);
    if (!nextAnchor) return null;

    const previousAnchor = [...anchors].reverse().find((anchor) => anchor.absoluteBefore <= lastWatchedAbsolute);
    const segmentStart = (previousAnchor?.absoluteBefore ?? 0) + 1;
    const segmentEnd = nextAnchor.absoluteBefore;
    const totalEpisodes = Math.max(1, segmentEnd - segmentStart + 1);

    let watchedEpisodesInSegment = 0;
    Object.entries(watchedBySeason).forEach(([seasonKey, episodes]) => {
      const seasonNumber = Number(seasonKey);
      Object.entries(episodes).forEach(([episodeKey, watched]) => {
        if (!watched) return;
        const absolute = getAbsoluteEpisodeIndex(seasonNumber, Number(episodeKey));
        if (absolute >= segmentStart && absolute <= segmentEnd) watchedEpisodesInSegment += 1;
      });
    });

    return {
      nextFilmTitle: nextAnchor.title,
      remainingEpisodes: Math.max(0, segmentEnd - lastWatchedAbsolute),
      watchedEpisodesInSegment,
      totalEpisodes,
    };
  }, [episodeUrlsByFilmKey, getAbsoluteEpisodeIndex, watchedBySeason]);

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1500px] flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-8 sm:py-4">
          <div className="flex items-center gap-2.5 sm:gap-4">
            <img src="./logo.png" alt="PokéWatch" width={180} height={42} className="h-auto w-[122px] sm:w-[180px]" />
            <span className="rounded bg-yellow-400 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-black">
              <LanguageText textKey="animeBadge" />
            </span>
          </div>

          <nav className="mobile-top-nav order-3 flex w-full items-center gap-4 overflow-x-auto whitespace-nowrap text-[11px] text-white/80 sm:order-none sm:w-auto sm:gap-6 sm:text-sm">
            <a href="./" className="hover:text-white">
              <LanguageText textKey="home" />
            </a>
            <a href="#" className="hover:text-white">
              <LanguageText textKey="seriesTv" />
            </a>
            <a href="./timeline" className="hover:text-white">
              <LanguageText textKey="timeline" />
            </a>
          </nav>

          <AuthHeaderActions />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-8 sm:px-8">
        <section className="rounded-2xl border border-white/10 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-transparent p-5">
          <h1 className="text-2xl font-black sm:text-4xl">{getUIText("timelineFilmsTitle", language)}</h1>
          <p className="mt-2 text-sm text-white/75">Timeline visuale episodio → film → episodio.</p>

          {progressToNextFilm ? (
            <div className="mt-4 rounded-lg border border-white/10 bg-black/30 p-3">
              <p className="text-xs font-semibold text-cyan-100">
                Prossimo film: {progressToNextFilm.nextFilmTitle} · mancano {progressToNextFilm.remainingEpisodes} episodi
              </p>
              <p className="mt-1 text-[11px] text-white/65">
                {progressToNextFilm.watchedEpisodesInSegment}/{progressToNextFilm.totalEpisodes} episodi nel tratto corrente
              </p>
            </div>
          ) : null}

        </section>

        <section className="rounded-xl border border-white/10 bg-[#141414] p-4 sm:p-6">
          {visible.length > 0 ? (
            <div className="overflow-x-auto pb-2">
              <div className="relative h-[760px] w-max min-w-[3000px] px-6 py-16 sm:h-[820px] sm:min-w-[3800px] sm:px-10">
                <div className="absolute left-0 right-0 top-1/2 h-[6px] -translate-y-1/2 rounded-full bg-[#424850]" />

                <div className="relative flex items-center gap-10 sm:gap-4">
                  {visible.map((item) => (
                    <div key={item.key} className="relative h-[640px] w-[520px] shrink-0">
                      {(() => {
                        const resolvedUrls = episodeUrlsByFilmKey[item.key];
                        const beforeEpisodeUrl =
                          resolvedUrls?.beforeEpisodeYoutubeUrl ?? item.beforeEpisodeYoutubeUrl;
                        const afterEpisodeUrl =
                          resolvedUrls?.afterEpisodeYoutubeUrl ?? item.afterEpisodeYoutubeUrl;
                        const beforeLabel = resolvedUrls
                          ? `${formatSeasonEpisode(resolvedUrls.beforeSeason, resolvedUrls.beforeEpisode)} • ${
                              resolvedUrls.beforeEpisodeTitle ?? item.beforeEpisode ?? ""
                            }`
                          : item.beforeEpisode;
                        const afterLabel = resolvedUrls
                          ? `${formatSeasonEpisode(resolvedUrls.afterSeason, resolvedUrls.afterEpisode)} • ${
                              resolvedUrls.afterEpisodeTitle ?? item.afterEpisode ?? ""
                            }`
                          : item.afterEpisode;

                        const isBeforeWatched =
                          resolvedUrls ? Boolean(watchedBySeason[resolvedUrls.beforeSeason]?.[resolvedUrls.beforeEpisode]) : false;
                        const isAfterWatched =
                          resolvedUrls ? Boolean(watchedBySeason[resolvedUrls.afterSeason]?.[resolvedUrls.afterEpisode]) : false;
                        return (
                      <div className="absolute left-1/2 bottom-[calc(50%+20px)] flex -translate-x-1/2 items-end justify-center gap-7 sm:gap-10">
                        <div className="relative w-[220px]">
                          <div
                            className={`rounded-xl border p-2 shadow-lg shadow-black/35 ${
                              isBeforeWatched ? "border-sky-400/30 bg-sky-500/15" : "border-white/15 bg-[#1b1b1b]"
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={getYouTubeThumbnailFromUrl(beforeEpisodeUrl) ?? EP_IMG}
                              alt={item.beforeEpisode ?? getUIText("episodeN", language)}
                              className="h-28 w-full rounded-lg object-cover"
                              loading="lazy"
                              onError={(event) => {
                                event.currentTarget.src = EP_IMG;
                              }}
                            />
                            <p className="line-clamp-2 text-[10px] text-white/90">{beforeLabel}</p>
                          </div>
                          <div className="pointer-events-none absolute bottom-[-24px] left-1/2 h-6 w-[2px] -translate-x-1/2 bg-[#424850]" />
                          <div className="pointer-events-none absolute bottom-[-32px] left-1/2 h-4 w-4 -translate-x-1/2 rounded-full border border-[#696f79] bg-[#424850] shadow-[0_0_0_3px_rgba(20,20,20,0.9)]" />
                        </div>

                        <div className="relative w-[210px]">
                          <div
                            className={`rounded-xl border p-2 shadow-lg shadow-black/35 ${
                              isAfterWatched ? "border-sky-400/30 bg-sky-500/15" : "border-white/15 bg-[#1b1b1b]"
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={getYouTubeThumbnailFromUrl(afterEpisodeUrl) ?? EP_IMG}
                              alt={item.afterEpisode ?? getUIText("episodeN", language)}
                              className="h-28 w-full rounded-lg object-cover"
                              loading="lazy"
                              onError={(event) => {
                                event.currentTarget.src = EP_IMG;
                              }}
                            />
                            <p className="line-clamp-2 text-[10px] text-white/90">{afterLabel}</p>
                          </div>
                          <div className="pointer-events-none absolute bottom-[-24px] left-1/2 h-6 w-[2px] -translate-x-1/2 bg-[#424850]" />
                          <div className="pointer-events-none absolute bottom-[-32px] left-1/2 h-4 w-4 -translate-x-1/2 rounded-full border border-[#696f79] bg-[#424850] shadow-[0_0_0_3px_rgba(20,20,20,0.9)]" />
                        </div>
                      </div>
                        );
                      })()}

                      <div className="absolute left-1/2 top-[calc(50%+56px)] flex -translate-x-1/2 justify-center">
                        <div className="relative w-[250px] sm:w-[260px]">
                          <div className="pointer-events-none absolute left-1/2 top-[-24px] h-6 w-[2px] -translate-x-1/2 bg-[#424850]" />
                          <div className="pointer-events-none absolute left-1/2 top-[-32px] h-4 w-4 -translate-x-1/2 rounded-full border border-[#696f79] bg-[#424850] shadow-[0_0_0_3px_rgba(20,20,20,0.9)]" />

                          <div
                            className={`rounded-xl border p-2 shadow-lg shadow-black/35 ${
                              Boolean(watchedFilmsByKey[item.key]) ? "border-cyan-300/50 bg-cyan-500/10" : "border-white/15 bg-[#1b1b1b]"
                            }`}
                          >
                            <div className="flex h-[190px] items-center justify-center overflow-hidden rounded-lg bg-black/30 sm:h-[210px]">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={getFilmImageFromBase(item.filmImageBase)}
                                alt={item.filmTitle}
                                className="max-h-full max-w-full h-auto w-auto object-contain"
                                loading="lazy"
                                onError={(event) => {
                                  const currentIndex = Number(event.currentTarget.dataset.extIndex ?? "0");
                                  const nextIndex = currentIndex + 1;
                                  if (nextIndex < FILM_EXTENSIONS.length) {
                                    event.currentTarget.dataset.extIndex = String(nextIndex);
                                    event.currentTarget.src = getFilmImageFromBase(item.filmImageBase, nextIndex);
                                    return;
                                  }

                                  event.currentTarget.src = FILM_IMG;
                                }}
                                data-ext-index="0"
                              />
                            </div>
                            <p className="mt-2 line-clamp-2 px-1 text-center text-xs font-semibold leading-tight text-white">
                              {item.filmTitle}
                            </p>
                            <button
                              type="button"
                              onClick={() => toggleFilmWatched(item.key)}
                              className={`mt-2 w-full rounded-md border px-2 py-1 text-[11px] font-semibold transition ${
                                Boolean(watchedFilmsByKey[item.key])
                                  ? "border-cyan-300/60 bg-cyan-500/20 text-cyan-100"
                                  : "border-white/20 bg-white/5 text-white/75 hover:bg-white/10"
                              }`}
                            >
                              {Boolean(watchedFilmsByKey[item.key]) ? "Film visto ✓" : "Segna film visto"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/65">
              {getUIText("noItemsFilter", language)}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
