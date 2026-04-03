"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { GoDotFill } from "react-icons/go";
import { IoCheckmark } from "react-icons/io5";
import { episodesLabel, type PokemonSeason } from "@/app/data/pokemonCatalog";

type SeasonCarouselProps = {
  seasons: PokemonSeason[];
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
const WATCHED_COOKIE_PREFIX = "pokewatch-watched-season";

const getThumbnailCandidates = (seasonNumber: number) => [
  `./seasons/s${seasonNumber}.jpg`,
  `./seasons/s${seasonNumber}.jpeg`,
  `./seasons/s${seasonNumber}.png`,
  `./seasons/s${seasonNumber}.webp`,
];

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

const getWatchedProgressForSeason = (season: PokemonSeason) => {
  const cookieName = `${WATCHED_COOKIE_PREFIX}-${season.season}`;
  const rawValue = getCookieValue(cookieName);
  const totalEpisodes = season.episodes && season.episodes > 0 ? season.episodes : 24;

  if (!rawValue || totalEpisodes <= 0) {
    return 0;
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(rawValue)) as Record<string, boolean>;
    const watchedCount = Object.values(parsed).filter(Boolean).length;
    return Math.max(0, Math.min(100, Math.round((watchedCount / totalEpisodes) * 100)));
  } catch {
    return 0;
  }
};

const buildProgressMap = (seasons: PokemonSeason[]) => {
  const progress: Record<number, number> = {};
  seasons.forEach((season) => {
    progress[season.season] = getWatchedProgressForSeason(season);
  });

  return progress;
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
        <NextImage
          src={thumbnailSrc}
          alt={title}
          fill
          sizes="300px"
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

export default function SeasonCarousel({ seasons }: SeasonCarouselProps) {
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
    const loadProgress = () => {
      setWatchedProgressBySeason(buildProgressMap(seasons));
    };

    window.addEventListener("focus", loadProgress);
    window.addEventListener("storage", loadProgress);

    return () => {
      window.removeEventListener("focus", loadProgress);
      window.removeEventListener("storage", loadProgress);
    };
  }, [seasons]);

  const cardWidth = STANDARD_CARD_WIDTH;

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

  if (!isCarouselEnabled) {
    return (
      <div className="netflix-scroll flex gap-4 overflow-x-auto px-1 py-3">
        {seasons.map((season) => (
          <Link
            key={season.title}
            href={`/stagione/${season.season}`}
            className="group relative flex h-[360px] w-[300px] shrink-0 flex-col overflow-hidden rounded-md border border-white/10 bg-zinc-900 transition duration-300 hover:-translate-y-1 hover:border-white/25"
          >
            {(watchedProgressBySeason[season.season] ?? 0) >= 100 ? (
              <span className="absolute right-2 top-2 z-20 inline-flex h-13 w-13 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md shadow-black/30">
                <IoCheckmark className="text-3xl" aria-hidden="true" />
              </span>
            ) : null}

            <SeasonThumbnail
              seasonNumber={season.season}
              title={season.title}
              arc={season.arc}
              accent={season.accent}
            />

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

              <p className="mt-3 text-xs text-white/60">
                <span className="inline-flex items-center gap-1">
                  <span>{season.years}</span>
                  <GoDotFill className="text-[10px]" aria-hidden="true" />
                  <span>{episodesLabel(season.episodes)}</span>
                </span>
              </p>
            </div>
          </Link>
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
            <Link
              key={`${season.title}-${index}`}
              href={`/stagione/${season.season}`}
              style={{
                width: `${cardWidth}px`,
                minWidth: `${cardWidth}px`,
                maxWidth: `${cardWidth}px`,
                height: `${STANDARD_CARD_HEIGHT}px`,
              }}
              className="group relative flex shrink-0 flex-col overflow-hidden rounded-md border border-white/10 bg-zinc-900 transition duration-300 hover:-translate-y-1 hover:border-white/25"
            >
              {(watchedProgressBySeason[season.season] ?? 0) >= 100 ? (
                <span className="absolute right-2 top-2 z-20 inline-flex h-13 w-13 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md shadow-black/30">
                  <IoCheckmark className="text-3xl" aria-hidden="true" />
                </span>
              ) : null}

              <SeasonThumbnail
                seasonNumber={season.season}
                title={season.title}
                arc={season.arc}
                accent={season.accent}
              />

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
          ))}
        </div>
      </div>
    </div>
  );
}
