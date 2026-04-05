"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/app/components/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { loginWithEmail, loginWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleEmailLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      await loginWithEmail(email.trim(), password);
      router.push("/");
    } catch {
      setErrorMessage("Login fallito. Controlla email/password e riprova.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setLoading(true);

    try {
      await loginWithGoogle();
      router.push("/");
    } catch (error) {
      console.error("Google login error:", error);
      setErrorMessage(
        error instanceof Error && error.message === "Firebase non configurato"
          ? "Firebase non configurato. Controlla le variabili ambiente della build."
          : "Accesso con Google non riuscito. Riprova."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-12">
      <section className="w-full rounded-xl border border-white/10 bg-zinc-900 p-6 sm:p-8">
        <h1 className="text-2xl font-bold">Accedi</h1>
        <p className="mt-2 text-sm text-white/70">Entra con email/password o con Google.</p>

        <form className="mt-6 space-y-4" onSubmit={handleEmailLogin}>
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

          {errorMessage ? <p className="text-sm text-red-400">{errorMessage}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Accesso in corso..." : "Accedi con email"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => void handleGoogleLogin()}
          disabled={loading}
          className="mt-3 w-full rounded border border-white/25 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Continua con Google
        </button>

        <p className="mt-5 text-sm text-white/70">
          Non hai un account?{" "}
          <Link href="/register" className="font-semibold text-white underline underline-offset-2">
            Registrati
          </Link>
        </p>
      </section>
    </main>
  );
}
