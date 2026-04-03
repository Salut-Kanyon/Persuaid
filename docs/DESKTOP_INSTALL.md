# Desktop app: install and auth → workspace

Persuaid already ships an **Electron** wrapper (`electron/main.js`) plus **electron-builder** scripts in `package.json`. The window starts at **`/welcome`**, then **Join now** → **`/sign-in`** (create account or sign in) → **`/dashboard`** (workspace) once Supabase has a session.

## 1. Try it without building an installer (recommended first)

Uses the **Next.js dev server** so all `/api/*` routes behave like the web app.

```bash
npm run desktop:dev
```

This runs **`next dev` in-process**, reads the **Local:** URL from its output for the real port (3000, 3001, …), then opens Electron to **`http://localhost:<port>/welcome`** with matching `NEXT_DEV_PORT` (same host as Next’s **Local:** line, so dev HMR / `/_next/*` are not treated as cross-origin).

- Ensure **`.env.local`** includes `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (same as web).
- The **dashboard** requires a normal signed-in user (`AuthGuard` redirects to `/sign-in` if there is no session). You do **not** need Anonymous sign-ins enabled.
- If **email confirmation** is required for sign-up, either disable it for your dev project or confirm the email before expecting a full session in the app.

**Terminal noise (normal):**

- **`quota_database.cc … Could not open the quota database`** — Chromium/Electron storage; usually harmless. If it repeats, quit other Persuaid/Electron instances or clear the app’s user-data folder.
- **`Cross origin request … 127.0.0.1 to /_next/*`** — Electron was loading **`127.0.0.1`** while Next’s dev URL is **`localhost`** (different origins). Current `electron/main.js` loads **`http://localhost:<port>/welcome`** in dev; if your log still shows `127.0.0.1`, restart after saving the latest `electron/main.js`.

**“I pressed Start Call and the terminal did X”**

- **Start Call** turns on the mic and opens the STT WebSocket (`ws://127.0.0.1:2998` in dev). That does **not** produce the big **“Compiling /…”** or **`GET /api/me/usage`** lines — those come from **Next** when you **load `/welcome` or `/dashboard`** (and when entitlements refetch).
- For **Start Call** problems (permission, no transcript, errors), open **DevTools → Console** (`npm run desktop:dev:inspect` or **View → Toggle Developer Tools**) and look for **`[STT]`** lines and red errors there — not the Next server terminal.

### Start Call checklist (Electron)

1. **macOS System Settings → Privacy & Security → Microphone** — **Persuaid** (or “Electron” during dev) must be allowed.
2. **`DEEPGRAM_API_KEY`** — Electron starts the STT relay on **`ws://127.0.0.1:2998`** when the key is loaded from **`.env.local`** (dev, project root) or **`~/Library/Application Support/Persuaid/.env`** (installed app). Terminal should show **`[STT] Proxy listening on ws://127.0.0.1:2998`**. If you only see “DEEPGRAM_API_KEY loaded: no”, Start Call cannot transcribe.
3. **`NEXT_PUBLIC_STT_PROXY_URL`** — Chooses the relay in the browser and in **packaged Electron** when set to a **non-loopback** URL (hosted `wss://…` or a LAN IP). The preload **`window.persuaid.sttProxyUrl`** (`ws://127.0.0.1:2998`) is used when the env URL is empty or loopback-only, or when Electron’s local proxy should win (e.g. `desktop:dev` with `DEEPGRAM_API_KEY`).
4. **Console** — After **Start Call**, you should see **`[STT] websocket open`**, then **`[STT] PCM capture via AudioWorklet`** and **`[STT] sending PCM bytes (AudioWorklet): …`** once you speak. (Older **ScriptProcessorNode** paths often never logged **`onaudioprocess`** in Electron; the app now prefers **`/stt-pcm-processor.js`**.) If **`Could not connect to the STT relay`**, port **2998** is blocked or the proxy did not start (see 2).

**During a call (dashboard):** **Start Call** hides the workspace behind a **frosted full-screen layer** and shows a **minimal glass pill** at the **top** (logo + end control). In **Electron**, the window also **shrinks** to a thin strip along the **top edge** and stays **on top** until you end the call.

## 2. Build a local `.app` / folder (no DMG)

```bash
npm run pack
```

Produces an unpacked app under `dist/` (for example `dist/mac-arm64/Persuaid.app` on Apple Silicon). Run it with:

```bash
npm run desktop:run
```

(or open the `.app` from Finder).

## 3. Build an installable DMG (macOS)

```bash
npm run desktop:build
```

This runs `build:desktop` (static export into `out/`), then **electron-builder**. A **`.dmg`** appears under `dist/` and is also copied to `public/downloads/Persuaid.dmg` when that step succeeds.

### Code signing and notarization (Gatekeeper “damaged”)

If macOS says the app **is damaged and can’t be opened**, the build was almost certainly **not notarized** (or not signed with your **Developer ID Application** identity).

1. **Signing** — Build on a Mac that has your **Apple Developer** certificate installed (**Keychain Access** → search for **Developer ID Application**). `electron-builder` picks it up automatically. Without it, you get an ad-hoc or invalid signature.

2. **Notarization** — After `desktop:build`, watch the terminal. Unless all of these are set when `electron-builder` runs, notarization is **skipped** (you’ll see a **WARNING** from `[notarize-macos]`):
   - `APPLE_ID` — your Apple ID email  
   - `APPLE_APP_SPECIFIC_PASSWORD` — **not** your normal password; create at [appleid.apple.com](https://appleid.apple.com) under **Sign-In and Security → App-Specific Passwords**  
   - `APPLE_TEAM_ID` — 10-character Team ID from [Apple Developer Membership](https://developer.apple.com/account)

   Export them in the shell before building, or use a tool that injects env for the command (`.env.local` is **not** automatically passed to the notarize script unless your tooling loads it).

3. **Partner / CI builds** — A DMG is only safe to ship if **that** build machine had the cert + the three `APPLE_*` variables and the log shows **notarization finished** without errors.

**Environment at build time:** `NEXT_PUBLIC_*` variables are **baked into the client** during `next build`. Put them in **`.env.local`** (or your CI env) before `desktop:build` so the packaged app talks to your Supabase project and, for **production live transcription without per-user Deepgram keys**, set **`NEXT_PUBLIC_STT_PROXY_URL=wss://…`** to your hosted STT relay (same strategy as web — see `docs/STT.md`).

**After install — optional keys in the app support directory**

For transcription and in-app AI routes served by Electron, create:

`~/Library/Application Support/Persuaid/.env`

Example:

```env
OPENAI_API_KEY=sk-...
DEEPGRAM_API_KEY=...
```

## 4. How the packaged app differs from `desktop:dev`

| | `desktop:dev` | Packaged `.app` / `.dmg` |
|--|---------------|---------------------------|
| UI | `localhost:3000` (full Next server) | Static files from `out/` + local HTTP on port **2999** |
| Next `/api/*` (Stripe, usage, entitlements, …) | Available | **Not included** (static export cannot ship App Router API routes). The UI falls back gracefully for many flows; `/api/me/*` calls may fail and entitlements behave like **free** until you add hosting or Electron-side proxies. |
| AI follow-up / STT in Electron | Uses Next or Electron handlers | Electron **main** implements `/api/ai/*` and the STT proxy when keys are set |

For a **full** production desktop experience matching Vercel, you would either load the **deployed site URL** in Electron instead of `out/`, or re-implement critical `/api` routes in `electron/main.js`.

### DMG for production: now or later?

- **Polish desktop first (`desktop:dev`)** until **Start Call**, transcript, and copilot match what you want. The DMG is the same UI from **`out/`** but **without** Next server APIs — billing/usage entitlements are weaker until you proxy or load the live site.
- **Ship a DMG now** if you need testers to install without Node, or you want to validate mic + keys + static UI on real machines.
- **Defer the DMG** if you still need **full** parity with the web app (Stripe, `/api/me/*`, etc.); in that window, prioritize either **loading your deployed `https://…` URL in Electron** or **adding Electron main-process proxies** for the APIs you care about.

## 5. Static export and `app/api`

`npm run build:desktop` runs `scripts/next-static-export-build.js`, which **temporarily moves `app/api` aside** so `output: 'export'` can complete, then **restores** `app/api`. If a build is killed abruptly and `app/api` is missing, restore manually:

```bash
mv .desktop-stash-api app/api
```

(Normal completion always restores automatically.)
