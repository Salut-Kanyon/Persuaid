#!/usr/bin/env bash
# Verify NSMicrophoneUsageDescription and CFBundleIdentifier on a built or installed .app.
# Usage:
#   bash scripts/verify-macos-app-plist.sh
#   bash scripts/verify-macos-app-plist.sh /Applications/Persuaid.app
#   bash scripts/verify-macos-app-plist.sh ./dist/mac-arm64/Persuaid.app
set -euo pipefail
APP="${1:-/Applications/Persuaid.app}"
PLIST="${APP}/Contents/Info.plist"
echo "=== macOS app plist check ==="
echo "App: $APP"
if [[ ! -d "$APP" ]]; then
  echo "ERROR: Not found. Pass path to Persuaid.app (e.g. /Applications/Persuaid.app or dist/mac-arm64/Persuaid.app)"
  exit 1
fi
if [[ ! -f "$PLIST" ]]; then
  echo "ERROR: Missing $PLIST"
  exit 1
fi
echo ""
echo "--- CFBundleIdentifier (must match the binary you run; duplicates in /Applications vs DMG = separate TCC rows) ---"
/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$PLIST" 2>/dev/null || echo "(read failed)"
echo ""
echo "--- NSMicrophoneUsageDescription (required for mic TCC dialog) ---"
/usr/libexec/PlistBuddy -c 'Print :NSMicrophoneUsageDescription' "$PLIST" 2>/dev/null || echo "MISSING"
echo ""
echo "--- CFBundleShortVersionString ---"
/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' "$PLIST" 2>/dev/null || true
echo ""
echo "Done."
