Persuaid — where the desktop build files live (on your Mac, after you run `npm run desktop:build`)

DO YOU NEED TO REDOWNLOAD THE DMG AFTER ADDING API KEYS?
  No. Keys go in: ~/Library/Application Support/Persuaid/.env
  The installed app reads that file every time it starts. Rebuild or redownload only when you want a NEW version of the app.

AFTER CHANGING .env
  Quit Persuaid fully: Cmd+Q (not only closing the window).
  Open the app again from Applications (or double-click Persuaid.app below).

WHERE TO FIND THE LATEST BUILD (same machine, after `npm run desktop:build`)
  DMG (full copy): Persuaid/DesktopBuild/Persuaid.dmg        (same file the build also puts in public/downloads/)
  DMG (symlink):   Persuaid/DesktopBuild/Persuaid-Latest.dmg  (→ dist/Persuaid-*-arm64.dmg — recreate if missing)
  Unpacked app:    Persuaid/DesktopBuild/Persuaid.app          (shortcut → dist/mac-arm64)
  Copy for site:   Persuaid/public/downloads/Persuaid.dmg      (build script copies the DMG here too)

SOURCE PATHS (if shortcuts are missing, open these in Finder)
  dist/Persuaid-0.1.0-arm64.dmg
  dist/mac-arm64/Persuaid.app

RECREATE SHORTCUTS (from project root, after a build)
  ln -sf ../dist/Persuaid-0.1.0-arm64.dmg DesktopBuild/Persuaid-Latest.dmg
  ln -sf ../dist/mac-arm64/Persuaid.app DesktopBuild/Persuaid.app
  (If the DMG filename changes with version, adjust the first path.)

API KEYS (packaged app — not .env.local in the repo)
  ~/Library/Application Support/Persuaid/.env

MICROPHONE VS “LISTEN TO THE COMPUTER”
  Persuaid’s live transcription uses your **microphone** (getUserMedia) — the same input as talking into a mic for a call.
  An **Apple Developer certificate / notarization** does **not** unlock audio. macOS decides mic access in **System Settings → Privacy & Security → Microphone** (toggle **Persuaid** on). If you denied it once, macOS may not show the prompt again until you enable it there.
  **Installed DMG / Persuaid.app** → look for **Persuaid** in the Microphone list.
  **`npm run desktop:dev`** runs **Electron.app** from node_modules → macOS lists **Electron**, not Persuaid. Enable **Electron** for mic while developing, or test with the built **Persuaid.app** to match real users.
  Packaged builds must route mic requests through **askForMediaAccess** (fixed in `electron/main.js`). If Persuaid never appeared in the list, rebuild the DMG and install again; then start a call so **getUserMedia** runs once.
  **Computer / speaker audio** (sound playing from other apps, “what the Mac outputs”) is **not** the same permission. Capturing that needs **Screen Recording** (and product support for loopback capture). If you expect the app to “hear Zoom from the speakers,” use a **headset mic** or **listen from** the right input — the app is not recording system audio unless we add that feature.

APPLE SIGNING + NOTARIZATION (distribution / Gatekeeper — separate from mic)
  Your DMG is already **code-signed** if Xcode / “Apple Development” or “Developer ID Application” is installed; `electron-builder` picks an identity.
  **Notarization** (Apple’s malware scan) is optional for your own testing but recommended for downloads from the web. It does **not** fix microphone routing.
  To notarize when building, set in the environment before `npm run desktop:build`:
    export APPLE_ID="your@email.com"
    export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"   # app-specific password from appleid.apple.com
    export APPLE_TEAM_ID="XXXXXXXXXX"                          # 10-char Team ID from developer.apple.com
  The hook `scripts/notarize-macos.cjs` runs after sign; if these are unset, the build skips notarization (see build log).

PORT 2998 “address already in use”
  The STT relay uses 127.0.0.1:2998. Quit extra Persuaid windows, and stop `npm run desktop:dev` or `npm run stt:proxy` before opening the DMG app if you want a clean start. New builds tolerate a busy port and keep running (they reuse whatever is already listening).

DEBUGGING (why AI / Enter might “do nothing”)
  Log file: ~/Library/Application Support/Persuaid/debug.log
  On launch, look for:
    [AI] OPENAI_API_KEY: yes (length …)  ← key loaded
    [STT] DEEPGRAM_API_KEY loaded: yes   ← speech
  After you press Enter (newer builds), look for:
    [AI] follow-up: empty transcript …  ← no text in the transcript yet (speak / wait for captions)
    [AI] follow-up: calling OpenAI …    ← request sent
    [AI] follow-up: OpenAI HTTP 401 …   ← bad/expired OpenAI key (rotate key in dashboard)
    [AI] follow-up: OK, replyChars=…     ← success
  Tip: open debug.log in Console.app or: tail -f "~/Library/Application Support/Persuaid/debug.log"

DOCK / APP ICON (mint P on dark)
  Desktop builds use Local/icon.icns copied to build/icon.icns (see scripts/build-macos-app-icon.sh).
  Reinstall from a fresh DMG after `npm run desktop:build` to refresh the icon in Finder/Dock.
