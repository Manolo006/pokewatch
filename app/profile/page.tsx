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
  updatePassword,
  updateProfile,
  verifyBeforeUpdateEmail,
} from "firebase/auth";
import { get, ref, remove, set, update } from "firebase/database";
import { FaChevronLeft, FaChevronRight, FaEye, FaEyeSlash, FaPen, FaSave, FaTrash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { useAuth } from "@/app/components/AuthProvider";
import AuthHeaderActions from "@/app/components/AuthHeaderActions";
import { auth, db, googleProvider } from "@/app/lib/firebase";
import { allSeasons, episodesLabel, getEpisodesForSeason } from "@/app/data/pokemonCatalog";

type EpisodeFillerType = "non-filler" | "filler" | "misto";

type OwnProfileSettings = {
  username: string;
  displayName: string;
  bio?: string;
  joinedAt: string | null;
  profileImageUrl?: string | null;
  profileImageBgColor?: string | null;
};

type SpriteCategory = "pokemon" | "items" | "berries";

type SpriteOption = {
  id: string;
  name: string;
  imageUrl: string;
  category: SpriteCategory;
  pokemonDexId?: number;
};

type AshBadgeMilestone = {
  key: string;
  title: string;
  city: string;
  itemName: string;
  badgeSpriteId?: number;
  animeEpisode: number;
};

type BadgeSeasonCard = {
  key: string;
  title: string;
  subtitle: string;
  badges: AshBadgeMilestone[];
};

const ASH_BADGE_SEASON_CARDS: BadgeSeasonCard[] = [
  {
    key: "indigo-kanto",
    title: "Kanto",
    subtitle: "Badge da palestra in ordine anime classico.",
    badges: [
      { key: "boulder", title: "Medaglia Sasso", city: "Pewter City", itemName: "boulder-badge", badgeSpriteId: 1, animeEpisode: 5 },
      { key: "cascade", title: "Medaglia Cascata", city: "Cerulean City", itemName: "cascade-badge", badgeSpriteId: 2, animeEpisode: 7 },
      { key: "thunder", title: "Medaglia Tuono", city: "Vermilion City", itemName: "thunder-badge", badgeSpriteId: 3, animeEpisode: 14 },
      { key: "rainbow", title: "Medaglia Arcobaleno", city: "Celadon City", itemName: "rainbow-badge", badgeSpriteId: 4, animeEpisode: 26 },
      { key: "soul", title: "Medaglia Anima", city: "Fuchsia City", itemName: "soul-badge", badgeSpriteId: 5, animeEpisode: 32 },
      { key: "marsh", title: "Medaglia Palude", city: "Saffron City", itemName: "marsh-badge", badgeSpriteId: 6, animeEpisode: 55 },
      { key: "volcano", title: "Medaglia Vulcano", city: "Cinnabar Island", itemName: "volcano-badge", badgeSpriteId: 7, animeEpisode: 58 },
      { key: "earth", title: "Medaglia Terra", city: "Viridian City", itemName: "earth-badge", badgeSpriteId: 8, animeEpisode: 63 },
    ],
  },
  {
    key: "orange-islands",
    title: "Orange",
    subtitle: "Trofei Orange Crew (anime).",
    badges: [
      { key: "orange-coral-eye", title: "Coral-Eye Badge", city: "Mikan Island", itemName: "coral-eye-badge", badgeSpriteId: 66, animeEpisode: 86 },
      { key: "orange-sea-ruby", title: "Sea Ruby Badge", city: "Navel Island", itemName: "sea-ruby-badge", badgeSpriteId: 67, animeEpisode: 100 },
      { key: "orange-spike-shell", title: "Spike Shell Badge", city: "Trovita Island", itemName: "spike-shell-badge", badgeSpriteId: 68, animeEpisode: 109 },
      { key: "orange-jade-star", title: "Jade Star Badge", city: "Kumquat Island", itemName: "jade-star-badge", badgeSpriteId: 69, animeEpisode: 112 },
    ],
  },
  {
    key: "johto",
    title: "Johto",
    subtitle: "Badge Johto in ordine anime.",
    badges: [
      { key: "zephyr", title: "Medaglia Zefiro", city: "Violet City", itemName: "zephyr-badge", badgeSpriteId: 9, animeEpisode: 132 },
      { key: "hive", title: "Medaglia Alveare", city: "Azalea Town", itemName: "hive-badge", badgeSpriteId: 10, animeEpisode: 143 },
      { key: "plain", title: "Medaglia Piana", city: "Goldenrod City", itemName: "plain-badge", badgeSpriteId: 11, animeEpisode: 163 },
      { key: "fog", title: "Medaglia Nebbia", city: "Ecruteak City", itemName: "fog-badge", badgeSpriteId: 12, animeEpisode: 185 },
      { key: "storm", title: "Medaglia Tempesta", city: "Cianwood City", itemName: "storm-badge", badgeSpriteId: 13, animeEpisode: 209 },
      { key: "mineral", title: "Medaglia Minerale", city: "Olivine City", itemName: "mineral-badge", badgeSpriteId: 14, animeEpisode: 226 },
      { key: "glacier", title: "Medaglia Ghiacciaio", city: "Mahogany Town", itemName: "glacier-badge", badgeSpriteId: 15, animeEpisode: 238 },
      { key: "rising", title: "Medaglia Dragone", city: "Blackthorn City", itemName: "rising-badge", badgeSpriteId: 16, animeEpisode: 255 },
    ],
  },
  {
    key: "hoenn",
    title: "Hoenn",
    subtitle: "Badge Hoenn in ordine anime.",
    badges: [
      { key: "stone", title: "Medaglia Pietra", city: "Rustboro City", itemName: "stone-badge", badgeSpriteId: 17, animeEpisode: 281 },
      { key: "knuckle", title: "Medaglia Pugno", city: "Dewford Town", itemName: "knuckle-badge", badgeSpriteId: 18, animeEpisode: 292 },
      { key: "dynamo", title: "Medaglia Dynamo", city: "Mauville City", itemName: "dynamo-badge", badgeSpriteId: 19, animeEpisode: 307 },
      { key: "heat", title: "Medaglia Calore", city: "Lavaridge Town", itemName: "heat-badge", badgeSpriteId: 20, animeEpisode: 329 },
      { key: "balance", title: "Medaglia Equilibrio", city: "Petalburg City", itemName: "balance-badge", badgeSpriteId: 21, animeEpisode: 343 },
      { key: "feather", title: "Medaglia Piuma", city: "Fortree City", itemName: "feather-badge", badgeSpriteId: 22, animeEpisode: 350 },
      { key: "mind", title: "Medaglia Mente", city: "Mossdeep City", itemName: "mind-badge", badgeSpriteId: 23, animeEpisode: 377 },
      { key: "rain", title: "Medaglia Pioggia", city: "Sootopolis City", itemName: "rain-badge", badgeSpriteId: 24, animeEpisode: 389 },
    ],
  },
  {
    key: "sinnoh",
    title: "Sinnoh",
    subtitle: "Badge Sinnoh in ordine anime.",
    badges: [
      { key: "coal", title: "Medaglia Carbone", city: "Oreburgh City", itemName: "coal-badge", badgeSpriteId: 25, animeEpisode: 406 },
      { key: "forest", title: "Medaglia Foresta", city: "Eterna City", itemName: "forest-badge", badgeSpriteId: 26, animeEpisode: 440 },
      { key: "cobble", title: "Medaglia Ciottolo", city: "Hearthome City", itemName: "cobble-badge", badgeSpriteId: 27, animeEpisode: 457 },
      { key: "fen", title: "Medaglia Acquitrino", city: "Pastoria City", itemName: "fen-badge", badgeSpriteId: 28, animeEpisode: 473 },
      { key: "relic", title: "Medaglia Reliquia", city: "Hearthome City", itemName: "relic-badge", badgeSpriteId: 29, animeEpisode: 497 },
      { key: "mine", title: "Medaglia Miniera", city: "Canalave City", itemName: "mine-badge", badgeSpriteId: 30, animeEpisode: 507 },
      { key: "icicle", title: "Medaglia Ghiacciolo", city: "Snowpoint City", itemName: "icicle-badge", badgeSpriteId: 31, animeEpisode: 522 },
      { key: "beacon", title: "Medaglia Faro", city: "Sunyshore City", itemName: "beacon-badge", badgeSpriteId: 32, animeEpisode: 539 },
    ],
  },
  {
    key: "unova",
    title: "Unima",
    subtitle: "Badge Unima in ordine anime.",
    badges: [
      { key: "trio", title: "Medaglia Trio", city: "Striaton City", itemName: "trio-badge", badgeSpriteId: 33, animeEpisode: 659 },
      { key: "basic", title: "Medaglia Base", city: "Nacrene City", itemName: "basic-badge", badgeSpriteId: 34, animeEpisode: 670 },
      { key: "insect", title: "Medaglia Scarabeo", city: "Castelia City", itemName: "insect-badge", badgeSpriteId: 36, animeEpisode: 683 },
      { key: "bolt", title: "Medaglia Volt", city: "Nimbasa City", itemName: "bolt-badge", badgeSpriteId: 37, animeEpisode: 696 },
      { key: "quake", title: "Medaglia Sisma", city: "Driftveil City", itemName: "quake-badge", badgeSpriteId: 38, animeEpisode: 726 },
      { key: "jet", title: "Medaglia Jet", city: "Mistralton City", itemName: "jet-badge", badgeSpriteId: 39, animeEpisode: 738 },
      { key: "legend", title: "Medaglia Stalattite", city: "Opelucid City", itemName: "legend-badge", badgeSpriteId: 40, animeEpisode: 754 },
      { key: "wave", title: "Medaglia Arsenico", city: "Humilau City", itemName: "wave-badge", badgeSpriteId: 35, animeEpisode: 773 },
    ],
  },
  {
    key: "kalos",
    title: "Kalos",
    subtitle: "Badge Kalos in ordine anime.",
    badges: [
      { key: "bug", title: "Medaglia Coleottero", city: "Santalune City", itemName: "bug-badge", badgeSpriteId: 43, animeEpisode: 806 },
      { key: "cliff", title: "Medaglia Rupe", city: "Cyllage City", itemName: "cliff-badge", badgeSpriteId: 44, animeEpisode: 823 },
      { key: "rumble", title: "Medaglia Rissa", city: "Shalour City", itemName: "rumble-badge", badgeSpriteId: 45, animeEpisode: 836 },
      { key: "plant", title: "Medaglia Pianta", city: "Coumarine City", itemName: "plant-badge", badgeSpriteId: 46, animeEpisode: 849 },
      { key: "voltage", title: "Medaglia Tensione", city: "Lumiose City", itemName: "voltage-badge", badgeSpriteId: 47, animeEpisode: 861 },
      { key: "fairy", title: "Medaglia Folletto", city: "Laverre City", itemName: "fairy-badge", badgeSpriteId: 48, animeEpisode: 873 },
      { key: "psychic", title: "Medaglia Psiche", city: "Anistar City", itemName: "psychic-badge", badgeSpriteId: 49, animeEpisode: 885 },
      { key: "iceberg", title: "Medaglia Iceberg", city: "Snowbelle City", itemName: "iceberg-badge", badgeSpriteId: 50, animeEpisode: 891 },
    ],
  },
  {
    key: "alola",
    title: "Alola",
    subtitle: "Isola Challenge (anime).",
    badges: [
      { key: "alola-melemele", title: "Melemele Stamp", city: "Melemele Island", itemName: "normalium-z", animeEpisode: 952 },
      { key: "alola-akala", title: "Akala Stamp", city: "Akala Island", itemName: "firium-z", animeEpisode: 986 },
      { key: "alola-ulu-ulu", title: "Ula'ula Stamp", city: "Ula'ula Island", itemName: "electrium-z", animeEpisode: 1039 },
      { key: "alola-poni", title: "Poni Stamp", city: "Poni Island", itemName: "dragonium-z", animeEpisode: 1089 },
    ],
  },
];

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
  return email?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9]/g, "") || "profile";
}

function normalizeNickname(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 24);
}

function normalizeDisplayName(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 24);
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

function formatJoinDay(value?: string | null) {
  if (!value) return "Non disponibile";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Non disponibile";

  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "medium",
  }).format(date);
}

function formatSpriteLabel(name: string) {
  return name
    .split("-")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

function getPokeApiItemSpriteUrl(itemName: string) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${itemName}.png`;
}

function getPokeApiBadgeSpriteUrl(badgeId: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/badges/${badgeId}.png`;
}

function getBadgeImageUrl(badge: AshBadgeMilestone) {
  if (badge.badgeSpriteId) return getPokeApiBadgeSpriteUrl(badge.badgeSpriteId);
  return getPokeApiItemSpriteUrl(badge.itemName);
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

  return <div className={`absolute inset-0 bg-linear-to-br ${accent} via-slate-700 to-black`} />;
}

type ProfilePageProps = {
  viewedUserId?: string;
  publicDisplayName?: string;
  publicUsername?: string;
  publicJoinedAt?: string | null;
  manageMode?: boolean;
  settingsSection?: "profile" | "security";
  readOnly?: boolean;
};

export default function ProfilePage({
  viewedUserId,
  publicDisplayName,
  publicUsername,
  publicJoinedAt,
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
  const [emailCurrentPassword, setEmailCurrentPassword] = useState("");
  const [passwordCurrentPassword, setPasswordCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPasswordValue, setShowNewPasswordValue] = useState(false);
  const [bioDraft, setBioDraft] = useState("");
  const [showEmailValue, setShowEmailValue] = useState(false);
  const [enableEmailAccountCreation, setEnableEmailAccountCreation] = useState(false);
  const [showEmailEditor, setShowEmailEditor] = useState(false);
  const [showPasswordEditor, setShowPasswordEditor] = useState(false);
  const [deleteAccountNotice, setDeleteAccountNotice] = useState<string | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileInputError, setProfileInputError] = useState<string | null>(null);
  const [securityMessage, setSecurityMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [emailSecurityMessage, setEmailSecurityMessage] = useState<string | null>(null);
  const [emailSecurityError, setEmailSecurityError] = useState<string | null>(null);
  const [passwordSecurityMessage, setPasswordSecurityMessage] = useState<string | null>(null);
  const [passwordSecurityError, setPasswordSecurityError] = useState<string | null>(null);
  const [isSecurityMessageFading, setIsSecurityMessageFading] = useState(false);
  const [isSecurityErrorFading, setIsSecurityErrorFading] = useState(false);
  const [isEmailSecurityMessageFading, setIsEmailSecurityMessageFading] = useState(false);
  const [isEmailSecurityErrorFading, setIsEmailSecurityErrorFading] = useState(false);
  const [isPasswordSecurityMessageFading, setIsPasswordSecurityMessageFading] = useState(false);
  const [isPasswordSecurityErrorFading, setIsPasswordSecurityErrorFading] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);
  const isGoogleLinked = Boolean(user?.providerData?.some((provider) => provider.providerId === "google.com"));
  const ownDisplayName = ownProfileSettings?.displayName || user?.displayName?.trim() || getDisplayName(user?.email);
  const ownUsername = ownProfileSettings?.username || getUserSlug(user?.email);
  const normalizedEditedNickname = normalizeNickname(editNickname);
  const trimmedEditedDisplayName = editDisplayName.trim();
  const trimmedEditedBio = bioDraft.trim();
  const ownBio = ownProfileSettings?.bio?.trim() ?? "";
  const ownProfileImageUrl = ownProfileSettings?.profileImageUrl ?? null;
  const ownProfileImageBgColor = ownProfileSettings?.profileImageBgColor ?? "#e50914";
  const hasDisplayNameChange = trimmedEditedDisplayName !== ownDisplayName;
  const hasNicknameChange = normalizedEditedNickname !== ownUsername;
  const hasBioChange = trimmedEditedBio !== ownBio;
  const displayName = publicDisplayName ?? ownDisplayName;
  const usernameLabel = publicUsername ?? ownUsername;
  const isPublicView = Boolean(viewedUserId && viewedUserId !== user?.uid);
  const joinDaySource = publicJoinedAt ?? ownProfileSettings?.joinedAt ?? user?.metadata.creationTime;
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number | null>(null);
  const [selectedBadgeRegionKey, setSelectedBadgeRegionKey] = useState<string | null>(null);
  const [seasonCarouselStart, setSeasonCarouselStart] = useState(0);
  const [watchedBySeason, setWatchedBySeason] = useState<Record<number, Record<number, boolean>>>(() => {
    if (typeof window === "undefined") return {};
    return parseStoredWatchedBySeason(window.localStorage);
  });
  const [fillerBySeason, setFillerBySeason] = useState<Record<number, Record<number, EpisodeFillerType>>>(() => {
    if (typeof window === "undefined") return {};
    return parseStoredFillerBySeason(window.localStorage);
  });
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [avatarCategory, setAvatarCategory] = useState<SpriteCategory>("pokemon");
  const [pokemonSprites, setPokemonSprites] = useState<SpriteOption[]>([]);
  const [itemSprites, setItemSprites] = useState<SpriteOption[]>([]);
  const [berrySprites, setBerrySprites] = useState<SpriteOption[]>([]);
  const [isLoadingAvatarSprites, setIsLoadingAvatarSprites] = useState(false);
  const [avatarSpritesError, setAvatarSpritesError] = useState<string | null>(null);
  const [isSavingProfileImage] = useState(false);
  const [isSavingProfileBackground] = useState(false);
  const [profileImageBgColor, setProfileImageBgColor] = useState("#e50914");
  const [profileImageHexInput, setProfileImageHexInput] = useState("#e50914");
  const [avatarSearchQuery, setAvatarSearchQuery] = useState("");
  const [pokemonSearchResults, setPokemonSearchResults] = useState<SpriteOption[]>([]);
  const [isSearchingPokemon, setIsSearchingPokemon] = useState(false);
  const [pokemonSearchError, setPokemonSearchError] = useState<string | null>(null);
  const hasProfileImageChange = profileImageUrl !== ownProfileImageUrl;
  const hasProfileImageBgColorChange = profileImageBgColor !== ownProfileImageBgColor;
  const profileSettingsCacheKey = user ? `pokewatch-profile-settings-${user.uid}` : null;
  const hasUnsavedProfileChanges =
    hasDisplayNameChange ||
    hasNicknameChange ||
    hasBioChange ||
    hasProfileImageChange ||
    hasProfileImageBgColorChange;

  const formatNumber = new Intl.NumberFormat("it-IT");

  useEffect(() => {
    if (loading || !user) return;
    if (viewedUserId) return;
    if (pathname !== "/profile") return;
  }, [loading, pathname, router, user, viewedUserId]);

  useEffect(() => {
    if (!user || !db || isPublicView) return;

    const database = db;

    let active = true;

    const loadOwnProfileSettings = async () => {
      const snapshot = await get(ref(database, `users/${user.uid}/publicProfile`));
      if (!active) return;

      const value = (snapshot.val() as Partial<OwnProfileSettings> | null) ?? null;
      let cachedValue: Partial<OwnProfileSettings> | null = null;

      if (typeof window !== "undefined" && profileSettingsCacheKey) {
        try {
          const rawCached = window.localStorage.getItem(profileSettingsCacheKey);
          cachedValue = rawCached ? (JSON.parse(rawCached) as Partial<OwnProfileSettings>) : null;
        } catch {
          cachedValue = null;
        }
      }

      const username = value?.username || cachedValue?.username || getUserSlug(user.email);
      const display = value?.displayName || cachedValue?.displayName || user.displayName?.trim() || getDisplayName(user.email);
      const bio = value?.bio?.trim() ?? cachedValue?.bio?.trim() ?? "";
      const joinedAt = value?.joinedAt ?? cachedValue?.joinedAt ?? user.metadata.creationTime ?? null;
      const profileImage = value?.profileImageUrl ?? cachedValue?.profileImageUrl ?? null;
      const profileBgColor = value?.profileImageBgColor ?? cachedValue?.profileImageBgColor ?? "#e50914";

      const resolvedSettings: OwnProfileSettings = {
        username,
        displayName: display,
        bio,
        joinedAt,
        profileImageUrl: profileImage,
        profileImageBgColor: profileBgColor,
      };

      setOwnProfileSettings(resolvedSettings);
      setEditNickname(username);
      setEditDisplayName(display);
      setBioDraft(bio);
      setProfileImageUrl(profileImage);
      setProfileImageBgColor(profileBgColor);

      if (typeof window !== "undefined" && profileSettingsCacheKey) {
        try {
          window.localStorage.setItem(profileSettingsCacheKey, JSON.stringify(resolvedSettings));
        } catch {
          // ignore storage write errors
        }
      }
    };

    void loadOwnProfileSettings();

    return () => {
      active = false;
    };
  }, [db, isPublicView, profileSettingsCacheKey, user]);

  useEffect(() => {
    if (!securityMessage) return;

    setIsSecurityMessageFading(false);

    const fadeTimeoutId = window.setTimeout(() => {
      setIsSecurityMessageFading(true);
    }, 3200);

    const timeoutId = window.setTimeout(() => {
      setSecurityMessage(null);
      setIsSecurityMessageFading(false);
    }, 4000);

    return () => {
      window.clearTimeout(fadeTimeoutId);
      window.clearTimeout(timeoutId);
    };
  }, [securityMessage]);

  useEffect(() => {
    if (!securityError) return;

    setIsSecurityErrorFading(false);

    const fadeTimeoutId = window.setTimeout(() => {
      setIsSecurityErrorFading(true);
    }, 3200);

    const timeoutId = window.setTimeout(() => {
      setSecurityError(null);
      setIsSecurityErrorFading(false);
    }, 4000);

    return () => {
      window.clearTimeout(fadeTimeoutId);
      window.clearTimeout(timeoutId);
    };
  }, [securityError]);

  useEffect(() => {
    if (!emailSecurityMessage) return;

    setIsEmailSecurityMessageFading(false);

    const fadeTimeoutId = window.setTimeout(() => {
      setIsEmailSecurityMessageFading(true);
    }, 3200);

    const timeoutId = window.setTimeout(() => {
      setEmailSecurityMessage(null);
      setIsEmailSecurityMessageFading(false);
    }, 4000);

    return () => {
      window.clearTimeout(fadeTimeoutId);
      window.clearTimeout(timeoutId);
    };
  }, [emailSecurityMessage]);

  useEffect(() => {
    if (!emailSecurityError) return;

    setIsEmailSecurityErrorFading(false);

    const fadeTimeoutId = window.setTimeout(() => {
      setIsEmailSecurityErrorFading(true);
    }, 3200);

    const timeoutId = window.setTimeout(() => {
      setEmailSecurityError(null);
      setIsEmailSecurityErrorFading(false);
    }, 4000);

    return () => {
      window.clearTimeout(fadeTimeoutId);
      window.clearTimeout(timeoutId);
    };
  }, [emailSecurityError]);

  useEffect(() => {
    if (!passwordSecurityMessage) return;

    setIsPasswordSecurityMessageFading(false);

    const fadeTimeoutId = window.setTimeout(() => {
      setIsPasswordSecurityMessageFading(true);
    }, 3200);

    const timeoutId = window.setTimeout(() => {
      setPasswordSecurityMessage(null);
      setIsPasswordSecurityMessageFading(false);
    }, 4000);

    return () => {
      window.clearTimeout(fadeTimeoutId);
      window.clearTimeout(timeoutId);
    };
  }, [passwordSecurityMessage]);

  useEffect(() => {
    if (!passwordSecurityError) return;

    setIsPasswordSecurityErrorFading(false);

    const fadeTimeoutId = window.setTimeout(() => {
      setIsPasswordSecurityErrorFading(true);
    }, 3200);

    const timeoutId = window.setTimeout(() => {
      setPasswordSecurityError(null);
      setIsPasswordSecurityErrorFading(false);
    }, 4000);

    return () => {
      window.clearTimeout(fadeTimeoutId);
      window.clearTimeout(timeoutId);
    };
  }, [passwordSecurityError]);

  useEffect(() => {
    if (!isAvatarPickerOpen) return;
    if (pokemonSprites.length > 0 && itemSprites.length > 0 && berrySprites.length > 0) return;

    let active = true;

    const loadAvatarSprites = async () => {
      setAvatarSpritesError(null);
      setIsLoadingAvatarSprites(true);

      try {
        const [pokemonResponse, itemsResponse, berriesResponse] = await Promise.all([
          fetch("https://pokeapi.co/api/v2/pokemon?limit=1025"),
          fetch("https://pokeapi.co/api/v2/item?limit=5000"),
          fetch("https://pokeapi.co/api/v2/berry?limit=200"),
        ]);

        if (!pokemonResponse.ok || !itemsResponse.ok || !berriesResponse.ok) {
          throw new Error("fetch_failed");
        }

        const pokemonData = (await pokemonResponse.json()) as {
          results: Array<{ name: string; url: string }>;
        };
        const itemsData = (await itemsResponse.json()) as {
          results: Array<{ name: string }>;
        };
        const berriesData = (await berriesResponse.json()) as {
          results: Array<{ name: string }>;
        };

        if (!active) return;

        const nextPokemonSprites: SpriteOption[] = pokemonData.results
          .map((entry) => {
            const idMatch = entry.url.match(/\/pokemon\/(\d+)\/$/);
            const pokemonId = idMatch ? Number(idMatch[1]) : null;
            if (!pokemonId) return null;

            return {
              id: `pokemon-${pokemonId}`,
              name: entry.name,
              imageUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`,
              category: "pokemon" as const,
              pokemonDexId: pokemonId,
            } as SpriteOption;
          })
          .filter((sprite): sprite is SpriteOption => sprite !== null);
        
        const nextItemSprites: SpriteOption[] = itemsData.results
          .filter(entry => 
            !entry.name.includes("berry")
          )
          .map((entry, index) => ({
            id: `item-${entry.name}-${index}`,
            name: entry.name,
            imageUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${entry.name}.png`,
            category: "items",
          }));

        const nextBerrySprites: SpriteOption[] = berriesData.results.map((entry, index) => ({
          id: `berry-${entry.name}-${index}`,
          name: entry.name,
          imageUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${entry.name}-berry.png`,
          category: "berries",
        }));

        setPokemonSprites(nextPokemonSprites);
        setItemSprites(nextItemSprites);
        setBerrySprites(nextBerrySprites);
      } catch {
        if (!active) return;
        setAvatarSpritesError("Non sono riuscito a caricare gli sprite da PokéAPI. Riprova tra poco.");
      } finally {
        if (!active) return;
        setIsLoadingAvatarSprites(false);
      }
    };

    void loadAvatarSprites();

    return () => {
      active = false;
    };
  }, [isAvatarPickerOpen, pokemonSprites.length, itemSprites.length, berrySprites.length]);

  useEffect(() => {
    if (!isAvatarPickerOpen || avatarCategory !== "pokemon") {
      setPokemonSearchResults([]);
      setPokemonSearchError(null);
      setIsSearchingPokemon(false);
      return;
    }

    const rawQuery = avatarSearchQuery.trim().toLowerCase();
    if (!rawQuery) {
      setPokemonSearchResults([]);
      setPokemonSearchError(null);
      setIsSearchingPokemon(false);
      return;
    }

    if (pokemonSprites.length === 0) {
      setPokemonSearchResults([]);
      setPokemonSearchError(null);
      setIsSearchingPokemon(true);
      return;
    }

    setIsSearchingPokemon(true);

    const byPrefix = pokemonSprites.filter((sprite) => {
      const nameStartsWith = sprite.name.toLowerCase().startsWith(rawQuery);
      const dexStartsWith = String(sprite.pokemonDexId ?? "").startsWith(rawQuery);
      return nameStartsWith || dexStartsWith;
    });

    const byIncludes = pokemonSprites.filter((sprite) => {
      const nameIncludes = sprite.name.toLowerCase().includes(rawQuery);
      const dexIncludes = String(sprite.pokemonDexId ?? "").includes(rawQuery);
      return nameIncludes || dexIncludes;
    });

    const merged = [...byPrefix, ...byIncludes.filter((candidate) => !byPrefix.some((prefixItem) => prefixItem.id === candidate.id))];

    setPokemonSearchResults(merged);
    setPokemonSearchError(merged.length === 0 ? "Nessun Pokémon trovato con questa ricerca." : null);
    setIsSearchingPokemon(false);
  }, [avatarCategory, avatarSearchQuery, isAvatarPickerOpen, pokemonSprites]);

  const saveProfileBasics = async (scope: "all" | "displayName" | "nickname" = "all") => {
    if (!user || !db) return;

    if (scope === "displayName" && !hasDisplayNameChange) {
      setProfileError(null);
      setProfileMessage("Nessuna modifica al display name da salvare.");
      return;
    }

    if (scope === "nickname" && !hasNicknameChange) {
      setProfileError(null);
      setProfileMessage("Nessuna modifica al nickname da salvare.");
      return;
    }

    if (scope === "all" && !hasUnsavedProfileChanges) {
      setProfileError(null);
      setProfileMessage("Nessuna modifica da salvare.");
      return;
    }

    setProfileError(null);
    setProfileMessage(null);

    const normalizedNickname = scope === "displayName" ? ownUsername : normalizeNickname(editNickname);
    const trimmedDisplayName = scope === "nickname" ? ownDisplayName : normalizeDisplayName(editDisplayName).trim();
    const nextBio = bioDraft.trim();

    if (normalizedNickname.length < 3) {
      setProfileError("Il nickname deve avere almeno 3 caratteri validi (solo lettere e numeri).");
      return;
    }

    if (!trimmedDisplayName) {
      setProfileError("Il display name non può essere vuoto.");
      return;
    }

    if (!/^[a-z0-9]+$/i.test(normalizedNickname)) {
      setProfileError("Il nickname può contenere solo lettere e numeri.");
      return;
    }

    if (!/^[a-z0-9]+$/i.test(trimmedDisplayName)) {
      setProfileError("Il display name può contenere solo lettere e numeri.");
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
        bio: nextBio,
        joinedAt,
        profileImageUrl,
        profileImageBgColor,
      };

      await set(ref(db, `users/${user.uid}/publicProfile`), nextSettings);
      await set(ref(db, `publicProfiles/${normalizedNickname}`), {
        uid: user.uid,
        username: normalizedNickname,
        displayName: trimmedDisplayName,
        bio: nextBio,
        joinedAt,
        profileImageUrl,
        profileImageBgColor,
      });

      if (normalizedNickname !== currentUsername) {
        await remove(ref(db, `publicProfiles/${currentUsername}`));
      }

      setOwnProfileSettings(nextSettings);
      setEditDisplayName(trimmedDisplayName);
      setEditNickname(normalizedNickname);
      setBioDraft(nextBio);

      if (typeof window !== "undefined" && profileSettingsCacheKey) {
        try {
          window.localStorage.setItem(profileSettingsCacheKey, JSON.stringify(nextSettings));
        } catch {
          // ignore storage write errors
        }
      }

      setProfileMessage("Profilo aggiornato con successo.");
    } catch {
      setProfileError("Non sono riuscito a salvare il profilo. Riprova.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSelectProfileImage = (spriteUrl: string | null) => {
    setProfileError(null);
    setProfileMessage(null);
    setProfileImageUrl(spriteUrl);

    setProfileMessage("Immagine profilo aggiornata localmente. Premi “Salva modifiche” per confermare.");
    setIsAvatarPickerOpen(false);
  };

  const handleSelectProfileBackgroundColor = (nextColor: string) => {
    setProfileError(null);
    setProfileMessage(null);
    setProfileImageBgColor(nextColor);

    setProfileMessage("Colore sfondo aggiornato localmente. Premi “Salva modifiche” per confermare.");
  };

  const handleApplyHexBackgroundColor = () => {
    const normalizedHex = profileImageHexInput.trim();
    const isValidHex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(normalizedHex);

    if (!isValidHex) {
      setProfileError("Codice HEX non valido. Usa formato #RGB o #RRGGBB (es: #e50914).");
      return;
    }

    void handleSelectProfileBackgroundColor(normalizedHex.toLowerCase());
  };

  useEffect(() => {
    setProfileImageHexInput(profileImageBgColor);
  }, [profileImageBgColor]);

  const savePrivacyAndSecurityPrefs = async () => {
    if (!user || !db) return;
    const username = ownProfileSettings?.username || getUserSlug(user.email);
    const display = ownProfileSettings?.displayName || ownDisplayName;
    const joinedAt = ownProfileSettings?.joinedAt ?? user.metadata.creationTime ?? null;

    setSecurityError(null);
    setSecurityMessage(null);

    setIsSavingSecurity(true);

    try {
      await update(ref(db, `users/${user.uid}/publicProfile`), {});

      setOwnProfileSettings((prev) => ({
        ...prev,
        username,
        displayName: display,
        joinedAt,
      }));
      setSecurityMessage("Impostazioni di sicurezza aggiornate.");
    } catch {
      setSecurityError("Impossibile salvare le impostazioni di sicurezza.");
    } finally {
      setIsSavingSecurity(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!user || !auth) return;

    if (!newEmail.trim()) {
      setEmailSecurityMessage(null);
      setEmailSecurityError("Inserisci una nuova email.");
      return;
    }

    if (!emailCurrentPassword.trim()) {
      setEmailSecurityMessage(null);
      setEmailSecurityError("Inserisci la password corrente per cambiare email.");
      return;
    }

    setEmailSecurityError(null);
    setEmailSecurityMessage(null);
    setIsSavingSecurity(true);

    try {
      const credential = EmailAuthProvider.credential(user.email ?? "", emailCurrentPassword);
      await reauthenticateWithCredential(user, credential);
      await verifyBeforeUpdateEmail(user, newEmail.trim());
      setEmailSecurityMessage("Ti ho inviato un link di verifica alla nuova email. Conferma il link per completare la modifica.");
      setEmailCurrentPassword("");
      setNewEmail("");
    } catch {
      setEmailSecurityError("Impossibile inviare la verifica email. Controlla password corrente e nuova email.");
    } finally {
      setIsSavingSecurity(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user || !user.email) return;

    if (!passwordCurrentPassword.trim()) {
      setPasswordSecurityError("Inserisci la password corrente per cambiare la password.");
      return;
    }

    if (!newPassword.trim()) {
      setPasswordSecurityError("Inserisci una nuova password.");
      return;
    }

    if (newPassword.trim().length < 6) {
      setPasswordSecurityError("La nuova password deve avere almeno 6 caratteri.");
      return;
    }

    setPasswordSecurityError(null);
    setPasswordSecurityMessage(null);
    setIsSavingSecurity(true);

    try {
      const credential = EmailAuthProvider.credential(user.email, passwordCurrentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword.trim());
      setPasswordSecurityMessage("Password aggiornata con successo.");
      setPasswordCurrentPassword("");
      setNewPassword("");
    } catch {
      setPasswordSecurityError("Impossibile cambiare password. Controlla password corrente e riprova.");
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

  const handleToggleEmailEditor = () => {
    setShowEmailEditor((prev) => !prev);
  };

  const handleTogglePasswordEditor = () => {
    setShowPasswordEditor((prev) => !prev);
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

  const handleDisplayNameInputChange = (value: string) => {
    const normalized = normalizeDisplayName(value);
    setEditDisplayName(normalized);

    if (normalized !== value) {
      setProfileInputError("Display name: puoi usare solo lettere e numeri (niente spazi o simboli). Max 24 caratteri.");
      return;
    }

    setProfileInputError(null);
  };

  const handleNicknameInputChange = (value: string) => {
    const normalized = normalizeNickname(value);
    setEditNickname(normalized);

    if (normalized !== value) {
      setProfileInputError("Nickname: puoi usare solo lettere e numeri (niente spazi o simboli). Max 24 caratteri.");
      return;
    }

    setProfileInputError(null);
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

  const badgeSeasonCards = useMemo(
    () =>
      ASH_BADGE_SEASON_CARDS.map((card) => {
        const badges = card.badges.map((badge) => ({
          ...badge,
          imageUrl: getBadgeImageUrl(badge),
          unlocked: watchedStats.episodesWatched >= badge.animeEpisode,
          description: `Sblocco episodio anime ${badge.animeEpisode}.`,
        }));

        const unlockedCount = badges.filter((badge) => badge.unlocked).length;

        return {
          ...card,
          badges,
          unlockedCount,
          totalCount: badges.length,
          progressPercent: badges.length > 0 ? (unlockedCount / badges.length) * 100 : 0,
        };
      }),
    [watchedStats.episodesWatched]
  );

  const unlockedBadgesCount = badgeSeasonCards.reduce((sum, card) => sum + card.unlockedCount, 0);
  const totalBadgesCount = badgeSeasonCards.reduce((sum, card) => sum + card.totalCount, 0);
  const badgeProgressPercent = totalBadgesCount > 0 ? (unlockedBadgesCount / totalBadgesCount) * 100 : 0;
  const selectedBadgeRegion = useMemo(
    () => badgeSeasonCards.find((card) => card.key === selectedBadgeRegionKey) ?? null,
    [badgeSeasonCards, selectedBadgeRegionKey]
  );

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
  const searchValue = avatarSearchQuery.trim().toLowerCase();
  const filteredItemSprites = itemSprites.filter((sprite) => {
    if (!searchValue) return true;
    return sprite.name.toLowerCase().includes(searchValue);
  });
  const filteredBerrySprites = berrySprites.filter((sprite) => {
    if (!searchValue) return true;
    return sprite.name.toLowerCase().includes(searchValue);
  });
  function SpriteButton({
    sprite,
    isSelected,
    onSelect,
    disabled,
  }: {
    sprite: SpriteOption;
    isSelected: boolean;
    onSelect: (url: string) => void;
    disabled: boolean;
  }) {
    const [valid, setValid] = useState<boolean | null>(null);

    if (valid === false) return null;

    return (
      <button
        type="button"
        onClick={() => onSelect(sprite.imageUrl)}
        disabled={disabled}
        className={`group rounded border p-2 text-center transition ${
          isSelected
            ? "border-[#e50914] bg-[#e50914]/15"
            : "border-white/15 bg-black/25 hover:border-white/35 hover:bg-white/5"
        }`}
      >
        <img
          src={sprite.imageUrl}
          alt={sprite.name}
          loading="lazy"
          className="mx-auto h-12 w-12 object-contain sm:h-14 sm:w-14"
          onLoad={() => setValid(true)}
          onError={() => setValid(false)}
        />
        <p className="mt-1 line-clamp-1 text-[10px] font-semibold text-white/75 group-hover:text-white">
          {formatSpriteLabel(sprite.name)}
        </p>
      </button>
    );
  }

  const activeAvatarSprites =
    avatarCategory === "pokemon"
      ? searchValue
        ? pokemonSearchResults
        : pokemonSprites
      : avatarCategory === "items"
        ? filteredItemSprites
        : filteredBerrySprites;
  const avatarPickerModal = isAvatarPickerOpen ? (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/75 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      onClick={() => setIsAvatarPickerOpen(false)}
    >
      <div
        className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-md border border-white/15 bg-[#181818] shadow-2xl shadow-black/70"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/55">Immagine profilo</p>
            <h3 className="text-lg font-black sm:text-xl">Scegli uno sprite da PokéAPI</h3>
          </div>
          <button
            type="button"
            onClick={() => setIsAvatarPickerOpen(false)}
            className="rounded border border-white/20 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10"
          >
            Chiudi
          </button>
        </div>

        <div className="border-b border-white/10 px-4 py-3 sm:px-5">
          <div className="flex flex-wrap gap-2">
            {([
              ["pokemon", "Pokémon"],
              ["items", "Oggetti"],
              ["berries", "Bacche"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setAvatarCategory(key)}
                className={`rounded border px-3 py-1.5 text-xs font-semibold transition ${
                  avatarCategory === key
                    ? "border-[#e50914] bg-[#e50914]/20 text-white"
                    : "border-white/20 text-white/80 hover:bg-white/10"
                }`}
              >
                {label}
              </button>
            ))}

            <input
              type="text"
              value={avatarSearchQuery}
              onChange={(event) => setAvatarSearchQuery(event.target.value)}
              placeholder={
                avatarCategory === "pokemon"
                  ? "Cerca Pokémon (nome o Pokédex ID)"
                  : avatarCategory === "items"
                    ? "Cerca oggetto"
                    : "Cerca bacca"
              }
              className="min-w-56 flex-1 rounded border border-white/20 bg-black/30 px-3 py-1.5 text-xs text-white outline-none ring-[#e50914] focus:ring-1"
            />

            <button
              type="button"
              onClick={() => void handleSelectProfileImage(null)}
              className="rounded border border-rose-400/35 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20"
            >
              Rimuovi immagine
            </button>

            <div className="flex items-center gap-2 rounded border border-white/10 bg-black/20 px-2 py-1">
              <input
                type="color"
                value={profileImageBgColor}
                onChange={(event) => void handleSelectProfileBackgroundColor(event.target.value)}
                disabled={isSavingProfileBackground}
                className="h-5 w-7 rounded border border-white/30 bg-transparent p-0"
              />
              <input
                type="text"
                value={profileImageHexInput}
                onChange={(event) => setProfileImageHexInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleApplyHexBackgroundColor();
                  }
                }}
                placeholder="#e50914"
                className="w-20 rounded border border-white/20 bg-black/30 px-2 py-1 text-[11px] text-white outline-none ring-[#e50914] focus:ring-1"
              />
              <button
                type="button"
                onClick={handleApplyHexBackgroundColor}
                className="rounded border border-white/20 px-2 py-1 text-[11px] font-semibold text-white/90 transition hover:bg-white/10"
              >
                HEX
              </button>
            </div>
          </div>
        </div>

        <div className="max-h-[62vh] overflow-y-auto p-4 sm:p-5">
          {avatarSpritesError ? <p className="text-sm text-rose-300">{avatarSpritesError}</p> : null}
          {isLoadingAvatarSprites ? <p className="text-sm text-white/70">Carico sprite da PokéAPI...</p> : null}
          {avatarCategory === "pokemon" && isSearchingPokemon ? <p className="text-sm text-white/70">Ricerca Pokémon...</p> : null}
          {avatarCategory === "pokemon" && pokemonSearchError ? <p className="text-sm text-rose-300">{pokemonSearchError}</p> : null}

          {!isLoadingAvatarSprites && !avatarSpritesError ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
              {activeAvatarSprites.map((sprite) => (
                <SpriteButton
                  key={sprite.id}
                  sprite={sprite}
                  isSelected={profileImageUrl === sprite.imageUrl}
                  onSelect={handleSelectProfileImage}
                  disabled={isSavingProfileImage}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  ) : null;

  if (manageMode) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#141414] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(229,9,20,.2),transparent_40%),radial-gradient(circle_at_90%_0%,rgba(255,255,255,.08),transparent_35%)]" />

        <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-300 items-center justify-between gap-4 px-4 py-4 sm:px-8">
            <div className="flex items-center gap-3">
              <Link href="/" aria-label="Vai alla home">
                <img src="../../logo.png" alt="PokéWatch" width={170} height={40} className="h-auto w-32.5 sm:w-42.5" />
              </Link>
              <span className="rounded bg-[#e50914] px-2.5 py-1 text-[10px] font-black tracking-[0.16em] text-white">SETTINGS</span>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/profile" className="rounded border border-white/20 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10">
                Torna al profilo
              </Link>
              <button
                type="button"
                onClick={() => void saveProfileBasics()}
                disabled={isSavingProfile || !hasUnsavedProfileChanges}
                className="rounded bg-[#e50914] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#f6121d] disabled:opacity-60"
              >
                {isSavingProfile ? "Salvataggio..." : "Salva modifiche"}
              </button>
            </div>
          </div>
        </header>

        <main className="relative z-10 mx-auto w-full max-w-300 space-y-5 px-4 py-7 sm:px-8 sm:py-10">
          <div className="rounded-md border border-white/10 bg-[#181818] p-3 sm:p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/50">Settings menu</p>
            <nav className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/profile/settings/profile"
                className={`rounded border px-3 py-2 text-sm transition ${settingsSection === "profile" ? "border-white/10 bg-white/5 font-semibold text-white" : "border-white/10 text-white/80 hover:bg-white/10"}`}
              >
                Profilo
              </Link>
              <Link
                href="/profile/settings/security"
                className={`rounded border px-3 py-2 text-sm transition ${settingsSection === "security" ? "border-white/10 bg-white/5 font-semibold text-white" : "border-white/10 text-white/80 hover:bg-white/10"}`}
              >
                Sicurezza & Privacy
              </Link>
            </nav>
          </div>

          <section className="space-y-5">
            {settingsSection === "profile" ? (
            <article id="identity" className="rounded-md border border-white/10 bg-[#181818] p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/60">Profile</p>
              <h1 className="mt-2 text-2xl font-black sm:text-3xl">Impostazioni profilo</h1>
              <p className="mt-2 text-sm text-white/70">Layout in stile creator dashboard: modifica identità, sicurezza e privacy in sezioni dedicate.</p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="text-xs text-white/70">
                  Display name
                  <div className="relative mt-1 rounded border border-white/20 bg-black/35 px-3 py-2">
                    <div className="flex items-center gap-2 pr-8">
                      <FaPen size={12} className="text-white/60" />
                      <input
                        value={editDisplayName}
                        onChange={(event) => handleDisplayNameInputChange(event.target.value)}
                        className="w-full bg-transparent text-sm font-semibold text-white outline-none"
                      />
                    </div>
                    {hasDisplayNameChange ? (
                      <button
                        type="button"
                        onClick={() => void saveProfileBasics("displayName")}
                        disabled={isSavingProfile}
                        aria-label="Salva display name"
                        className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded border border-white/25 bg-black/50 text-white transition hover:bg-white/10 disabled:opacity-60"
                      >
                        {isSavingProfile ? "..." : <FaSave size={12} />}
                      </button>
                    ) : null}
                  </div>
                </label>

                <label className="text-xs text-white/70">
                  Nickname
                  <div className="relative mt-1 rounded border border-white/20 bg-black/35 px-3 py-2">
                    <div className="flex items-center gap-2 pr-8">
                      <FaPen size={12} className="text-white/60" />
                      <span className="text-white/50">@</span>
                      <input
                        value={editNickname}
                        onChange={(event) => handleNicknameInputChange(event.target.value)}
                        className="w-full bg-transparent text-sm font-semibold text-white outline-none"
                      />
                    </div>
                    {hasNicknameChange ? (
                      <button
                        type="button"
                        onClick={() => void saveProfileBasics("nickname")}
                        disabled={isSavingProfile}
                        aria-label="Salva nickname"
                        className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded border border-white/25 bg-black/50 text-white transition hover:bg-white/10 disabled:opacity-60"
                      >
                        {isSavingProfile ? "..." : <FaSave size={12} />}
                      </button>
                    ) : null}
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
                  <div
                    className="mx-auto mt-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-white/25 text-xl font-black"
                    style={{ backgroundColor: profileImageBgColor }}
                  >
                    {profileImageUrl ? (
                      <img src={profileImageUrl} alt="Immagine profilo" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      displayName.charAt(0)
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAvatarPickerOpen(true)}
                    disabled={isSavingProfileImage}
                    className="mt-3 w-full rounded border border-white/20 px-3 py-2 text-xs font-semibold text-white/90 transition hover:bg-white/10"
                  >
                    {isSavingProfileImage ? "Salvataggio..." : "Cambia immagine"}
                  </button>
                </div>
              </div>

              {hasUnsavedProfileChanges ? (
                <p className="mt-3 text-xs text-amber-200">Hai modifiche non salvate: premi “Salva modifiche” per applicarle.</p>
              ) : null}

              {profileError ? <p className="mt-3 text-xs text-rose-300">{profileError}</p> : null}
              {profileInputError ? <p className="mt-3 text-xs text-amber-300">{profileInputError}</p> : null}
              {profileMessage ? <p className="mt-3 text-xs text-emerald-300">{profileMessage}</p> : null}
            </article>
            ) : null}

            {settingsSection === "security" ? (
            <article id="security" className="rounded-md border border-white/10 bg-[#181818] p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/55">Settings</p>
              <h1 className="mt-2 text-2xl font-black sm:text-3xl">Security</h1>
              <p className="mt-2 text-sm text-white/70">Impostazioni in stile Twitch classico: lista lineare con voce, descrizione e controllo a destra.</p>

              <section className="mt-6 overflow-hidden rounded border border-white/10 bg-black/25">
                <div className="border-b border-white/10 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">Accesso e account</p>
                </div>

                <div className="divide-y divide-white/10">
                  <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">Email</p>
                      <p className="mt-1 text-xs text-white/65">Indirizzo attuale: {maskEmail(user?.email)}. Puoi aggiornarlo con conferma password.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleEmailEditor}
                      className="rounded border border-white/20 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                    >
                      {showEmailEditor ? "Chiudi" : "Modifica"}
                    </button>
                  </div>

                  {showEmailEditor ? (
                    <div className="bg-black/20 px-4 py-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          type="email"
                          value={newEmail}
                          onChange={(event) => setNewEmail(event.target.value)}
                          placeholder="Nuova email"
                          className="w-full rounded border border-white/20 bg-black/35 px-3 py-2 text-sm text-white outline-none ring-[#e50914] focus:ring-1"
                        />
                        <input
                          type="password"
                          value={emailCurrentPassword}
                          onChange={(event) => setEmailCurrentPassword(event.target.value)}
                          placeholder="Password corrente"
                          className="w-full rounded border border-white/20 bg-black/35 px-3 py-2 text-sm text-white outline-none ring-[#e50914] focus:ring-1"
                        />
                      </div>
                      <div className="mt-3 flex justify-end">
                        <div className="w-full rounded border border-white/10 bg-black/20 p-2.5 text-[11px] text-white/70">
                          Per confermare la modifica, invieremo un link di verifica alla nuova email.
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="min-h-[1.1rem] text-left">
                          {emailSecurityError ? (
                            <p
                              className={`text-xs text-rose-300 transition-opacity duration-700 ${
                                isEmailSecurityErrorFading ? "opacity-0" : "opacity-100"
                              }`}
                            >
                              {emailSecurityError}
                            </p>
                          ) : null}
                          {!emailSecurityError && emailSecurityMessage ? (
                            <p
                              className={`text-xs text-emerald-300 transition-opacity duration-700 ${
                                isEmailSecurityMessageFading ? "opacity-0" : "opacity-100"
                              }`}
                            >
                              {emailSecurityMessage}
                            </p>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleChangeEmail()}
                          className="rounded border border-white/20 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                        >
                          Invia verifica email
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">Password</p>
                      <p className="mt-1 text-xs text-white/65">Cambia la password del tuo account per aumentare la sicurezza.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleTogglePasswordEditor}
                      className="rounded border border-white/20 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                    >
                      {showPasswordEditor ? "Chiudi" : "Modifica"}
                    </button>
                  </div>

                  {showPasswordEditor ? (
                    <div className="bg-black/20 px-4 py-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          type="password"
                          value={passwordCurrentPassword}
                          onChange={(event) => setPasswordCurrentPassword(event.target.value)}
                          placeholder="Password corrente"
                          className="w-full rounded border border-white/20 bg-black/35 px-3 py-2 text-sm text-white outline-none ring-[#e50914] focus:ring-1"
                        />
                        <div className="relative">
                          <input
                            type={showNewPasswordValue ? "text" : "password"}
                            value={newPassword}
                            onChange={(event) => setNewPassword(event.target.value)}
                            placeholder="Nuova password"
                            className="w-full rounded border border-white/20 bg-black/35 px-3 py-2 pr-10 text-sm text-white outline-none ring-[#e50914] focus:ring-1"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPasswordValue((prev) => !prev)}
                            aria-label={showNewPasswordValue ? "Nascondi password" : "Mostra password"}
                            className="absolute inset-y-0 right-0 flex items-center px-3 text-white/65 transition hover:text-white"
                          >
                            {showNewPasswordValue ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                          </button>
                        </div>
                      </div>
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() => router.push("/lost")}
                          className="text-xs font-medium text-white/75 underline underline-offset-2 transition hover:text-white"
                        >
                          Scordato la password?
                        </button>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="min-h-[1.1rem] text-left">
                          {passwordSecurityError ? (
                            <p
                              className={`text-xs text-rose-300 transition-opacity duration-700 ${
                                isPasswordSecurityErrorFading ? "opacity-0" : "opacity-100"
                              }`}
                            >
                              {passwordSecurityError}
                            </p>
                          ) : null}
                          {!passwordSecurityError && passwordSecurityMessage ? (
                            <p
                              className={`text-xs text-emerald-300 transition-opacity duration-700 ${
                                isPasswordSecurityMessageFading ? "opacity-0" : "opacity-100"
                              }`}
                            >
                              {passwordSecurityMessage}
                            </p>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleChangePassword()}
                          className="rounded border border-white/20 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                        >
                          Cambia password
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">Google</p>
                      <p className="mt-1 text-xs text-white/65">Sincronizza o scollega il provider Google per l&apos;accesso rapido.</p>
                    </div>
                    {!isGoogleLinked ? (
                      <button
                        type="button"
                        onClick={() => void handleConnectGoogle()}
                        className="inline-flex items-center gap-2 rounded border border-white/25 bg-white/8 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/16"
                      >
                        <FcGoogle size={16} />
                        Sincronizza Google
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void handleDisconnectGoogle()}
                        className="inline-flex items-center gap-2 rounded border border-rose-400/35 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20"
                      >
                        <FcGoogle size={16} />
                        Scollega Google
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">Termina sessioni</p>
                      <p className="mt-1 text-xs text-white/65">Disconnetti tutte le sessioni e richiedi un nuovo login.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleSignOutEverywhere()}
                      className="rounded border border-white/20 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                    >
                      Termina sessioni
                    </button>
                  </div>
                </div>
              </section>

              <button
                type="button"
                onClick={() => void savePrivacyAndSecurityPrefs()}
                disabled={isSavingSecurity}
                className="mt-4 rounded bg-[#e50914] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#f6121d] disabled:opacity-60"
              >
                {isSavingSecurity ? "Salvataggio..." : "Salva impostazioni sicurezza"}
              </button>
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

        {avatarPickerModal}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#141414] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(229,9,20,.22),transparent_42%),radial-gradient(circle_at_80%_0%,rgba(115,115,115,.18),transparent_38%)]" />

      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-375 flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-8 sm:py-4">
          <div className="flex items-center gap-2.5 sm:gap-4">
            <Link href="/" aria-label="Vai alla home">
              <Image src="./logo.png" alt="PokéWatch" width={180} height={42} className="h-auto w-30.5 sm:w-45" priority />
            </Link>
            <span className="rounded bg-[#e50914] px-2.5 py-1 text-[10px] font-black tracking-[0.18em] text-white shadow-[0_0_14px_rgba(229,9,20,.45)]">
              PROFILE
            </span>
          </div>

          <nav className="mobile-top-nav order-3 flex w-full items-center gap-4 overflow-x-auto whitespace-nowrap text-[11px] uppercase tracking-widest text-white/70 sm:order-0 sm:w-auto sm:gap-6 sm:text-xs">
            <Link href="/" className="transition hover:text-white">Home</Link>
            <a href="#" className="transition hover:text-white">Serie TV</a>
            <a href="#" className="transition hover:text-white">Nuovi arrivi</a>
            <Link href="/profile" className="font-bold text-white">Profilo</Link>
          </nav>

          <AuthHeaderActions />
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-375 px-4 py-8 sm:px-8 sm:py-10">
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
                <div className="absolute inset-0 bg-linear-to-t from-[#181818] via-transparent to-transparent" />
              </div>

              <div className="relative px-5 pb-6 pt-10 sm:px-8 sm:pb-8 sm:pt-12">
                <div
                  className="absolute -top-12 left-1/2 flex h-24 w-24 -translate-x-1/2 items-center justify-center overflow-hidden rounded border border-white/20 text-4xl font-black text-white shadow-xl sm:h-28 sm:w-28"
                  style={{ backgroundColor: profileImageBgColor }}
                >
                  {profileImageUrl ? (
                    <img src={profileImageUrl} alt="Immagine profilo" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    displayName.charAt(0)
                  )}
                </div>

                <div className="flex flex-col items-center gap-4 pt-12 text-center sm:pt-10">
                  <div>
                    {!readOnly && isEditMode ? (
                      <div className="space-y-2">
                        <div className="mx-auto flex w-full max-w-[320px] items-center gap-2 rounded border border-white/20 bg-black/35 px-3 py-2">
                          <FaPen size={12} className="shrink-0 text-white/65" />
                          <input
                            value={editDisplayName}
                            onChange={(event) => handleDisplayNameInputChange(event.target.value)}
                            className="w-full bg-transparent text-center text-2xl font-black tracking-tight text-white outline-none sm:text-3xl"
                          />
                        </div>
                        <div className="mx-auto flex max-w-[320px] items-center justify-center gap-2 rounded border border-white/20 bg-black/35 px-3 py-2">
                          <FaPen size={12} className="shrink-0 text-white/65" />
                          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">@</span>
                          <input
                            value={editNickname}
                            onChange={(event) => handleNicknameInputChange(event.target.value)}
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
                      Join day: {formatJoinDay(joinDaySource)}
                    </p>
                    {readOnly ? null : (
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {!manageMode ? (
                          <Link href="/profile/settings" className="rounded bg-[#e50914] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#f6121d]">
                            Impostazioni
                          </Link>
                        ) : (
                          <Link href="/profile" className="rounded bg-[#e50914] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#f6121d]">
                            Chiudi modifica
                          </Link>
                        )}
                        {manageMode ? (
                          <button
                            type="button"
                            onClick={() => void saveProfileBasics()}
                            disabled={isSavingProfile || !hasUnsavedProfileChanges}
                            className="rounded border border-white/25 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
                          >
                            {isSavingProfile ? "Salvataggio..." : "Salva modifiche"}
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
                      value={emailCurrentPassword}
                      onChange={(event) => setEmailCurrentPassword(event.target.value)}
                      className="mt-1 w-full rounded border border-white/20 bg-black/35 px-3 py-2 text-sm text-white outline-none ring-[#e50914] focus:ring-1"
                    />
                  </label>
                </div>

                <label className="mt-3 block text-xs text-white/70">
                  Nuova password
                  <div className="relative mt-1">
                    <input
                      type={showNewPasswordValue ? "text" : "password"}
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      className="w-full rounded border border-white/20 bg-black/35 px-3 py-2 pr-10 text-sm text-white outline-none ring-[#e50914] focus:ring-1"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPasswordValue((prev) => !prev)}
                      aria-label={showNewPasswordValue ? "Nascondi password" : "Mostra password"}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-white/65 transition hover:text-white"
                    >
                      {showNewPasswordValue ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                    </button>
                  </div>
                </label>

                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => router.push("/lost")}
                    className="text-xs font-medium text-white/75 underline underline-offset-2 transition hover:text-white"
                  >
                    Scordato la password?
                  </button>
                </div>

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

                {securityError ? (
                  <p
                    className={`mt-3 text-xs text-rose-300 transition-opacity duration-700 ${
                      isSecurityErrorFading ? "opacity-0" : "opacity-100"
                    }`}
                  >
                    {securityError}
                  </p>
                ) : null}
                {securityMessage ? (
                  <p
                    className={`mt-3 text-xs text-emerald-300 transition-opacity duration-700 ${
                      isSecurityMessageFading ? "opacity-0" : "opacity-100"
                    }`}
                  >
                    {securityMessage}
                  </p>
                ) : null}

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
                    <p className="mt-2 text-sm text-white/90">Gestisci email, password, reset credenziali e collegamento Google.</p>
                  </article>
                  <article className="rounded border border-white/15 bg-black/25 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">Privacy</p>
                    <p className="mt-2 text-sm text-white/90">Controlla visibilità profilo e join day per decidere cosa mostrare pubblicamente.</p>
                  </article>
                </div>
              </section>
            ) : (
            <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
              <article className="rounded-md border border-white/10 bg-[#181818] p-5 sm:p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-white">Distribuzione contenuti</p>
                <p className="mt-1 text-xs text-slate-300">Percentuale episodi guardati per tipologia.</p>
                <div className="mt-3 h-px w-full bg-linear-to-r from-transparent via-white/20 to-transparent" />

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
                    <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-linear-to-r from-[#181818] via-[#181818]/80 to-transparent" />
                    <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-linear-to-l from-[#181818] via-[#181818]/80 to-transparent" />

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
                          className="group relative flex min-h-82.5 flex-col overflow-hidden rounded border border-white/10 bg-[#111] text-left transition duration-300 hover:scale-[1.02] hover:border-white/35"
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
                            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-black/10" />
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
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-white">Stagioni medaglie (PokéAPI)</p>
                <p className="mt-1 text-xs text-slate-300">Una card per ogni stagione/lega medaglie di Ash.</p>
                <div className="mt-3 h-px w-full bg-linear-to-r from-transparent via-white/20 to-transparent" />

                <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {badgeSeasonCards.map((card) => (
                    <button
                      key={card.key}
                      type="button"
                      onClick={() => setSelectedBadgeRegionKey(card.key)}
                      className="rounded border border-white/10 bg-black/25 p-2.5 text-left transition hover:border-white/25 hover:bg-black/40"
                    >
                      <p className="text-sm font-bold text-white">{card.title}</p>
                      <p className="mt-0.5 text-[10px] text-white/60">{card.unlockedCount}/{card.totalCount} sbloccati</p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-[#e50914]" style={{ width: `${card.progressPercent}%` }} />
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-6 rounded border border-white/15 bg-black/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Progressione badge</p>
                  <p className="mt-2 text-sm text-white/90">{unlockedBadgesCount} / {totalBadgesCount} badge sbloccati</p>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-linear-to-r from-[#e50914] to-[#ff5a5f]" style={{ width: `${badgeProgressPercent}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-slate-300">Continua a guardare per sbloccare gli altri avanzamenti.</p>
                </div>
              </article>
            </div>
            )}
          </div>
        )}
      </main>

      {avatarPickerModal}

      {selectedBadgeRegion ? (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedBadgeRegionKey(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-md border border-white/15 bg-[#181818] shadow-2xl shadow-black/60"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/60">Regione</p>
                <h3 className="text-xl font-black text-white">{selectedBadgeRegion.title}</h3>
                <p className="text-xs text-white/65">{selectedBadgeRegion.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBadgeRegionKey(null)}
                className="rounded border border-white/20 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10"
              >
                Chiudi
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-4 sm:p-5">
              <div className="grid gap-2 sm:grid-cols-2">
                {selectedBadgeRegion.badges.map((badge) => (
                  <div
                    key={badge.key}
                    className={`rounded border p-2.5 ${badge.unlocked ? "border-emerald-400/35 bg-emerald-500/10" : "border-white/10 bg-black/25"}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <img
                        src={badge.imageUrl}
                        alt={badge.title}
                        loading="lazy"
                        className="h-8 w-8 rounded bg-black/40 p-1 object-contain"
                        onError={(event) => {
                          const target = event.currentTarget;
                          const fallback = getPokeApiItemSpriteUrl("poke-ball");
                          if (target.src !== fallback) target.src = fallback;
                        }}
                      />
                      <div>
                        <p className="text-xs font-bold text-white">{badge.title}</p>
                        <p className="mt-0.5 text-[10px] text-white/55">{badge.city}</p>
                        <p className="mt-0.5 text-[10px] text-white/70">{badge.description}</p>
                      </div>
                    </div>
                    <p className={`mt-2 text-[10px] font-semibold uppercase tracking-wide ${badge.unlocked ? "text-emerald-300" : "text-white/50"}`}>
                      {badge.unlocked ? "Sbloccato" : "Bloccato"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {selectedSeasonDetail ? (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 p-3 sm:p-6"
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
              <div className="absolute inset-0 bg-linear-to-t from-black/45 via-black/10 to-transparent" />
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