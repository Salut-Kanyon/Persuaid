#!/usr/bin/env bash
# Writes build/icon.icns for electron-builder (package.json build.mac.icon).
#
# Default: Pillow preprocess (scripts/preprocess-macos-app-icon.py) — padded logo on black, rounded
# alpha at 1024, then sips → full iconset → iconutil.
#
# Optional:
#   USE_LOCAL_ICON_MASTER=1   — copy Local/icon.icns only.
#   SKIP_PILLOW_ICON=1        — use raw Assets.xcassets/AppIcon.appiconset PNGs (no Pillow).
#   BAKE_MACOS_SQUIRCLE=1     — use Swift clip instead of Pillow (ignores Pillow path).
#   MAC_ICON_CORNER_RADIUS=185 — Swift or Pillow rounded-rect radius @1024px.
#   MAC_ICON_PADDING_FRAC=0.25 — Pillow only; per-side margin fraction (inner = 1 - 2*frac; higher = more padding).
#   MAC_ICON_INNER_SAFE_SCALE=0.84 — shrink the fitted mark further so it clears the squircle corners.
#   MAC_ICON_BG_RGB_MAX=28 — treat RGB <= this as background when cropping opaque-black AppIcon PNGs.
#   MAC_ICON_INPUT=path — override source PNG (default: AppIcon.appiconset/1024.png).
#
# Requires: Python 3 + Pillow (installed automatically via pip from scripts/requirements-icon.txt
# on first run if import fails).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/Assets.xcassets/AppIcon.appiconset"
OUTSET="$ROOT/build/.appicon.iconset"
ICNS="$ROOT/build/icon.icns"
LOCAL_MASTER="$ROOT/Local/icon.icns"
PILL_MASTER="$ROOT/build/.mac-icon-pillow-1024.png"
MASTER1024="$ROOT/build/.squircle-1024.png"
CORNER="${MAC_ICON_CORNER_RADIUS:-185}"
PADDING_FRAC="${MAC_ICON_PADDING_FRAC:-0.25}"
INNER_SAFE_SCALE="${MAC_ICON_INNER_SAFE_SCALE:-0.84}"
BG_RGB_MAX="${MAC_ICON_BG_RGB_MAX:-28}"
EDGE_PAD="${MAC_ICON_EDGE_PAD:-2}"
ICON_INPUT="${MAC_ICON_INPUT:-$SRC/1024.png}"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "build-macos-app-icon: skipping (Swift/iconutil require macOS). electron-builder will use existing build/icon.icns if present."
  exit 0
fi

mkdir -p "$ROOT/build"

if [[ -n "${USE_LOCAL_ICON_MASTER:-}" ]] && [[ -f "$LOCAL_MASTER" ]]; then
  cp "$LOCAL_MASTER" "$ICNS"
  echo "build-macos-app-icon: USE_LOCAL_ICON_MASTER -> copied Local/icon.icns -> $ICNS"
  exit 0
fi

assets_ok=true
for f in 16.png 32.png 64.png 128.png 256.png 512.png 1024.png; do
  if [[ ! -f "$SRC/$f" ]]; then
    assets_ok=false
    break
  fi
done

if [[ "$assets_ok" != true ]]; then
  echo "build-macos-app-icon: missing PNGs under $SRC" >&2
  if [[ -f "$LOCAL_MASTER" ]]; then
    cp "$LOCAL_MASTER" "$ICNS"
    echo "build-macos-app-icon: fallback copied Local/icon.icns -> $ICNS" >&2
    exit 0
  fi
  exit 1
fi

if ! command -v iconutil >/dev/null 2>&1; then
  echo "build-macos-app-icon: iconutil not found" >&2
  if [[ -f "$LOCAL_MASTER" ]]; then
    cp "$LOCAL_MASTER" "$ICNS"
    echo "build-macos-app-icon: fallback copied Local/icon.icns -> $ICNS" >&2
    exit 0
  fi
  exit 1
fi

ensure_pillow() {
  if python3 -c "from PIL import Image" 2>/dev/null; then
    return 0
  fi
  echo "build-macos-app-icon: installing Pillow (python3 -m pip install -r scripts/requirements-icon.txt) …" >&2
  python3 -m pip install -q -r "$ROOT/scripts/requirements-icon.txt"
}

build_gen_from_master() {
  local master="$1"
  local gen="$2"
  rm -rf "$gen"
  mkdir -p "$gen"
  sips -z 16 16 "$master" --out "$gen/16.png" >/dev/null
  sips -z 32 32 "$master" --out "$gen/32.png" >/dev/null
  sips -z 64 64 "$master" --out "$gen/64.png" >/dev/null
  sips -z 128 128 "$master" --out "$gen/128.png" >/dev/null
  sips -z 256 256 "$master" --out "$gen/256.png" >/dev/null
  sips -z 512 512 "$master" --out "$gen/512.png" >/dev/null
  cp "$master" "$gen/1024.png"
}

FROM_DIR=""
LABEL=""

if [[ -n "${BAKE_MACOS_SQUIRCLE:-}" ]]; then
  GEN="$ROOT/build/.icon-gen-sizes"
  swift "$ROOT/scripts/apply-macos-squircle.swift" "$SRC/1024.png" "$MASTER1024" "$CORNER"
  echo "build-macos-app-icon: BAKE_MACOS_SQUIRCLE (radius @1024=${CORNER}) -> $MASTER1024"
  build_gen_from_master "$MASTER1024" "$GEN"
  FROM_DIR="$GEN"
  LABEL="Swift squircle + resampled sizes"
elif [[ -z "${SKIP_PILLOW_ICON:-}" ]]; then
  GEN="$ROOT/build/.icon-gen-sizes"
  ensure_pillow
  if [[ ! -f "$ICON_INPUT" ]]; then
    echo "build-macos-app-icon: MAC_ICON_INPUT not found: $ICON_INPUT" >&2
    exit 1
  fi
  python3 "$ROOT/scripts/preprocess-macos-app-icon.py" \
    --input "$ICON_INPUT" \
    --output "$PILL_MASTER" \
    --radius "$CORNER" \
    --padding-frac "$PADDING_FRAC" \
    --inner-safe-scale "$INNER_SAFE_SCALE" \
    --bg-rgb-max "$BG_RGB_MAX" \
    --edge-pad "$EDGE_PAD"
  echo "build-macos-app-icon: Pillow master -> $PILL_MASTER (radius=${CORNER}, padding_frac=${PADDING_FRAC}, inner_safe=${INNER_SAFE_SCALE})"
  build_gen_from_master "$PILL_MASTER" "$GEN"
  FROM_DIR="$GEN"
  LABEL="Pillow (padded + rounded alpha) + resampled sizes"
else
  FROM_DIR="$SRC"
  LABEL="AppIcon.appiconset (raw, SKIP_PILLOW_ICON)"
fi

rm -rf "$OUTSET"
mkdir -p "$OUTSET"

cp "$FROM_DIR/16.png" "$OUTSET/icon_16x16.png"
cp "$FROM_DIR/32.png" "$OUTSET/icon_16x16@2x.png"
cp "$FROM_DIR/32.png" "$OUTSET/icon_32x32.png"
cp "$FROM_DIR/64.png" "$OUTSET/icon_32x32@2x.png"
cp "$FROM_DIR/128.png" "$OUTSET/icon_128x128.png"
cp "$FROM_DIR/256.png" "$OUTSET/icon_128x128@2x.png"
cp "$FROM_DIR/256.png" "$OUTSET/icon_256x256.png"
cp "$FROM_DIR/512.png" "$OUTSET/icon_256x256@2x.png"
cp "$FROM_DIR/512.png" "$OUTSET/icon_512x512.png"
cp "$FROM_DIR/1024.png" "$OUTSET/icon_512x512@2x.png"

rm -f "$ICNS"
if iconutil -c icns "$OUTSET" -o "$ICNS"; then
  echo "build-macos-app-icon: wrote $ICNS ($LABEL)"
else
  echo "build-macos-app-icon: iconutil failed; falling back to Local/icon.icns" >&2
  if [[ -f "$LOCAL_MASTER" ]]; then
    cp "$LOCAL_MASTER" "$ICNS"
    echo "build-macos-app-icon: fallback copied to $ICNS"
  else
    exit 1
  fi
fi

rm -rf "$OUTSET" "$ROOT/build/.icon-gen-sizes"
rm -f "$MASTER1024" "$PILL_MASTER"
