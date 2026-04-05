"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/app/components/AuthProvider";

export default function RegisterPage() {
  const router = useRouter();
  const { signUpWithEmail, loginWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleEmailRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage("Le password non coincidono.");
      return;
    }

    setLoading(true);

    try {
      await signUpWithEmail(email.trim(), password);
      router.push("/");
    } catch {
      setErrorMessage("Registrazione fallita. Verifica i dati e riprova.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setErrorMessage(null);
    setLoading(true);

    try {
      await loginWithGoogle();
      router.push("/");
    } catch (error) {
      console.error("Google register error:", error);
      setErrorMessage(
        error instanceof Error && error.message === "Firebase non configurato"
          ? "Firebase non configurato. Controlla le variabili ambiente della build."
          : "Registrazione con Google non riuscita. Riprova."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-12">
      <section className="w-full rounded-xl border border-white/10 bg-zinc-900 p-6 sm:p-8">
        <h1 className="text-2xl font-bold">Crea account</h1>
        <p className="mt-2 text-sm text-white/70">Registrati con email/password o con Google.</p>

        <form className="mt-6 space-y-4" onSubmit={handleEmailRegister}>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-white/80">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded border border-white/20 bg-black/30 px-3 py-2 text-sm outline-none ring-0 focus:border-white/40"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm text-white/80">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full rounded border border-white/20 bg-black/30 px-3 py-2 text-sm outline-none ring-0 focus:border-white/40"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-1 block text-sm text-white/80">
              Conferma password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              className="w-full rounded border border-white/20 bg-black/30 px-3 py-2 text-sm outline-none ring-0 focus:border-white/40"
            />
          </div>

          {errorMessage ? <p className="text-sm text-red-400">{errorMessage}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Registrazione in corso..." : "Registrati con email"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => void handleGoogleRegister()}
          disabled={loading}
          className="mt-3 w-full rounded border border-white/25 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Continua con Google
        </button>

        <p className="mt-5 text-sm text-white/70">
          Hai già un account?{" "}
          <Link href="/login" className="font-semibold text-white underline underline-offset-2">
            Accedi
          </Link>
        </p>
      </section>
    </main>
  );
}
