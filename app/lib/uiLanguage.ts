export type UILanguage = "it" | "en";

export const UI_LANGUAGE_STORAGE_KEY = "pokewatch-episode-title-lang";
export const UI_LANGUAGE_CHANGE_EVENT = "pokewatch-language-changed";

export const normalizeUILanguage = (value?: string | null): UILanguage => {
  const normalized = value?.trim().toLowerCase();
  return normalized === "en" ? "en" : "it";
};

export const uiText = {
  home: { it: "Home", en: "Home" },
  seriesTv: { it: "Serie Tv", en: "TV Series" },
  timeline: { it: "Timeline", en: "Timeline" },
  login: { it: "Login", en: "Login" },
  register: { it: "Registrati", en: "Sign up" },
  logout: { it: "Logout", en: "Logout" },
  loadingAccount: { it: "Caricamento account...", en: "Loading account..." },
  featuredSeason: { it: "STAGIONE IN EVIDENZA", en: "FEATURED SEASON" },
  season: { it: "Stagione", en: "Season" },
  play: { it: "Riproduci", en: "Play" },
  myList: { it: "La mia lista", en: "My List" },
  continueShort: { it: "Continua", en: "Continue" },
  seasonPrevious: { it: "Stagione precedente", en: "Previous season" },
  seasonNext: { it: "Stagione successiva", en: "Next season" },
  backHome: { it: "Torna alla home", en: "Back to home" },
  seasonDetail: { it: "DETTAGLIO STAGIONE", en: "SEASON DETAILS" },
  seasonLabel: { it: "Stagione", en: "Season" },
  animeBadge: { it: "ANIME", en: "ANIME" },
  trending: { it: "Di tendenza", en: "Trending" },
  episodes: { it: "episodi", en: "episodes" },
  watched: { it: "visto", en: "watched" },
  completion: { it: "Completamento visione", en: "Watch progress" },
  votes: { it: "voti", en: "votes" },
  classifyPending: { it: "Da classificare", en: "Unclassified" },
  nonFiller: { it: "Non filler", en: "Non filler" },
  filler: { it: "Filler", en: "Filler" },
  mixed: { it: "Misto", en: "Mixed" },
  episodeType: { it: "Tipo episodio:", en: "Episode type:" },
  community: { it: "Community", en: "Community" },
  noData: { it: "N/D", en: "N/A" },
  notClassified: { it: "Non classificato", en: "Not classified" },
  removeFromWatched: { it: "Togli da guardato", en: "Remove from watched" },
  watch: { it: "Guarda", en: "Watch" },
  closePlayer: { it: "Chiudi player", en: "Close player" },
  noThumbnail: { it: "Nessuna thumbnail", en: "No thumbnail" },
  episodeActions: { it: "Azioni episodio", en: "Episode actions" },
  episodeN: { it: "Episodio", en: "Episode" },
  playerTitle: { it: "POKÉWATCH PLAYER", en: "POKÉWATCH PLAYER" },
  audioTrackHint: {
    it: "Lingua audio: usa ⚙ Impostazioni → Traccia audio nel player. (Disponibile solo se il video YouTube ha più tracce audio.)",
    en: "Audio language: use ⚙ Settings → Audio track in the player. (Available only if the YouTube video has multiple audio tracks.)",
  },
  noItemsFilter: { it: "Nessun elemento con i filtri attuali.", en: "No items for current filters." },
  eraFilter: { it: "Filtro era", en: "Era filter" },
  all: { it: "Tutte", en: "All" },
  timelineFilmsTitle: { it: "Timeline Film Pokémon", en: "Pokémon Movie Timeline" },
  timelineFilmsSubtitle: {
    it: "Timeline visuale stile: episodio → film → episodio, con immagini e collocazioni dalla fonte indicata.",
    en: "Visual timeline: episode → movie → episode, with images and placements from the source.",
  },
  openSource: { it: "Apri fonte Pokénerd", en: "Open Pokénerd source" },
  episodesShiftLabel: { it: "EPISODI (SOPRA / SHIFT SX)", en: "EPISODES (TOP / LEFT SHIFT)" },
  filmShiftLabel: { it: "FILM (SOTTO / SHIFT DX)", en: "MOVIE (BOTTOM / RIGHT SHIFT)" },
  noSeasonAvailable: { it: "Nessuna stagione disponibile.", en: "No season available." },
  before: { it: "Prima", en: "Before" },
  after: { it: "Dopo", en: "After" },
  footerRights: { it: "© 2026 PokéWatch. Tutti i diritti riservati.", en: "© 2026 PokéWatch. All rights reserved." },
} as const;

export type UITextKey = keyof typeof uiText;

export const getUIText = (key: UITextKey, language: UILanguage) => uiText[key][language];
