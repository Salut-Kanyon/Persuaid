# Desktop DMG vs dev: copilot / OpenAI parity

The packaged app serves **static files only** from `out/` (no `app/api` in the bundle). Copilot requests use [`lib/api-base.ts`](../lib/api-base.ts): **`NEXT_PUBLIC_API_BASE_URL`** must be set at **static export build time** so `fetch("/api/ai/...")` resolves to your **hosted** Next.js app (e.g. Vercel).

## 1. Verify baked API base (automated)

After `npm run build:desktop`, **`scripts/verify-desktop-ai-config.js`** runs (unless `SKIP_VERIFY_DESKTOP_AI=1`):

- Ensures `NEXT_PUBLIC_API_BASE_URL` is set (from `.env.local` / `.env` via dotenv, or the parent process env).
- Confirms that URL appears inside `out/_next/static/chunks/*.js` (baked by Next).

**Optional network probe** (CI or pre-release):

```bash
VERIFY_DESKTOP_AI_PROBE=1 node scripts/verify-desktop-ai-config.js
```

Sends `POST { transcript: [], mode: "answer" }` to `{base}/api/ai/follow-up` and expects **200** JSON with a `text` field (no OpenAI call for empty transcript).

## 2. Hosted deployment (e.g. Vercel) — manual checklist

| Check | Why |
|--------|-----|
| **`OPENAI_API_KEY`** set on the **same** project that serves `NEXT_PUBLIC_API_BASE_URL` | Route handlers [`app/api/ai/follow-up/route.ts`](../app/api/ai/follow-up/route.ts) read `process.env.OPENAI_API_KEY`. |
| **Deploy** includes the same `/api/ai/*` code you test locally | Stale production = different prompts/behavior. |
| **CORS** | Electron sends `Origin: http://127.0.0.1:2999`. [`middleware.ts`](../middleware.ts) allow-lists that origin for `/api/*`. |

`OPENAI_API_KEY` on **Railway** only matters if your AI routes run on Railway. If copilot hits **Vercel**, the key belongs in **Vercel** env, not Railway (unless you proxy through Railway).

## 3. Runtime checks in the installed app

1. **Console** — On first API call you should see: `[Persuaid] API requests: base = https://…` (from [`lib/api-base.ts`](../lib/api-base.ts)). If you see **same-origin** and `NEXT_PUBLIC_API_BASE_URL not set`, the DMG was built without a baked base; rebuild with `.env.local` fixed.
2. **Network** — `POST https://<your-host>/api/ai/follow-up` returns **200** and JSON, not **404** HTML from the local bundle server.

Artifact audit: [`DesktopBuild/electron-build-versions.txt`](../DesktopBuild/electron-build-versions.txt) includes `NEXT_PUBLIC_API_BASE_URL=…` after `desktop:build`.

## 4. If the API is correct but answers feel wrong (“repeats”, shallow)

The model is driven by **transcript + notes** in the request. Compare **dev vs DMG**:

- **Transcript** — STT differences (`NEXT_PUBLIC_STT_PROXY_URL`, Deepgram key, relay). Empty or duplicated lines change outputs.
- **Notes** — `notesContext` / My notes must be populated in session ([`NotesPanel`](../components/app/panels/NotesPanel.tsx)) before pressing Return.

Use DevTools → **Network** → select the `follow-up` request → **Payload** and compare the same moment on `desktop:dev` vs packaged.
