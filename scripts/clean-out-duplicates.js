#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

// Remove macOS-style duplicates from out/ (e.g. "dashboard 2", "api 3") so electron-builder
// doesn't fail on paths with spaces when copying extraResources.
const outDir = path.join(path.resolve(__dirname, ".."), "out");
if (!fs.existsSync(outDir)) return;

function removeDuplicates(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      removeDuplicates(full);
    }
    // Match "something 2", "something 3", etc. (space + digit)
    if (/ \d+$/.test(e.name) || / \d+\./.test(e.name)) {
      try {
        fs.rmSync(full, { recursive: true, force: true });
        console.log("Removed duplicate from out:", path.relative(outDir, full));
      } catch (err) {
        console.warn("Could not remove", full, err.message);
      }
    }
  }
}

removeDuplicates(outDir);
