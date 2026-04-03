import SeasonCarousel from "./components/SeasonCarousel";
import { GoDotFill } from "react-icons/go";
import { IoAdd, IoPlay } from "react-icons/io5";
import { episodesLabel, latestSeason, seasonRows, type PokemonSeason } from "./data/pokemonCatalog";

const featuredSeason: PokemonSeason =
  latestSeason ?? {
    season: 0,
    title: "Pokémon",
    arc: "",
    synopsis: "Nessuna stagione disponibile.",
    episodes: null,
    years: "",
    accent: "from-zinc-700/90",
  };

export default function Home() {
  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between px-4 py-4 sm:px-8">
          <div className="flex items-center gap-4">
            <img src="./logo.png" alt="PokéWatch" width={180} height={42} className="h-auto w-[150px] sm:w-[180px]" />
            <span className="rounded bg-yellow-400 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-black">
              ANIME
            </span>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-white/80 md:flex">
            <a href="#" className="hover:text-white">
              Home
            </a>
            <a href="#" className="hover:text-white">
              Serie
            </a>
            <a href="#" className="hover:text-white">
              Ultime aggiunte
            </a>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative isolate overflow-hidden border-b border-white/10">
          <video
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
          >
            <source src="./trailers28.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,#2563eb55,transparent_40%)]" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />

          <div className="mx-auto grid max-w-[1500px] px-4 py-20 sm:px-8 lg:grid-cols-[1.3fr_1fr]">
            <div className="relative z-10 max-w-2xl space-y-5">
              <p className="text-xs font-bold tracking-[0.25em] text-white/70">STAGIONE IN EVIDENZA</p>
              <h1 className="text-4xl font-black leading-tight sm:text-6xl">{featuredSeason.title}</h1>
              <p className="text-base text-white/85 sm:text-lg">{featuredSeason.synopsis}</p>
              <p className="flex flex-wrap items-center gap-1 text-sm text-white/60">
                <span>Stagione {featuredSeason.season}</span>
                <GoDotFill className="text-[10px]" aria-hidden="true" />
                <span>{featuredSeason.years}</span>
                <GoDotFill className="text-[10px]" aria-hidden="true" />
                <span>{episodesLabel(featuredSeason.episodes)}</span>
              </p>
              <div className="flex flex-wrap gap-3">
                <button className="inline-flex items-center gap-2 rounded bg-white px-6 py-2.5 text-sm font-bold text-black transition hover:bg-white/90">
                  <IoPlay className="text-base" aria-hidden="true" />
                  <span>Riproduci</span>
                </button>
                <button className="inline-flex items-center gap-1 rounded bg-white/20 px-6 py-2.5 text-sm font-bold transition hover:bg-white/30">
                  <IoAdd className="text-base" aria-hidden="true" />
                  <span>La mia lista</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto flex max-w-[1500px] flex-col gap-10 px-4 py-10 sm:px-8">
          {seasonRows.map((row) => (
            <div key={row.rowTitle} className="space-y-4">
              <h2 className="text-xl font-bold sm:text-2xl">{row.rowTitle}</h2>

              <SeasonCarousel seasons={row.seasons} />
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
