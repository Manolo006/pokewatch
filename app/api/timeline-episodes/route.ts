import { getSeasonPlaylistUrl } from "@/app/data/seasonPlaylists";
import { getYouTubePlaylistVideos } from "@/app/lib/youtubePlaylist";

export const revalidate = 3600;

type TimelineEpisodePointer = {
  beforeSeason: number;
  beforeEpisode: number;
  afterSeason: number;
  afterEpisode: number;
};

const timelineEpisodeMap: Record<string, TimelineEpisodePointer> = {
  mewtwo: { beforeSeason: 2, beforeEpisode: 13, afterSeason: 2, afterEpisode: 14 },
  film2: { beforeSeason: 2, beforeEpisode: 60, afterSeason: 3, afterEpisode: 1 },
  unown: { beforeSeason: 3, beforeEpisode: 38, afterSeason: 3, afterEpisode: 39 },
  pokemon4ever: { beforeSeason: 4, beforeEpisode: 43, afterSeason: 4, afterEpisode: 44 },
  heroes: { beforeSeason: 5, beforeEpisode: 38, afterSeason: 5, afterEpisode: 39 },
};

type TimelineEpisodeUrls = {
  beforeSeason: number;
  beforeEpisode: number;
  beforeEpisodeTitle: string | null;
  beforeEpisodeYoutubeUrl: string | null;
  afterSeason: number;
  afterEpisode: number;
  afterEpisodeTitle: string | null;
  afterEpisodeYoutubeUrl: string | null;
};

export async function GET() {
  const seasonNumbers = [
    ...new Set(
      Object.values(timelineEpisodeMap).flatMap((item) => [
        item.beforeSeason,
        item.afterSeason,
      ])
    ),
  ];

  const videosBySeason = new Map<number, Awaited<ReturnType<typeof getYouTubePlaylistVideos>>>();

  await Promise.all(
    seasonNumbers.map(async (season) => {
      const playlistUrl = getSeasonPlaylistUrl(season);
      if (!playlistUrl) {
        videosBySeason.set(season, []);
        return;
      }

      const videos = await getYouTubePlaylistVideos(playlistUrl, 500, "it");
      videosBySeason.set(season, videos);
    })
  );

  const urlsByFilmKey: Record<string, TimelineEpisodeUrls> = {};

  Object.entries(timelineEpisodeMap).forEach(([filmKey, pointer]) => {
    const beforeSeasonVideos = videosBySeason.get(pointer.beforeSeason) ?? [];
    const afterSeasonVideos = videosBySeason.get(pointer.afterSeason) ?? [];
    const beforeVideo = beforeSeasonVideos[pointer.beforeEpisode - 1];
    const afterVideo = afterSeasonVideos[pointer.afterEpisode - 1];

    urlsByFilmKey[filmKey] = {
      beforeSeason: pointer.beforeSeason,
      beforeEpisode: pointer.beforeEpisode,
      beforeEpisodeTitle: beforeVideo?.title ?? null,
      beforeEpisodeYoutubeUrl: beforeVideo?.youtubeUrl ?? null,
      afterSeason: pointer.afterSeason,
      afterEpisode: pointer.afterEpisode,
      afterEpisodeTitle: afterVideo?.title ?? null,
      afterEpisodeYoutubeUrl: afterVideo?.youtubeUrl ?? null,
    };
  });

  return Response.json(
    { urlsByFilmKey },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}
