export type YouTubePlaylistVideo = {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  youtubeUrl: string;
  duration?: string;
};

const PLAYLIST_ID_REGEX = /[?&]list=([a-zA-Z0-9_-]+)/;

type YouTubePlaylistItemsApiResponse = {
  nextPageToken?: string;
  items?: Array<{
    snippet?: {
      title?: string;
      resourceId?: {
        videoId?: string;
      };
      thumbnails?: {
        high?: { url?: string };
        medium?: { url?: string };
        default?: { url?: string };
      };
    };
  }>;
};

type YouTubeVideosApiResponse = {
  items?: Array<{
    id?: string;
    contentDetails?: {
      duration?: string;
    };
  }>;
};

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

const parseIsoDurationToLabel = (isoDuration?: string) => {
  if (!isoDuration) return undefined;

  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return undefined;

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);

  if (hours > 0) {
    if (minutes > 0 && seconds > 0) return `${hours} h ${minutes} min ${seconds} sec`;
    if (minutes > 0) return `${hours} h ${minutes} min`;
    if (seconds > 0) return `${hours} h ${seconds} sec`;
    return `${hours} h 0 min`;
  }

  if (minutes > 0 && seconds > 0) return `${minutes} min ${seconds} sec`;
  if (minutes > 0) return `${minutes} min`;
  if (seconds > 0) return `${seconds} sec`;

  return undefined;
};

const parseClockDurationToLabel = (clockDuration?: string) => {
  if (!clockDuration) return undefined;

  const parts = clockDuration
    .trim()
    .split(":")
    .map((part) => Number(part));

  if (parts.some((part) => Number.isNaN(part))) return undefined;

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    if (hours > 0 && minutes > 0 && seconds > 0) return `${hours} h ${minutes} min ${seconds} sec`;
    if (hours > 0 && minutes > 0) return `${hours} h ${minutes} min`;
    if (hours > 0 && seconds > 0) return `${hours} h ${seconds} sec`;
    if (hours > 0) return `${hours} h 0 min`;
    if (minutes > 0 && seconds > 0) return `${minutes} min ${seconds} sec`;
    if (minutes > 0) return `${minutes} min`;
    if (seconds > 0) return `${seconds} sec`;
    return undefined;
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    if (minutes > 0 && seconds > 0) return `${minutes} min ${seconds} sec`;
    if (minutes > 0) return `${minutes} min`;
    if (seconds > 0) return `${seconds} sec`;
    return undefined;
  }

  if (parts.length === 1 && parts[0] > 0) {
    return `${parts[0]} sec`;
  }

  return undefined;
};

const chunk = <T>(items: T[], size: number) => {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
};

async function getPlaylistVideosViaApi(
  playlistId: string,
  maxItems: number,
  apiKey: string
): Promise<YouTubePlaylistVideo[]> {
  const playlistVideos: YouTubePlaylistVideo[] = [];
  let nextPageToken: string | undefined;

  while (playlistVideos.length < maxItems) {
    const params = new URLSearchParams({
      part: "snippet",
      playlistId,
      maxResults: String(Math.min(50, maxItems - playlistVideos.length)),
      key: apiKey,
    });

    if (nextPageToken) {
      params.set("pageToken", nextPageToken);
    }

    const response = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?${params.toString()}`, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      break;
    }

    const data = (await response.json()) as YouTubePlaylistItemsApiResponse;

    for (const item of data.items ?? []) {
      const videoId = item.snippet?.resourceId?.videoId;
      if (!videoId) continue;

      const title = item.snippet?.title?.trim() || "Episodio";
      const thumbnailUrl =
        item.snippet?.thumbnails?.high?.url ||
        item.snippet?.thumbnails?.medium?.url ||
        item.snippet?.thumbnails?.default?.url ||
        `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      playlistVideos.push({
        videoId,
        title,
        thumbnailUrl,
        youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
      });

      if (playlistVideos.length >= maxItems) break;
    }

    if (!data.nextPageToken) break;
    nextPageToken = data.nextPageToken;
  }

  if (playlistVideos.length === 0) return playlistVideos;

  const durationMap = new Map<string, string>();
  const videoIdChunks = chunk(
    [...new Set(playlistVideos.map((video) => video.videoId))],
    50
  );

  for (const ids of videoIdChunks) {
    const params = new URLSearchParams({
      part: "contentDetails",
      id: ids.join(","),
      key: apiKey,
    });

    const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params.toString()}`, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) continue;

    const data = (await response.json()) as YouTubeVideosApiResponse;
    for (const item of data.items ?? []) {
      const id = item.id;
      if (!id) continue;

      const duration = parseIsoDurationToLabel(item.contentDetails?.duration);
      if (duration) {
        durationMap.set(id, duration);
      }
    }
  }

  return playlistVideos.map((video) => ({
    ...video,
    duration: durationMap.get(video.videoId),
  }));
}

export async function getYouTubePlaylistVideos(
  playlistUrl: string,
  maxItems = 50
): Promise<YouTubePlaylistVideo[]> {
  const playlistId = extractPlaylistId(playlistUrl);

  if (!playlistId) return [];

  const apiKey = process.env.YOUTUBE_API_KEY;

  if (apiKey) {
    const apiVideos = await getPlaylistVideosViaApi(playlistId, maxItems, apiKey);
    if (apiVideos.length > 0) {
      return apiVideos;
    }
  }

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
  const durationByVideoId = new Map<string, string>();
  const durationRegex =
    /"videoId":"([a-zA-Z0-9_-]{11})"[\s\S]*?"lengthText":\{[\s\S]*?"simpleText":"([0-9:]+)"\}/g;

  let durationMatch: RegExpExecArray | null;
  while ((durationMatch = durationRegex.exec(html)) !== null) {
    const videoId = durationMatch[1];
    const rawClockDuration = durationMatch[2];
    const durationLabel = parseClockDurationToLabel(rawClockDuration);

    if (durationLabel && !durationByVideoId.has(videoId)) {
      durationByVideoId.set(videoId, durationLabel);
    }
  }

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
      duration: durationByVideoId.get(videoId),
    });
  }

  return videos;
}
