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

- **`DEEPGRAM_API_KEY`** – For live speech-to-text in the dashboard. Get a key at [Deepgram](https://deepgram.com/). Use a key with **Member or Owner** role in the Deepgram Console; restricted keys cannot create streaming tokens. If the token works but the connection still fails, create a **new key** in the Deepgram Console (old keys can be restricted or revoked). Required for real-time transcription when recording.
- **`OPENAI_API_KEY`** – For AI suggestions and “Take notes” from the transcript. Required for the AI Suggestions panel and the Take notes button.

See `supabase/README.md` for database migrations (scripts, notes, sessions).

### Desktop app (DMG) and Supabase

When building the desktop app or DMG (`npm run desktop:build` or `npm run pack`), the app loads the **static export** (no Next.js server). So:

- **Env vars:** Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are in `.env.local` when you run `next build`; they are baked into the static files so the DMG can talk to Supabase.
- **Supabase redirect URLs:** Add `http://127.0.0.1:2999` and `http://127.0.0.1:2999/**` to **Redirect URLs** in Supabase (Authentication → URL Configuration). The desktop app serves its UI from this origin; without it, token refresh fails and users get signed out shortly after login.
- The desktop app always loads from the bundle – no localhost. **`npm run desktop`** and the DMG both run the same bundled app. For hot reload use **`npm run desktop:dev`** (with **`npm run dev`** in another terminal).
- **DMG size:** The clean step also removes **`public/downloads/*.dmg`** (and other installers) before `next build`. Otherwise the Next.js export would put the previous DMG into `out/`, and the new DMG would package it — so the file would grow every build. After a build, the new DMG is copied to `public/downloads/Persuaid.dmg` for the website.
- **Cloud upload:** Upload only the built DMG, not the repo or `node_modules`. Paths: **`dist/*.dmg`** (or **`public/downloads/Persuaid.dmg`** after `desktop:build`). In CI, use **`npm run desktop:artifact`** to print the DMG path (e.g. `dist/Persuaid-0.1.0.dmg`).

### Microphone (Live Session) and Q&A

Live transcription (Q&A: speak, press Enter for an AI answer) needs microphone access and a way to reach Deepgram:

- **In the browser** (http://localhost:3000 with `npm run dev`): use the **STT WebSocket proxy** so the connection works: run **`npm run stt:proxy`** in another terminal, add **`NEXT_PUBLIC_STT_WS_PROXY=ws://localhost:3001`** to `.env.local`, restart dev, then try again.
- **With `npm run desktop:dev`** (and `npm run dev` in another terminal): same as browser; proxy recommended.
- **In the standalone DMG**: the app runs an **in-app STT proxy** so transcription works without a separate process. You must provide your API keys in a **`.env`** file:
  - **macOS:** Create **`~/Library/Application Support/Persuaid/.env`** (run the app once if the folder doesn’t exist). Add:
    - **`DEEPGRAM_API_KEY=your_key_here`** – for live transcription (mic + “Press Enter”).
    - **`OPENAI_API_KEY=sk-your_key_here`** – for “What to say” / “Questions to ask” / “Key points” (follow-up AI). Without this, you’ll see “Request failed. Try again.”
  - **Windows:** Same path: **`%APPDATA%\Persuaid\.env`** with the same keys.
  - Restart the app after editing `.env`. Then open the dashboard and use Q&A (mic + Enter) and follow-up suggestions as usual.
- **Mic permission:** On macOS, if you see “Microphone access denied”, open **System Settings → Privacy & Security → Microphone** and allow **Persuaid** (or **Electron** when running unpacked). If you launch from a terminal, the **terminal** may be prompted instead; run the built **Persuaid.app** from Finder so Persuaid gets the prompt.

## Project Structure

```
persuaid/
├── app/              # Next.js app directory
├── components/       # React components
│   └── ui/          # UI components
├── lib/             # Utility functions
└── styles/          # Global styles
```
