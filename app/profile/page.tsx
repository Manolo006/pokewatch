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

export default function ProfilePage() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <header className="border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1500px] flex-wrap items-center justify-between gap-3 px-3 py-2 sm:px-8 sm:py-3">
          <div className="flex items-center gap-2.5 sm:gap-4">
            <Link href="/" aria-label="Vai alla home">
              <Image src="./logo.png" alt="PokéWatch" width={180} height={42} className="h-auto w-[122px] sm:w-[180px]" priority />
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
            <div className="space-y-5">
              <section className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/70 shadow-[0_12px_45px_rgba(0,0,0,0.35)]">
                <div className="h-32 bg-[linear-gradient(120deg,#1e3a8a_0%,#0f172a_35%,#7c3aed_100%)] sm:h-40" />
                <div className="-mt-14 px-4 pb-5 sm:px-6 sm:pb-6">
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div className="flex items-end gap-3">
                      <div className="flex h-24 w-24 items-center justify-center rounded-xl border-4 border-zinc-900 bg-black/40 text-3xl font-black uppercase text-white sm:h-28 sm:w-28">
                        {user.email?.[0] ?? "P"}
                      </div>
                      <div>
                        <p className="text-xs font-bold tracking-[0.22em] text-white/60">PROFILE</p>
                        <h1 className="mt-1 text-xl font-black sm:text-2xl">{user.email ?? "Utente PokéWatch"}</h1>
                        <p className="mt-1 text-xs text-white/70">Allenatore attivo su PokéWatch</p>
                      </div>
                    </div>
                    <Link
                      href="/"
                      className="inline-flex rounded border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      Torna alla home
                    </Link>
                  </div>
                </div>
              </section>

              <div className="grid gap-5 lg:grid-cols-[290px_1fr]">
                <aside className="rounded-2xl border border-white/10 bg-zinc-900/70 p-5">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-white/80">Dettagli account</h2>
                  <dl className="mt-4 space-y-3 text-sm">
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-white/50">Email</dt>
                      <dd className="mt-1 break-all text-white/90">{user.email ?? "Non disponibile"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-white/50">UID</dt>
                      <dd className="mt-1 break-all text-white/90">{user.uid}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-white/50">Creato il</dt>
                      <dd className="mt-1 text-white/90">{formatDate(user.metadata.creationTime)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-white/50">Ultimo accesso</dt>
                      <dd className="mt-1 text-white/90">{formatDate(user.metadata.lastSignInTime)}</dd>
                    </div>
                  </dl>
                </aside>

                <div className="space-y-5">
                  <section className="rounded-2xl border border-white/10 bg-zinc-900/70 p-5 sm:p-6">
                    <h2 className="text-lg font-bold">Overview</h2>
                    <p className="mt-2 text-sm text-white/70">
                      Dashboard in stile AniList del tuo account. Qui puoi monitorare il tuo profilo e avere una panoramica rapida
                      del tuo ritmo di visione.
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                        <p className="text-xs uppercase tracking-wide text-white/50">Stagioni viste</p>
                        <p className="mt-1 text-2xl font-black">28</p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                        <p className="text-xs uppercase tracking-wide text-white/50">Episodi completati</p>
                        <p className="mt-1 text-2xl font-black">1,214</p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                        <p className="text-xs uppercase tracking-wide text-white/50">Ore guardate</p>
                        <p className="mt-1 text-2xl font-black">432h</p>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-white/10 bg-zinc-900/70 p-5 sm:p-6">
                    <h2 className="text-lg font-bold">Genre Overview</h2>
                    <p className="mt-2 text-sm text-white/70">Distribuzione episodi: filler, misto e non-filler.</p>

                    <div className="mt-4 space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-white/90">Non-filler</span>
                          <span className="text-white/70">62%</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full w-[62%] rounded-full bg-emerald-400" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-white/90">Misto</span>
                          <span className="text-white/70">21%</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full w-[21%] rounded-full bg-sky-400" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-white/90">Filler</span>
                          <span className="text-white/70">17%</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full w-[17%] rounded-full bg-fuchsia-400" />
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}