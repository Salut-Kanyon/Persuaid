#!/usr/bin/env bash
# Writes build/icon.icns for electron-builder (mac.icon).
#
# Default: copy Local/icon.icns (gold-master Dock icon — mint P on dark).
# To rebuild from Assets.xcassets/AppIcon.appiconset instead, run:
#   REGENERATE_APP_ICON_FROM_ASSETS=1 bash scripts/build-macos-app-icon.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/Assets.xcassets/AppIcon.appiconset"
OUTSET="$ROOT/build/.appicon.iconset"
ICNS="$ROOT/build/icon.icns"
LOCAL_MASTER="$ROOT/Local/icon.icns"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "build-macos-app-icon: skipping (iconutil requires macOS). electron-builder will use PNG if configured."
  exit 0
fi

if [[ -z "${REGENERATE_APP_ICON_FROM_ASSETS:-}" ]] && [[ -f "$LOCAL_MASTER" ]]; then
  mkdir -p "$ROOT/build"
  cp "$LOCAL_MASTER" "$ICNS"
  echo "build-macos-app-icon: using Local/icon.icns -> $ICNS"
  exit 0
fi

if ! command -v iconutil >/dev/null 2>&1; then
  echo "build-macos-app-icon: iconutil not found" >&2
  exit 1
fi

# Remove any stale iconset from a failed run (iconutil rejects incomplete sets).
rm -rf "$OUTSET"

for f in 16.png 32.png 64.png 128.png 256.png 512.png 1024.png; do
  if [[ ! -f "$SRC/$f" ]]; then
    echo "build-macos-app-icon: missing $SRC/$f" >&2
    exit 1
  fi
done

rm -rf "$OUTSET"
mkdir -p "$ROOT/build"
mkdir -p "$OUTSET"

# Names required by iconutil (see Apple “Create a set of icons”)
cp "$SRC/16.png" "$OUTSET/icon_16x16.png"
cp "$SRC/32.png" "$OUTSET/icon_16x16@2x.png"
cp "$SRC/32.png" "$OUTSET/icon_32x32.png"
cp "$SRC/64.png" "$OUTSET/icon_32x32@2x.png"
cp "$SRC/128.png" "$OUTSET/icon_128x128.png"
cp "$SRC/256.png" "$OUTSET/icon_128x128@2x.png"
cp "$SRC/256.png" "$OUTSET/icon_256x256.png"
cp "$SRC/512.png" "$OUTSET/icon_256x256@2x.png"
cp "$SRC/512.png" "$OUTSET/icon_512x512.png"
cp "$SRC/1024.png" "$OUTSET/icon_512x512@2x.png"

rm -f "$ICNS"
if iconutil -c icns "$OUTSET" -o "$ICNS"; then
  echo "build-macos-app-icon: wrote $ICNS"
else
  echo "build-macos-app-icon: iconutil failed; falling back to Local/icon.icns" >&2
  if [[ -f "$ROOT/Local/icon.icns" ]]; then
    cp "$ROOT/Local/icon.icns" "$ICNS"
    echo "build-macos-app-icon: fallback copied to $ICNS"
  else
    echo "build-macos-app-icon: fallback file not found: $ROOT/Local/icon.icns" >&2
    exit 1
  fi
fi

rm -rf "$OUTSET"
