# Persuaid

AI copilot for live sales calls — **real-time transcription + “what to say next” coaching**.

**Authors:** [Bryce Zimmerman](https://github.com/brycezimmerman5), [Sebastian Borge](https://github.com/sebastianborge)

## Overview

Persuaid is a Next.js + Electron app that listens to a live call, shows a running transcript, and uses AI to generate **short, actionable responses** and **follow-up questions**. It’s built for **SDRs, AEs, and founders** who need help answering objections and staying on-message in the moment.

## Demo

- **Product screenshot:** _Add `./docs/assets/screenshot.png`_
- **Demo GIF/video:** _Add `./docs/assets/demo.gif`_ or a short Loom link

## Features

- **Live speech-to-text** during calls (Deepgram) with a transcript panel
- **Press Enter → “What to say”** (AI generates a 1–2 sentence response)
- **Follow-up question** generation (one question to ask next)
- **Notes panel** with:
  - import from saved notes
  - load from file (`.txt`, `.md`, and other text formats)
  - AI rewrite with selectable formatting styles
- **Transcript export** (default format configurable: `.txt` or `.md`)
- **Scripts / talking points** manager (Supabase) with paste-to-auto-format talking points
- **Desktop app packaging** (Electron + DMG build pipeline)

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend:** Next.js Route Handlers (API routes)
- **Auth & DB:** Supabase (auth + tables for notes/scripts)
- **AI / APIs:** OpenAI (`gpt-4o-mini`), Deepgram streaming STT
- **Desktop:** Electron + electron-builder (DMG, Windows NSIS, Linux AppImage)

## How It Works

1. **Audio capture:** The app records an audio input device you select (e.g., mic / Bluetooth / call capture device).
2. **Streaming STT:** Audio is streamed to Deepgram (`/api/stt/token` in web/dev; in-app proxy in the packaged desktop app).
3. **Transcript + context:** Transcript is stored in client state and shown live. Notes and scripts provide additional context.
4. **AI coaching:** On demand (Enter / Follow-up), the app calls the OpenAI-backed routes to generate a response.

## Getting Started

### Installation

```bash
npm install
```

### Environment Variables

Create `.env.local` in the repo root:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DEEPGRAM_API_KEY` (for STT token generation in dev/web)
- `OPENAI_API_KEY` (for AI follow-ups, rewrites, summaries)
- `SUPABASE_SERVICE_ROLE_KEY` (optional — enables delete-account API route)

### Running the Project (Web)

```bash
npm run dev
```

Open `http://localhost:3000`.

### Desktop (Electron)

Dev mode (hot reload):

```bash
npm run desktop:dev
```

Build DMG (macOS):

```bash
npm run desktop:build
```

#### Packaged Desktop App: API Keys

The packaged desktop app loads from the bundled static export (no Next server). Add keys here:

- macOS: `~/Library/Application Support/Persuaid/.env`
- Windows: `%APPDATA%\\Persuaid\\.env`

Example:

```bash
DEEPGRAM_API_KEY=...
OPENAI_API_KEY=...
```

## Project Structure

```
app/                  # Next.js routes, pages, API route handlers
components/           # UI and app components
  app/                # dashboard workspace, panels, settings components
  ui/                 # landing/pricing UI components
electron/             # Electron main process + in-app proxies
lib/                  # shared utilities (Supabase client, settings, helpers)
scripts/              # build helpers (STT proxy, clean scripts, desktop tooling)
```

## Future Improvements

- **True billing integration** (Stripe customer portal, invoices, subscription state)
- **Persist settings server-side** (Supabase profile/settings table) + multi-device sync
- **Better diarization UX** (assign speakers, confidence indicators, per-speaker coloring)
- **Transcript history** (save sessions to Supabase + searchable call library)
- **Better note generation** (structured notes from transcript with CRM export)

## Contributing

1. Fork the repo
2. Create a feature branch
3. Run the app locally (`npm run dev`)
4. Open a PR with a clear description and screenshots when relevant

## License

No license file is currently included in this repository. Add a `LICENSE` to clarify usage (MIT, Apache-2.0, or proprietary).  
