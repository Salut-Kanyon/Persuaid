# STT relay (production)

The relay is `scripts/stt-ws-proxy.js`. It exposes:

- `GET /health` — JSON health (used for uptime / `curl` checks)
- `WebSocket /v1/listen?...` — same path/query shape as Deepgram’s listen API; the relay adds `Authorization: Token …` upstream.

Deploy with Fly using the files at the **repository root**: `Dockerfile.stt-relay` and `fly.stt.toml`. See [docs/STT.md](../../docs/STT.md) for full steps, DNS, and verification.
