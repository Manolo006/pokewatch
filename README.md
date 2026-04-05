# PokéWatch

Applicazione Next.js per consultare le stagioni Pokémon in stile catalogo.

## Avvio in locale

```bash
npm install
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000).

## Account Firebase (Email/Password + Google)

L'app include:

- pagina login: `/login`
- pagina registrazione: `/register`
- stato utente nel provider globale (`AuthProvider`)
- pulsanti login/logout nell'header home

### 1) Configura Firebase Console

Nel tuo progetto Firebase:

1. Vai su **Authentication → Sign-in method**
2. Abilita:
   - **Email/Password**
   - **Google**
3. In **Project settings → Your apps → Web app**, copia le credenziali.
4. In **Authentication → Settings → Authorized domains**, aggiungi:
   - `localhost`
   - `<tuo-username>.github.io` (dominio GitHub Pages)

### 2) Configura le variabili ambiente

Copia `.env.example` in `.env.local` e compila i valori:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### 3) Riavvia il server

Dopo aver aggiornato `.env.local`, riavvia:

```bash
npm run dev
```

## Note

- Al momento **nessuna route è protetta** (come richiesto).
- Su GitHub Pages, le variabili `.env` locali non vengono caricate automaticamente: imposta gli stessi valori in **GitHub → Settings → Secrets and variables → Actions → New repository secret** usando i nomi `NEXT_PUBLIC_FIREBASE_*`.
- Se vuoi, nel prossimo step posso aggiungere route protette (es. `/stagione/*` o tutta l'app tranne login/register).
