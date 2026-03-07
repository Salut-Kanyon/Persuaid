# Testing Persuaid: Developer vs Real (Packaged) Versions

## Quick reference

| What you're testing | Command(s) | What you see |
|--------------------|------------|--------------|
| **Website (dev)** | `npm run dev` → open http://localhost:3000 | Full site + app in the browser, hot reload. |
| **Desktop app (dev)** | Terminal 1: `npm run dev`<br>Terminal 2: `npm run desktop:dev` | Electron window loading localhost:3000; changes refresh as you edit. |
| **Desktop app (built, unpacked)** | `npm run desktop` | Electron serves from local `out/` (no dev server). Same as packaged behavior, no DMG. |
| **Desktop app (real / DMG)** | `npm run desktop:build` then open DMG from `dist/` | Installable app. Fully offline; uses bundled `out/` inside the app. |

---

## 1. Developer version (fast iteration)

**Goal:** Edit code and see changes without rebuilding the desktop app.

### Website only
```bash
npm run dev
```
- Open **http://localhost:3000**
- Use **http://localhost:3000/welcome** for the desktop-style flow (welcome → sign-in → dashboard)
- Hot reload on save

### Desktop shell + dev server (recommended for desktop UI work)
```bash
# Terminal 1
npm run dev

# Terminal 2
npm run desktop:dev
```
- Electron opens and loads **http://localhost:3000/welcome**
- Same content as the website; hot reload works
- If you see “Cannot connect to localhost:3000”, start Terminal 1 first and try again

**What to test:** Welcome screen, sign-in (email/password), dashboard/home, layout, theme. No need to build a DMG.

---

## 2. Real version (packaged desktop app)

**Goal:** Test the app that users get when they download and open the DMG.

### Build the DMG
```bash
npm run desktop:build
```
- Runs `next build` (writes to `out/`), then packages with Electron into **dist/Persuaid-0.1.0-arm64.dmg**

### Clean rebuild (if the DMG looks outdated or wrong)
```bash
npm run desktop:build:clean
```
- Deletes `out/`, `.next/`, and `dist/`, then runs a full build and creates a new DMG. Use this when you’ve made changes and the DMG still shows old UI.

### How to test the real version
1. Quit Persuaid completely (no window open).
2. In Finder: project folder → **dist** → double‑click **Persuaid-0.1.0-arm64.dmg**.
3. In the DMG window, double‑click **Persuaid** to launch.
4. You should see: welcome (dark theme) → Continue → sign-in (email/password) → dashboard/home. All of this runs from the bundled app; no localhost.

**Important:** Always open the app **from the DMG** (or from a copy you just dragged from the new DMG into Applications). If you open an old Persuaid from Applications, you may be running a previous build.

**What to test:** Full flow without dev server, sign-in with real Supabase, that the UI matches the dev version (theme, copy, behavior). No deployment required; the “real” version is the DMG.

---

## 3. Supabase / auth (both versions)

- **Redirect URLs in Supabase** (Authentication → URL Configuration):
  - Local website: `http://localhost:3000/auth/callback`
  - Desktop (when testing with dev): still uses localhost:3000, so same callback.
  - Desktop (packaged): if you add a custom URL or test with a hosted app later, add that callback URL too.
- Sign-in is **email + password**; after sign-in you go straight to the dashboard (no magic link step).

---

## 4. Checklist before shipping a new DMG

- [ ] Run `npm run desktop:build:clean` (or at least `npm run desktop:build` after pulling changes).
- [ ] Open the **new** DMG from `dist/` and confirm:
  - [ ] Welcome screen matches site theme (dark, green).
  - [ ] Sign-in (email/password) works and lands on dashboard.
  - [ ] Dashboard/home and main app UI look correct.
- [ ] Don’t rely on an old Persuaid.app in Applications; use the app launched from the DMG you just built.
