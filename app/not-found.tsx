import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#141414] px-6 text-white">
      <section className="w-full max-w-xl rounded-md border border-white/10 bg-[#181818] p-8 text-center shadow-2xl shadow-black/40">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#ff7f86]">404</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">Pagina non trovata</h1>
        <p className="mt-3 text-sm text-white/75 sm:text-base">
          Il link che hai aperto non esiste oppure non è disponibile.
        </p>

        <div className="mt-7 flex justify-center gap-3">
          <Link href="/" className="rounded bg-[#e50914] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#f6121d]">
            Torna alla home
          </Link>
          <Link href="/profile" className="rounded border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
            Vai al profilo
          </Link>
        </div>
      </section>
    </main>
  );
}
