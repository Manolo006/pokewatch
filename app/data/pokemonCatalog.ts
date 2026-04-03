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

const trendingSeasons: PokemonSeason[] = [
  {
    season: 101,
    title: "Pokémon Legends: Rising Sparks",
    arc: "Trend 1",
    synopsis: "Placeholder: una nuova avventura ad alta energia tra regioni inedite e sfide globali.",
    episodes: null,
    years: "Prossimamente",
    accent: "from-pink-600/90",
  },
  {
    season: 102,
    title: "Pokémon Nova Frontier",
    arc: "Trend 2",
    synopsis: "Placeholder: allenatori emergenti si sfidano in una frontiera ricca di misteri.",
    episodes: null,
    years: "Prossimamente",
    accent: "from-indigo-600/90",
  },
  {
    season: 103,
    title: "Pokémon Eclipse Quest",
    arc: "Trend 3",
    synopsis: "Placeholder: un viaggio tra fenomeni rari e leggende antiche mai esplorate.",
    episodes: null,
    years: "Prossimamente",
    accent: "from-purple-600/90",
  },
  {
    season: 104,
    title: "Pokémon Crystal Horizon",
    arc: "Trend 4",
    synopsis: "Placeholder: nuove alleanze e rivalità in un torneo interregionale spettacolare.",
    episodes: null,
    years: "Prossimamente",
    accent: "from-cyan-500/90",
  },
  {
    season: 105,
    title: "Pokémon Mythic Pulse",
    arc: "Trend 5",
    synopsis: "Placeholder: antiche forze si risvegliano e cambiano gli equilibri del mondo Pokémon.",
    episodes: null,
    years: "Prossimamente",
    accent: "from-amber-500/90",
  },
];

export const seasonRows: PokemonRow[] = [
  {
    rowTitle: "Trending",
    seasons: trendingSeasons,
  },
  ...baseRows,
];

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
