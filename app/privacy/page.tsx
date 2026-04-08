import Link from "next/link";

export default function ContactUsPage() {
  return (
    <main className="mx-auto min-h-[calc(100vh-160px)] w-full max-w-3xl px-4 py-10 text-white sm:px-8 sm:py-14">
      <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Privacy</h1>

      <p className="mt-4 text-sm text-white/80 sm:text-base">
        Per domande, segnalazioni o richieste relative alla privacy, puoi contattarci tramite email.
      </p>

      <section className="mt-8 space-y-3 rounded-xl border border-white/15 bg-white/5 p-5">
        <h2 className="text-lg font-bold">Privacy</h2>
        <p className="text-sm text-white/80">
          Email:{" "}
          <a className="underline hover:text-white" href="mailto:privacy@pokewatch.com">
            privacy@pokewatch.com
          </a>
        </p>
      </section>

      <section className="mt-6 space-y-3 rounded-xl border border-white/15 bg-white/5 p-5">
        <h2 className="text-lg font-bold">Informativa Privacy (sintesi)</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-white/80">
          <li>Raccogliamo solo i dati necessari al funzionamento dell&apos;account e del servizio (es. email, username, numero di telefono).</li>
          <li>I dati vengono utilizzati esclusivamente per autenticazione, gestione dell&apos;account e sicurezza del servizio.</li>
          <li>I dati non vengono venduti a terze parti.</li>
          <li>I dati possono essere trattati tramite servizi esterni (es. Firebase) per il corretto funzionamento dell&apos;applicazione.</li>
          <li>I dati possono essere archiviati su server situati al di fuori dell&apos;Unione Europea.</li>
          <li>Puoi richiedere in qualsiasi momento accesso, modifica o cancellazione dei tuoi dati.</li>
          <li>I dati vengono conservati finché l&apos;account è attivo o fino a richiesta di eliminazione.</li>
          <li>Utilizziamo eventuali cookie tecnici necessari al funzionamento del servizio.</li>
          <li>Adottiamo misure di sicurezza per proteggere i dati da accessi non autorizzati.</li>
          <li>Ci riserviamo il diritto di aggiornare questa informativa in qualsiasi momento.</li>
          <li>Questo progetto è un&apos;iniziativa indipendente e non è ufficialmente affiliato a Nintendo o a qualsiasi altra società legata a Pokémon.</li>
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