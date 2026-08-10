# Production setup — Firebase Spark, Vercel OTP, Maps

Live site: https://mylocalvoice.in

**Firebase Spark plan:** Cloud Functions are not available. OTP and status SMS run on **Vercel serverless** (`/api/*`) so you can stay on Spark.

## 1. Firebase (Spark — live project)

1. Use project `mylocalvoice-a73f4`.
2. Put real web app keys in `.env` / Vercel (`VITE_FIREBASE_*`).
3. Set `VITE_USE_MOCK_DATA=false` and `VITE_USE_FIREBASE_EMULATOR=false`.
4. Set `VITE_USE_CLOUD_FUNCTIONS=false` (Spark).
5. Deploy rules only: `npx firebase deploy --only firestore:rules --project mylocalvoice-a73f4`

## 2. Vercel API — OTP + status SMS (Spark path)

| Route | Purpose |
|-------|---------|
| `POST /api/send-otp` | Generate OTP, send SMS, return HMAC proof |
| `POST /api/verify-otp` | Verify OTP + proof |
| `POST /api/notify-status` | SMS when complaint status changes |

Client uses these automatically in production when `VITE_USE_OTP_API` is true (default on Vercel sync).

### Server env on Vercel (not `VITE_*`)

| Variable | Notes |
|----------|--------|
| `OTP_SECRET` | Long random string (required in production) |
| `SMS_PROVIDER` | `console` (default) \| `fast2sms` \| `msg91` \| `twilio` |
| `SMS_API_KEY` | Fast2SMS / MSG91 |
| `SMS_TEMPLATE_ID` | MSG91 OTP template (DLT) |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM` | Twilio |

With `SMS_PROVIDER=console`, OTP works and the app may show a **demo code**. Real providers do not return `demoCode`.

### Client env on Vercel

```
VITE_USE_MOCK_DATA=false
VITE_USE_FIREBASE_EMULATOR=false
VITE_USE_CLOUD_FUNCTIONS=false
VITE_USE_OTP_API=true
```

Plus all `VITE_FIREBASE_*`, `VITE_VILLAGE_ID`, `VITE_GOOGLE_MAPS_API_KEY`.

## 3. Google Maps

1. Enable Maps JavaScript API; create an API key.
2. Restrict by HTTP referrer: `https://mylocalvoice.in/*`, localhost as needed.
3. Set `VITE_GOOGLE_MAPS_API_KEY` on Vercel.

## 4. Optional: Firebase Cloud Functions (Blaze only)

The `functions/` folder remains for later if you upgrade to Blaze. Set `VITE_USE_CLOUD_FUNCTIONS=true` and deploy with `npm run functions:deploy`. Not required on Spark.

## 5. Rollout order (Spark)

1. Firebase live + rules (already done).
2. Push app with Vercel `/api` routes; set `VITE_USE_OTP_API=true`.
3. Set `OTP_SECRET` + `SMS_PROVIDER=console` on Vercel → test OTP (demo code / logs).
4. Switch to Fast2SMS or MSG91 (DLT) for real SMS.
5. Add Google Maps key.
