/**
 * WebSocket proxy for Deepgram STT. Use when the browser fails to connect
 * directly (e.g. "[Transcription connection failed]").
 *
 * Run: node scripts/stt-ws-proxy.js
 * Then in .env.local set NEXT_PUBLIC_STT_WS_PROXY=ws://localhost:3001
 * (or the client will try this URL when direct connection fails).
 *
 * Loads DEEPGRAM_API_KEY from .env.local (same dir as package.json).
 */

const http = require("http");
const { WebSocketServer } = require("ws");

const PORT = Number(process.env.STT_PROXY_PORT) || 2998;
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
  console.error("Missing DEEPGRAM_API_KEY in .env.local");
  process.exit(1);
}

const server = http.createServer();
const wss = new WebSocketServer({ server });

wss.on("connection", (clientWs, req) => {
  const path = req.url?.split("?")[0] || "/v1/listen";
  const query = req.url?.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  const deepgramUrl = `${DEEPGRAM_ORIGIN}${path}${query}`;

  console.log("[STT proxy] Connecting to Deepgram:", deepgramUrl);

  const WebSocketClient = require("ws");
  const upstream = new WebSocketClient(deepgramUrl, {
    headers: {
      Authorization: `Token ${apiKey}`,
    },
  });

  upstream.on("unexpected-response", (req, res) => {
    let body = "";
    res.on("data", (chunk) => { body += (chunk && chunk.toString) ? chunk.toString() : String(chunk); });
    res.on("end", () => {
      const dgError = res.headers["dg-error"] || "(no dg-error header)";
      const dgRequestId = res.headers["dg-request-id"] || "(none)";
      console.error("[STT proxy] Deepgram unexpected response:", res.statusCode, res.statusMessage);
      console.error("[STT proxy] dg-error:", dgError, "dg-request-id:", dgRequestId);
      console.error("[STT proxy] body:", body || "(empty)");
    });
  });

  const pendingFromClient = [];
  clientWs.on("message", (data) => {
    if (upstream.readyState === upstream.OPEN) {
      upstream.send(data);
    } else {
      pendingFromClient.push(data);
    }
  });

  upstream.on("open", () => {
    for (const data of pendingFromClient) upstream.send(data);
    pendingFromClient.length = 0;
    clientWs.on("close", () => {
      try {
        upstream.send(JSON.stringify({ type: "CloseStream" }));
        upstream.close();
      } catch (_) {}
    });
    upstream.on("message", (data) => {
      if (clientWs.readyState !== clientWs.OPEN) return;
      const text = Buffer.isBuffer(data) ? data.toString("utf8") : data;
      clientWs.send(text);
    });
  });

  upstream.on("error", (err) => {
    console.error("Deepgram upstream error:", err.message);
    try {
      clientWs.close(1011, "Upstream error");
    } catch (_) {}
  });

  upstream.on("close", () => {
    try {
      clientWs.close();
    } catch (_) {}
  });

  clientWs.on("error", () => {
    try {
      upstream.close();
    } catch (_) {}
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`STT WebSocket proxy listening on ws://127.0.0.1:${PORT}`);
  console.log("Localhost dev uses this proxy by default. DEEPGRAM_API_KEY is loaded from .env.local.");
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Stop the other process or set STT_PROXY_PORT to a different number.`);
  } else {
    console.error("Proxy server error:", err.message);
  }
  process.exit(1);
});
