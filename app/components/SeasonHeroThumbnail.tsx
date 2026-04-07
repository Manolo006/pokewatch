"use client";

import { useEffect, useState } from "react";

type SeasonHeroThumbnailProps = {
  seasonNumber: number;
  title: string;
  accent: string;
  className?: string;
};

const getThumbnailCandidates = (seasonNumber: number) => [
  `../seasons/s${seasonNumber}.jpg`,
  `../seasons/s${seasonNumber}.jpeg`,
  `../seasons/s${seasonNumber}.png`,
  `../seasons/s${seasonNumber}.webp`,
  `./seasons/s${seasonNumber}.jpg`,
  `./seasons/s${seasonNumber}.jpeg`,
  `./seasons/s${seasonNumber}.png`,
  `./seasons/s${seasonNumber}.webp`,
];

export default function SeasonHeroThumbnail({
  seasonNumber,
  title,
  accent,
  className = "h-52",
}: SeasonHeroThumbnailProps) {
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
    <div className={`relative overflow-hidden ${className}`}>
      {thumbnailSrc ? (
        <img src={thumbnailSrc} alt={title} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className={`absolute inset-0 bg-linear-to-r ${accent} via-slate-700 to-black`} />
      )}

      <div className="absolute inset-0 bg-linear-to-t from-black/50 via-black/10 to-transparent" />
    </div>
  );
}
