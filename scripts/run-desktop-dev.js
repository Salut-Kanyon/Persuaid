#!/usr/bin/env node
/**
 * Runs `next dev`, parses the printed Local URL for the real port (3000, 3001, …),
 * then starts Electron with NEXT_DEV_PORT so it always matches this dev server
 * (avoids attaching to an old process still bound to 3000).
 */
"use strict";

const path = require("path");
const { spawn } = require("child_process");

const root = path.resolve(__dirname, "..");
const electronEnv = {
  ...process.env,
  DESKTOP_DEV: "1",
};
if (process.env.ELECTRON_OPEN_DEVTOOLS === "1") {
  electronEnv.ELECTRON_OPEN_DEVTOOLS = "1";
}

let electronStarted = false;
let electronProc = null;

function extractPortFromChunk(text) {
  const local = text.match(/-\s+Local:\s+https?:\/\/[^:\s]+:(\d+)/);
  if (local) return parseInt(local[1], 10);
  const alt = text.match(/\b127\.0\.0\.1:(\d{2,5})\b/);
  if (alt) return parseInt(alt[1], 10);
  const loc = text.match(/\blocalhost:(\d{2,5})\b/);
  if (loc) return parseInt(loc[1], 10);
  return null;
}

function startElectron(port) {
  if (electronStarted) return;
  if (!Number.isFinite(port) || port < 1024 || port > 65535) return;
  electronStarted = true;
  electronEnv.NEXT_DEV_PORT = String(port);
  console.log("[desktop] Next dev URL uses port", port, "— launching Electron");
  if (process.platform === "darwin") {
    console.log(
      "[desktop] Note: the Dock hover label shows “Electron” in dev — macOS names the running app bundle (the Electron binary from node_modules). Menu bar should say Persuaid. For “Persuaid” in the Dock, run the built app: open dist/mac-arm64/Persuaid.app (after npm run pack or desktop:build)."
    );
  }
  electronProc = spawn("npx", ["electron", "."], {
    cwd: root,
    env: electronEnv,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  electronProc.on("exit", (code, signal) => {
    if (signal === "SIGTERM" || signal === "SIGKILL") {
      process.exit(0);
      return;
    }
    try {
      nextProc.kill("SIGTERM");
    } catch (_) {}
    process.exit(code !== null && code !== undefined ? code : 1);
  });
}

const nextProc = spawn("npx", ["next", "dev"], {
  cwd: root,
  env: process.env,
  stdio: ["inherit", "pipe", "pipe"],
  shell: process.platform === "win32",
});

nextProc.stdout.on("data", (c) => {
  const s = c.toString();
  process.stdout.write(s);
  const port = extractPortFromChunk(s);
  if (port !== null) startElectron(port);
});
nextProc.stderr.on("data", (c) => process.stderr.write(c));

nextProc.on("exit", (code, signal) => {
  if (!electronStarted) {
    process.exit(code !== null && code !== undefined ? code : 1);
    return;
  }
  try {
    if (electronProc && !electronProc.killed) electronProc.kill("SIGTERM");
  } catch (_) {}
});

function shutdown() {
  try {
    nextProc.kill("SIGTERM");
  } catch (_) {}
  try {
    if (electronProc && !electronProc.killed) electronProc.kill("SIGTERM");
  } catch (_) {}
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
