"use client";

import { useEffect } from "react";
import { ref, runTransaction } from "firebase/database";
import { db } from "@/app/lib/firebase";

type SeasonOpenCountTrackerProps = {
  seasonNumber: number;
};

const DEDUPE_WINDOW_MS = 1500;

export default function SeasonOpenCountTracker({ seasonNumber }: SeasonOpenCountTrackerProps) {
  useEffect(() => {
    if (!db || !Number.isInteger(seasonNumber) || seasonNumber <= 0) return;

    const storageKey = `pokewatch-season-open-count-${seasonNumber}`;
    const now = Date.now();

    try {
      const lastTrackedAtRaw = window.sessionStorage.getItem(storageKey);
      const lastTrackedAt = Number(lastTrackedAtRaw);

      if (Number.isFinite(lastTrackedAt) && now - lastTrackedAt < DEDUPE_WINDOW_MS) {
        return;
      }

      window.sessionStorage.setItem(storageKey, String(now));
    } catch {
      // no-op
    }

    void runTransaction(ref(db, `community/SeasonOpenCount/${seasonNumber}`), (current) => {
      const count = Number(current);
      return Number.isFinite(count) && count >= 0 ? count + 1 : 1;
    });
  }, [seasonNumber]);

  return null;
}
