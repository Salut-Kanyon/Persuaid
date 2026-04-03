# Persuaid STT relay (Railway)

Forwards WebSocket audio from the Persuaid app to Deepgram. `DEEPGRAM_API_KEY` stays on the server.

## Railway deploy

1. Create a **new project** → **Deploy from GitHub** (this repo) or **Empty project** → connect repo.
2. **Important:** open the service **Settings** → set **Root Directory** to **`stt-relay`**.  
   If you skip this, Railway builds the **monorepo root** and `npm ci` fails (root `package-lock.json` out of sync with Next.js deps).
3. **Build:** prefer **Dockerfile** (this folder includes `railway.toml` + `Dockerfile`). If Railpack still runs `npm run build` from the wrong root, switch the service to **Docker** and point at `stt-relay/Dockerfile`.
4. **Variables** (production):
   - `DEEPGRAM_API_KEY` — your Deepgram API key
   - Optional: `RELAY_CLIENT_TOKEN` — long random string; must match client `NEXT_PUBLIC_STT_RELAY_TOKEN` baked at build time
5. Railway sets `PORT` automatically. **Start command:** `npm start` (runs `node server.js`) when not using Docker; the Dockerfile uses `CMD ["node", "server.js"]`.
6. **Generate domain** in Railway → you get `https://your-app.up.railway.app`.
7. **Custom domain:** add `stt.persuaid.app` in Railway, then at your DNS provider create a **CNAME** from `stt` to the Railway target hostname.

## Verify

```bash
curl -sI https://stt.persuaid.app/health
```

Expect HTTP 200 and JSON `{"ok":true,...}`.

## Client env (Vercel + desktop build)

- `NEXT_PUBLIC_STT_PROXY_URL=wss://stt.persuaid.app`
- Optional: `NEXT_PUBLIC_STT_RELAY_TOKEN` — same value as `RELAY_CLIENT_TOKEN` if you enabled relay auth

See also `docs/STT.md` in the repo root.
