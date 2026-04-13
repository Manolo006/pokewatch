import { getSeasonPlaylistUrl } from "@/app/data/seasonPlaylists";
import { getYouTubePlaylistVideos } from "@/app/lib/youtubePlaylist";

export const dynamic = "force-static";
export const revalidate = 3600;

type SeasonEpisodeDurationMap = Record<number, Record<number, number>>;

function parseDurationLabelToSeconds(duration?: string) {
  if (!duration) return null;

  const hoursMatch = duration.match(/(\d+)\s*h/);
  const minutesMatch = duration.match(/(\d+)\s*min/);
  const secondsMatch = duration.match(/(\d+)\s*sec/);

  const hours = Number(hoursMatch?.[1] ?? 0);
  const minutes = Number(minutesMatch?.[1] ?? 0);
  const seconds = Number(secondsMatch?.[1] ?? 0);

  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  return totalSeconds > 0 ? totalSeconds : null;
}

export async function GET() {
  const durationsBySeason: SeasonEpisodeDurationMap = {};

  const seasons = [1, 2, 3, 4, 5, 6, 7, 8];

  await Promise.all(
    seasons.map(async (seasonNumber) => {
      const playlistUrl = getSeasonPlaylistUrl(seasonNumber);
      if (!playlistUrl) return;

      const videos = await getYouTubePlaylistVideos(playlistUrl, 400);
      if (videos.length === 0) return;

      const byEpisode: Record<number, number> = {};

      videos.forEach((video, index) => {
        const episodeNumber = index + 1;
        const seconds = parseDurationLabelToSeconds(video.duration);

        if (seconds) {
          byEpisode[episodeNumber] = seconds;
        }
      });

      if (Object.keys(byEpisode).length > 0) {
        durationsBySeason[seasonNumber] = byEpisode;
      }
    })
  );

  return Response.json(
    { durationsBySeason },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}
