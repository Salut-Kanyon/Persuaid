# Persuaid

AI Copilot for Sales Calls - Say the right thing on every sales call.

## About

Persuaid is an AI-powered sales assistant that provides real-time guidance during sales conversations. It helps sales reps, founders, and closers know what to say in real time with live transcripts, AI suggestions, notes, and editable scripts.

## Tech Stack

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Environment variables

Create a `.env.local` file in the project root. In addition to your existing Supabase and Stripe keys:

- **`DEEPGRAM_API_KEY`** – For live speech-to-text in the dashboard. Get a key at [Deepgram](https://deepgram.com/). Use a key with **Member or Owner** role in the Deepgram Console; restricted keys cannot create streaming tokens. Required for real-time transcription when recording.
- **`OPENAI_API_KEY`** – For AI suggestions and “Take notes” from the transcript. Required for the AI Suggestions panel and the Take notes button.

See `supabase/README.md` for database migrations (scripts, notes, sessions).

### Desktop app (DMG) and Supabase

When building the desktop app or DMG (`npm run desktop:build` or `npm run pack`), the app loads the **static export** (no Next.js server). So:

- **Env vars:** Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are in `.env.local` when you run `next build`; they are baked into the static files so the DMG can talk to Supabase.
- **Supabase redirect URLs:** If you use OAuth or redirect-based auth, add your app origin to **Redirect URLs** in Supabase (Authentication → URL Configuration). The desktop app loads from `app://persuaid` (no localhost).
- The desktop app always loads from the bundle – no localhost. **`npm run desktop`** and the DMG both run the same bundled app. For hot reload use **`npm run desktop:dev`** (with **`npm run dev`** in another terminal).
- **DMG size:** The clean step also removes **`public/downloads/*.dmg`** (and other installers) before `next build`. Otherwise the Next.js export would put the previous DMG into `out/`, and the new DMG would package it — so the file would grow every build. After a build, the new DMG is copied to `public/downloads/Persuaid.dmg` for the website.
- **Cloud upload:** Upload only the built DMG, not the repo or `node_modules`. Paths: **`dist/*.dmg`** (or **`public/downloads/Persuaid.dmg`** after `desktop:build`). In CI, use **`npm run desktop:artifact`** to print the DMG path (e.g. `dist/Persuaid-0.1.0.dmg`).

### Microphone (Live Session)

Live transcription needs microphone access **and** the Next.js server (for the `/api/stt/token` and Deepgram flow). So:
- If you see **"Transcription connection failed. Check your network and try again."** in the browser, use the **STT WebSocket proxy**: in one terminal run **`npm run stt:proxy`**, add **`NEXT_PUBLIC_STT_WS_PROXY=ws://localhost:3001`** to `.env.local`, restart **`npm run dev`**, then try recording again. The proxy connects to Deepgram with your API key so the browser doesn’t need to.
- **In the browser** (http://localhost:3000 with `npm run dev`): transcription works.
- **With `npm run desktop:dev`** (and `npm run dev` in another terminal): transcription works.
- **In the standalone DMG**: the app has no API server, so transcription shows "Transcription isn't available in the standalone app" — use the browser or desktop:dev for live transcription. In the **desktop app (Electron)** on macOS, if you see “Microphone access denied”, open **System Settings → Privacy & Security → Microphone** and allow **Electron** (or **Persuaid** when running the built app). If you run from a terminal, macOS asks the **terminal** for mic access. To have **Persuaid** ask instead: run `npm run dev` in a terminal, then run `npm run pack` once and open **Persuaid.app** from `dist/mac-arm64` or `dist/mac` in Finder. The app will use the dev server (same as `npm run desktop:dev`) so the full app and mic work, and the mic prompt goes to Persuaid. Allow **Persuaid** in System Settings → Microphone.

## Project Structure

```
persuaid/
├── app/              # Next.js app directory
├── components/       # React components
│   └── ui/          # UI components
├── lib/             # Utility functions
└── styles/          # Global styles
```
