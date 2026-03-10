# Persuaid desktop – commands that actually run

Run these in **Terminal** (not necessarily from Cursor).

## 1. Build the app (no code signing)

```bash
cd /Users/sebastianborge/Desktop/Persuaid
CSC_IDENTITY_AUTO_DISCOVERY=false npm run pack
```

## 2. Run the app and see logs

**Option A – run from Terminal (logs in this window):**

```bash
cd /Users/sebastianborge/Desktop/Persuaid
./dist/mac-arm64/Persuaid.app/Contents/MacOS/Persuaid
```

Leave this window open. Use the app (sign in, start a call, speak). Any `[STT]` and startup logs from the main process will appear here.

**Option B – run app from Finder, then watch log file:**

1. Double‑click **Persuaid.app** (in `dist/mac-arm64/` or wherever you copied it).
2. In Terminal, run:

```bash
tail -f /tmp/persuaid-debug.log
```

Or:

```bash
tail -f "$HOME/Library/Application Support/Persuaid/debug.log"
```

Then use the app (sign in, start a call, speak). New log lines will stream in that terminal.

## 3. One-shot: build + run + follow logs

```bash
cd /Users/sebastianborge/Desktop/Persuaid
npm run desktop:logs
```

This builds (no signing), starts the app, then tails `/tmp/persuaid-debug.log`. In the app: sign in → start a call → speak. Watch the terminal for `[STT]` lines.

## 4. Full signed build (for release / notarization)

```bash
cd /Users/sebastianborge/Desktop/Persuaid
npm run desktop:build
```

Requires code signing identity and can prompt for notarization; may need `GH_TOKEN` if the build tries to publish.
