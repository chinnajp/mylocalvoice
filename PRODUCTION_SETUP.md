# Production setup — Firebase, OTP SMS, Maps

Live site: https://mylocalvoice.in

## 1. Firebase (live project)

1. Use project `mylocalvoice-a73f4` (or your production project).
2. Put real web app keys in `.env` / Vercel (`VITE_FIREBASE_*`).
3. Set `VITE_USE_MOCK_DATA=false` and `VITE_USE_FIREBASE_EMULATOR=false`.
4. Deploy rules: `npm run firebase:deploy-rules`
5. Deploy functions: `npm run functions:deploy`

Client OTP uses Cloud Functions when Firebase is live (unless `VITE_USE_CLOUD_FUNCTIONS=false`).

## 2. Cloud Functions — OTP + status SMS

Code lives in `functions/`:

| Function | Purpose |
|----------|---------|
| `sendCitizenOtp` | Callable — generate OTP, store hash, send SMS |
| `verifyCitizenOtp` | Callable — verify OTP |
| `onComplaintStatusChange` | Firestore trigger — SMS when status changes |

### SMS provider (server env only)

In Firebase Console → Functions → environment / secrets, or `functions/.env` for emulator:

| Variable | Notes |
|----------|--------|
| `SMS_PROVIDER` | `fast2sms` \| `msg91` \| `twilio` \| `console` (default) |
| `SMS_API_KEY` | Fast2SMS / MSG91 |
| `SMS_TEMPLATE_ID` | MSG91 OTP template (DLT) |
| `SMS_SENDER_ID` | Optional DLT sender |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM` | Twilio |

With `SMS_PROVIDER=console`, OTP still works; the app may show a **demo code** on screen. Real providers never return `demoCode` to the client.

### Deploy

```bash
cd functions && npm install && cd ..
firebase use mylocalvoice-a73f4   # or your project
npm run functions:deploy
```

### Local emulator

```bash
npm run emulators   # includes functions on :5001
npm run dev         # VITE_USE_FIREBASE_EMULATOR=true
```

## 3. Google Maps

1. Create a Maps JavaScript API key in Google Cloud Console.
2. Restrict by HTTP referrer: `https://mylocalvoice.in/*`, `http://localhost:5173/*`, etc.
3. Set `VITE_GOOGLE_MAPS_API_KEY` in `.env` and Vercel.
4. Sync to Vercel: include the key in `.env`, then `node scripts/sync-vercel-env.mjs` (script syncs Maps + Cloud Functions flag).

Without a key, the map UI falls back to a non-Google view.

## 4. Vercel checklist

- `VITE_USE_MOCK_DATA=false`
- `VITE_USE_FIREBASE_EMULATOR=false`
- `VITE_USE_CLOUD_FUNCTIONS=true` (recommended)
- All `VITE_FIREBASE_*` + `VITE_VILLAGE_ID` + `VITE_GOOGLE_MAPS_API_KEY`
- Redeploy after env changes

## 5. Recommended rollout order

1. Firebase live + rules deployed (complaints already persist).
2. Deploy functions with `SMS_PROVIDER=console` → test OTP via demo code / Functions logs.
3. Switch to Fast2SMS or MSG91 (DLT-compliant) for real OTP + status SMS.
4. Add Google Maps key on Vercel.
