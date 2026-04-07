"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  deleteUser,
  EmailAuthProvider,
  linkWithPopup,
  reauthenticateWithCredential,
  signOut,
  sendPasswordResetEmail,
  unlink,
  updateEmail,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import { get, ref, remove, set, update } from "firebase/database";
import { FaChevronLeft, FaChevronRight, FaEye, FaEyeSlash, FaPen, FaTrash } from "react-icons/fa";
import { useAuth } from "@/app/components/AuthProvider";
import AuthHeaderActions from "@/app/components/AuthHeaderActions";
import { auth, db, googleProvider } from "@/app/lib/firebase";
import { allSeasons, episodesLabel, getEpisodesForSeason } from "@/app/data/pokemonCatalog";

type EpisodeFillerType = "non-filler" | "filler" | "misto";
type ProfileVisibility = "public" | "private";

type OwnProfileSettings = {
  username: string;
  displayName: string;
  joinedAt: string | null;
  joinDayVisible: boolean;
  profileVisibility: ProfileVisibility;
  twoFactorEnabled: boolean;
};

const FILLER_STORAGE_PREFIX = "pokewatch-filler-season";
const WATCHED_STORAGE_PREFIX = "pokewatch-watched-season";

function parseStoredWatchedBySeason(storage: Storage) {
  const result: Record<number, Record<number, boolean>> = {};

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key || !key.startsWith(`${WATCHED_STORAGE_PREFIX}-`)) continue;

    const seasonNumber = Number(key.replace(`${WATCHED_STORAGE_PREFIX}-`, ""));
    if (!Number.isInteger(seasonNumber)) continue;

    try {
      const raw = storage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as Record<string, unknown>;

      const byEpisode: Record<number, boolean> = {};
      Object.entries(parsed).forEach(([episodeKey, watched]) => {
        const episodeNumber = Number(episodeKey);
        if (!Number.isInteger(episodeNumber)) return;
        byEpisode[episodeNumber] = Boolean(watched);
      });

      result[seasonNumber] = byEpisode;
    } catch {
      // ignore invalid local data
    }
  }

  return result;
}

function parseStoredFillerBySeason(storage: Storage) {
  const result: Record<number, Record<number, EpisodeFillerType>> = {};

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key || !key.startsWith(`${FILLER_STORAGE_PREFIX}-`)) continue;

    const seasonNumber = Number(key.replace(`${FILLER_STORAGE_PREFIX}-`, ""));
    if (!Number.isInteger(seasonNumber)) continue;

    try {
      const raw = storage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as Record<string, unknown>;

      const byEpisode: Record<number, EpisodeFillerType> = {};
      Object.entries(parsed).forEach(([episodeKey, value]) => {
        const episodeNumber = Number(episodeKey);
        if (!Number.isInteger(episodeNumber)) return;

        if (value === "non-filler" || value === "filler" || value === "misto") {
          byEpisode[episodeNumber] = value;
        }
      });

      result[seasonNumber] = byEpisode;
    } catch {
      // ignore invalid local data
    }
  }

  return result;
}

function parseDbWatchedBySeason(value: unknown) {
  if (!value || typeof value !== "object") return {} as Record<number, Record<number, boolean>>;

  const result: Record<number, Record<number, boolean>> = {};
  Object.entries(value as Record<string, unknown>).forEach(([seasonKey, seasonValue]) => {
    const seasonNumber = Number(seasonKey);
    if (!Number.isInteger(seasonNumber) || !seasonValue || typeof seasonValue !== "object") return;

    const byEpisode: Record<number, boolean> = {};
    Object.entries(seasonValue as Record<string, unknown>).forEach(([episodeKey, watched]) => {
      const episodeNumber = Number(episodeKey);
      if (!Number.isInteger(episodeNumber)) return;
      byEpisode[episodeNumber] = Boolean(watched);
    });

    result[seasonNumber] = byEpisode;
  });

  return result;
}

function parseDbUserFillerVotes(value: unknown, userId: string) {
  if (!value || typeof value !== "object") return {} as Record<number, Record<number, EpisodeFillerType>>;

  const result: Record<number, Record<number, EpisodeFillerType>> = {};

  Object.entries(value as Record<string, unknown>).forEach(([seasonKey, seasonValue]) => {
    const seasonNumber = Number(seasonKey);
    if (!Number.isInteger(seasonNumber) || !seasonValue || typeof seasonValue !== "object") return;

    const byEpisode: Record<number, EpisodeFillerType> = {};
    Object.entries(seasonValue as Record<string, unknown>).forEach(([episodeKey, episodeValue]) => {
      const episodeNumber = Number(episodeKey);
      if (!Number.isInteger(episodeNumber) || !episodeValue || typeof episodeValue !== "object") return;

      const votes = (episodeValue as Record<string, unknown>).votes;
      if (!votes || typeof votes !== "object") return;

      const vote = (votes as Record<string, unknown>)[userId];
      if (vote === "non-filler" || vote === "filler" || vote === "misto") {
        byEpisode[episodeNumber] = vote;
      }
    });

    result[seasonNumber] = byEpisode;
  });

  return result;
}

function getDisplayName(email?: string | null) {
  if (!email) return "Allenatore PokéWatch";
  return email.split("@")[0]?.toUpperCase() ?? "Allenatore PokéWatch";
}

function getUserSlug(email?: string | null) {
  return email?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9._-]/g, "") || "profile";
}

function normalizeNickname(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 24);
}

function maskEmail(value?: string | null) {
  if (!value) return "Not set";
  const [name, domain] = value.split("@");
  if (!name || !domain) return value;

  const safeName = `${name.slice(0, 1)}***${name.slice(-1)}`;
  const [domainName, extension] = domain.split(".");
  if (!domainName || !extension) return `${safeName}@***`;
  return `${safeName}@${domainName.slice(0, 1)}***.${extension}`;
}

function maskPhone(value?: string | null) {
  if (!value) return "Not set";
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  return `*** *** *** **${digits.slice(-2)}`;
}

function formatJoinDay(value?: string | null) {
  if (!value) return "Non disponibile";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Non disponibile";

  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "medium",
  }).format(date);
}

const getSeasonImageCandidates = (seasonNumber: number) => [
  `/seasons/s${seasonNumber}.jpg`,
  `/seasons/s${seasonNumber}.jpeg`,
  `/seasons/s${seasonNumber}.png`,
  `/seasons/s${seasonNumber}.webp`,
  `./seasons/s${seasonNumber}.jpg`,
  `./seasons/s${seasonNumber}.jpeg`,
  `./seasons/s${seasonNumber}.png`,
  `./seasons/s${seasonNumber}.webp`,
  `../seasons/s${seasonNumber}.jpg`,
  `../seasons/s${seasonNumber}.jpeg`,
  `../seasons/s${seasonNumber}.png`,
  `../seasons/s${seasonNumber}.webp`,
];

function SeasonCardImage({ seasonNumber, title, accent }: { seasonNumber: number; title: string; accent: string }) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const candidates = getSeasonImageCandidates(seasonNumber);

    const tryLoad = (index: number) => {
      if (!active) return;
      if (index >= candidates.length) {
        setImageSrc(null);
        return;
      }

      const candidate = candidates[index];
      const image = new window.Image();
      image.onload = () => {
        if (!active) return;
        setImageSrc(candidate);
      };
      image.onerror = () => {
        tryLoad(index + 1);
      };
      image.src = candidate;
    };

    tryLoad(0);

    return () => {
      active = false;
    };
  }, [seasonNumber]);

  if (imageSrc) {
    return <Image src={imageSrc} alt={title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />;
  }

  return <div className={`absolute inset-0 bg-gradient-to-br ${accent} via-slate-700 to-black`} />;
}

type ProfilePageProps = {
  viewedUserId?: string;
  publicDisplayName?: string;
  publicUsername?: string;
  publicJoinedAt?: string | null;
  publicJoinDayVisible?: boolean;
  publicProfileVisibility?: "public" | "private";
  manageMode?: boolean;
  settingsSection?: "profile" | "security";
  readOnly?: boolean;
};

export default function ProfilePage({
  viewedUserId,
  publicDisplayName,
  publicUsername,
  publicJoinedAt,
  publicJoinDayVisible,
  publicProfileVisibility,
  manageMode = false,
  settingsSection = "profile",
  readOnly = false,
}: ProfilePageProps = {}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [ownProfileSettings, setOwnProfileSettings] = useState<OwnProfileSettings | null>(null);
  const isEditMode = manageMode;
  const [showSecurityPanel, setShowSecurityPanel] = useState(false);
  const [editNickname, setEditNickname] = useState("");
  const [editDisplayName, setEditDisplayName] = useState("");
  const [joinDayVisibleSetting, setJoinDayVisibleSetting] = useState(true);
  const [profileVisibilitySetting, setProfileVisibilitySetting] = useState<ProfileVisibility>("public");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [bioDraft, setBioDraft] = useState("");
  const [showEmailValue, setShowEmailValue] = useState(false);
  const [showPhoneValue, setShowPhoneValue] = useState(false);
  const [enableEmailAccountCreation, setEnableEmailAccountCreation] = useState(false);
  const [enablePhoneAccountCreation, setEnablePhoneAccountCreation] = useState(false);
  const [showEmailEditor, setShowEmailEditor] = useState(false);
  const [showPasswordEditor, setShowPasswordEditor] = useState(false);
  const [deleteAccountNotice, setDeleteAccountNotice] = useState<string | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [securityMessage, setSecurityMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);
  const isGoogleLinked = Boolean(user?.providerData?.some((provider) => provider.providerId === "google.com"));
  const ownDisplayName = ownProfileSettings?.displayName || user?.displayName?.trim() || getDisplayName(user?.email);
  const ownUsername = ownProfileSettings?.username || getUserSlug(user?.email);
  const displayName = publicDisplayName ?? ownDisplayName;
  const usernameLabel = publicUsername ?? ownUsername;
  const isPublicView = Boolean(viewedUserId && viewedUserId !== user?.uid);
  const joinDayVisible = isPublicView ? (publicJoinDayVisible ?? true) : joinDayVisibleSetting;
  const profileVisibility = isPublicView ? (publicProfileVisibility ?? "public") : profileVisibilitySetting;
  const joinDaySource = publicJoinedAt ?? ownProfileSettings?.joinedAt ?? user?.metadata.creationTime;
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number | null>(null);
  const [seasonCarouselStart, setSeasonCarouselStart] = useState(0);
  const [watchedBySeason, setWatchedBySeason] = useState<Record<number, Record<number, boolean>>>(() => {
    if (typeof window === "undefined") return {};
    return parseStoredWatchedBySeason(window.localStorage);
  });
  const [fillerBySeason, setFillerBySeason] = useState<Record<number, Record<number, EpisodeFillerType>>>(() => {
    if (typeof window === "undefined") return {};
    return parseStoredFillerBySeason(window.localStorage);
  });

  const formatNumber = new Intl.NumberFormat("it-IT");

  useEffect(() => {
    if (loading || !user) return;
    if (viewedUserId) return;
    if (pathname !== "/profile") return;

    router.replace(`/profile/${getUserSlug(user.email)}`);
  }, [loading, pathname, router, user, viewedUserId]);

  useEffect(() => {
    if (!user || !db || isPublicView) return;

    const database = db;

    let active = true;

    const loadOwnProfileSettings = async () => {
      const snapshot = await get(ref(database, `users/${user.uid}/publicProfile`));
      if (!active) return;

      const value = (snapshot.val() as Partial<OwnProfileSettings> | null) ?? null;
      const username = value?.username || getUserSlug(user.email);
      const display = value?.displayName || user.displayName?.trim() || getDisplayName(user.email);
      const joinedAt = value?.joinedAt ?? user.metadata.creationTime ?? null;
      const visible = typeof value?.joinDayVisible === "boolean" ? value.joinDayVisible : true;
      const visibility = value?.profileVisibility === "private" ? "private" : "public";
      const twoFactor = Boolean(value?.twoFactorEnabled);

      setOwnProfileSettings({
        username,
        displayName: display,
        joinedAt,
        joinDayVisible: visible,
        profileVisibility: visibility,
        twoFactorEnabled: twoFactor,
      });
      setEditNickname(username);
      setEditDisplayName(display);
      setJoinDayVisibleSetting(visible);
      setProfileVisibilitySetting(visibility);
      setTwoFactorEnabled(twoFactor);
      setNewEmail(user.email ?? "");
    };

    void loadOwnProfileSettings();

    return () => {
      active = false;
    };
  }, [db, isPublicView, user]);

  const saveProfileBasics = async () => {
    if (!user || !db) return;

    setProfileError(null);
    setProfileMessage(null);

    const normalizedNickname = normalizeNickname(editNickname);
    const trimmedDisplayName = editDisplayName.trim();

    if (normalizedNickname.length < 3) {
      setProfileError("Il nickname deve avere almeno 3 caratteri validi (a-z, 0-9, . _ -).");
      return;
    }

    if (!trimmedDisplayName) {
      setProfileError("Il display name non può essere vuoto.");
      return;
    }

    setIsSavingProfile(true);

    try {
      const currentUsername = ownProfileSettings?.username || getUserSlug(user.email);

      if (normalizedNickname !== currentUsername) {
        const targetSnapshot = await get(ref(db, `publicProfiles/${normalizedNickname}`));
        if (targetSnapshot.exists()) {
          const existing = targetSnapshot.val() as { uid?: string };
          if (existing.uid && existing.uid !== user.uid) {
            setProfileError("Questo nickname è già in uso.");
            return;
          }
        }
      }

      await updateProfile(user, { displayName: trimmedDisplayName });

      const joinedAt = ownProfileSettings?.joinedAt ?? user.metadata.creationTime ?? null;
      const nextSettings: OwnProfileSettings = {
        username: normalizedNickname,
        displayName: trimmedDisplayName,
        joinedAt,
        joinDayVisible: joinDayVisibleSetting,
        profileVisibility: profileVisibilitySetting,
        twoFactorEnabled,
      };

      await set(ref(db, `users/${user.uid}/publicProfile`), nextSettings);
      await set(ref(db, `publicProfiles/${normalizedNickname}`), {
        uid: user.uid,
        username: normalizedNickname,
        displayName: trimmedDisplayName,
        joinedAt,
        joinDayVisible: joinDayVisibleSetting,
        profileVisibility: profileVisibilitySetting,
      });

      if (normalizedNickname !== currentUsername) {
        await remove(ref(db, `publicProfiles/${currentUsername}`));
      }

      setOwnProfileSettings(nextSettings);
      setEditNickname(normalizedNickname);
      setProfileMessage("Profilo aggiornato con successo.");
    } catch {
      setProfileError("Non sono riuscito a salvare il profilo. Riprova.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const savePrivacyAndSecurityPrefs = async () => {
    if (!user || !db) return;
    const username = ownProfileSettings?.username || getUserSlug(user.email);
    const display = ownProfileSettings?.displayName || ownDisplayName;
    const joinedAt = ownProfileSettings?.joinedAt ?? user.metadata.creationTime ?? null;

    setSecurityError(null);
    setSecurityMessage(null);
    setIsSavingSecurity(true);

    try {
      await update(ref(db, `users/${user.uid}/publicProfile`), {
        joinDayVisible: joinDayVisibleSetting,
        profileVisibility: profileVisibilitySetting,
        twoFactorEnabled,
      });

      await update(ref(db, `publicProfiles/${username}`), {
        joinDayVisible: joinDayVisibleSetting,
        profileVisibility: profileVisibilitySetting,
      });

      setOwnProfileSettings((prev) => ({
        ...prev,
        username,
        displayName: display,
        joinedAt,
        joinDayVisible: joinDayVisibleSetting,
        profileVisibility: profileVisibilitySetting,
        twoFactorEnabled,
      }));
      setSecurityMessage("Impostazioni sicurezza/privacy aggiornate.");
    } catch {
      setSecurityError("Impossibile salvare le impostazioni di sicurezza.");
    } finally {
      setIsSavingSecurity(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!user || !auth || !newEmail.trim() || !currentPassword) return;

    setSecurityError(null);
    setSecurityMessage(null);
    setIsSavingSecurity(true);

    try {
      const credential = EmailAuthProvider.credential(user.email ?? "", currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updateEmail(user, newEmail.trim());
      setSecurityMessage("Email aggiornata con successo.");
      setCurrentPassword("");
    } catch {
      setSecurityError("Cambio email fallito. Controlla password corrente e nuova email.");
    } finally {
      setIsSavingSecurity(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user || !newPassword.trim() || !currentPassword) return;

    setSecurityError(null);
    setSecurityMessage(null);
    setIsSavingSecurity(true);

    try {
      const credential = EmailAuthProvider.credential(user.email ?? "", currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword.trim());
      setSecurityMessage("Password aggiornata con successo.");
      setCurrentPassword("");
      setNewPassword("");
    } catch {
      setSecurityError("Cambio password fallito. Verifica la password corrente.");
    } finally {
      setIsSavingSecurity(false);
    }
  };

  const handleResetPassword = async () => {
    if (!auth || !user?.email) return;

    setSecurityError(null);
    setSecurityMessage(null);
    setIsSavingSecurity(true);

    try {
      await sendPasswordResetEmail(auth, user.email);
      setSecurityMessage("Email di reset inviata.");
    } catch {
      setSecurityError("Non sono riuscito a inviare l'email di reset password.");
    } finally {
      setIsSavingSecurity(false);
    }
  };

  const handleConnectGoogle = async () => {
    if (!user) return;

    setSecurityError(null);
    setSecurityMessage(null);
    setIsSavingSecurity(true);

    try {
      await linkWithPopup(user, googleProvider);
      setSecurityMessage("Account Google collegato correttamente.");
    } catch {
      setSecurityError("Impossibile collegare Google. Potrebbe essere già collegato.");
    } finally {
      setIsSavingSecurity(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!user) return;

    setSecurityError(null);
    setSecurityMessage(null);
    setIsSavingSecurity(true);

    try {
      await unlink(user, "google.com");
      setSecurityMessage("Account Google scollegato correttamente.");
    } catch {
      setSecurityError("Impossibile scollegare Google. Verifica di avere almeno un altro metodo di accesso.");
    } finally {
      setIsSavingSecurity(false);
    }
  };

  const handleSignOutEverywhere = async () => {
    if (!auth) return;

    setSecurityError(null);
    setSecurityMessage(null);
    setIsSavingSecurity(true);

    try {
      await signOut(auth);
      setSecurityMessage("Sessione terminata. Effettua di nuovo l'accesso per continuare.");
      router.replace("/login");
    } catch {
      setSecurityError("Impossibile terminare la sessione. Riprova.");
    } finally {
      setIsSavingSecurity(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !db) return;

    const confirmed = window.confirm("Sei sicuro di voler eliminare definitivamente il tuo account?");
    if (!confirmed) return;

    setDeleteAccountNotice(null);
    setIsDeletingAccount(true);

    try {
      const currentUsername = ownProfileSettings?.username || getUserSlug(user.email);

      await remove(ref(db, `users/${user.uid}`));
      await remove(ref(db, `publicProfiles/${currentUsername}`));
      await deleteUser(user);

      setDeleteAccountNotice("Account eliminato con successo. Reindirizzamento...");
      router.replace("/");
    } catch {
      setDeleteAccountNotice("Impossibile eliminare account. Potrebbe essere necessario effettuare di nuovo il login.");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined" || !db) return;

    const database = db;

    const targetUserId = viewedUserId ?? user?.uid;
    if (!targetUserId) return;

    let active = true;

    const shouldUseLocalData = !viewedUserId || viewedUserId === user?.uid;
    const localWatched = shouldUseLocalData ? parseStoredWatchedBySeason(window.localStorage) : {};
    const localFiller = shouldUseLocalData ? parseStoredFillerBySeason(window.localStorage) : {};

    const loadFromDb = async () => {
      try {
        const watchedSnapshot = await get(ref(database, `users/${targetUserId}/watchedBySeason`));
        const fillerSnapshot = await get(ref(database, "community/fillerVotesBySeason"));

        if (!active) return;

        setWatchedBySeason({
          ...localWatched,
          ...parseDbWatchedBySeason(watchedSnapshot.val()),
        });

        setFillerBySeason({
          ...localFiller,
          ...parseDbUserFillerVotes(fillerSnapshot.val(), targetUserId),
        });
      } catch {
        if (!active) return;
        setWatchedBySeason(localWatched);
        setFillerBySeason(localFiller);
      }
    };

    void loadFromDb();

    return () => {
      active = false;
    };
  }, [db, user?.uid, viewedUserId]);

  const watchedTotals = useMemo(() => {
    const totals = {
      filler: 0,
      misto: 0,
      "non-filler": 0,
      unclassified: 0,
    } as Record<EpisodeFillerType | "unclassified", number>;

    Object.entries(watchedBySeason).forEach(([seasonKey, seasonEpisodes]) => {
      const seasonNumber = Number(seasonKey);
      const fillerMap = fillerBySeason[seasonNumber] ?? {};

      Object.entries(seasonEpisodes).forEach(([episodeKey, watched]) => {
        if (!watched) return;

        const episodeNumber = Number(episodeKey);
        if (!Number.isInteger(episodeNumber)) return;

        const type = fillerMap[episodeNumber];
        if (type) {
          totals[type] += 1;
        } else {
          totals.unclassified += 1;
        }
      });
    });

    return totals;
  }, [watchedBySeason, fillerBySeason]);

  const watchedStats = useMemo(() => {
    let episodesWatched = 0;

    Object.values(watchedBySeason).forEach((seasonEpisodes) => {
      const watchedInSeason = Object.values(seasonEpisodes).filter(Boolean).length;
      episodesWatched += watchedInSeason;
    });

    const totalMinutes = episodesWatched * 23;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const formattedTime = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    return {
      episodesWatched,
      formattedTime,
    };
  }, [watchedBySeason]);

  const overviewItems = [
    { label: "Filler", entries: watchedTotals.filler, color: "bg-rose-500", textColor: "text-rose-300" },
    { label: "Misto", entries: watchedTotals.misto, color: "bg-amber-400", textColor: "text-amber-200" },
    {
      label: "Non-filler",
      entries: watchedTotals["non-filler"],
      color: "bg-emerald-500",
      textColor: "text-emerald-300",
    },
  ] as const;

  const totalEntries = overviewItems.reduce((sum, item) => sum + item.entries, 0);
  const safeTotalEntries = totalEntries > 0 ? totalEntries : 1;

  const badges = [
    {
      title: "Primo episodio",
      description: "Guarda almeno 1 episodio.",
      unlocked: watchedStats.episodesWatched >= 1,
      icon: "🎬",
    },
    {
      title: "Maratoneta",
      description: "Guarda almeno 50 episodi.",
      unlocked: watchedStats.episodesWatched >= 50,
      icon: "🔥",
    },
    {
      title: "Canon Master",
      description: "Guarda almeno 100 episodi non-filler.",
      unlocked: watchedTotals["non-filler"] >= 100,
      icon: "🏆",
    },
    {
      title: "Anti-filler",
      description: "Completa almeno 30 episodi filler.",
      unlocked: watchedTotals.filler >= 30,
      icon: "🛡️",
    },
  ] as const;

  const seasonProgress = useMemo(() => {
    return allSeasons.map((season) => {
      const episodes = getEpisodesForSeason(season);
      const watchedMap = watchedBySeason[season.season] ?? {};
      const watchedCount = episodes.reduce((count, episode) => count + (watchedMap[episode.number] ? 1 : 0), 0);
      const progress = episodes.length > 0 ? Math.round((watchedCount / episodes.length) * 100) : 0;

      return {
        season,
        episodes,
        watchedMap,
        watchedCount,
        progress,
      };
    });
  }, [watchedBySeason]);

  const selectedSeasonDetail = useMemo(
    () => seasonProgress.find((entry) => entry.season.season === selectedSeasonNumber) ?? null,
    [selectedSeasonNumber, seasonProgress]
  );

  const maxCarouselStart = Math.max(0, seasonProgress.length - 3);
  const normalizedCarouselStart = Math.min(seasonCarouselStart, maxCarouselStart);
  const visibleSeasonCards = seasonProgress.slice(normalizedCarouselStart, normalizedCarouselStart + 3);

  if (manageMode) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#141414] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(229,9,20,.2),transparent_40%),radial-gradient(circle_at_90%_0%,rgba(255,255,255,.08),transparent_35%)]" />

        <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-4 px-4 py-4 sm:px-8">
            <div className="flex items-center gap-3">
              <Link href="/" aria-label="Vai alla home">
                <Image src="/logo.png" alt="PokéWatch" width={170} height={40} className="h-auto w-[130px] sm:w-[170px]" priority />
              </Link>
              <span className="rounded bg-[#e50914] px-2.5 py-1 text-[10px] font-black tracking-[0.16em] text-white">SETTINGS</span>
            </div>

            <div className="flex items-center gap-2">
              <Link href={`/profile/${ownUsername}`} className="rounded border border-white/20 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10">
                Torna al profilo
              </Link>
              <button
                type="button"
                onClick={() => void saveProfileBasics()}
                disabled={isSavingProfile}
                className="rounded bg-[#e50914] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#f6121d] disabled:opacity-60"
              >
                {isSavingProfile ? "Salvataggio..." : "Salva profilo"}
              </button>
            </div>
          </div>
        </header>

        <main className="relative z-10 mx-auto grid w-full max-w-[1200px] gap-6 px-4 py-7 sm:px-8 sm:py-10 lg:grid-cols-[240px_1fr]">
          <aside className="rounded-md border border-white/10 bg-[#181818] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/50">Settings menu</p>
            <nav className="mt-3 space-y-2">
              <Link
                href="/profile/settings/profile"
                className={`block rounded border px-3 py-2 text-sm transition ${settingsSection === "profile" ? "border-white/10 bg-white/5 font-semibold text-white" : "border-white/10 text-white/80 hover:bg-white/10"}`}
              >
                Profilo
              </Link>
              <Link
                href="/profile/settings/security"
                className={`block rounded border px-3 py-2 text-sm transition ${settingsSection === "security" ? "border-white/10 bg-white/5 font-semibold text-white" : "border-white/10 text-white/80 hover:bg-white/10"}`}
              >
                Sicurezza & Privacy
              </Link>
            </nav>
          </aside>

          <section className="space-y-5">
            {settingsSection === "profile" ? (
            <article id="identity" className="rounded-md border border-white/10 bg-[#181818] p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/60">Profile</p>
              <h1 className="mt-2 text-2xl font-black sm:text-3xl">Impostazioni profilo</h1>
              <p className="mt-2 text-sm text-white/70">Layout in stile creator dashboard: modifica identità, sicurezza e privacy in sezioni dedicate.</p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="text-xs text-white/70">
                  Display name
                  <div className="mt-1 flex items-center gap-2 rounded border border-white/20 bg-black/35 px-3 py-2">
                    <FaPen size={12} className="text-white/60" />
                    <input
                      value={editDisplayName}
                      onChange={(event) => setEditDisplayName(event.target.value)}
                      className="w-full bg-transparent text-sm font-semibold text-white outline-none"
                    />
                  </div>
                </label>

                <label className="text-xs text-white/70">
                  Nickname
                  <div className="mt-1 flex items-center gap-2 rounded border border-white/20 bg-black/35 px-3 py-2">
                    <FaPen size={12} className="text-white/60" />
                    <span className="text-white/50">@</span>
                    <input
                      value={editNickname}
                      onChange={(event) => setEditNickname(event.target.value)}
                      className="w-full bg-transparent text-sm font-semibold text-white outline-none"
                    />
                  </div>
                </label>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-[1fr_220px]">
                <label className="text-xs text-white/70">
                  Bio
                  <textarea
                    value={bioDraft}
                    onChange={(event) => setBioDraft(event.target.value)}
                    rows={4}
                    placeholder="Scrivi qualcosa su di te..."
                    className="mt-1 w-full resize-none rounded border border-white/20 bg-black/35 px-3 py-2 text-sm text-white outline-none ring-[#e50914] focus:ring-1"
                  />
                </label>

                <div className="rounded border border-white/15 bg-black/25 p-3 text-center">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-white/55">Immagine profilo</p>
                  <div className="mx-auto mt-3 flex h-16 w-16 items-center justify-center rounded-full border border-white/25 bg-gradient-to-br from-[#e50914] to-[#66070d] text-xl font-black">
                    {displayName.charAt(0)}
                  </div>
                  <button
                    type="button"
                    onClick={() => setProfileMessage("Cambio immagine profilo in arrivo.")}
                    className="mt-3 w-full rounded border border-white/20 px-3 py-2 text-xs font-semibold text-white/90 transition hover:bg-white/10"
                  >
                    Cambia immagine
                  </button>
                </div>
              </div>

              {profileError ? <p className="mt-3 text-xs text-rose-300">{profileError}</p> : null}
              {profileMessage ? <p className="mt-3 text-xs text-emerald-300">{profileMessage}</p> : null}
            </article>
            ) : null}

            {settingsSection === "security" ? (
            <article id="security" className="rounded-md border border-white/10 bg-[#181818] p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/55">Settings</p>
              <h1 className="mt-2 text-2xl font-black sm:text-3xl">Security and Privacy</h1>
              <p className="mt-2 text-sm text-white/70">Layout a sezioni in stile Twitch: account, connessioni e privacy.</p>

              <section className="mt-6 rounded border border-white/10 bg-black/25 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Account security</p>
                    <p className="mt-1 text-xs text-white/65">Aggiorna email e password del tuo account.</p>
                  </div>
                  <span className="rounded border border-white/15 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-white/60">Login</span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="text-xs text-white/70">
                    Nuova email
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(event) => setNewEmail(event.target.value)}
                      className="mt-1 w-full rounded border border-white/20 bg-black/35 px-3 py-2 text-sm text-white outline-none ring-[#e50914] focus:ring-1"
                    />
                  </label>
                  <label className="text-xs text-white/70">
                    Password corrente
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      className="mt-1 w-full rounded border border-white/20 bg-black/35 px-3 py-2 text-sm text-white outline-none ring-[#e50914] focus:ring-1"
                    />
                  </label>
                </div>

                <label className="mt-3 block text-xs text-white/70">
                  Nuova password
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="mt-1 w-full rounded border border-white/20 bg-black/35 px-3 py-2 text-sm text-white outline-none ring-[#e50914] focus:ring-1"
                  />
                </label>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => void handleChangeEmail()} className="rounded border border-white/20 px-3 py-2 text-xs hover:bg-white/10">Aggiorna email</button>
                  <button type="button" onClick={() => void handleChangePassword()} className="rounded border border-white/20 px-3 py-2 text-xs hover:bg-white/10">Aggiorna password</button>
                  <button type="button" onClick={() => void handleResetPassword()} className="rounded border border-white/20 px-3 py-2 text-xs hover:bg-white/10">Invia reset password</button>
                </div>
              </section>

              <section className="mt-4 rounded border border-white/10 bg-black/25 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Connected accounts</p>
                    <p className="mt-1 text-xs text-white/65">Collega o scollega il login Google.</p>
                  </div>
                  <span className="rounded border border-white/15 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-white/60">OAuth</span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {!isGoogleLinked ? (
                    <button type="button" onClick={() => void handleConnectGoogle()} className="rounded border border-white/20 px-3 py-2 text-xs hover:bg-white/10">Collega Google</button>
                  ) : (
                    <button type="button" onClick={() => void handleDisconnectGoogle()} className="rounded border border-rose-400/35 bg-rose-500/10 px-3 py-2 text-xs text-rose-200 hover:bg-rose-500/20">Scollega Google</button>
                  )}
                </div>
              </section>

              <section className="mt-4 rounded border border-white/10 bg-black/25 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Privacy controls</p>
                    <p className="mt-1 text-xs text-white/65">Gestisci la visibilità del profilo e dei dettagli pubblici.</p>
                  </div>
                  <span className="rounded border border-white/15 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-white/60">Privacy</span>
                </div>

                <div className="mt-3 space-y-3">
                  <label className="flex items-center justify-between gap-3 rounded border border-white/15 bg-black/25 px-3 py-2 text-xs text-white/85">
                    <span>Mostra join day</span>
                    <input type="checkbox" checked={joinDayVisibleSetting} onChange={(event) => setJoinDayVisibleSetting(event.target.checked)} />
                  </label>
                  <label className="flex items-center justify-between gap-3 rounded border border-white/15 bg-black/25 px-3 py-2 text-xs text-white/85">
                    <span>Profilo privato</span>
                    <input
                      type="checkbox"
                      checked={profileVisibilitySetting === "private"}
                      onChange={(event) => setProfileVisibilitySetting(event.target.checked ? "private" : "public")}
                    />
                  </label>
                  <label className="flex items-center justify-between gap-3 rounded border border-white/15 bg-black/25 px-3 py-2 text-xs text-white/85">
                    <span>Abilita 2FA</span>
                    <input type="checkbox" checked={twoFactorEnabled} onChange={(event) => setTwoFactorEnabled(event.target.checked)} />
                  </label>
                </div>
              </section>

              <button
                type="button"
                onClick={() => void savePrivacyAndSecurityPrefs()}
                disabled={isSavingSecurity}
                className="mt-4 rounded bg-[#e50914] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#f6121d] disabled:opacity-60"
              >
                {isSavingSecurity ? "Salvataggio..." : "Salva impostazioni sicurezza/privacy"}
              </button>

              {securityError ? <p className="mt-3 text-xs text-rose-300">{securityError}</p> : null}
              {securityMessage ? <p className="mt-3 text-xs text-emerald-300">{securityMessage}</p> : null}
            </article>
            ) : null}

            {settingsSection === "profile" ? (
            <article className="rounded-md border border-rose-500/35 bg-rose-500/10 p-5 sm:p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-rose-200">Elimina il tuo account</p>
              <p className="mt-2 text-xs text-rose-100/80">
                Questa operazione cancellerà definitivamente tutti i tuoi contenuti e le informazioni del tuo profilo.
              </p>
              <button
                type="button"
                onClick={() => void handleDeleteAccount()}
                disabled={isDeletingAccount}
                className="mt-4 rounded bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-500 disabled:opacity-60"
              >
                {isDeletingAccount ? "Eliminazione..." : "Elimina il tuo account"}
              </button>
              {deleteAccountNotice ? <p className="mt-3 text-xs text-rose-100">{deleteAccountNotice}</p> : null}
            </article>
            ) : null}
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#141414] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(229,9,20,.22),transparent_42%),radial-gradient(circle_at_80%_0%,rgba(115,115,115,.18),transparent_38%)]" />

      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1500px] flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-8 sm:py-4">
          <div className="flex items-center gap-2.5 sm:gap-4">
            <Link href="/" aria-label="Vai alla home">
              <Image src="/logo.png" alt="PokéWatch" width={180} height={42} className="h-auto w-[122px] sm:w-[180px]" priority />
            </Link>
            <span className="rounded bg-[#e50914] px-2.5 py-1 text-[10px] font-black tracking-[0.18em] text-white shadow-[0_0_14px_rgba(229,9,20,.45)]">
              PROFILE
            </span>
          </div>

          <AuthHeaderActions />

          <nav className="mobile-top-nav order-3 flex w-full items-center gap-4 overflow-x-auto whitespace-nowrap text-[11px] uppercase tracking-[0.1em] text-white/70 sm:order-none sm:w-auto sm:gap-6 sm:text-xs">
            <Link href="/" className="transition hover:text-white">Home</Link>
            <a href="#" className="transition hover:text-white">Serie TV</a>
            <a href="#" className="transition hover:text-white">Nuovi arrivi</a>
            <Link href="/profile" className="font-bold text-white">Profilo</Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-[1500px] px-4 py-8 sm:px-8 sm:py-10">
        {loading ? (
          <div className="rounded-md border border-white/10 bg-[#181818] p-8 text-sm text-white/70">Caricamento profilo...</div>
        ) : !user && !viewedUserId ? (
          <section className="mx-auto w-full max-w-2xl rounded-md border border-white/10 bg-[#181818] p-6 shadow-2xl shadow-black/50 sm:p-9">
            <div className="inline-flex rounded bg-[#e50914]/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#ff8a8f]">Accesso richiesto</div>
            <h1 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">Bentornato su PokéWatch</h1>
            <p className="mt-3 text-sm text-white/75 sm:text-base">Accedi per vedere il tuo catalogo personale, le statistiche e continuare da dove avevi lasciato.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/login" className="rounded bg-[#e50914] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#f6121d]">Vai al login</Link>
              <Link href="/" className="rounded border border-white/25 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">Torna alla home</Link>
            </div>
          </section>
        ) : (
          <div className="space-y-7">
            <section className="overflow-hidden rounded-md border border-white/10 bg-[#181818] shadow-[0_25px_70px_rgba(0,0,0,.45)]">
              <div className="relative h-44 bg-[linear-gradient(120deg,#000_0%,#111_40%,#1f1f1f_100%)] sm:h-56">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(229,9,20,.28),transparent_50%)]" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent" />
              </div>

              <div className="relative px-5 pb-6 pt-10 sm:px-8 sm:pb-8 sm:pt-12">
                <div className="absolute -top-12 left-1/2 flex h-24 w-24 -translate-x-1/2 items-center justify-center rounded border border-white/20 bg-gradient-to-br from-[#e50914] to-[#66070d] text-4xl font-black text-white shadow-xl sm:h-28 sm:w-28">{displayName.charAt(0)}</div>

                <div className="flex flex-col items-center gap-4 pt-12 text-center sm:pt-10">
                  <div>
                    {!readOnly && isEditMode ? (
                      <div className="space-y-2">
                        <div className="mx-auto flex w-full max-w-[320px] items-center gap-2 rounded border border-white/20 bg-black/35 px-3 py-2">
                          <FaPen size={12} className="shrink-0 text-white/65" />
                          <input
                            value={editDisplayName}
                            onChange={(event) => setEditDisplayName(event.target.value)}
                            className="w-full bg-transparent text-center text-2xl font-black tracking-tight text-white outline-none sm:text-3xl"
                          />
                        </div>
                        <div className="mx-auto flex max-w-[320px] items-center justify-center gap-2 rounded border border-white/20 bg-black/35 px-3 py-2">
                          <FaPen size={12} className="shrink-0 text-white/65" />
                          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">@</span>
                          <input
                            value={editNickname}
                            onChange={(event) => setEditNickname(event.target.value)}
                            className="w-full bg-transparent text-center text-xs font-semibold uppercase tracking-[0.16em] text-white/80 outline-none"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-3xl font-black tracking-tight sm:text-4xl">{displayName}</p>
                        <div className="mt-1 flex items-center justify-center">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">@{usernameLabel}</p>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="mt-1 flex w-full items-center justify-between gap-3 border-t border-white/10 pt-4 text-left">
                    <p className="text-xs font-medium text-white/70">
                      {joinDayVisible ? `Join day: ${formatJoinDay(joinDaySource)}` : "Join day nascosto"}
                    </p>
                    {readOnly ? null : (
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {!manageMode ? (
                          <Link href="/profile/settings" className="rounded bg-[#e50914] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#f6121d]">
                            Impostazioni
                          </Link>
                        ) : (
                          <Link href={`/profile/${usernameLabel}`} className="rounded bg-[#e50914] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#f6121d]">
                            Chiudi modifica
                          </Link>
                        )}
                        {manageMode ? (
                          <button
                            type="button"
                            onClick={() => void saveProfileBasics()}
                            disabled={isSavingProfile}
                            className="rounded border border-white/25 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
                          >
                            {isSavingProfile ? "Salvataggio..." : "Salva profilo"}
                          </button>
                        ) : null}
                        {manageMode ? (
                          <button
                            type="button"
                            onClick={() => setShowSecurityPanel((prev) => !prev)}
                            className="rounded border border-white/25 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                          >
                            Security
                          </button>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {!readOnly && manageMode && (profileError || profileMessage) ? (
              <section className="rounded-md border border-white/10 bg-[#181818] p-3">
                {profileError ? <p className="text-xs text-rose-300">{profileError}</p> : null}
                {profileMessage ? <p className="text-xs text-emerald-300">{profileMessage}</p> : null}
              </section>
            ) : null}

            {!readOnly && manageMode && showSecurityPanel ? (
              <section className="rounded-md border border-white/10 bg-[#181818] p-5 sm:p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-white">Security</p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="text-xs text-white/70">
                    Nuova email
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(event) => setNewEmail(event.target.value)}
                      className="mt-1 w-full rounded border border-white/20 bg-black/35 px-3 py-2 text-sm text-white outline-none ring-[#e50914] focus:ring-1"
                    />
                  </label>
                  <label className="text-xs text-white/70">
                    Password corrente
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      className="mt-1 w-full rounded border border-white/20 bg-black/35 px-3 py-2 text-sm text-white outline-none ring-[#e50914] focus:ring-1"
                    />
                  </label>
                </div>

                <label className="mt-3 block text-xs text-white/70">
                  Nuova password
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="mt-1 w-full rounded border border-white/20 bg-black/35 px-3 py-2 text-sm text-white outline-none ring-[#e50914] focus:ring-1"
                  />
                </label>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => void handleChangeEmail()} className="rounded border border-white/20 px-3 py-2 text-xs hover:bg-white/10">Cambia email</button>
                  <button type="button" onClick={() => void handleChangePassword()} className="rounded border border-white/20 px-3 py-2 text-xs hover:bg-white/10">Cambia password</button>
                  <button type="button" onClick={() => void handleResetPassword()} className="rounded border border-white/20 px-3 py-2 text-xs hover:bg-white/10">Reset password</button>
                  {!isGoogleLinked ? (
                    <button type="button" onClick={() => void handleConnectGoogle()} className="rounded border border-white/20 px-3 py-2 text-xs hover:bg-white/10">Collega Google</button>
                  ) : (
                    <button type="button" onClick={() => void handleDisconnectGoogle()} className="rounded border border-rose-400/35 bg-rose-500/10 px-3 py-2 text-xs text-rose-200 hover:bg-rose-500/20">Scollega Google</button>
                  )}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <label className="flex items-center gap-2 text-xs text-white/80">
                    <input type="checkbox" checked={joinDayVisibleSetting} onChange={(event) => setJoinDayVisibleSetting(event.target.checked)} />
                    Mostra join day
                  </label>
                  <label className="flex items-center gap-2 text-xs text-white/80">
                    <input type="checkbox" checked={profileVisibilitySetting === "private"} onChange={(event) => setProfileVisibilitySetting(event.target.checked ? "private" : "public")} />
                    Profilo privato
                  </label>
                  <label className="flex items-center gap-2 text-xs text-white/80">
                    <input type="checkbox" checked={twoFactorEnabled} onChange={(event) => setTwoFactorEnabled(event.target.checked)} />
                    Abilita 2FA
                  </label>
                </div>

                {securityError ? <p className="mt-3 text-xs text-rose-300">{securityError}</p> : null}
                {securityMessage ? <p className="mt-3 text-xs text-emerald-300">{securityMessage}</p> : null}

                <button
                  type="button"
                  onClick={() => void savePrivacyAndSecurityPrefs()}
                  disabled={isSavingSecurity}
                  className="mt-4 rounded bg-[#e50914] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#f6121d] disabled:opacity-60"
                >
                  {isSavingSecurity ? "Salvataggio..." : "Salva impostazioni security"}
                </button>
              </section>
            ) : null}

            {manageMode ? (
              <section className="rounded-md border border-white/10 bg-[#181818] p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">PROFILE MANAGEMENT</p>
                    <h2 className="mt-2 text-2xl font-black tracking-tight">Gestione account</h2>
                    <p className="mt-1 text-sm text-white/70">Aggiorna le informazioni del profilo, la sicurezza e la privacy del tuo account.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSecurityPanel((prev) => !prev)}
                    className="rounded border border-white/25 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-white/10"
                  >
                    {showSecurityPanel ? "Nascondi security" : "Apri security"}
                  </button>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <article className="rounded border border-white/15 bg-black/25 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">Identità</p>
                    <p className="mt-2 text-sm text-white/90">Display name e nickname modificabili in alto con salvataggio immediato.</p>
                  </article>
                  <article className="rounded border border-white/15 bg-black/25 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">Sicurezza</p>
                    <p className="mt-2 text-sm text-white/90">Gestisci email, password, reset credenziali, collegamento Google e opzioni 2FA.</p>
                  </article>
                  <article className="rounded border border-white/15 bg-black/25 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">Privacy</p>
                    <p className="mt-2 text-sm text-white/90">Controlla visibilità profilo e join day per decidere cosa mostrare pubblicamente.</p>
                  </article>
                </div>
              </section>
            ) : isPublicView && profileVisibility === "private" ? (
              <section className="rounded-md border border-white/10 bg-[#181818] p-6 text-sm text-white/80">
                Questo profilo è privato.
              </section>
            ) : (
            <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
              <article className="rounded-md border border-white/10 bg-[#181818] p-5 sm:p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-white">Distribuzione contenuti</p>
                <p className="mt-1 text-xs text-slate-300">Percentuale episodi guardati per tipologia.</p>
                <div className="mt-3 h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                <div className="mt-5">
                  <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                    {overviewItems.map((item) => {
                      const percentage = (item.entries / safeTotalEntries) * 100;
                      return (
                        <p key={item.label} className={item.textColor}>
                          <span className="font-semibold text-white/90">{item.label}</span>: {formatNumber.format(item.entries)} · {percentage.toFixed(0)}%
                        </p>
                      );
                    })}
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-white/10">
                    {overviewItems.map((item) => {
                      const percentage = (item.entries / safeTotalEntries) * 100;
                      return (
                        <div
                          key={item.label}
                          className={`h-full ${item.color} first:rounded-l-full last:rounded-r-full`}
                          style={{ width: `${percentage}%`, float: "left" }}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded border border-white/15 bg-black/30 p-3 text-center">
                    <p className="text-[11px] uppercase tracking-wide text-slate-300">Tempo di visione</p>
                    <p className="mt-1 text-xl font-bold text-white">{watchedStats.formattedTime}</p>
                  </div>
                  <div className="rounded border border-white/15 bg-black/30 p-3 text-center">
                    <p className="text-[11px] uppercase tracking-wide text-slate-300">Episodi totali</p>
                    <p className="mt-1 text-2xl font-bold text-white">{formatNumber.format(watchedStats.episodesWatched)}</p>
                  </div>
                </div>

                <div className="mt-7">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">Le tue stagioni</p>
                    <p className="mt-1 text-xs text-slate-300">Clicca una card per vedere i dettagli della stagione e gli episodi visti/non visti.</p>
                  </div>

                  <div className="relative mt-3">
                    <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[#181818] via-[#181818]/80 to-transparent" />
                    <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[#181818] via-[#181818]/80 to-transparent" />

                    <button
                      type="button"
                      onClick={() => setSeasonCarouselStart((prev) => Math.max(0, Math.min(prev, maxCarouselStart) - 1))}
                      disabled={normalizedCarouselStart === 0}
                      aria-label="Precedente"
                      className="absolute left-1 top-1/2 z-20 -translate-y-1/2 rounded-r-md bg-black/45 px-3 py-8 text-2xl text-white transition hover:bg-black/70 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <FaChevronLeft aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSeasonCarouselStart((prev) => Math.min(maxCarouselStart, Math.min(prev, maxCarouselStart) + 1))}
                      disabled={normalizedCarouselStart >= maxCarouselStart}
                      aria-label="Successivo"
                      className="absolute right-1 top-1/2 z-20 -translate-y-1/2 rounded-l-md bg-black/45 px-3 py-8 text-2xl text-white transition hover:bg-black/70 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <FaChevronRight aria-hidden="true" />
                    </button>

                    <div className="grid gap-3 px-10 md:grid-cols-3">
                      {visibleSeasonCards.map((entry) => (
                        <button
                          key={entry.season.season}
                          type="button"
                          onClick={() => setSelectedSeasonNumber(entry.season.season)}
                          className="group relative flex min-h-[330px] flex-col overflow-hidden rounded border border-white/10 bg-[#111] text-left transition duration-300 hover:scale-[1.02] hover:border-white/35"
                        >
                          {entry.progress >= 100 ? (
                            <span className="absolute right-2 top-2 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-sm font-black text-white shadow-md shadow-black/30">
                              ✓
                            </span>
                          ) : null}

                          <div className="relative aspect-video w-full overflow-hidden p-4">
                            <SeasonCardImage
                              seasonNumber={entry.season.season}
                              title={entry.season.title}
                              accent={entry.season.accent}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
                            <div className="relative z-10">
                              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/90">Stagione {entry.season.season}</p>
                              <p className="mt-2 inline-block rounded bg-black/35 px-2 py-0.5 text-xs font-semibold text-white/90">{entry.season.arc}</p>
                            </div>
                          </div>

                          <div className="flex flex-1 flex-col justify-between p-4">
                            <div>
                              <p className="line-clamp-2 text-base font-bold leading-snug text-white">{entry.season.title}</p>
                              <p className="mt-2 line-clamp-3 text-sm text-white/70">{entry.season.synopsis}</p>
                            </div>

                            <div className="mt-3 space-y-2">
                              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                                <div className="h-full rounded-full bg-[#e50914] transition-all duration-300" style={{ width: `${entry.progress}%` }} />
                              </div>
                              <p className="text-[11px] text-white/60">{entry.watchedCount}/{entry.episodes.length} episodi · {entry.progress}% visto</p>
                              <p className="text-xs text-white/60">{entry.season.years} · {episodesLabel(entry.season.episodes)}</p>
                            </div>
                          </div>

                          <div className="pointer-events-none absolute inset-0 rounded-md ring-1 ring-inset ring-white/0 transition group-hover:ring-white/20" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </article>

              <article className="rounded-md border border-white/10 bg-[#181818] p-5 sm:p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-white">Badges</p>
                <p className="mt-1 text-xs text-slate-300">I tuoi avanzamenti sbloccati su PokéWatch.</p>
                <div className="mt-3 h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {badges.map((badge) => (
                    <div
                      key={badge.title}
                      className={`rounded border p-3 ${badge.unlocked ? "border-emerald-400/35 bg-emerald-500/10" : "border-white/10 bg-black/25"}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl" aria-hidden="true">{badge.icon}</span>
                        <div>
                          <p className="text-sm font-bold text-white">{badge.title}</p>
                          <p className="mt-0.5 text-xs text-white/70">{badge.description}</p>
                        </div>
                      </div>
                      <p className={`mt-3 text-[11px] font-semibold uppercase tracking-wide ${badge.unlocked ? "text-emerald-300" : "text-white/50"}`}>
                        {badge.unlocked ? "Sbloccato" : "Bloccato"}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded border border-white/15 bg-black/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Progressione badge</p>
                  <p className="mt-2 text-sm text-white/90">{badges.filter((badge) => badge.unlocked).length} / {badges.length} badge sbloccati</p>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#e50914] to-[#ff5a5f]"
                      style={{ width: `${(badges.filter((badge) => badge.unlocked).length / badges.length) * 100}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-300">Continua a guardare per sbloccare gli altri avanzamenti.</p>
                </div>
              </article>
            </div>
            )}
          </div>
        )}
      </main>

      {selectedSeasonDetail ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedSeasonNumber(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-md border border-white/15 bg-[#181818] shadow-2xl shadow-black/60"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative h-36 overflow-hidden sm:h-44">
              <SeasonCardImage
                seasonNumber={selectedSeasonDetail.season.season}
                title={selectedSeasonDetail.season.title}
                accent={selectedSeasonDetail.season.accent}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
            </div>

            <div className="relative -mt-8 space-y-5 px-4 pb-5 sm:px-6 sm:pb-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold tracking-[0.2em] text-white/70">DETTAGLIO STAGIONE</p>
                  <h3 className="mt-1 text-xl font-black sm:text-2xl">{selectedSeasonDetail.season.title}</h3>
                  <p className="mt-1 text-sm text-slate-200/85">{selectedSeasonDetail.season.synopsis}</p>
                  <p className="mt-2 text-xs text-slate-300">
                    Stagione {selectedSeasonDetail.season.season} · {selectedSeasonDetail.season.arc} · {selectedSeasonDetail.season.years} · {episodesLabel(selectedSeasonDetail.season.episodes)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedSeasonNumber(null)}
                  className="rounded border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/90 transition hover:bg-white/10"
                >
                  Chiudi
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded border border-white/10 bg-black/35 p-3 text-center">
                  <p className="text-[11px] text-slate-300">Visti</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-300">{selectedSeasonDetail.watchedCount}</p>
                </div>
                <div className="rounded border border-white/10 bg-black/35 p-3 text-center">
                  <p className="text-[11px] text-slate-300">Totale episodi</p>
                  <p className="mt-1 text-2xl font-bold text-sky-300">{selectedSeasonDetail.episodes.length}</p>
                </div>
                <div className="rounded border border-white/10 bg-black/35 p-3 text-center">
                  <p className="text-[11px] text-slate-300">Completamento</p>
                  <p className="mt-1 text-2xl font-bold text-[#ff7f86]">{selectedSeasonDetail.progress}%</p>
                </div>
              </div>

              <div className="max-h-[45vh] space-y-2 overflow-y-auto pr-1">
                {selectedSeasonDetail.episodes.map((episode) => {
                  const watched = Boolean(selectedSeasonDetail.watchedMap[episode.number]);
                  return (
                    <div
                      key={episode.number}
                      className={`rounded-lg border p-3 ${watched ? "border-emerald-400/30 bg-emerald-500/10" : "border-rose-400/30 bg-rose-500/10"}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">{episode.title}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${watched ? "bg-emerald-500/20 text-emerald-200" : "bg-rose-500/20 text-rose-200"}`}>
                          {watched ? "Visto" : "Non visto"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}