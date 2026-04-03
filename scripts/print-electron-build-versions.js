#!/usr/bin/env node
/**
 * Writes electron + electron-builder versions next to build artifacts for shipped-app audits.
 * Run after `electron-builder` (e.g. end of `npm run desktop:build`).
 */
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

function readVer(pkg) {
  try {
    return require(path.join(root, "node_modules", pkg, "package.json")).version;
  } catch {
    return "(not installed)";
  }
}

const eb = readVer("electron-builder");
const el = readVer("electron");
const lines = [
  `electron-builder=${eb}`,
  `electron=${el}`,
  `generatedAt=${new Date().toISOString()}`,
  "",
].join("\n");

process.stdout.write(lines);

["dist", "DesktopBuild", "out"].forEach((d) => {
  const dir = path.join(root, d);
  const filePath = path.join(dir, "electron-build-versions.txt");
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, lines, "utf8");
    console.log("Wrote", path.relative(root, filePath));
  } catch (e) {
    console.warn("Could not write", filePath, e && e.message);
  }
});
