import Link from "next/link";
import { notFound } from "next/navigation";
import { GoDotFill } from "react-icons/go";
import { IoArrowBack, IoChevronBack, IoChevronForward } from "react-icons/io5";
import {
  allSeasons,
  episodesLabel,
  getEpisodesForSeason,
  getSeasonByNumber,
} from "@/app/data/pokemonCatalog";
import { getSeasonPlaylistUrl } from "@/app/data/seasonPlaylists";
import SeasonHeroThumbnail from "@/app/components/SeasonHeroThumbnail";
import SeasonEpisodesList from "@/app/components/SeasonEpisodesList";
import SeasonOpenCountTracker from "@/app/components/SeasonOpenCountTracker";
import { getYouTubePlaylistVideos } from "@/app/lib/youtubePlaylist";

type SeasonPageProps = {
  params: Promise<{ season: string }>;
};

export function generateStaticParams() {
  return allSeasons.map((season) => ({
    season: String(season.season),
  }));
}

export default async function SeasonPage({ params }: SeasonPageProps) {
  const { season } = await params;
  const seasonNumber = Number(season);

  if (!Number.isInteger(seasonNumber) || seasonNumber <= 0) {
    notFound();
  }

  const selectedSeason = getSeasonByNumber(seasonNumber);

  if (!selectedSeason) {
    notFound();
  }

  const currentSeasonIndex = allSeasons.findIndex((item) => item.season === selectedSeason.season);

  if (currentSeasonIndex === -1) {
    notFound();
  }

  const previousSeason =
    allSeasons[(currentSeasonIndex - 1 + allSeasons.length) % allSeasons.length];
  const nextSeason = allSeasons[(currentSeasonIndex + 1) % allSeasons.length];

  const fallbackEpisodes = getEpisodesForSeason(selectedSeason);

  const playlistUrl = getSeasonPlaylistUrl(selectedSeason.season);
  const youtubeVideos = playlistUrl ? await getYouTubePlaylistVideos(playlistUrl, fallbackEpisodes.length) : [];

  const episodes = fallbackEpisodes.map((episode, index) => {
    const youtubeVideo = youtubeVideos[index];

    if (!youtubeVideo) {
      return episode;
    }

    return {
      ...episode,
      title: youtubeVideo.title || episode.title,
      duration: youtubeVideo.duration || episode.duration,
      thumbnailUrl: youtubeVideo.thumbnailUrl,
      youtubeUrl: youtubeVideo.youtubeUrl,
    };
  });

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <SeasonOpenCountTracker seasonNumber={selectedSeason.season} />

      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-300 items-center justify-between px-4 py-4 sm:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded bg-white/10 px-3 py-2 text-sm font-semibold transition hover:bg-white/20"
          >
            <IoArrowBack aria-hidden="true" />
            Torna alla home
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-300 px-4 py-8 sm:px-8 sm:py-10">
        <section className="overflow-hidden rounded-xl border border-white/10 bg-zinc-900/80">
          <SeasonHeroThumbnail
            seasonNumber={selectedSeason.season}
            title={selectedSeason.title}
            accent={selectedSeason.accent}
            className="h-48 sm:h-56"
          />

          <div className="space-y-4 p-6 sm:p-8">
            <p className="text-xs font-bold tracking-[0.2em] text-white/70">DETTAGLIO STAGIONE</p>
            <h1 className="text-3xl font-black leading-tight sm:text-4xl">{selectedSeason.title}</h1>
            <p className="text-sm text-white/75 sm:text-base">{selectedSeason.synopsis}</p>

            <p className="flex flex-wrap items-center gap-1 text-xs text-white/70 sm:text-sm">
              <span>Stagione {selectedSeason.season}</span>
              <GoDotFill className="text-[10px]" aria-hidden="true" />
              <span>{selectedSeason.arc}</span>
              <GoDotFill className="text-[10px]" aria-hidden="true" />
              <span>{selectedSeason.years}</span>
              <GoDotFill className="text-[10px]" aria-hidden="true" />
              <span>{episodesLabel(selectedSeason.episodes)}</span>
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href={`/stagione/${previousSeason.season}`}
                className="inline-flex items-center gap-2 rounded bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/20"
                aria-label={`Vai alla stagione precedente: ${previousSeason.title}`}
              >
                <IoChevronBack aria-hidden="true" />
                Stagione precedente
              </Link>

              <Link
                href={`/stagione/${nextSeason.season}`}
                className="inline-flex items-center gap-2 rounded bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/20"
                aria-label={`Vai alla stagione successiva: ${nextSeason.title}`}
              >
                Stagione successiva
                <IoChevronForward aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 space-y-4 sm:mt-10">
          <SeasonEpisodesList seasonNumber={selectedSeason.season} episodes={episodes} />

          <div className="mt-6 flex flex-wrap gap-3 border-t border-white/10 pt-6">
            <Link
              href={`/stagione/${previousSeason.season}`}
              className="inline-flex items-center gap-2 rounded bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/20"
              aria-label={`Vai alla stagione precedente: ${previousSeason.title}`}
            >
              <IoChevronBack aria-hidden="true" />
              Stagione precedente
            </Link>

            <Link
              href={`/stagione/${nextSeason.season}`}
              className="inline-flex items-center gap-2 rounded bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/20"
              aria-label={`Vai alla stagione successiva: ${nextSeason.title}`}
            >
              Stagione successiva
              <IoChevronForward aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
