"use client";

import { useMemo, useState } from "react";
import AuthHeaderActions from "@/app/components/AuthHeaderActions";
import LanguageText from "@/app/components/LanguageText";
import { getUIText } from "@/app/lib/uiLanguage";
import { useUILanguage } from "@/app/lib/useUILanguage";

type Era = "Original" | "Advanced" | "DiamondPearl" | "XY";

type FilmTimelineBlock = {
  key: string;
  filmTitle: string;
  era: Era;
  beforeEpisode?: string;
  afterEpisode?: string;
  note: string;
  episodeImage: string;
  filmImage: string;
};

const DATA_SOURCE =
  "https://pokenerd.altervista.org/collocazione-dei-film-tra-gli-episodi-dellanime-pokemon/";

const EP_IMG =
  "https://pokenerd.altervista.org/wp-content/uploads/2018/03/222-Il-pokemon-misterioso.mkv_snapshot_11.40.png";
const FILM_IMG =
  "https://pokenerd.altervista.org/wp-content/uploads/2015/01/oolho-copy.png";

const placements: FilmTimelineBlock[] = [
  {
    key: "mewtwo",
    filmTitle: "Mewtwo Strikes Back",
    era: "Original",
    beforeEpisode: "La Grande onda",
    afterEpisode: "Insidia Verde",
    note: "Collocazione esplicita indicata dalla fonte.",
    episodeImage: EP_IMG,
    filmImage: FILM_IMG,
  },
  {
    key: "film2",
    filmTitle: "Pokémon 2 - La forza di 1",
    era: "Original",
    beforeEpisode: "Un nuovo sfidante",
    afterEpisode: "L’alga curativa",
    note: "Charizard obbedisce e Misty non sembra avere Poliwag.",
    episodeImage: EP_IMG,
    filmImage: FILM_IMG,
  },
  {
    key: "unown",
    filmTitle: "L'incantesimo degli Unown",
    era: "Original",
    beforeEpisode: "Ride bene chi ride ultimo",
    afterEpisode: "Ma che bel castello",
    note: "Dopo Noctowl e prima dell’evoluzione di Zubat.",
    episodeImage: EP_IMG,
    filmImage: FILM_IMG,
  },
  {
    key: "heroes",
    filmTitle: "Pokémon Heroes",
    era: "Original",
    beforeEpisode: "Un nuovo piano",
    afterEpisode: "La ricercatrice",
    note: "Poliwhirl evoluto in Politoed; fase pre-Conferenza Argento.",
    episodeImage: EP_IMG,
    filmImage: FILM_IMG,
  },
  {
    key: "jirachi",
    filmTitle: "Jirachi Wish Maker",
    era: "Advanced",
    beforeEpisode: "Il relitto",
    afterEpisode: "Una gara pazzesca",
    note: "Deviazione nel viaggio verso Ciclamipoli.",
    episodeImage: EP_IMG,
    filmImage: FILM_IMG,
  },
  {
    key: "deoxys",
    filmTitle: "Destiny Deoxys",
    era: "Advanced",
    beforeEpisode: "Cinema per tutti",
    afterEpisode: "Il negozio di Pokémelle",
    note: "Ambientato tra Forestopoli e Porto Alghepoli.",
    episodeImage: EP_IMG,
    filmImage: FILM_IMG,
  },
  {
    key: "lucario",
    filmTitle: "Lucario e il mistero di Mew",
    era: "Advanced",
    beforeEpisode: "Fascino e mistero sul Monte Luna",
    afterEpisode: "La farmacia",
    note: "Nel periodo iniziale della serie Battle Frontier.",
    episodeImage: EP_IMG,
    filmImage: FILM_IMG,
  },
  {
    key: "darkrai",
    filmTitle: "L'ascesa di Darkrai",
    era: "DiamondPearl",
    beforeEpisode: "La famiglia cresce",
    afterEpisode: "La gara di doppia performance",
    note: "Con Happiny presente e Chimchar ancora assente.",
    episodeImage: EP_IMG,
    filmImage: FILM_IMG,
  },
  {
    key: "giratina",
    filmTitle: "Giratina e il Guerriero dei cieli",
    era: "DiamondPearl",
    beforeEpisode: "Combattere la paura con la paura!",
    afterEpisode: "Dare una mano al nemico",
    note: "Tra evoluzione di Gligar e prima di quella di Turtwig.",
    episodeImage: EP_IMG,
    filmImage: FILM_IMG,
  },
  {
    key: "arceus",
    filmTitle: "Arceus e il Gioiello della Vita",
    era: "DiamondPearl",
    beforeEpisode: "Salviamo la foresta",
    afterEpisode: "Una nuova gara",
    note: "Indicata come collocazione ufficiale nel testo fonte.",
    episodeImage: EP_IMG,
    filmImage: FILM_IMG,
  },
  {
    key: "zoroark",
    filmTitle: "Il Re delle Illusioni: Zoroark",
    era: "DiamondPearl",
    beforeEpisode: "L’alba di un giorno regale",
    afterEpisode: "L’ottava meraviglia del mondo di Sinnoh",
    note: "Tra le tappe finali del percorso di Sinnoh.",
    episodeImage: EP_IMG,
    filmImage: FILM_IMG,
  },
  {
    key: "diancie",
    filmTitle: "Diancie e il Bozzolo della Distruzione",
    era: "XY",
    beforeEpisode: "Lotte Aeree",
    afterEpisode: "Sognando un futuro da Performer Pokémon",
    note: "Prima collocazione XY riportata nella fonte.",
    episodeImage: EP_IMG,
    filmImage:
      "https://pokenerd.altervista.org/wp-content/uploads/2018/03/Pok%C3%A9mon-Movie-17-Diancie-Il-bozzolo-della-distruzione.mkv_snapshot_00.09.33.png",
  },
  {
    key: "hoopa",
    filmTitle: "Hoopa e lo scontro epocale",
    era: "XY",
    beforeEpisode: "Un decollo difficile",
    afterEpisode: "Una foto leggendaria",
    note: "Seconda collocazione XY riportata nella fonte.",
    episodeImage: EP_IMG,
    filmImage:
      "https://pokenerd.altervista.org/wp-content/uploads/2018/03/MXY02-Hoopa-e-lo-Scontro-Epocale.mkv_snapshot_01.17.38.png",
  },
  {
    key: "volcanion",
    filmTitle: "Volcanion e la meraviglia meccanica",
    era: "XY",
    beforeEpisode: "Il ghiaccio si è rotto!",
    afterEpisode: "Una lega a parte!",
    note: "Terza collocazione XY riportata nella fonte.",
    episodeImage: EP_IMG,
    filmImage:
      "https://pokenerd.altervista.org/wp-content/uploads/2018/03/Pokemon-Movie-XY03-Volcanion-e-la-meraviglia-meccanica-BDmux-720p-H264-Ita-Eng-Jpn-Aac-Sub-EngbyR02.mkv_snapshot_01.07.39.png",
  },
];

const eraLabel: Record<Era, string> = {
  Original: "Original Series / Johto",
  Advanced: "Advanced / Battle Frontier",
  DiamondPearl: "Diamond & Pearl",
  XY: "XY",
};

export default function TimelineFilmPage() {
  const language = useUILanguage();
  const [eraFilter, setEraFilter] = useState<"all" | Era>("all");

  const visible = useMemo(
    () =>
      placements.filter((item) => eraFilter === "all" || item.era === eraFilter),
    [eraFilter]
  );

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

      <main className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-8 sm:px-8">
        <section className="rounded-2xl border border-white/10 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-transparent p-5">
          <h1 className="text-2xl font-black sm:text-4xl">{getUIText("timelineFilmsTitle", language)}</h1>
          <p className="mt-2 text-sm text-white/75">
            {getUIText("timelineFilmsSubtitle", language)}
          </p>
          <a href={DATA_SOURCE} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded border border-cyan-300/40 px-3 py-1.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/15">
            {getUIText("openSource", language)}
          </a>
        </section>

        <section className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/60">{getUIText("eraFilter", language)}</p>
            <div className="flex flex-wrap gap-2">
              {(["all", "Original", "Advanced", "DiamondPearl", "XY"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setEraFilter(value)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    eraFilter === value ? "border-cyan-300 bg-cyan-500/20 text-cyan-100" : "border-white/20 bg-white/5 text-white/75"
                  }`}
                >
                  {value === "all" ? getUIText("all", language) : eraLabel[value]}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-[#131a24] p-6">
          {visible.length > 0 ? (
            <div className="overflow-x-auto pb-2">
              <div className="relative min-w-[4200px] px-6 py-10">
                <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 bg-white/20" />

                <div className="relative flex items-center justify-between gap-6">
                  {visible.map((item) => (
                    <div key={item.key} className="relative w-[260px] shrink-0">
                      <div className="relative mb-14 -translate-x-3 rounded-lg border border-sky-300/30 bg-sky-500/10 p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.episodeImage} alt={item.beforeEpisode ?? getUIText("episodeN", language)} className="h-28 w-full rounded object-cover" loading="lazy" />
                        <p className="mt-1 text-[10px] font-bold text-sky-100">{getUIText("episodesShiftLabel", language)}</p>
                        <p className="text-xs text-white/85">{getUIText("before", language)}: {item.beforeEpisode}</p>
                        <p className="text-xs text-white/70">{getUIText("after", language)}: {item.afterEpisode}</p>
                        <span className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-100 bg-sky-400" />
                      </div>

                      <div className="relative mt-14 translate-x-3 rounded-lg border border-red-300/30 bg-red-500/10 p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.filmImage} alt={item.filmTitle} className="h-28 w-full rounded object-cover" loading="lazy" />
                        <p className="mt-1 text-[10px] font-bold text-red-100">{getUIText("filmShiftLabel", language)}</p>
                        <p className="text-xs font-semibold text-white">{item.filmTitle}</p>
                        <span className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-red-100 bg-red-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/65">
              {getUIText("noItemsFilter", language)}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
