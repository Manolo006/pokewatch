"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/app/components/AuthProvider";
import AuthHeaderActions from "@/app/components/AuthHeaderActions";

function formatDate(value?: string | null) {
  if (!value) return "Non disponibile";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Non disponibile";

  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getDisplayName(email?: string | null) {
  if (!email) return "Allenatore PokéWatch";
  return email.split("@")[0]?.toUpperCase() ?? "Allenatore PokéWatch";
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const displayName = getDisplayName(user?.email);

  const formatNumber = new Intl.NumberFormat("it-IT");
  const overviewItems = [
    { label: "Filler", entries: 26, color: "bg-rose-500", textColor: "text-rose-300" },
    { label: "Misto", entries: 18, color: "bg-amber-400", textColor: "text-amber-200" },
    { label: "Non-filler", entries: 61, color: "bg-emerald-500", textColor: "text-emerald-300" },
  ] as const;

  const totalEntries = overviewItems.reduce((sum, item) => sum + item.entries, 0);

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1500px] flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-8 sm:py-4">
          <div className="flex items-center gap-2.5 sm:gap-4">
            <Link href="/" aria-label="Vai alla home">
              <Image src="/logo.png" alt="PokéWatch" width={180} height={42} className="h-auto w-[122px] sm:w-[180px]" priority />
            </Link>
            <span className="rounded bg-yellow-400 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-black">ANIME</span>
          </div>

          <AuthHeaderActions />

          <nav className="mobile-top-nav order-3 flex w-full items-center gap-4 overflow-x-auto whitespace-nowrap text-[11px] text-white/80 sm:order-none sm:w-auto sm:gap-6 sm:text-sm">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <a href="#" className="hover:text-white">
              Serie
            </a>
            <a href="#" className="hover:text-white">
              Ultime aggiunte
            </a>
            <Link href="/profile" className="text-white">
              Profilo
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-8 sm:py-14">
          {loading ? (
            <p className="text-sm text-white/70">Caricamento profilo...</p>
          ) : !user ? (
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
          ) : (
            <div className="space-y-6">
              <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#09192d] shadow-[0_12px_45px_rgba(0,0,0,0.35)]">
                <div className="h-36 bg-[linear-gradient(135deg,#1b365b_0%,#112645_55%,#1f1b3d_100%)] sm:h-44" />

                <div className="relative border-t border-white/10 bg-[#0b2038] px-5 pb-5 pt-12 sm:px-7">
                  <div className="absolute -top-10 left-5 flex h-20 w-20 items-center justify-center rounded-md border-4 border-[#0b2038] bg-gradient-to-br from-rose-600 to-red-900 text-2xl font-black sm:left-7">
                    {displayName.charAt(0)}
                  </div>

                  <p className="text-2xl font-extrabold tracking-tight">{displayName}</p>
                  <p className="mt-1 text-sm text-slate-300">{user.email ?? "Email non disponibile"}</p>

                  <nav className="mt-5 flex gap-5 overflow-x-auto whitespace-nowrap border-t border-white/10 pt-3 text-sm text-slate-300">
                    <span className="font-semibold text-red-400">Overview</span>
                    <span className="opacity-75">Anime List</span>
                    <span className="opacity-75">Manga List</span>
                    <span className="opacity-75">Favorites</span>
                    <span className="opacity-75">Stats</span>
                    <span className="opacity-75">Social</span>
                  </nav>
                </div>
              </section>

              <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
                <article className="rounded-xl border border-white/10 bg-[#0c2038] p-5">
                  <p className="inline-block bg-slate-600/50 px-2 py-0.5 text-sm text-slate-200">Genre Overview</p>

                  <div className="mt-4 flex flex-wrap gap-2.5">
                    {overviewItems.map((item) => (
                      <div key={item.label} className="rounded-lg bg-[#152a46] p-2.5">
                        <p className={`rounded px-2 py-1 text-xs font-bold text-white ${item.color}`}>{item.label}</p>
                        <p className={`mt-2 text-center text-xl font-bold ${item.textColor}`}>{item.entries}</p>
                        <p className="text-center text-xs text-slate-300">Entry</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#11223a]">
                    {overviewItems.map((item) => (
                      <div
                        key={item.label}
                        className={`h-full ${item.color} float-left`}
                        style={{ width: `${(item.entries / totalEntries) * 100}%` }}
                      />
                    ))}
                  </div>
                </article>

                <article className="rounded-xl border border-white/10 bg-[#0c2038] p-5">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-lg bg-[#152a46] p-3 text-center">
                      <p className="text-xs text-slate-300">Total Anime</p>
                      <p className="mt-1 text-2xl font-bold text-red-400">{formatNumber.format(105)}</p>
                    </div>
                    <div className="rounded-lg bg-[#152a46] p-3 text-center">
                      <p className="text-xs text-slate-300">Days Watched</p>
                      <p className="mt-1 text-2xl font-bold text-sky-300">{formatNumber.format(14.7)}</p>
                    </div>
                    <div className="rounded-lg bg-[#152a46] p-3 text-center">
                      <p className="text-xs text-slate-300">Episodes Watched</p>
                      <p className="mt-1 text-2xl font-bold text-emerald-300">{formatNumber.format(487)}</p>
                    </div>
                    <div className="rounded-lg bg-[#152a46] p-3 text-center">
                      <p className="text-xs text-slate-300">Ultimo accesso</p>
                      <p className="mt-1 text-sm font-semibold text-white">{formatDate(user.metadata.lastSignInTime)}</p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <p className="text-sm font-semibold text-slate-200">Activity</p>

                    <div className="rounded-lg bg-[#152a46] p-3 text-sm text-slate-200">
                      Hai completato un arco <span className="font-semibold text-red-300">non-filler</span> con 12 episodi.
                    </div>

                    <div className="rounded-lg bg-[#152a46] p-3 text-sm text-slate-200">
                      Hai ripreso una stagione <span className="font-semibold text-amber-200">mista</span> per recuperare gli episodi principali.
                    </div>

                    <div className="rounded-lg bg-[#152a46] p-3 text-sm text-slate-200">
                      Hai saltato un blocco <span className="font-semibold text-rose-300">filler</span> e continuato la storia canonica.
                    </div>
                  </div>
                </article>
              </div>

              <div>
                <Link href="/" className="inline-flex rounded border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
                  Torna alla home
                </Link>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}