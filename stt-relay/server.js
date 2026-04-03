/**
 * Railway / Fly / any Node host: browser/Electron → this relay → Deepgram.
 *
 * Env:
 *   PORT                    — Railway sets automatically
 *   DEEPGRAM_API_KEY        — required
 *   STT_PROXY_BIND=0.0.0.0  — default below
 *   RELAY_CLIENT_TOKEN      — optional; if set, client must send ?relay_token= same value
 *
 * Health: GET /health
 * WebSocket: /v1/listen?... (same query shape as Deepgram; relay_token stripped before upstream)
 */

const http = require("http");
const crypto = require("crypto");
const { WebSocketServer } = require("ws");

const PORT = Number(process.env.PORT || process.env.STT_PROXY_PORT) || 8080;
const BIND = (process.env.STT_PROXY_BIND || "0.0.0.0").trim();
const DEEPGRAM_ORIGIN = "wss://api.deepgram.com";

const apiKey = process.env.DEEPGRAM_API_KEY;
const RELAY_CLIENT_TOKEN = (process.env.RELAY_CLIENT_TOKEN || "").trim();

if (!apiKey) {
  console.error("[stt-relay] Missing DEEPGRAM_API_KEY");
  process.exit(1);
}

function validateAndStripRelayQuery(rawUrl) {
  const pathPart = (rawUrl || "/v1/listen").split("?")[0] || "/v1/listen";
  const full = rawUrl || "/v1/listen";
  const q = full.includes("?") ? full.slice(full.indexOf("?")) : "";
  if (!q.startsWith("?")) {
    return { ok: true, pathPart, query: "" };
  }
  const params = new URLSearchParams(q.slice(1));
  const tok = params.get("relay_token") || "";
  params.delete("relay_token");
  if (RELAY_CLIENT_TOKEN && tok !== RELAY_CLIENT_TOKEN) {
    return { ok: false };
  }
  const rest = params.toString();
  return { ok: true, pathPart, query: rest ? `?${rest}` : "" };
}

const server = http.createServer((req, res) => {
  if (req.url === "/health" || req.url?.startsWith("/health?")) {
    const body = JSON.stringify({
      ok: true,
      service: "persuaid-stt-relay",
      port: PORT,
      relayAuth: RELAY_CLIENT_TOKEN ? "required" : "off",
    });
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

const wss = new WebSocketServer({
  server,
  perMessageDeflate: false,
  clientTracking: true,
});

function newSessionId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

wss.on("connection", (clientWs, req) => {
  const sessionId = newSessionId();
  const started = Date.now();
  const stripped = validateAndStripRelayQuery(req.url || "/v1/listen");
  if (!stripped.ok) {
    try {
      clientWs.close(4401, "Unauthorized");
    } catch (_) {}
    return;
  }
  const { pathPart, query } = stripped;
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

  upstream.on("unexpected-response", (request, res) => {
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
      } catch (_) {}
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
  console.log(`[stt-relay] Listening ${BIND}:${PORT} health=GET /health`);
  console.log("[stt-relay] DEEPGRAM_API_KEY loaded; relay_token auth:", RELAY_CLIENT_TOKEN ? "on" : "off");
});

server.on("error", (err) => {
  console.error("[stt-relay] Server error:", err.message);
  process.exit(1);
});
