type PokemonSeason = {
  title: string;
  subtitle: string;
  episodes: number;
  years: string;
};

const featuredSeason: PokemonSeason = {
  title: "Pokémon: Indigo League",
  subtitle: "Ash inizia il viaggio a Kanto con Pikachu e affronta le prime palestre.",
  episodes: 82,
  years: "1997-1999",
};

const seasonRows: { rowTitle: string; seasons: PokemonSeason[] }[] = [
  {
    rowTitle: "Le più viste",
    seasons: [
      featuredSeason,
      {
        title: "Pokémon: Adventures in the Orange Islands",
        subtitle: "Una missione tropicale tra isole, lotte e nuove amicizie.",
        episodes: 36,
        years: "1999",
      },
      {
        title: "Pokémon: The Johto Journeys",
        subtitle: "Nuove palestre, nuovi rivali e una nuova regione da esplorare.",
        episodes: 41,
        years: "1999-2000",
      },
      {
        title: "Pokémon: Johto League Champions",
        subtitle: "La corsa verso la Lega Johto entra nella sua fase decisiva.",
        episodes: 52,
        years: "2000-2001",
      },
    ],
  },
  {
    rowTitle: "Regione Hoenn",
    seasons: [
      {
        title: "Pokémon: Advanced",
        subtitle: "Ash arriva a Hoenn e inizia una nuova avventura.",
        episodes: 40,
        years: "2002-2003",
      },
      {
        title: "Pokémon: Advanced Challenge",
        subtitle: "La sfida continua tra contest, lotte e Team Rocket.",
        episodes: 52,
        years: "2003-2004",
      },
      {
        title: "Pokémon: Advanced Battle",
        subtitle: "Lotte sempre più intense verso il Grande Festival.",
        episodes: 53,
        years: "2004-2005",
      },
      {
        title: "Pokémon: Battle Frontier",
        subtitle: "Le sfide del Parco Lotta mettono Ash alla prova.",
        episodes: 47,
        years: "2005-2006",
      },
    ],
  },
  {
    rowTitle: "Regione Sinnoh",
    seasons: [
      {
        title: "Pokémon: Diamond and Pearl",
        subtitle: "Un nuovo inizio a Sinnoh insieme a Dawn e Brock.",
        episodes: 52,
        years: "2006-2007",
      },
      {
        title: "Pokémon: DP Battle Dimension",
        subtitle: "Rivalità in crescita e nuove strategie di lotta.",
        episodes: 52,
        years: "2007-2008",
      },
      {
        title: "Pokémon: DP Galactic Battles",
        subtitle: "Il Team Galactic minaccia l'equilibrio della regione.",
        episodes: 53,
        years: "2008-2009",
      },
      {
        title: "Pokémon: DP Sinnoh League Victors",
        subtitle: "La Lega Sinnoh decide il destino dei migliori allenatori.",
        episodes: 34,
        years: "2010",
      },
    ],
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0d0f14] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0d0f14]/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-4 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black tracking-tight text-red-600">POKEFLIX</span>
            <span className="rounded bg-yellow-400 px-2 py-0.5 text-xs font-bold text-black">
              SERIE
            </span>
          </div>
          <nav className="hidden gap-6 text-sm text-white/80 md:flex">
            <a href="#" className="transition hover:text-white">
              Home
            </a>
            <a href="#" className="transition hover:text-white">
              Serie TV
            </a>
            <a href="#" className="transition hover:text-white">
              Nuove uscite
            </a>
          </nav>
        </div>
      </header>

      <main className="pb-12">
        <section className="relative isolate overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#2563eb40,transparent_45%)]" />
          <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-18 sm:px-8 lg:grid-cols-[1.2fr_1fr]">
            <div className="relative z-10 max-w-2xl space-y-6">
              <p className="text-xs font-semibold tracking-[0.2em] text-white/70">IN EVIDENZA</p>
              <h1 className="text-4xl font-black leading-tight sm:text-5xl">
                {featuredSeason.title}
              </h1>
              <p className="max-w-xl text-base text-white/80 sm:text-lg">{featuredSeason.subtitle}</p>
              <p className="text-sm text-white/60">
                {featuredSeason.years} • {featuredSeason.episodes} episodi
              </p>
              <div className="flex flex-wrap gap-3">
                <button className="rounded bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90">
                  ▶ Riproduci
                </button>
                <button className="rounded bg-white/20 px-5 py-2.5 text-sm font-semibold transition hover:bg-white/30">
                  + La mia lista
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-8 flex max-w-[1400px] flex-col gap-8 px-4 sm:px-8">
          {seasonRows.map((row) => (
            <div key={row.rowTitle} className="space-y-3">
              <h2 className="text-xl font-bold">{row.rowTitle}</h2>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {row.seasons.map((season) => (
                  <article
                    key={season.title}
                    className="group relative min-h-52 min-w-70 rounded-md border border-white/10 bg-gradient-to-br from-slate-800 via-slate-900 to-black p-4 transition hover:-translate-y-1 hover:border-white/30"
                  >
                    <div className="flex h-full flex-col justify-between gap-4">
                      <div className="space-y-2">
                        <h3 className="line-clamp-2 text-lg font-semibold leading-snug">{season.title}</h3>
                        <p className="line-clamp-3 text-sm text-white/70">{season.subtitle}</p>
                      </div>
                      <p className="text-xs text-white/60">
                        {season.years} • {season.episodes} episodi
                      </p>
                    </div>
                    <div className="pointer-events-none absolute inset-0 rounded-md ring-1 ring-inset ring-white/0 transition group-hover:ring-white/20" />
                  </article>
                ))}
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
