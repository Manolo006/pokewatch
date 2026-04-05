"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { GoDotFill } from "react-icons/go";
import { IoCheckmark } from "react-icons/io5";
import { episodesLabel, type PokemonSeason } from "@/app/data/pokemonCatalog";
import { ref, get, runTransaction } from "firebase/database";
import { db } from "@/app/lib/firebase";
import { useAuth } from "@/app/components/AuthProvider";

type SeasonCarouselProps = {
  seasons: PokemonSeason[];
  enableTrendVoting?: boolean;
};

type CommunitySeasonTrendStats = {
  clicks: number;
  totalClicks: number;
  share: number;
  consensus: "tendenza" | "normale";
};

type SeasonThumbnailProps = {
  seasonNumber: number;
  title: string;
  arc: string;
  accent: string;
};

const GAP = 16;
const PEEK = 0;
const STANDARD_CARD_WIDTH = 300;
const STANDARD_CARD_HEIGHT = 360;
const MOBILE_BREAKPOINT = 768;
const WATCHED_STORAGE_PREFIX = "pokewatch-watched-season";

const getThumbnailCandidates = (seasonNumber: number) => [
  `./seasons/s${seasonNumber}.jpg`,
  `./seasons/s${seasonNumber}.jpeg`,
  `./seasons/s${seasonNumber}.png`,
  `./seasons/s${seasonNumber}.webp`,
];

const getWatchedProgressForSeason = (season: PokemonSeason) => {
  if (typeof window === "undefined") return 0;

  const storageKey = `${WATCHED_STORAGE_PREFIX}-${season.season}`;
  const rawValue = window.localStorage.getItem(storageKey);
  const totalEpisodes = season.episodes && season.episodes > 0 ? season.episodes : 24;

  if (!rawValue || totalEpisodes <= 0) {
    return 0;
  }

  try {
    const parsed = JSON.parse(rawValue) as Record<string, boolean>;
    const watchedCount = Object.values(parsed).filter(Boolean).length;
    return Math.max(0, Math.min(100, Math.round((watchedCount / totalEpisodes) * 100)));
  } catch {
    return 0;
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

const getProgressFromWatchedRecord = (season: PokemonSeason, watched: Record<number, boolean>) => {
  const totalEpisodes = season.episodes && season.episodes > 0 ? season.episodes : 24;
  if (totalEpisodes <= 0) return 0;

  const watchedCount = Object.values(watched).filter(Boolean).length;
  return Math.max(0, Math.min(100, Math.round((watchedCount / totalEpisodes) * 100)));
};

const buildProgressMap = (seasons: PokemonSeason[]) => {
  const progress: Record<number, number> = {};
  seasons.forEach((season) => {
    progress[season.season] = getWatchedProgressForSeason(season);
  });

  return progress;
};

const buildSeasonClickMap = (value: unknown): Record<number, number> => {
  if (!value || typeof value !== "object") {
    return {};
  }

  const result: Record<number, number> = {};

  Object.entries(value as Record<string, unknown>).forEach(([seasonKey, seasonValue]) => {
    const seasonNumber = Number(seasonKey);
    if (!Number.isInteger(seasonNumber)) return;
    const clicks = Number(seasonValue);
    result[seasonNumber] = Number.isFinite(clicks) && clicks > 0 ? Math.floor(clicks) : 0;
  });

  return result;
};

const buildCommunityTrendStats = (
  seasons: PokemonSeason[],
  clickMap: Record<number, number>
): Record<number, CommunitySeasonTrendStats> => {
  const totalClicks = seasons.reduce((acc, season) => acc + (clickMap[season.season] ?? 0), 0);
  const maxClicks = seasons.reduce((acc, season) => Math.max(acc, clickMap[season.season] ?? 0), 0);

  const result: Record<number, CommunitySeasonTrendStats> = {};

  seasons.forEach((season) => {
    const clicks = clickMap[season.season] ?? 0;
    const share = totalClicks > 0 ? Math.round((clicks / totalClicks) * 100) : 0;
    const consensus: "tendenza" | "normale" = clicks > 0 && clicks >= maxClicks ? "tendenza" : "normale";

    result[season.season] = {
      clicks,
      totalClicks,
      share,
      consensus,
    };
  });

  return result;
};

function SeasonThumbnail({ seasonNumber, title, arc, accent }: SeasonThumbnailProps) {
  const [thumbnailSrc, setThumbnailSrc] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    const candidates = getThumbnailCandidates(seasonNumber);

    const tryLoad = (index: number) => {
      if (!isActive) return;

      if (index >= candidates.length) {
        setThumbnailSrc(null);
        return;
      }

      const src = candidates[index];
      const image = new window.Image();

      image.onload = () => {
        if (!isActive) return;
        setThumbnailSrc(src);
      };

      image.onerror = () => {
        tryLoad(index + 1);
      };

      image.src = src;
    };

    tryLoad(0);

    return () => {
      isActive = false;
    };
  }, [seasonNumber]);

  return (
    <div className="relative aspect-video w-full overflow-hidden p-4">
      {thumbnailSrc ? (
        <img
          src={thumbnailSrc}
          alt={title}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${accent} via-slate-700 to-black`} />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />

      <div className="relative z-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/90">Stagione {seasonNumber}</p>
        <p className="mt-2 inline-block rounded bg-black/35 px-2 py-0.5 text-xs font-semibold text-white/90">
          {arc}
        </p>
      </div>
    </div>
  );
}

export default function SeasonCarousel({ seasons, enableTrendVoting = false }: SeasonCarouselProps) {
  const { user } = useAuth();
  const viewportRef = useRef<HTMLDivElement>(null);
  const lastClickRef = useRef(0);
  const totalItems = seasons.length;
  const baseIndex = totalItems;

  const [currentIndex, setCurrentIndex] = useState(baseIndex);
  const [withTransition, setWithTransition] = useState(true);
  const [transitionDuration, setTransitionDuration] = useState(420);
  const [watchedProgressBySeason, setWatchedProgressBySeason] = useState<Record<number, number>>(() =>
    buildProgressMap(seasons)
  );
  const [seasonClickBySeason, setSeasonClickBySeason] = useState<Record<number, number>>({});

  const isCarouselEnabled = seasons.length > 4;

  const trackItems = useMemo(() => {
    if (!isCarouselEnabled) return seasons;
    return [...seasons, ...seasons, ...seasons];
  }, [isCarouselEnabled, seasons]);

  useEffect(() => {
    if (!isCarouselEnabled) return;

    let enableTransitionTimer: number | undefined;

    const resetTimer = window.setTimeout(() => {
      setCurrentIndex(baseIndex);
      setTransitionDuration(420);
      setWithTransition(false);
      enableTransitionTimer = window.setTimeout(() => setWithTransition(true), 20);
    }, 0);

    return () => {
      window.clearTimeout(resetTimer);
      if (enableTransitionTimer) {
        window.clearTimeout(enableTransitionTimer);
      }
    };
  }, [isCarouselEnabled, baseIndex, seasons.length]);

  useEffect(() => {
    const dbInstance = db;

    const loadProgress = () => {
      if (!user || !dbInstance) {
        setWatchedProgressBySeason(buildProgressMap(seasons));
        return;
      }

      void Promise.all(
        seasons.map(async (season) => {
          try {
            const watchedRef = ref(dbInstance, `users/${user.uid}/watchedBySeason/${season.season}`);
            const snapshot = await get(watchedRef);
            const watchedRecord = normalizeWatchedRecord(snapshot.val());
            return [season.season, getProgressFromWatchedRecord(season, watchedRecord)] as const;
          } catch {
            return [season.season, 0] as const;
          }
        })
      ).then((entries) => {
        const nextMap: Record<number, number> = {};
        entries.forEach(([seasonNumber, progress]) => {
          nextMap[seasonNumber] = progress;
        });
        setWatchedProgressBySeason(nextMap);
      });
    };

    loadProgress();
    window.addEventListener("focus", loadProgress);
    if (!user || !dbInstance) {
      window.addEventListener("storage", loadProgress);
    }

    return () => {
      window.removeEventListener("focus", loadProgress);
      if (!user || !dbInstance) {
        window.removeEventListener("storage", loadProgress);
      }
    };
  }, [seasons, user]);

  useEffect(() => {
    if (!enableTrendVoting) return;

    const dbInstance = db;

    const loadSeasonClickCounts = async () => {
      if (!dbInstance) {
        setSeasonClickBySeason({});
        return;
      }

      try {
        const snapshot = await get(ref(dbInstance, "community/seasonOpenCounts"));
        setSeasonClickBySeason(buildSeasonClickMap(snapshot.val()));
      } catch {
        setSeasonClickBySeason({});
      }
    };

    void loadSeasonClickCounts();
    window.addEventListener("focus", loadSeasonClickCounts);

    return () => {
      window.removeEventListener("focus", loadSeasonClickCounts);
    };
  }, [enableTrendVoting, user]);

  const communityTrendBySeason = useMemo(
    () => buildCommunityTrendStats(seasons, seasonClickBySeason),
    [seasons, seasonClickBySeason]
  );

  const trackSeasonOpen = (seasonNumber: number) => {
    if (!enableTrendVoting || !db) return;

    const dbInstance = db;
    setSeasonClickBySeason((prev) => ({
      ...prev,
      [seasonNumber]: (prev[seasonNumber] ?? 0) + 1,
    }));

    void runTransaction(ref(dbInstance, `community/seasonOpenCounts/${seasonNumber}`), (current) => {
      const count = Number(current);
      return Number.isFinite(count) && count >= 0 ? count + 1 : 1;
    });
  };

  const [cardWidth, setCardWidth] = useState<number>(STANDARD_CARD_WIDTH);
  const [cardHeight, setCardHeight] = useState<number>(STANDARD_CARD_HEIGHT);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isTouchInput, setIsTouchInput] = useState(false);

  useEffect(() => {
    const updateSizes = () => {
      const w = window.innerWidth;

      if (w <= 480) {
        const responsiveWidth = Math.max(220, Math.min(280, Math.round(w * 0.78)));
        setCardWidth(responsiveWidth);
        setCardHeight(Math.round(responsiveWidth * 1.38));
      } else if (w <= MOBILE_BREAKPOINT) {
        setCardWidth(250);
        setCardHeight(330);
      } else {
        setCardWidth(STANDARD_CARD_WIDTH);
        setCardHeight(STANDARD_CARD_HEIGHT);
      }

      setIsMobileView(w <= MOBILE_BREAKPOINT);
    };

    updateSizes();
    window.addEventListener("resize", updateSizes);
    return () => window.removeEventListener("resize", updateSizes);
  }, []);

  useEffect(() => {
    const pointerQuery = window.matchMedia("(hover: none) and (pointer: coarse)");

    const updateTouchMode = () => {
      setIsTouchInput(pointerQuery.matches || "ontouchstart" in window);
    };

    updateTouchMode();
    pointerQuery.addEventListener("change", updateTouchMode);

    return () => {
      pointerQuery.removeEventListener("change", updateTouchMode);
    };
  }, []);

  const step = cardWidth + GAP;
  const translateX = -(currentIndex * step) + PEEK;

  const getAdaptiveDuration = () => {
    const now = Date.now();
    const diff = now - lastClickRef.current;
    lastClickRef.current = now;

    if (diff < 130) return 120;
    if (diff < 250) return 160;
    if (diff < 420) return 240;
    return 420;
  };

  const goNext = () => {
    if (!isCarouselEnabled) return;
    setTransitionDuration(getAdaptiveDuration());
    setWithTransition(true);
    setCurrentIndex((prev) => prev + 1);
  };

  const goPrev = () => {
    if (!isCarouselEnabled) return;
    setTransitionDuration(getAdaptiveDuration());
    setWithTransition(true);
    setCurrentIndex((prev) => prev - 1);
  };

  const handleTransitionEnd = () => {
    if (!isCarouselEnabled) return;

    let normalizedIndex = currentIndex;
    const outOfCenterBand = currentIndex >= totalItems * 2 || currentIndex < totalItems;

    if (outOfCenterBand) {
      const offset = ((currentIndex - totalItems) % totalItems + totalItems) % totalItems;
      normalizedIndex = totalItems + offset;
    }

    if (normalizedIndex !== currentIndex) {
      setWithTransition(false);
      setCurrentIndex(normalizedIndex);
      requestAnimationFrame(() => requestAnimationFrame(() => setWithTransition(true)));
    }
  };

  const renderSeasonCard = (season: PokemonSeason, key: string) => (
    <Link
      key={key}
      href={`/stagione/${season.season}`}
      onClick={() => {
        trackSeasonOpen(season.season);
      }}
      style={{
        width: `${cardWidth}px`,
        minWidth: `${cardWidth}px`,
        maxWidth: `${cardWidth}px`,
        height: `${cardHeight}px`,
      }}
      className={`group relative flex shrink-0 flex-col overflow-hidden rounded-md border border-white/10 bg-zinc-900 transition duration-300 hover:-translate-y-1 hover:border-white/25 ${
        isMobileView ? "snap-start active:scale-[0.99]" : ""
      }`}
    >
      {(watchedProgressBySeason[season.season] ?? 0) >= 100 ? (
        <span className="absolute right-2 top-2 z-20 inline-flex h-13 w-13 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md shadow-black/30">
          <IoCheckmark className="text-3xl" aria-hidden="true" />
        </span>
      ) : null}

      <SeasonThumbnail seasonNumber={season.season} title={season.title} arc={season.arc} accent={season.accent} />

      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <h3 className="line-clamp-2 text-base font-bold leading-snug">{season.title}</h3>
          <p className="mt-2 line-clamp-3 text-sm text-white/70">{season.synopsis}</p>
        </div>

        <div className="mt-3 space-y-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-red-500 transition-all duration-300"
              style={{ width: `${watchedProgressBySeason[season.season] ?? 0}%` }}
            />
          </div>

          <p className="text-[11px] text-white/60">{watchedProgressBySeason[season.season] ?? 0}% visto</p>
        </div>

        {enableTrendVoting ? (
          <div className="mt-2 space-y-2">
            <p
              className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                communityTrendBySeason[season.season]?.consensus === "tendenza"
                  ? "border-fuchsia-400/30 bg-fuchsia-500/20 text-fuchsia-100"
                  : "border-slate-400/30 bg-slate-500/20 text-slate-100"
              }`}
            >
              Trend automatico: {communityTrendBySeason[season.season]?.consensus === "tendenza" ? "Di tendenza" : "Normale"}
            </p>

            <p className="text-[10px] text-white/75">
              {communityTrendBySeason[season.season]?.clicks ?? 0} aperture
              {communityTrendBySeason[season.season]?.totalClicks
                ? ` · ${communityTrendBySeason[season.season].share}% del totale`
                : ""}
            </p>
          </div>
        ) : null}

        <p className="mt-3 text-xs text-white/60">
          <span className="inline-flex items-center gap-1">
            <span>{season.years}</span>
            <GoDotFill className="text-[10px]" aria-hidden="true" />
            <span>{episodesLabel(season.episodes)}</span>
          </span>
        </p>
      </div>

      <div className="pointer-events-none absolute inset-0 rounded-md ring-1 ring-inset ring-white/0 transition group-hover:ring-white/20" />
    </Link>
  );

  const useTouchCarousel = isMobileView || isTouchInput;

  if (!isCarouselEnabled || useTouchCarousel) {
    return (
      <div className="netflix-scroll mobile-carousel-scroll flex gap-3 overflow-x-auto px-1 py-3 sm:gap-4" style={{ touchAction: "pan-x" }}>
        {seasons.map((season) => (
          renderSeasonCard(season, String(season.season))
        ))}
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[#141414] via-[#141414]/90 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[#141414] via-[#141414]/90 to-transparent" />

      <button
        type="button"
        aria-label="Previous"
        onClick={goPrev}
        className="absolute left-1 top-1/2 z-20 -translate-y-1/2 rounded-r-md bg-black/45 px-3 py-8 text-2xl text-white transition hover:bg-black/70"
      >
        <FaChevronLeft aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="Next"
        onClick={goNext}
        className="absolute right-1 top-1/2 z-20 -translate-y-1/2 rounded-l-md bg-black/45 px-3 py-8 text-2xl text-white transition hover:bg-black/70"
      >
        <FaChevronRight aria-hidden="true" />
      </button>

      <div ref={viewportRef} className="overflow-hidden px-1 py-3">
        <div
          className="flex"
          style={{
            gap: `${GAP}px`,
            transform: `translate3d(${translateX}px, 0, 0)`,
            willChange: "transform",
            transition: withTransition
              ? `transform ${transitionDuration}ms cubic-bezier(0.22, 0.61, 0.36, 1)`
              : "none",
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {trackItems.map((season, index) => (
            renderSeasonCard(season, `${season.title}-${index}`)
          ))}
        </div>
      </div>
    </div>
  );
}
