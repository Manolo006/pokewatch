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
- Se vuoi, nel prossimo step posso aggiungere route protette (es. `/stagione/*` o tutta l'app tranne login/register).
