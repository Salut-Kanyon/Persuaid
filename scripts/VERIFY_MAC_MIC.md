# macOS shipped app — microphone / identity verification

Run these on the **built** `Persuaid.app` (e.g. under `dist/mac-arm64/Persuaid.app` or after copying from DMG to `/Applications`). Replace `APP` with the path to the `.app` bundle.

**One-shot local check (plist + codesign):**

```bash
./scripts/verify-mac-app-mic.sh "/path/to/Persuaid.app"
```

(See also `scripts/verify-macos-app-plist.sh` if present.)

## 1) `NSMicrophoneUsageDescription` in Info.plist

**Command:**

```bash
/usr/libexec/PlistBuddy -c 'Print :NSMicrophoneUsageDescription' "/path/to/Persuaid.app/Contents/Info.plist"
```

**Expected:** A non-empty string (Persuaid’s usage explanation). If this prints nothing or errors, the system may not show mic prompts correctly.

## 2) Stable bundle identifier

**Command:**

```bash
/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "/path/to/Persuaid.app/Contents/Info.plist"
```

**Expected:** `com.persuaid.app` (must match `build.appId` in `package.json` and signing identity).

## 3) Code signature and entitlements (hardened runtime)

**Command:**

```bash
codesign -dv --verbose=4 "/path/to/Persuaid.app" 2>&1
```

**Entitlements blob:**

```bash
codesign -d --entitlements :- "/path/to/Persuaid.app" 2>&1
```

**Expected:** Signed with your Developer ID. This project uses **non-sandboxed** Electron (`com.apple.security.app-sandbox` = false in `build/entitlements.mac.plist`). Microphone access for non-sandbox apps relies primarily on **Info.plist** `NSMicrophoneUsageDescription` and runtime TCC — **do not assume** a `com.apple.security.device.*` microphone key is required unless you enable App Sandbox.

## 4) Helper / identity mismatch (dev vs prod)

- **Production:** `CFBundleIdentifier` comes from `package.json` → `build.appId` (`com.persuaid.app`), merged into `Info.plist` by electron-builder.
- **Dev (`npx electron .`):** Process is the **Electron** binary; TCC may show **Electron**, not Persuaid — different code identity than the shipped `.app`.
- **Do not** mix permission testing between dev Electron and shipped `Persuaid.app`; reset with `tccutil reset Microphone` when switching.

## 5) Runtime logs (shipped app)

Logs are written to:

- `~/Library/Application Support/Persuaid/debug.log`
- `/tmp/persuaid-debug.log`

Search for:

- `[MIC_AUDIT]` — startup identity, Info.plist mic string, TCC status, permission handler lines
- `[MIC_DIAG]` — full diagnostic sequence (Mic debug panel)
- `[MIC_DEBUG]` — detailed permission / IPC traces

Enable the on-screen mic debug HUD: `?micDebug=1` or `localStorage.persuaid_mic_debug = "1"`, then use **Full diag (main+GUM)**.

## 6) electron / electron-builder versions used for the build

After `npm run desktop:build`, see:

- `dist/electron-build-versions.txt`
- `DesktopBuild/electron-build-versions.txt`
- `out/electron-build-versions.txt` (if `out/` exists)

Or run: `node scripts/print-electron-build-versions.js`

## 7) Bundle ID references in repo (should stay consistent)

- `package.json` → `build.appId`: `com.persuaid.app`
- `scripts/notarize.js` → `appBundleId = "com.persuaid.app"`
- `electron/main.js` → PlistBuddy reads `CFBundleIdentifier` for `[MIC_AUDIT]` logs only (no separate hardcoded ID)

Any other bundle ID or helper name in third-party scripts should match, or notarization / TCC can diverge. **Dev vs prod:** running `npx electron .` uses the **Electron.app** identity; shipped `Persuaid.app` uses `com.persuaid.app` — different TCC rows.
