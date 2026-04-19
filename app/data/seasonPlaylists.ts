export const seasonPlaylists: Partial<Record<number, string>> = {
  1: "https://youtube.com/playlist?list=PLRcHmntfmJ8CnSmj4C284-a1euH518aQa",
  2: "https://youtube.com/playlist?list=PLRcHmntfmJ8AtnKq7EHNIQBUNTs85bqwS",
  3: "https://youtube.com/playlist?list=PLRcHmntfmJ8DB8wgMrUZwf3JGkLM17yeL",
  4: "https://youtube.com/playlist?list=PLRcHmntfmJ8A7vV0RYnAu0farLTV_T1i2",
  5: "https://youtube.com/playlist?list=PLRcHmntfmJ8BNWmL3MICuc1Oh5Mxf2qEh",
  6: "https://youtube.com/playlist?list=PLRcHmntfmJ8AYULKvzhleQPgPRinNDpc0",
  7: "https://youtube.com/playlist?list=PLRcHmntfmJ8BWeT4kzalbhx1r43bJv7pI",
  8: "https://youtube.com/playlist?list=PLRcHmntfmJ8BdccTC3w86qIBdUjNDfPGV",
  9: "https://youtube.com/playlist?list=PLRcHmntfmJ8A7vV0RYnAu0farLTV_T1i2",
};

export const getSeasonPlaylistUrl = (seasonNumber: number) => seasonPlaylists[seasonNumber] ?? null;
