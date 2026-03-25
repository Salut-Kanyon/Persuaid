#!/usr/bin/env node
/**
 * Next.js static export cannot include App Router Route Handlers (app/api/*).
 * Temporarily move app/api aside, run `next build` with OUTPUT_STATIC=1, then restore.
 * Vercel and normal `npm run build` are unchanged (no stash).
 */
"use strict";

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const apiDir = path.join(root, "app", "api");
const stashDir = path.join(root, ".desktop-stash-api");

function restoreApiIfStashed() {
  try {
    if (fs.existsSync(stashDir) && !fs.existsSync(apiDir)) {
      fs.renameSync(stashDir, apiDir);
      console.log("Restored app/api from static-export stash.");
    }
  } catch (e) {
    console.error(
      "CRITICAL: Failed to restore app/api from .desktop-stash-api — fix manually:",
      e.message
    );
    process.exitCode = 1;
  }
}

function main() {
  let stashed = false;
  let exitCode = 1;

  const onSignal = () => {
    restoreApiIfStashed();
    process.exit(exitCode);
  };
  process.on("SIGINT", onSignal);
  process.on("SIGTERM", onSignal);

  try {
    if (!fs.existsSync(apiDir)) {
      console.error("Expected", apiDir, "— nothing to stash.");
      process.exit(1);
      return;
    }
    if (fs.existsSync(stashDir)) {
      console.error(
        "Stale",
        stashDir,
        "exists. Remove it or move it aside, then retry."
      );
      process.exit(1);
      return;
    }
    fs.renameSync(apiDir, stashDir);
    stashed = true;

    const env = { ...process.env, OUTPUT_STATIC: "1" };
    const r = spawnSync("npx", ["next", "build"], {
      cwd: root,
      stdio: "inherit",
      env,
      shell: process.platform === "win32",
    });
    exitCode = r.status !== null && r.status !== undefined ? r.status : 1;
  } catch (e) {
    console.error(e);
    exitCode = 1;
  } finally {
    if (stashed) {
      restoreApiIfStashed();
    }
  }

  process.exit(exitCode);
}

main();
