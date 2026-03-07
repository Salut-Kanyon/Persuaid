#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const outDownloads = path.join(path.resolve(__dirname, ".."), "out", "downloads");
if (!fs.existsSync(outDownloads)) return;

const entries = fs.readdirSync(outDownloads, { withFileTypes: true });
for (const e of entries) {
  if (e.isFile() && (e.name.endsWith(".dmg") || e.name.endsWith(".exe") || e.name.endsWith(".AppImage"))) {
    const full = path.join(outDownloads, e.name);
    try {
      fs.rmSync(full, { force: true });
      console.log("Removed from out/downloads:", e.name);
    } catch (err) {
      console.error("Failed to remove", full, err.message);
    }
  }
}
