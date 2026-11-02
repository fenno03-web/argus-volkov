# ARGUS Volkov

Live teamkaart voor airsoft. Elke kant (geel, rood, ...) ziet alleen zichzelf, meedoen met spelcode + codewoord.
Squads binnen een kant (bijv. Airsoft Boches) krijgen een eigen kleur.

**Stack:** Svelte 5 + Vite, MapLibre (Esri-satelliet / OpenStreetMap), Supabase (project ARGUS DEV, tabellen `volkov_*`,
alleen bereikbaar via RPC-functies met kant-token), Capacitor 8 voor iPhone en Android met GPS op de achtergrond.

## Functies (ronde 1)
- Spel maken of meedoen (spelcode, QR-uitnodiging, spellen in de buurt)
- Kanten met codewoord, squads en rollen
- Live posities met richting, batterij en "laatst gezien"
- Markers (vijand, objective, vlag, intel, rally, medic, gevaar, basis), lijnen, zones en no-go-zones
- Chat (iedereen of alleen squad), snelle alerts met trilling en gesproken melding
- GERAAKT / RESPAWN-knop
- Replay-timelapse van het spel
- Nachtmodus (rood), satelliet/kaart, NL/EN

## Ontwikkelen
```bash
npm install
npm run dev          # web-versie op http://localhost:5173
npm run build        # productie naar dist/
```

## iPhone bouwen (Mac + Xcode)
```bash
npm install
npm run build
npx cap sync ios
npx cap open ios     # Xcode: Signing & Capabilities -> jouw Team, dan Product -> Archive -> TestFlight
```

## Android bouwen (Android Studio)
```bash
npm install
npm run build
npx cap sync android
npx cap open android # Build -> Build APK(s)
```
Of zonder Android Studio-scherm: `cd android && ./gradlew assembleDebug` (APK in `android/app/build/outputs/apk/debug/`).

## Web-versie
Elke push naar `main` bouwt en publiceert naar GitHub Pages: https://fenno03-web.github.io/argus-volkov/
(eenmalig: repo Settings -> Pages -> Source: GitHub Actions).

Easter egg: tik 7x op het logo.
