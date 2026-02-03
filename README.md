# Udharo – सजिलो उधारो खाता

A simple digital khata (ledger) for Nepali shopkeepers to manage udharo (credit) and payments. Android-first, offline-first, Nepali UI.

## Setup

```bash
npm install
```

## Run

- **Android (Expo Go):** `npx expo start` then press `a`, or `npx expo start --android`
- **iOS:** `npx expo start` then press `i`
- **Development build:** `npx expo run:android` (requires Android SDK)

## Screens

1. **Splash** – App name and tagline; loads SQLite; auto-navigates to Home after ~1.5s
2. **Home** – Total receivables (कुल बाँकी रकम), action cards (ग्राहकहरू, उधारो, भुक्तानी, उधारो रिपोर्ट), footer with + FAB
3. **Customer list (ग्राहक सूची)** – Search, list with name/mobile/address/balance, tap → detail, FAB → add customer
4. **Customer detail (ग्राहक विवरण)** – Balance, Add Credit / Payment, transaction history, edit customer
5. **Add Credit / Payment** – Mode toggle (उधारो | भुक्तानी), amount, optional note, Save
6. **Add / Edit customer** – Name (required), mobile, address, note
7. **Credit reports (उधारो रिपोर्ट)** – Month/Year filter, total credits, total payments, net balance

## Stack

- React Native (Expo), TypeScript
- React Navigation (native stack), Zustand, AsyncStorage
- expo-sqlite (local DB), react-native-safe-area-context, react-native-gesture-handler

Data is stored only on device (offline-first). No backend in v1.

### Linting

````bash
npm run lint
npm run format```
````


### Building APK

```bash
npx eas-cli login
npx eas-cli build -p android --profile preview
npx eas-cli build -p android --local
npx eas-cli build -p android --profile production
```