import pokeRows from "./pokeRows.json";

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

const baseRows = pokeRows as PokemonRow[];
const baseSeasons = baseRows.flatMap((row) => row.seasons);

export const seasonRows: PokemonRow[] = baseRows;

export const allSeasons: PokemonSeason[] = seasonRows.flatMap((row) => row.seasons);

export const latestSeason: PokemonSeason | null = baseSeasons.reduce<PokemonSeason | null>((latest, current) => {
  if (!latest || current.season > latest.season) {
    return current;
  }

  return latest;
}, null);

export const episodesLabel = (episodes: number | null) =>
  episodes && episodes > 0 ? `${episodes} episodi` : "episodi N/D";

export const getSeasonByNumber = (seasonNumber: number) =>
  allSeasons.find((season) => season.season === seasonNumber) ?? null;

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
      synopsis: `${season.title}: episodio ${episodeNumber}. Ash e i suoi compagni affrontano una nuova sfida nella saga ${season.arc}.`,
    };
  });
};
