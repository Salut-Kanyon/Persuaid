/**
 * Production-style STT relay: browser → this server → Deepgram (API key never in browser).
 *
 * Run: npm run stt:proxy
 * Dev with Next: npm run dev:stt
 *
 * Env (.env.local):
 *   DEEPGRAM_API_KEY=...
 *   STT_PROXY_PORT=2998          (default)
 *   STT_PROXY_BIND=0.0.0.0         (optional; use for phone on LAN — point NEXT_PUBLIC_STT_PROXY_URL at ws://YOUR_LAN_IP:2998)
 *
 * Client:
 *   NEXT_PUBLIC_STT_PROXY_URL=ws://127.0.0.1:2998
 *   Legacy direct browser→Deepgram (not recommended): NEXT_PUBLIC_STT_ALLOW_BROWSER_DEEPGRAM=true
 */

const http = require("http");
const crypto = require("crypto");
const { WebSocketServer } = require("ws");

const PORT = Number(process.env.PORT || process.env.STT_PROXY_PORT) || 2998;
const BIND = (process.env.STT_PROXY_BIND || "127.0.0.1").trim();
const DEEPGRAM_ORIGIN = "wss://api.deepgram.com";

function loadEnvLocal() {
  const path = require("path");
  const fs = require("fs");
  const envPath = path.resolve(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  content.split("\n").forEach((line) => {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  });
}

loadEnvLocal();
const apiKey = process.env.DEEPGRAM_API_KEY;
if (!apiKey) {
  console.error("[STT relay] Missing DEEPGRAM_API_KEY in .env.local");
  process.exit(1);
}

const server = http.createServer((req, res) => {
  if (req.url === "/health" || req.url?.startsWith("/health?")) {
    const body = JSON.stringify({ ok: true, service: "persuaid-stt-relay", port: PORT });
    if (req.method === "HEAD") {
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      });
      res.end();
      return;
    }
    if (req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(body);
      return;
    }
    res.writeHead(405);
    res.end();
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server });

function newSessionId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

wss.on("connection", (clientWs, req) => {
  const sessionId = newSessionId();
  const started = Date.now();
  const pathPart = req.url?.split("?")[0] || "/v1/listen";
  const query = req.url?.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  const deepgramUrl = `${DEEPGRAM_ORIGIN}${pathPart}${query}`;

  let upstreamOpenAt = null;
  let transcriptEvents = 0;
  let upstreamMessages = 0;

  console.log(
    JSON.stringify({
      evt: "stt_client_connect",
      sessionId,
      path: pathPart,
      remote: req.socket?.remoteAddress,
    }),
  );

  const WebSocketClient = require("ws");
  const upstream = new WebSocketClient(deepgramUrl, {
    headers: {
      Authorization: `Token ${apiKey}`,
    },
  });

  const pendingFromClient = [];

  clientWs.on("message", (data) => {
    if (upstream.readyState === upstream.OPEN) {
      upstream.send(data);
    } else {
      pendingFromClient.push(data);
    }
  });

  clientWs.on("close", (code, reason) => {
    console.log(
      JSON.stringify({
        evt: "stt_client_close",
        sessionId,
        code,
        reason: reason?.toString?.() || "",
        ms: Date.now() - started,
        transcriptEvents,
        upstreamMessages,
      }),
    );
    try {
      upstream.send(JSON.stringify({ type: "CloseStream" }));
    } catch (_) {}
    try {
      upstream.close();
    } catch (_) {}
  });

  clientWs.on("error", (err) => {
    console.error(
      JSON.stringify({
        evt: "stt_client_error",
        sessionId,
        message: err?.message || String(err),
      }),
    );
    try {
      upstream.close();
    } catch (_) {}
  });

  upstream.on("unexpected-response", (req, res) => {
    let body = "";
    res.on("data", (chunk) => {
      body += chunk && chunk.toString ? chunk.toString() : String(chunk);
    });
    res.on("end", () => {
      const dgError = res.headers["dg-error"] || "(no dg-error header)";
      const dgRequestId = res.headers["dg-request-id"] || "(none)";
      console.error(
        JSON.stringify({
          evt: "stt_deepgram_handshake_fail",
          sessionId,
          status: res.statusCode,
          statusMessage: res.statusMessage,
          dgError,
          dgRequestId,
          bodyPreview: (body || "").slice(0, 500),
        }),
      );
    });
  });

  upstream.on("open", () => {
    upstreamOpenAt = Date.now();
    console.log(
      JSON.stringify({
        evt: "stt_deepgram_open",
        sessionId,
        handshakeMs: upstreamOpenAt - started,
      }),
    );
    for (const data of pendingFromClient) {
      try {
        upstream.send(data);
      } catch (_) {}
    }
    pendingFromClient.length = 0;

    upstream.on("message", (data) => {
      upstreamMessages += 1;
      if (clientWs.readyState !== clientWs.OPEN) return;
      const text = Buffer.isBuffer(data) ? data.toString("utf8") : String(data);
      try {
        const j = JSON.parse(text);
        if (j && (j.type === "Results" || j.channel || j.results)) {
          transcriptEvents += 1;
        }
      } catch (_) {
        // ignore non-JSON
      }
      try {
        clientWs.send(text);
      } catch (_) {}
    });
  });

  upstream.on("error", (err) => {
    console.error(
      JSON.stringify({
        evt: "stt_deepgram_error",
        sessionId,
        message: err?.message || String(err),
      }),
    );
    try {
      clientWs.close(1011, "Upstream error");
    } catch (_) {}
  });

  upstream.on("close", (code, reason) => {
    console.log(
      JSON.stringify({
        evt: "stt_deepgram_close",
        sessionId,
        code,
        reason: reason?.toString?.() || "",
        transcriptEvents,
        upstreamMessages,
        upstreamDurationMs: upstreamOpenAt ? Date.now() - upstreamOpenAt : null,
      }),
    );
    try {
      clientWs.close();
    } catch (_) {}
  });
});

server.listen(PORT, BIND, () => {
  console.log(
    `[STT relay] WebSocket: ws://${BIND === "0.0.0.0" ? "127.0.0.1" : BIND}:${PORT}/v1/listen?...`,
  );
  if (BIND === "0.0.0.0") {
    console.log("[STT relay] Bound on 0.0.0.0 — use your LAN IP in NEXT_PUBLIC_STT_PROXY_URL for phone testing.");
  }
  console.log(`[STT relay] Health: http://${BIND === "0.0.0.0" ? "127.0.0.1" : BIND}:${PORT}/health`);
  console.log("[STT relay] DEEPGRAM_API_KEY loaded; browser must not connect to Deepgram directly in production.");
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`[STT relay] Port ${PORT} in use. Set STT_PROXY_PORT or stop the other process.`);
  } else {
    console.error("[STT relay] Server error:", err.message);
  }
  process.exit(1);
});
