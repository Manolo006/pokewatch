"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { get, ref } from "firebase/database";
import ProfilePage from "../page";
import { useAuth } from "@/app/components/AuthProvider";
import { db } from "@/app/lib/firebase";

type PublicProfileClientProps = {
  params: Promise<{ username: string }>;
};

type PublicProfileRecord = {
  uid?: string;
  username?: string;
  displayName?: string;
  joinedAt?: string | null;
  joinDayVisible?: boolean;
  profileVisibility?: "public" | "private";
};

function getUserSlug(email?: string | null) {
  return email?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9._-]/g, "") || "profile";
}

export default function PublicProfileClient({ params }: PublicProfileClientProps) {
  const { username } = use(params);
  const router = useRouter();
  const { user, loading } = useAuth();
  const [status, setStatus] = useState<"checking" | "ready" | "missing">(() => (db ? "checking" : "missing"));
  const [publicProfile, setPublicProfile] = useState<PublicProfileRecord | null>(null);

  const normalizedUsername = username.toLowerCase();
  const isOwnProfile = Boolean(user?.email && getUserSlug(user.email) === normalizedUsername);

  useEffect(() => {
    if (!db) return;

    const database = db;

    let active = true;

    const checkProfile = async () => {
      const profileSnapshot = await get(ref(database, `publicProfiles/${normalizedUsername}`));
      if (!active) return;

      if (!profileSnapshot.exists()) {
        setStatus("missing");
        return;
      }

      const profile = profileSnapshot.val() as PublicProfileRecord;
      if (!profile?.uid) {
        setStatus("missing");
        return;
      }

      setPublicProfile(profile);
      setStatus("ready");
    };

    void checkProfile();

    return () => {
      active = false;
    };
  }, [db, normalizedUsername]);

  useEffect(() => {
    if (status !== "missing") return;
    router.replace("/404");
  }, [router, status]);

  if (status === "checking" || loading) {
    return <div className="min-h-screen bg-[#141414] p-8 text-white/70">Verifica profilo...</div>;
  }

  if (status === "missing") {
    return <div className="min-h-screen bg-[#141414] p-8 text-white/70">Reindirizzamento...</div>;
  }

  if (isOwnProfile) {
    return <ProfilePage />;
  }

  return (
    <ProfilePage
      viewedUserId={publicProfile?.uid}
      publicDisplayName={publicProfile?.displayName}
      publicUsername={publicProfile?.username ?? normalizedUsername}
      publicJoinedAt={publicProfile?.joinedAt}
      publicJoinDayVisible={publicProfile?.joinDayVisible}
      publicProfileVisibility={publicProfile?.profileVisibility}
      readOnly
    />
  );
}
