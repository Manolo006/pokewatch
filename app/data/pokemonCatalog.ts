import pokeRows from "./pokeRows.json";
import type { UILanguage } from "@/app/lib/uiLanguage";

type LocalizedText = {
  it: string;
  en: string;
};

export type PokemonSeason = {
  season: number;
  title: string;
  arc: string;
  synopsis: string;
  episodes: number | null;
  years: string;
  accent: string;
};

export type PokemonRow = {
  rowTitle: string;
  seasons: PokemonSeason[];
};

export type LocalizedPokemonSeason = Omit<PokemonSeason, "synopsis"> & {
  synopsis: LocalizedText;
};

export type LocalizedPokemonRow = {
  rowTitle: LocalizedText;
  seasons: LocalizedPokemonSeason[];
};

const baseRows = pokeRows as PokemonRow[];

const toEnglishSynopsis = (season: PokemonSeason): string => {
  if (season.season === 1) return "Ash begins his journey with Pikachu, facing Gyms and legendary encounters.";
  if (season.season === 2) return "A tropical adventure with new challenges and off-route battles from the League path.";
  if (season.season === 3) return "A new region, new starters, and increasingly competitive rivals.";
  if (season.season === 4) return "Ash aims for the top of the Johto League with more mature strategies.";
  if (season.season === 5) return "The final stretch in Johto prepares Ash for the Silver Conference.";
  if (season.season === 6) return "New companions, Pokémon Contests, and the first challenges in Hoenn.";
  if (season.season === 7) return "The challenge level rises with Gym battles and the Grand Festival.";
  if (season.season === 8) return "Stronger rivals and decisive battles push Ash toward the Hoenn League.";
  if (season.season === 9) return "The Battle Frontier tests tactics, endurance, and team spirit.";
  if (season.season === 10) return "A new team and new techniques in a region rich in myths and legends.";
  if (season.season === 11) return "Competition intensifies as rivals refine their tactics and strategy.";
  if (season.season === 12) return "Team Galactic enters the scene and threatens the balance of the entire region.";
  if (season.season === 13) return "The Sinnoh League decides who truly deserves the title of top Trainer.";
  if (season.season === 14) return "Ash and Pikachu head to Unova, facing a region full of new Pokémon and rivals.";
  if (season.season === 15) return "Rivalries heat up as the road to the Unova League reaches its peak.";
  if (season.season === 16) return "The journey continues beyond Unova with final battles and pivotal encounters.";
  if (season.season === 17) return "Ash arrives in Kalos and builds a new team to explore Gyms and regional mysteries.";
  if (season.season === 18) return "The badge quest continues while Serena pursues her goals in Pokémon Showcases.";
  if (season.season === 19) return "Team Flare's threat grows, leading to crucial challenges for Kalos' future.";
  if (season.season === 20) return "In Alola, Ash experiences school life and new adventures in a different format.";
  if (season.season === 21) return "The journey expands with Ultra Beasts and increasingly demanding trials.";
  if (season.season === 22) return "The Alola chapter concludes with epic challenges and the climax of the local League.";
  if (season.season === 23) return "Ash and Goh travel across many regions, meeting old and new Pokémon.";
  if (season.season === 24) return "The climb in the World Coronation Series continues with higher-profile matchups.";
  if (season.season === 25) return "Ash's path to the world summit reaches decisive final battles.";
  if (season.season === 26) return "A final mini-series celebrating Ash and Pikachu with emotional closure.";
  return season.synopsis;
};

const toEnglishRowTitle = (rowTitle: string): string => {
  if (rowTitle === "Saga Classica") return "Classic Series";
  if (rowTitle === "Diamante e Perla") return "Diamond & Pearl";
  if (rowTitle === "Nero e Bianco") return "Black & White";
  if (rowTitle === "Sole e Luna") return "Sun & Moon";
  if (rowTitle === "Esplorazioni Pokémon") return "Pokémon Journeys";
  return rowTitle;
};

export const localizedSeasonRows: LocalizedPokemonRow[] = baseRows.map((row) => ({
  rowTitle: {
    it: row.rowTitle,
    en: toEnglishRowTitle(row.rowTitle),
  },
  seasons: row.seasons.map((season) => ({
    ...season,
    synopsis: {
      it: season.synopsis,
      en: toEnglishSynopsis(season),
    },
  })),
}));

const baseSeasons = localizedSeasonRows.flatMap((row) => row.seasons);

export const seasonRows: PokemonRow[] = localizedSeasonRows.map((row) => ({
  rowTitle: row.rowTitle.it,
  seasons: row.seasons.map((season) => ({
    ...season,
    synopsis: season.synopsis.it,
  })),
}));

export const allSeasons: PokemonSeason[] = seasonRows.flatMap((row) => row.seasons);

export const getLocalizedSeasonRows = (language: UILanguage): PokemonRow[] =>
  localizedSeasonRows.map((row) => ({
    rowTitle: row.rowTitle[language],
    seasons: row.seasons.map((season) => ({
      ...season,
      synopsis: season.synopsis[language],
    })),
  }));

export const getLocalizedAllSeasons = (language: UILanguage): PokemonSeason[] =>
  getLocalizedSeasonRows(language).flatMap((row) => row.seasons);

export const latestSeason: PokemonSeason | null = baseSeasons.reduce<PokemonSeason | null>((latest, current) => {
  const mappedCurrent: PokemonSeason = { ...current, synopsis: current.synopsis.it };
  if (!latest || current.season > latest.season) {
    return mappedCurrent;
  }

  return latest;
}, null);

export const getLatestSeason = (language: UILanguage): PokemonSeason | null => {
  const localizedSeasons = getLocalizedAllSeasons(language);

  return localizedSeasons.reduce<PokemonSeason | null>((latest, current) => {
    if (!latest || current.season > latest.season) {
      return current;
    }

    return latest;
  }, null);
};

export const episodesLabel = (episodes: number | null, language: UILanguage = "it") => {
  const hasEpisodes = Boolean(episodes && episodes > 0);

  if (language === "en") {
    return hasEpisodes ? `${episodes} episodes` : "episodes N/A";
  }

  return hasEpisodes ? `${episodes} episodi` : "episodi N/D";
};

export const getSeasonByNumber = (seasonNumber: number) =>
  allSeasons.find((season) => season.season === seasonNumber) ?? null;

export const getLocalizedSeasonByNumber = (seasonNumber: number, language: UILanguage) =>
  getLocalizedAllSeasons(language).find((season) => season.season === seasonNumber) ?? null;

export type PokemonEpisode = {
  number: number;
  title: string;
  duration: string;
  synopsis: string;
  thumbnailUrl?: string;
  youtubeUrl?: string;
};

const getEpisodeCount = (season: PokemonSeason) => {
  if (season.episodes && season.episodes > 0) return season.episodes;
  return 24;
};

export const getEpisodesForSeason = (season: PokemonSeason): PokemonEpisode[] => {
  const totalEpisodes = getEpisodeCount(season);

  return Array.from({ length: totalEpisodes }, (_, index) => {
    const episodeNumber = index + 1;

    return {
      number: episodeNumber,
      title: `Episodio ${episodeNumber}`,
      duration: "23 min",
      synopsis: `${season.title}: episodio ${episodeNumber}. Ash e i suoi compagni affrontano una nuova sfida nella regione di  ${season.arc}.`,
    };
  });
};
