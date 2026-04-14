"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithRedirect,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { get, ref, update } from "firebase/database";
import { auth, db, googleProvider, isFirebaseConfigured } from "@/app/lib/firebase";

function getUserSlug(email?: string | null) {
  return email?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9._-]/g, "") || "profile";
}

function getDisplayName(user: User) {
  if (user.displayName?.trim()) return user.displayName.trim();
  const fromEmail = user.email?.split("@")[0];
  return fromEmail ? fromEmail.charAt(0).toUpperCase() + fromEmail.slice(1) : "Allenatore PokéWatch";
}

type StoredPublicProfile = {
  username?: string;
  displayName?: string;
  joinedAt?: string | null;
  bio?: string;
  profileImageUrl?: string | null;
  profileImageBgColor?: string | null;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      queueMicrotask(() => setLoading(false));
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);

      if (nextUser && db) {
        void (async () => {
          const userPublicProfileRef = ref(db, `users/${nextUser.uid}/publicProfile`);
          const snapshot = await get(userPublicProfileRef);
          const stored = (snapshot.val() as StoredPublicProfile | null) ?? null;

          const username = stored?.username?.trim() || getUserSlug(nextUser.email);
          const displayName = stored?.displayName?.trim() || getDisplayName(nextUser);
          const joinedAt = stored?.joinedAt ?? nextUser.metadata.creationTime ?? null;
          const bio = stored?.bio ?? "";
          const profileImageUrl = stored?.profileImageUrl ?? null;
          const profileImageBgColor = stored?.profileImageBgColor ?? "#e50914";

          await update(userPublicProfileRef, {
            username,
            displayName,
            joinedAt,
            bio,
            profileImageUrl,
            profileImageBgColor,
          });

          await update(ref(db, `publicProfiles/${username}`), {
            uid: nextUser.uid,
            username,
            displayName,
            joinedAt,
            bio,
            profileImageUrl,
            profileImageBgColor,
          });
        })();
      }
    });

    return () => unsubscribe();
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    if (!auth || !isFirebaseConfigured) {
      throw new Error("Firebase non configurato");
    }

    await createUserWithEmailAndPassword(auth, email, password);
  }, []);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    if (!auth || !isFirebaseConfigured) {
      throw new Error("Firebase non configurato");
    }

    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    if (!auth || !isFirebaseConfigured) {
      throw new Error("Firebase non configurato");
    }

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      if (
        error instanceof FirebaseError &&
        (error.code === "auth/popup-blocked" ||
          error.code === "auth/cancelled-popup-request" ||
          error.code === "auth/popup-closed-by-user" ||
          error.code === "auth/internal-error")
      ) {
        await signInWithRedirect(auth, googleProvider);
        return;
      }

      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    if (!auth || !isFirebaseConfigured) {
      return;
    }

    await signOut(auth);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signUpWithEmail,
      loginWithEmail,
      loginWithGoogle,
      logout,
    }),
    [loading, loginWithEmail, loginWithGoogle, logout, signUpWithEmail, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
