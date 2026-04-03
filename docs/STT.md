# Speech-to-text (STT) — production architecture

## Principle

- **Browser** opens a WebSocket only to **your STT relay** (this repo: `scripts/stt-ws-proxy.js`).
- **Relay** holds `DEEPGRAM_API_KEY` and opens `wss://api.deepgram.com/v1/listen?...` with `Authorization: Token …`.
- **Never** ship the Deepgram key to the browser in production.

Direct **browser → Deepgram** (temporary JWT in `Sec-WebSocket-Protocol`) is **disabled by default** because it often fails with **1006** on mobile, strict networks, and extensions. Opt-in only:

```bash
NEXT_PUBLIC_STT_ALLOW_BROWSER_DEEPGRAM=true
```

## Local development

1. Put `DEEPGRAM_API_KEY` in `.env.local`.
2. Run **both** Next and the relay:

   ```bash
   npm run dev:stt
   ```

   Or two terminals: `npm run dev` and `npm run stt:proxy`.

3. Default relay: `ws://127.0.0.1:2998` (localhost / 127.0.0.1 in the browser is wired automatically).

4. Optional explicit URL:

   ```bash
   NEXT_PUBLIC_STT_PROXY_URL=ws://127.0.0.1:2998
   ```

## Phone / LAN testing

The relay binds to **127.0.0.1** by default (not reachable from your phone).

1. Start relay on all interfaces:

   ```bash
   STT_PROXY_BIND=0.0.0.0 npm run stt:proxy
   ```

2. Point the app at your machine’s LAN IP:

   ```bash
   NEXT_PUBLIC_STT_PROXY_URL=ws://192.168.x.x:2998
   ```

3. Open the app from the phone using **http://192.168.x.x:3000** (same host as env build).

## Production

**Product strategy:** use **Option A** — run the relay (`scripts/stt-ws-proxy.js` or the Docker/Fly layout) on infrastructure you control, keep **`DEEPGRAM_API_KEY` only on the server**, and set **`NEXT_PUBLIC_STT_PROXY_URL`** to the public **`wss://…`** endpoint when building the web app and the **desktop static export** (`build:desktop` / DMG). Strangers installing the DMG then get live transcription **without** putting Deepgram in `~/Library/Application Support/Persuaid/.env`. **Option B** (shipping or embedding API keys in the installer) is **not** the primary path for consumer installs.

**Do not point the STT hostname at Vercel.** Serverless/edge hosts are the wrong fit for a long‑lived browser → relay → Deepgram WebSocket. Use a small always-on VM/container (this repo ships a **Fly.io** layout).

### Railway (this repo)

Deploy the **`stt-relay/`** service (see `stt-relay/README.md`): Node process listens on `PORT`, `GET /health`, WebSocket on `/v1/listen?...`. Set `DEEPGRAM_API_KEY` and optional matching `RELAY_CLIENT_TOKEN` / client `NEXT_PUBLIC_STT_RELAY_TOKEN`.

### Fly.io (recommended)

1. Install [Fly CLI](https://fly.io/docs/hands-on/install-flyctl/), ensure Docker is running.
2. From the repo root, create the app once (name must be globally unique — change `app` in `fly.stt.toml` if this one is taken):

   ```bash
   fly apps create persuaid-stt-relay
   ```

3. Set the secret (never commit it):

   ```bash
   fly secrets set DEEPGRAM_API_KEY=your_key_here -a persuaid-stt-relay
   ```

4. Deploy:

   ```bash
   fly deploy -c fly.stt.toml
   ```

5. **TLS + custom domain** (e.g. `stt.persuaid.app`):

   ```bash
   fly certs add stt.persuaid.app -a persuaid-stt-relay
   ```

   At your DNS provider, add a **CNAME** for `stt` to the target Fly shows (usually `persuaid-stt-relay.fly.dev`). **Remove** any Vercel (or other) record that pointed `stt` at a dead deployment — that is what causes `x-vercel-error: DEPLOYMENT_NOT_FOUND`.

6. Verify:

   ```bash
   curl -sI https://stt.persuaid.app/health
   ```

   Expect **HTTP 200** and JSON body `{"ok":true,"service":"persuaid-stt-relay",...}` on `GET /health`.

7. In the Next/Vercel project env:

   ```bash
   NEXT_PUBLIC_STT_PROXY_URL=wss://stt.persuaid.app
   ```

- Do **not** set `NEXT_PUBLIC_STT_ALLOW_BROWSER_DEEPGRAM` in production unless you accept the operational risk.

## Observability (relay)

Structured JSON logs to stdout:

| Event | Meaning |
|--------|--------|
| `stt_client_connect` | Browser connected (includes `sessionId`) |
| `stt_deepgram_open` | Upstream handshake OK (`handshakeMs`) |
| `stt_deepgram_handshake_fail` | Auth / Deepgram HTTP error before WS upgrade |
| `stt_deepgram_error` | Upstream socket error |
| `stt_deepgram_close` | Upstream closed (`transcriptEvents`, `upstreamMessages`) |
| `stt_client_close` | Browser disconnected |

**Health check:** `GET /health` (or `HEAD` for `curl -I`) → **200** with `{"ok":true,"service":"persuaid-stt-relay",...}`. Local default port is **2998**; the Fly image listens on **8080** inside the container (only the public hostname matters once deployed).

## Client behavior

- If the relay URL is not configured (non-localhost host without env), the app shows a **clear configuration error** before opening the mic.
- On **relay** mode, if the socket drops mid-call, the client **retries with exponential backoff** and shows **“Live transcription unavailable. Retrying…”** instead of a blank transcript.
