"use client";

import AuthHeaderActions from "./components/AuthHeaderActions";
import ContinueWatchingButton from "./components/ContinueWatchingButton";
import SeasonRowsSection from "./components/SeasonRowsSection";
import LanguageText from "./components/LanguageText";
import { GoDotFill } from "react-icons/go";
import { IoAdd, IoPlay } from "react-icons/io5";
import { episodesLabel, getLatestSeason, type PokemonSeason } from "./data/pokemonCatalog";
import { getUIText } from "./lib/uiLanguage";
import { useUILanguage } from "./lib/useUILanguage";

export default function Home() {
  const language = useUILanguage();
  const localizedLatestSeason = getLatestSeason(language);
  const featuredSeason: PokemonSeason =
    localizedLatestSeason ?? {
      season: 0,
      title: "Pokémon",
      arc: "",
      synopsis: getUIText("noSeasonAvailable", language),
      episodes: null,
      years: "",
      accent: "from-zinc-700/90",
    };

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1500px] flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-8 sm:py-4">
          <div className="flex items-center gap-2.5 sm:gap-4">
            <img src="./logo.png" alt="PokéWatch" width={180} height={42} className="h-auto w-[122px] sm:w-[180px]" />
            <span className="rounded bg-yellow-400 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-black">
              <LanguageText textKey="animeBadge" />
            </span>
          </div>

          <nav className="mobile-top-nav order-3 flex w-full items-center gap-4 overflow-x-auto whitespace-nowrap text-[11px] text-white/80 sm:order-none sm:w-auto sm:gap-6 sm:text-sm">
            <a href="./" className="hover:text-white">
              <LanguageText textKey="home" />
            </a>
            <a href="#" className="hover:text-white">
              <LanguageText textKey="seriesTv" />
            </a>
            <a href="./timeline" className="hover:text-white">
              <LanguageText textKey="timeline" />
            </a>
          </nav>

          <AuthHeaderActions />
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

          <div className="mx-auto grid max-w-[1500px] px-3 py-7 sm:px-8 sm:py-20 lg:grid-cols-[1.3fr_1fr]">
            <div className="relative z-10 max-w-2xl space-y-5">
              <p className="text-xs font-bold tracking-[0.25em] text-white/70">{getUIText("featuredSeason", language)}</p>
              <h1 className="text-2xl font-black leading-tight sm:text-6xl">{featuredSeason.title}</h1>
              <p className="text-xs text-white/85 sm:text-lg">{featuredSeason.synopsis}</p>
              <p className="flex flex-wrap items-center gap-1 text-xs text-white/60 sm:text-sm">
                <span>{getUIText("season", language)} {featuredSeason.season}</span>
                <GoDotFill className="text-[10px]" aria-hidden="true" />
                <span>{featuredSeason.years}</span>
                <GoDotFill className="text-[10px]" aria-hidden="true" />
                <span>{episodesLabel(featuredSeason.episodes, language)}</span>
              </p>
              <div className="flex flex-wrap gap-2.5 sm:gap-3">
                <button className="inline-flex items-center gap-2 rounded bg-white px-4 py-2 text-xs font-bold text-black transition hover:bg-white/90 sm:px-6 sm:py-2.5 sm:text-sm">
                  <IoPlay className="text-base" aria-hidden="true" />
                  <span>{getUIText("play", language)}</span>
                </button>
                <button className="inline-flex items-center gap-1 rounded bg-white/20 px-4 py-2 text-xs font-bold transition hover:bg-white/30 sm:px-6 sm:py-2.5 sm:text-sm">
                  <IoAdd className="text-base" aria-hidden="true" />
                  <span>{getUIText("myList", language)}</span>
                </button>
                <ContinueWatchingButton />
              </div>
            </div>
          </div>
        </section>

        <SeasonRowsSection />
      </main>
    </div>
  );
}
