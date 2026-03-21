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

- Deploy the relay (or equivalent) as **`wss://stt.yourdomain.com`** behind TLS.
- Set:

  ```bash
  NEXT_PUBLIC_STT_PROXY_URL=wss://stt.yourdomain.com
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

**Health check:** `GET http://<host>:2998/health` → `{"ok":true,"service":"persuaid-stt-relay",...}`

## Client behavior

- If the relay URL is not configured (non-localhost host without env), the app shows a **clear configuration error** before opening the mic.
- On **relay** mode, if the socket drops mid-call, the client **retries with exponential backoff** and shows **“Live transcription unavailable. Retrying…”** instead of a blank transcript.
