# MyLocalVoice

Modern, responsive village issue-tracking platform for citizens and Panchayat administrators.

**Stack:** React · Vite · TypeScript · Tailwind CSS · React Router · React Hook Form · Firebase-ready · Recharts · Framer Motion · Lucide · i18n (English / Tamil) · PWA

## Quick start

```bash
cd "31/village project"
npm install
npm run dev
```

Open https://MyLocalVoice.in (or http://localhost:5173 in development)

### Daily workflow (laptop ↔ GitHub ↔ Vercel)

See **[WORKFLOW.md](./WORKFLOW.md)** for the start / finish checklist.

```bash
npm run sync          # start: pull latest from GitHub
npm run finish -- "…" # finish: commit + push (Vercel updates)
```

### Demo admin login

- Email: `admin@mylocalvoice.in`
- Password: `admin123`

## Features

### Public

- Home with hero, stats, announcements, recent complaints, map, testimonials
- Report issue (photos, voice record/upload, category, map/area pin)
- Duplicate detection with upvote / support existing complaints
- Track by Complaint ID, phone, or category
- Complaint details with workflow timeline, QR code, PDF download, comments
- Interactive village map (Google Maps when API key set; demo map otherwise)
- English / Tamil language toggle · Dark / light theme · PWA offline shell

### Admin

- Secure login · Dashboard charts · Statistics (screenshot-style UI)
- Filter / assign / update status · Internal notes · Activity log
- Excel / CSV export · Multi-village-ready data model

### Complaint workflow

`Submitted → Verified → Assigned → In Progress → Resolved → Closed`

IDs look like `TP-2026-00001`.

## Firebase setup

1. Copy `.env.example` to `.env`
2. Fill Firebase + Google Maps keys
3. Set `VITE_USE_MOCK_DATA=false`

Firestore structure supports multiple villages:

```
villages/{villageId}/complaints
villages/{villageId}/announcements
villages/{villageId}/activityLog
admins/{uid} → { villageId, role }
```

## Notifications architecture

`src/services/notifications.ts` defines SMS, WhatsApp, Email, and Push providers (console stubs). Swap in Twilio / MSG91 / Meta / SendGrid / FCM and trigger from Cloud Functions on status change.

## Scripts

| Command        | Description        |
| -------------- | ------------------ |
| `npm run sync` | Pull latest from GitHub (`main`) |
| `npm run finish -- "msg"` | Commit all changes and push to GitHub |
| `npm run dev`  | Development server |
| `npm run build`| Production build   |
| `npm run preview` | Preview build   |

## Folder structure

```
src/
  components/   # UI, layout, map, complaint widgets
  constants/    # Categories, statuses, village config
  contexts/     # Theme, auth, village
  data/         # Mock seed data
  i18n/         # EN / TA translations
  lib/          # Firebase init
  pages/        # Public + admin routes
  services/     # Complaints, export, notifications
  types/        # Shared TypeScript types
  utils/        # Helpers (duplicates, markers, etc.)
```
