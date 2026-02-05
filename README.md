# उधारो (Udharo) – Simple Nepali Ledger

A Nepali‑first, offline‑first khata app for shopkeepers to manage **customers, credits, and payments** with clean reports, backup/restore, and PDFs.

---

## Highlights

- **Offline‑first**: all data stored locally in SQLite
- **Customers, Credits, Payments** (with due/expected payment date)
- **Reports** with filters (Today / Week / Month / Year)
- **PDF export** for customer detail + reports
- **Backup / Restore** (SQL export/import)
- **App Lock** (PIN + biometric)
- **Daily reminder notification**
- **Language toggle** (Nepali default, English optional)

---

## Tech Stack

- Expo (React Native) + TypeScript
- React Navigation (Native Stack)
- Zustand + AsyncStorage
- SQLite (`expo-sqlite`)
- Notifications, Print, Sharing, File System

---

## Setup

```bash
npm install
```

## Run (Development)

```bash
npx expo start
```

- Android (Expo Go): press `a` or use `npx expo start --android`
- iOS: press `i`

---

## Build

```bash
npx eas-cli login
npx eas-cli build -p android --profile preview   # APK for testing
npx eas-cli build -p android --profile production # AAB for Play Store
```

---

## Lint & Type Check

```bash
npm run lint
npx tsc -p tsconfig.json --noEmit
```

---

## Key Screens

- **Home**: total receivables, quick actions
- **Customers**: list, search, detail, add/edit
- **Credits / Payments**: add/edit, audit logs, due dates
- **Reports**: totals + export
- **Menu**: backup, language, support, lock settings, about

---

## Data & Privacy

- Data is stored **only on device**
- No backend in v1
- Backup/restore is manual via SQL file

---

## Release Guide

See `docs/release-guide.md` for:
- versioning
- database migration safety
- build + Play Store flow

---

If you want to contribute or extend features, see `TODO.md`.
