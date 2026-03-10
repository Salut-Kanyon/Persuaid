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

// Do NOT remove public/downloads/*.dmg so the cloud keeps the current file.
