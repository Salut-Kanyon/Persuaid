#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

// Remove build dirs so next build and electron-builder start fresh
const dirs = ["out", ".next", "dist"];
for (const dir of dirs) {
  const full = path.join(root, dir);
  try {
    if (fs.existsSync(full)) {
      fs.rmSync(full, { recursive: true, force: true, maxRetries: 3 });
      console.log("Removed:", dir);
    }
  } catch (err) {
    console.error("Failed to remove", dir, err.message);
    process.exit(1);
  }
}

// Remove the DMG (and other large downloads) from public/ so next build does NOT
// export them into out/. Otherwise the desktop app would package the previous DMG
// and the DMG would grow every build.
const downloadsDir = path.join(root, "public", "downloads");
if (fs.existsSync(downloadsDir)) {
  const entries = fs.readdirSync(downloadsDir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isFile() && (e.name.endsWith(".dmg") || e.name.endsWith(".exe") || e.name.endsWith(".AppImage"))) {
      const full = path.join(downloadsDir, e.name);
      try {
        fs.rmSync(full, { force: true });
        console.log("Removed from public/downloads:", e.name);
      } catch (err) {
        console.error("Failed to remove", full, err.message);
      }
    }
  }
}
