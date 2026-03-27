Persuaid — where the desktop build files live (on your Mac, after you run `npm run desktop:build`)

DO YOU NEED TO REDOWNLOAD THE DMG AFTER ADDING API KEYS?
  No. Keys go in: ~/Library/Application Support/Persuaid/.env
  The installed app reads that file every time it starts. Rebuild or redownload only when you want a NEW version of the app.

AFTER CHANGING .env
  Quit Persuaid fully: Cmd+Q (not only closing the window).
  Open the app again from Applications (or double-click Persuaid.app below).

WHERE TO FIND THE LATEST BUILD (same machine, after `npm run desktop:build`)
  DMG installer:  Persuaid/DesktopBuild/Persuaid-Latest.dmg   (shortcut → dist)
  Unpacked app:   Persuaid/DesktopBuild/Persuaid.app          (shortcut → dist/mac-arm64)
  Copy for site:  Persuaid/public/downloads/Persuaid.dmg      (build script copies the DMG here)

SOURCE PATHS (if shortcuts are missing, open these in Finder)
  dist/Persuaid-0.1.0-arm64.dmg
  dist/mac-arm64/Persuaid.app

RECREATE SHORTCUTS (from project root, after a build)
  ln -sf ../dist/Persuaid-0.1.0-arm64.dmg DesktopBuild/Persuaid-Latest.dmg
  ln -sf ../dist/mac-arm64/Persuaid.app DesktopBuild/Persuaid.app
  (If the DMG filename changes with version, adjust the first path.)

API KEYS (packaged app — not .env.local in the repo)
  ~/Library/Application Support/Persuaid/.env

DOCK / APP ICON (mint P on dark)
  Desktop builds use Local/icon.icns copied to build/icon.icns (see scripts/build-macos-app-icon.sh).
  Reinstall from a fresh DMG after `npm run desktop:build` to refresh the icon in Finder/Dock.
