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
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "@/app/lib/firebase";

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

    await signInWithPopup(auth, googleProvider);
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
