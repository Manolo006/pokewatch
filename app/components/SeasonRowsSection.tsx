"use client";

import { useEffect, useMemo, useState } from "react";
import { get, ref } from "firebase/database";
import SeasonCarousel from "./SeasonCarousel";
import { db } from "@/app/lib/firebase";
import { allSeasons, seasonRows, type PokemonSeason } from "@/app/data/pokemonCatalog";

const TRENDING_LIMIT = 5;

const toSeasonOpenMap = (value: unknown): Record<number, number> => {
  if (!value || typeof value !== "object") return {};

  const result: Record<number, number> = {};

  Object.entries(value as Record<string, unknown>).forEach(([seasonKey, openCount]) => {
    const seasonNumber = Number(seasonKey);
    if (!Number.isInteger(seasonNumber)) return;

    const normalizedOpenCount = Number(openCount);
    if (!Number.isFinite(normalizedOpenCount) || normalizedOpenCount <= 0) return;

    result[seasonNumber] = Math.floor(normalizedOpenCount);
  });

  return result;
};

const fallbackTrendingSeasons = [...allSeasons]
  .sort((left, right) => right.season - left.season)
  .slice(0, TRENDING_LIMIT);

const buildTrendingSeasons = (seasonOpenMap: Record<number, number>): PokemonSeason[] => {
  const topByOpenCount = [...allSeasons]
    .filter((season) => (seasonOpenMap[season.season] ?? 0) > 0)
    .sort((left, right) => {
      const countDiff = (seasonOpenMap[right.season] ?? 0) - (seasonOpenMap[left.season] ?? 0);
      if (countDiff !== 0) return countDiff;
      return right.season - left.season;
    })
    .slice(0, TRENDING_LIMIT);

  return topByOpenCount.length > 0 ? topByOpenCount : fallbackTrendingSeasons;
};

export default function SeasonRowsSection() {
  const [seasonOpenMap, setSeasonOpenMap] = useState<Record<number, number>>({});

  useEffect(() => {
    const dbInstance = db;
    if (!dbInstance) {
      setSeasonOpenMap({});
      return;
    }

    const loadSeasonOpenCount = async () => {
      const candidatePaths = ["community/SeasonOpenCount", "SeasonOpenCount"];

      try {
        for (const path of candidatePaths) {
          const snapshot = await get(ref(dbInstance, path));
          const parsed = toSeasonOpenMap(snapshot.val());

          if (Object.keys(parsed).length > 0) {
            setSeasonOpenMap(parsed);
            return;
          }
        }

        setSeasonOpenMap({});
      } catch {
        setSeasonOpenMap({});
      }
    };

    void loadSeasonOpenCount();
    window.addEventListener("focus", loadSeasonOpenCount);

    return () => {
      window.removeEventListener("focus", loadSeasonOpenCount);
    };
  }, []);

  const trendingSeasons = useMemo(() => buildTrendingSeasons(seasonOpenMap), [seasonOpenMap]);

  return (
    <section className="mx-auto flex max-w-[1500px] flex-col gap-7 px-3 py-7 sm:gap-10 sm:px-8 sm:py-10">
      <div className="space-y-3 sm:space-y-4">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl sm:font-bold">Di tendenza</h2>
        <SeasonCarousel seasons={trendingSeasons} />
      </div>

      {seasonRows.map((row) => (
        <div key={row.rowTitle} className="space-y-3 sm:space-y-4">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl sm:font-bold">{row.rowTitle}</h2>
          <SeasonCarousel seasons={row.seasons} />
        </div>
      ))}
    </section>
  );
}
