# Persuaid STT relay (Railway)

Forwards WebSocket audio from the Persuaid app to Deepgram. `DEEPGRAM_API_KEY` stays on the server.

## Railway deploy

1. Create a **new project** → **Deploy from GitHub** (this repo) or **Empty project** → connect repo.
2. Add a **service** → set **Root directory** to `stt-relay` (if the platform supports it), or deploy this folder only.
3. **Variables** (production):
   - `DEEPGRAM_API_KEY` — your Deepgram API key
   - Optional: `RELAY_CLIENT_TOKEN` — long random string; must match client `NEXT_PUBLIC_STT_RELAY_TOKEN` baked at build time
4. Railway sets `PORT` automatically. **Start command:** `npm start` (runs `node server.js`).
5. **Generate domain** in Railway → you get `https://your-app.up.railway.app`.
6. **Custom domain:** add `stt.persuaid.app` in Railway, then at your DNS provider create a **CNAME** from `stt` to the Railway target hostname.

## Verify

```bash
curl -sI https://stt.persuaid.app/health
```

Expect HTTP 200 and JSON `{"ok":true,...}`.

## Client env (Vercel + desktop build)

- `NEXT_PUBLIC_STT_PROXY_URL=wss://stt.persuaid.app`
- Optional: `NEXT_PUBLIC_STT_RELAY_TOKEN` — same value as `RELAY_CLIENT_TOKEN` if you enabled relay auth

See also `docs/STT.md` in the repo root.
