#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function getSize(dirOrFile) {
  const full = path.join(root, dirOrFile);
  if (!fs.existsSync(full)) return null;
  let size = 0;
  const stat = fs.statSync(full);
  if (stat.isFile()) return stat.size;
  const walk = (p) => {
    const entries = fs.readdirSync(p, { withFileTypes: true });
    for (const e of entries) {
      const fp = path.join(p, e.name);
      if (e.isDirectory()) walk(fp);
      else size += fs.statSync(fp).size;
    }
  };
  walk(full);
  return size;
}

function fmt(bytes) {
  if (bytes == null) return "N/A";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

console.log("Build output sizes:");
console.log("  out/     ", fmt(getSize("out")));
console.log("  .next/   ", fmt(getSize(".next")));
console.log("  dist/    ", fmt(getSize("dist")));

const distDir = path.join(root, "dist");
if (fs.existsSync(distDir)) {
  const files = fs.readdirSync(distDir);
  for (const f of files) {
    const fp = path.join(distDir, f);
    if (fs.statSync(fp).isFile()) {
      console.log("  dist/" + f, fmt(fs.statSync(fp).size));
    }
  }
}
