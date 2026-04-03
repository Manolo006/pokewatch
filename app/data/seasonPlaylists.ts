export const seasonPlaylists: Partial<Record<number, string>> = {
  1: "https://youtube.com/playlist?list=PLRcHmntfmJ8CnSmj4C284-a1euH518aQa",
};

export const getSeasonPlaylistUrl = (seasonNumber: number) => seasonPlaylists[seasonNumber] ?? null;
