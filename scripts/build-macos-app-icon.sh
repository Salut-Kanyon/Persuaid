#!/usr/bin/env bash
# Build build/icon.icns from Assets.xcassets/AppIcon.appiconset (iconutil = macOS only).
# Replace that file with a hand-tuned fixed.icns if you use an external tool; run this only to regenerate from PNGs.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/Assets.xcassets/AppIcon.appiconset"
OUTSET="$ROOT/build/.appicon.iconset"
ICNS="$ROOT/build/icon.icns"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "build-macos-app-icon: skipping (iconutil requires macOS). electron-builder will use PNG if configured."
  exit 0
fi

if ! command -v iconutil >/dev/null 2>&1; then
  echo "build-macos-app-icon: iconutil not found" >&2
  exit 1
fi

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
iconutil -c icns "$OUTSET" -o "$ICNS"
rm -rf "$OUTSET"
echo "build-macos-app-icon: wrote $ICNS"
