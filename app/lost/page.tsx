"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/app/lib/firebase";

export default function LostPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSendReset = async () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setMessage("Inserisci la tua email.");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await sendPasswordResetEmail(auth, normalizedEmail);
      setMessage("Email di reset inviata. Controlla la tua casella di posta.");
    } catch {
      setMessage("Impossibile inviare l'email di reset. Controlla l'indirizzo e riprova.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#141414] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(229,9,20,.2),transparent_40%),radial-gradient(circle_at_85%_0%,rgba(255,255,255,.08),transparent_35%)]" />

      <header className="relative z-10 border-b border-white/10 bg-black/75 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-8">
          <Link href="/" aria-label="Vai alla home">
            <Image src="/logo.png" alt="PokéWatch" width={170} height={40} className="h-auto w-32 sm:w-42" priority />
          </Link>
          <span className="rounded bg-[#e50914] px-2.5 py-1 text-[10px] font-black tracking-[0.16em] text-white">RECOVERY</span>
        </div>
      </header>

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-5xl items-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-xl rounded-md border border-white/12 bg-[#181818] p-6 shadow-2xl shadow-black/60 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/55">Account</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Hai scordato la password?</h1>
          <p className="mt-2 text-sm text-white/70">Inserisci l'email del tuo account e ti invieremo il link per reimpostarla.</p>

          <div className="mt-6">
            <label htmlFor="lost-email" className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-white/70">
              Email
            </label>
            <input
              id="lost-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded border border-white/20 bg-black/35 px-3 py-2.5 text-sm text-white outline-none ring-[#e50914] focus:ring-1"
              placeholder="Inserisci la tua email"
            />
          </div>

          {message ? <p className="mt-3 text-sm text-white/85">{message}</p> : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded border border-white/25 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Torna alla home
            </Link>

            <button
              type="button"
              onClick={() => void handleSendReset()}
              disabled={loading}
              className="rounded bg-[#e50914] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#f6121d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Invio..." : "Manda email di reset"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
