import Link from "next/link";
import NextImage from "next/image";
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
import { getYouTubePlaylistVideos } from "@/app/lib/youtubePlaylist";

type SeasonPageProps = {
  params: Promise<{ season: string }>;
};

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
      thumbnailUrl: youtubeVideo.thumbnailUrl,
      youtubeUrl: youtubeVideo.youtubeUrl,
    };
  });

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-4 py-4 sm:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded bg-white/10 px-3 py-2 text-sm font-semibold transition hover:bg-white/20"
          >
            <IoArrowBack aria-hidden="true" />
            Torna alla home
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-8 sm:py-10">
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
          <h2 className="text-2xl font-bold">Episodi</h2>

          <div className="space-y-3">
            {episodes.map((episode) => (
              <article key={episode.number} className="rounded-lg border border-white/10 bg-zinc-900/80 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <div className="relative h-24 w-full overflow-hidden rounded-md border border-white/10 bg-black sm:h-20 sm:w-36 sm:shrink-0">
                    {episode.thumbnailUrl ? (
                      <NextImage
                        src={episode.thumbnailUrl}
                        alt={episode.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 144px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-white/40">
                        Nessuna thumbnail
                      </div>
                    )}
                  </div>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white/90">
                    {episode.number}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-base font-bold sm:text-lg">{episode.title}</h3>
                      <span className="text-xs text-white/60">{episode.duration}</span>
                    </div>
                    <p className="text-sm text-white/70">{episode.synopsis}</p>

                    {episode.youtubeUrl ? (
                      <a
                        href={episode.youtubeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex pt-1 text-xs font-semibold text-red-300 transition hover:text-red-200"
                      >
                        Guarda su YouTube
                      </a>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
