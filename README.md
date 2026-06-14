# Pixelwar MVP

Eine moderne interaktive Pixel-Wall-Webseite mit Next.js, React, TypeScript, TailwindCSS und Supabase.

## Features

- Landing Page im dunklen futuristischen Creative-Tech-Stil
- Supabase Auth mit Profilen, Username, Startguthaben 100 Coins / 0 Diamonds
- 1000 × 1000 HTML-Canvas mit Zoom, Pan, Pixel-Auswahl und Realtime-Updates
- Sichere Pixel-Aktionen über API-Routen und Supabase RPCs
- Preiszonen von 1 bis 5 Coins je nach Distanz zur Canvas-Mitte
- Coins, Diamonds, Pixel-Locks, Pixel-History und Report-Funktion
- Account-Seite mit eigenen Pixeln, Locked-Pixeln und Vorschau-Galerie
- Rewarded-Ads-Demo mit 10-Minuten-Cooldown
- Virtuelle Ingame-Börse ohne Echtgeldwert, Portfolio und simulierte Preise
- Leaderboards und Event-System-Vorbereitung

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Lege in `.env.local` deine Supabase-Werte ab:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=optional-for-future-admin-routes
NEXT_PUBLIC_ENABLE_TEST_TOOLS=true
```

Führe `supabase/schema.sql` im Supabase SQL Editor aus und aktiviere Realtime für `public.pixels`.

## Wichtiger Hinweis zur Börse

Die Börse ist eine reine Spielsimulation. Coins haben keinen Echtgeldwert, können nicht ausgezahlt werden und es gibt keine echten Zahlungen, keine Werbung, kein Casino, keine NFTs und keine Blockchain.
