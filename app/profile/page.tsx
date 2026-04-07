"use client";

import Link from "next/link";
import { useAuth } from "@/app/components/AuthProvider";

function formatDate(value?: string | null) {
  if (!value) return "Non disponibile";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Non disponibile";

  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function ProfilePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-12 sm:px-8">
        <p className="text-sm text-white/70">Caricamento profilo...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-12 sm:px-8">
        <section className="w-full max-w-xl rounded-2xl border border-white/10 bg-zinc-900/80 p-6 sm:p-8">
          <h1 className="text-2xl font-extrabold sm:text-3xl">Profilo</h1>
          <p className="mt-3 text-sm text-white/70">Devi effettuare l&apos;accesso per visualizzare i dati del tuo profilo.</p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/login"
              className="rounded bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              Vai al login
            </Link>
            <Link
              href="/"
              className="rounded border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Torna alla home
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#141414] text-white">
      <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-8 sm:py-14">
        <div className="rounded-2xl border border-white/10 bg-zinc-900/80 p-6 shadow-[0_12px_45px_rgba(0,0,0,0.35)] sm:p-8">
          <p className="text-xs font-bold tracking-[0.25em] text-white/60">ACCOUNT</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">Il tuo profilo</h1>
          <p className="mt-2 text-sm text-white/70">Gestisci e consulta le informazioni del tuo account PokéWatch.</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-wide text-white/50">Email</p>
              <p className="mt-1 break-all text-sm font-semibold text-white">{user.email ?? "Non disponibile"}</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-wide text-white/50">UID</p>
              <p className="mt-1 break-all text-xs text-white/90 sm:text-sm">{user.uid}</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-wide text-white/50">Account creato</p>
              <p className="mt-1 text-sm text-white/90">{formatDate(user.metadata.creationTime)}</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-wide text-white/50">Ultimo accesso</p>
              <p className="mt-1 text-sm text-white/90">{formatDate(user.metadata.lastSignInTime)}</p>
            </div>
          </div>

          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex rounded border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Torna alla home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}