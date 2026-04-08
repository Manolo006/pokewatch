import Link from "next/link";

export default function ContactUsPage() {
  return (
    <main className="mx-auto min-h-[calc(100vh-160px)] w-full max-w-3xl px-4 py-10 text-white sm:px-8 sm:py-14">
      <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Contact Us & Privacy</h1>

      <p className="mt-4 text-sm text-white/80 sm:text-base">
        Per domande, segnalazioni o richieste relative alla privacy, puoi contattarci tramite email.
      </p>

      <section className="mt-8 space-y-3 rounded-xl border border-white/15 bg-white/5 p-5">
        <h2 className="text-lg font-bold">Contatti</h2>
        <p className="text-sm text-white/80">
          Email: <a className="underline hover:text-white" href="mailto:privacy@pokewatch.com">privacy@pokewatch.com</a>
        </p>
      </section>

      <section className="mt-6 space-y-3 rounded-xl border border-white/15 bg-white/5 p-5">
        <h2 className="text-lg font-bold">Informativa Privacy (sintesi)</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-white/80">
          <li>Raccogliamo solo i dati necessari al funzionamento dell&apos;account e del servizio.</li>
          <li>I dati non vengono venduti a terze parti.</li>
          <li>Puoi richiedere aggiornamento o cancellazione dei tuoi dati in qualsiasi momento.</li>
        </ul>
      </section>

      <div className="mt-8">
        <Link href="/" className="text-sm font-semibold text-white/90 underline hover:text-white">
          Torna alla home
        </Link>
      </div>
    </main>
  );
}