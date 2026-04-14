"use client";

import { useEffect } from "react";
import { increment, ref, remove, runTransaction, update } from "firebase/database";
import { db } from "@/app/lib/firebase";
import { useAuth } from "@/app/components/AuthProvider";

type SeasonOpenCountTrackerProps = {
  seasonNumber: number;
};

export default function SeasonOpenCountTracker({ seasonNumber }: SeasonOpenCountTrackerProps) {
  const { user, loading } = useAuth();

  useEffect(() => {
    const database = db;
    if (!database || !Number.isInteger(seasonNumber) || seasonNumber <= 0 || loading) return;

    let isActive = true;

    const incrementCommunityOpenCount = async () => {
      await update(ref(database), {
        [`community/SeasonOpenCount/${seasonNumber}`]: increment(1),
        [`SeasonOpenCount/${seasonNumber}`]: increment(1),
      });

      return true;
    };

    const trackOpenOnce = async () => {
      // Utente loggato: conteggio massimo una volta per stagione per uid (lato DB)
      if (user?.uid) {
        try {
          const userSeasonMarkerRef = ref(database, `users/${user.uid}/seasonOpenTracked/${seasonNumber}`);
          const markerResult = await runTransaction(userSeasonMarkerRef, (current) => {
            if (current === true) {
              return;
            }

            return true;
          });

          if (markerResult.committed && isActive) {
            try {
              await incrementCommunityOpenCount();
            } catch {
              // Rollback marker: allow retry al prossimo accesso se incremento community fallisce
              await remove(userSeasonMarkerRef);
            }
          }
          return;
        } catch {
          return;
        }
      }

      // Utente anonimo: fallback locale (una sola volta per browser/stagione)
      try {
        const anonKey = `pokewatch-anon-season-open-tracked-${seasonNumber}`;
        if (window.localStorage.getItem(anonKey) === "1") {
          return;
        }

        const incremented = await incrementCommunityOpenCount();
        if (incremented && isActive) {
          window.localStorage.setItem(anonKey, "1");
        }
      } catch {
        // Se localStorage non è disponibile, non tracciamo per evitare spam involontario
      }
    };

    void trackOpenOnce();

    return () => {
      isActive = false;
    };
  }, [loading, seasonNumber, user?.uid]);

  return null;
}
