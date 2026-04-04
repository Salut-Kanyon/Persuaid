#!/usr/bin/env node
/**
 * After `build:desktop`, verifies the static bundle baked `NEXT_PUBLIC_API_BASE_URL`
 * so packaged Electron can POST to hosted `/api/ai/*` (copilot parity with `desktop:dev`).
 *
 * Skip: SKIP_VERIFY_DESKTOP_AI=1
 * Optional live probe (needs network): VERIFY_DESKTOP_AI_PROBE=1
 */
"use strict";

const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");

// Match Next.js: load .env.local so verify sees the same NEXT_PUBLIC_* as `next build` (parent shell may not export them).
try {
  require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
} catch {
  // ignore
}
try {
  require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
} catch {
  // ignore
}

const root = path.join(__dirname, "..");
const outNext = path.join(root, "out", "_next", "static");

function walkJsFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walkJsFiles(full, acc);
    else if (name.endsWith(".js")) acc.push(full);
  }
  return acc;
}

function bundleContainsBase(base, chunksDir) {
  if (!base) return false;
  const needle = base.replace(/\/$/, "");
  const files = walkJsFiles(chunksDir);
  for (const f of files) {
    try {
      const s = fs.readFileSync(f, "utf8");
      if (s.includes(needle)) return true;
    } catch {
      // ignore
    }
  }
  return false;
}

function postJson(urlStr, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const lib = u.protocol === "https:" ? https : http;
    const data = JSON.stringify(body);
    const req = lib.request(
      {
        hostname: u.hostname,
        port: u.port || (u.protocol === "https:" ? 443 : 80),
        path: u.pathname + u.search,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
          Origin: "http://127.0.0.1:2999",
        },
      },
      (res) => {
        let buf = "";
        res.on("data", (c) => {
          buf += c;
        });
        res.on("end", () => {
          resolve({ status: res.statusCode ?? 0, body: buf });
        });
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  if (process.env.SKIP_VERIFY_DESKTOP_AI === "1") {
    console.log("[verify-desktop-ai-config] SKIP_VERIFY_DESKTOP_AI=1 — skipping.");
    return;
  }

  const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").trim().replace(/\/$/, "");

  if (!fs.existsSync(path.join(root, "out"))) {
    console.error("[verify-desktop-ai-config] No out/ directory — run build:desktop first.");
    process.exit(1);
  }

  if (!base) {
    console.error(
      "[verify-desktop-ai-config] NEXT_PUBLIC_API_BASE_URL is not set in env or .env.local.\n" +
        "  Set it to your production origin (e.g. https://persuaid.app) before desktop:build so copilot calls hosted /api/ai/*."
    );
    process.exit(1);
  }

  if (!/^https:\/\//i.test(base)) {
    console.warn("[verify-desktop-ai-config] Warning: API base should usually be https:// in production:", base);
  }

  const chunksDir = path.join(outNext, "chunks");
  if (!bundleContainsBase(base, chunksDir)) {
    console.error(
      "[verify-desktop-ai-config] Built bundle under out/_next does not contain the API base URL:\n" +
        `  ${base}\n` +
        "  Re-run build:desktop with NEXT_PUBLIC_API_BASE_URL set in the environment (Next bakes it at build time)."
    );
    process.exit(1);
  }

  console.log("[verify-desktop-ai-config] OK: bundle includes API base:", base);

  if (process.env.VERIFY_DESKTOP_AI_PROBE === "1") {
    const probeUrl = `${base}/api/ai/follow-up`;
    try {
      const { status, body } = await postJson(probeUrl, {
        transcript: [],
        mode: "answer",
      });
      if (status !== 200) {
        console.error("[verify-desktop-ai-config] Probe failed:", status, body.slice(0, 200));
        process.exit(1);
      }
      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch {
        console.error("[verify-desktop-ai-config] Probe: non-JSON response:", body.slice(0, 200));
        process.exit(1);
      }
      if (typeof parsed.text !== "string") {
        console.error("[verify-desktop-ai-config] Probe: missing text field:", parsed);
        process.exit(1);
      }
      console.log("[verify-desktop-ai-config] Probe OK: POST", probeUrl, "→ 200 with JSON text");
    } catch (e) {
      console.error("[verify-desktop-ai-config] Probe network error:", e && e.message);
      process.exit(1);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
