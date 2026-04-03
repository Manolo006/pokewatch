export type YouTubePlaylistVideo = {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  youtubeUrl: string;
};

const PLAYLIST_ID_REGEX = /[?&]list=([a-zA-Z0-9_-]+)/;

const decodeYouTubeText = (value: string) =>
  value
    .replace(/\\u0026/g, "&")
    .replace(/\\u003d/g, "=")
    .replace(/\\u0027/g, "'")
    .replace(/\\\"/g, '"')
    .replace(/\\n/g, " ")
    .trim();

const extractPlaylistId = (playlistUrl: string) => {
  const match = playlistUrl.match(PLAYLIST_ID_REGEX);
  return match?.[1] ?? null;
};

export async function getYouTubePlaylistVideos(
  playlistUrl: string,
  maxItems = 50
): Promise<YouTubePlaylistVideo[]> {
  const playlistId = extractPlaylistId(playlistUrl);

  if (!playlistId) return [];

  const response = await fetch(`https://www.youtube.com/playlist?list=${playlistId}`, {
    next: { revalidate: 3600 },
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    },
  });

  if (!response.ok) {
    return [];
  }

  const html = await response.text();
  const regex =
    /"playlistVideoRenderer":\{"videoId":"([a-zA-Z0-9_-]{11})"[\s\S]*?"title":\{(?:"runs":\[\{"text":"([^"]*)"\}\]|"simpleText":"([^"]*)")/g;

  const videos: YouTubePlaylistVideo[] = [];
  const seen = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null && videos.length < maxItems) {
    const videoId = match[1];
    const rawTitle = match[2] || match[3] || "Episodio";

    if (seen.has(videoId)) continue;
    seen.add(videoId);

    videos.push({
      videoId,
      title: decodeYouTubeText(rawTitle),
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
    });
  }

  return videos;
}
