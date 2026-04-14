"use client";

import { episodesLabel } from "@/app/data/pokemonCatalog";
import { useUILanguage } from "@/app/lib/useUILanguage";

type LanguageEpisodesLabelProps = {
  episodes: number | null;
};

export default function LanguageEpisodesLabel({ episodes }: LanguageEpisodesLabelProps) {
  const language = useUILanguage();
  return <>{episodesLabel(episodes, language)}</>;
}
