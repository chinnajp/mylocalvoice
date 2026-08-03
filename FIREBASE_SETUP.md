# Firebase setup — MyLocalVoice

## Local (emulators) — works without a cloud project

```bash
npm install
npm run emulators          # terminal 1 — Auth :9099, Firestore :8080, Storage :9199, UI :4000
npm run seed:admin         # terminal 2 — creates admin@mylocalvoice.in / admin123
npm run dev                # terminal 2 — http://localhost:5173
```

Or one command after install:

```bash
npm run dev:firebase
```

Then in another terminal: `npm run seed:admin`

Confirm **Admin → Settings → Data mode: Firebase live**.

Emulator UI: http://127.0.0.1:4000

### Demo logins (seeded)

| Role      | Email                   | Password  |
|-----------|-------------------------|-----------|
| President | admin@mylocalvoice.in   | admin123  |
| Staff     | staff1@mylocalvoice.in  | staff123  |

## Production (Firebase cloud)

1. Create a project at https://console.firebase.google.com
2. Enable **Authentication → Email/Password**
3. Create **Firestore** (production mode; deploy rules below)
4. Enable **Storage**
5. Add a **Web app** and copy config into `.env`:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_USE_MOCK_DATA=false
VITE_USE_FIREBASE_EMULATOR=false
```

6. Login CLI and deploy rules:

```bash
npx firebase login
npx firebase use your_project_id
npm run firebase:deploy-rules
```

7. Seed admin (needs a service account JSON):

```bash
set GOOGLE_APPLICATION_CREDENTIALS=path\to\serviceAccount.json
set SEED_TARGET=cloud
set FIREBASE_PROJECT_ID=your_project_id
npm run seed:admin
```

Or manually: Auth → Add user, then Firestore doc `admins/{uid}`:

```json
{
  "email": "admin@mylocalvoice.in",
  "displayName": "Village President",
  "role": "president",
  "villageId": "thiruppair"
}
```

## Data model

```
villages/{villageId}/complaints/{id}
villages/{villageId}/activityLog/{id}
villages/{villageId}/meta/counters
admins/{uid}
```
