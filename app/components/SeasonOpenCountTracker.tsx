"use client";

import { useEffect } from "react";
import { ref, runTransaction } from "firebase/database";
import { db } from "@/app/lib/firebase";
import { useAuth } from "@/app/components/AuthProvider";

type SeasonOpenCountTrackerProps = {
  seasonNumber: number;
};

export default function SeasonOpenCountTracker({ seasonNumber }: SeasonOpenCountTrackerProps) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!db || !Number.isInteger(seasonNumber) || seasonNumber <= 0 || loading) return;

    let isActive = true;

    const incrementCommunityOpenCount = async () => {
      const result = await runTransaction(ref(db, `community/SeasonOpenCount/${seasonNumber}`), (current) => {
        const count = Number(current);
        return Number.isFinite(count) && count >= 0 ? count + 1 : 1;
      });

      return result.committed;
    };

    const trackOpenOnce = async () => {
      // Utente loggato: conteggio massimo una volta per stagione per uid (lato DB)
      if (user?.uid) {
        try {
          const userSeasonMarkerRef = ref(db, `users/${user.uid}/seasonOpenTracked/${seasonNumber}`);
          const markerResult = await runTransaction(userSeasonMarkerRef, (current) => {
            if (current === true) {
              return;
            }

            return true;
          });

          if (markerResult.committed && isActive) {
            await incrementCommunityOpenCount();
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
