#!/usr/bin/env bash
# Verify built Persuaid.app microphone-related plist + signing. Usage:
#   ./scripts/verify-mac-app-mic.sh /path/to/Persuaid.app
set -euo pipefail
APP="${1:-}"
if [[ -z "$APP" || ! -d "$APP" ]]; then
  echo "Usage: $0 /path/to/Persuaid.app"
  exit 1
fi
INFO="${APP}/Contents/Info.plist"
echo "=== CFBundleIdentifier ==="
/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$INFO" 2>&1 || true
echo ""
echo "=== NSMicrophoneUsageDescription ==="
/usr/libexec/PlistBuddy -c 'Print :NSMicrophoneUsageDescription' "$INFO" 2>&1 || true
echo ""
echo "=== codesign -dv (first 30 lines) ==="
codesign -dv --verbose=4 "$APP" 2>&1 | head -30
echo ""
echo "=== entitlements (xml) ==="
codesign -d --entitlements :- "$APP" 2>&1 || true
