const {
  app,
  BrowserWindow,
  session,
  protocol,
  Menu,
  ipcMain,
  dialog,
  screen,
  nativeImage,
  shell,
  systemPreferences,
} = require('electron');

/**
 * Human-readable product name (menu bar, our menus, window title).
 * macOS Dock *tooltip* while running `npx electron` still shows "Electron" — that comes from
 * Electron.app's Info.plist, not from JS. Only the built Persuaid.app shows "Persuaid" in the Dock.
 */
const APP_DISPLAY_NAME = 'Persuaid';

try {
  app.setName(APP_DISPLAY_NAME);
  process.title = APP_DISPLAY_NAME;
} catch (_) {}

// Before app ready: HTTP/2 can trigger net::ERR_FAILED (-2) loading OAuth HTTPS in a secondary
// BrowserWindow on some macOS/Electron builds. Desktop dev enables disable-http2 by default; set
// PERSUAID_OAUTH_DISABLE_HTTP2=0 to opt out, or =1 to force when not using desktop:dev.
const _oauthHttp2Off =
  process.env.PERSUAID_OAUTH_DISABLE_HTTP2 === '1' ||
  (process.env.DESKTOP_DEV === '1' && process.env.PERSUAID_OAUTH_DISABLE_HTTP2 !== '0');
if (_oauthHttp2Off) {
  try {
    app.commandLine.appendSwitch('disable-http2');
  } catch (_) {}
}
if (process.platform === 'darwin') {
  app.on('will-finish-launching', () => {
    try {
      app.setName(APP_DISPLAY_NAME);
    } catch (_) {}
  });
}

const path = require('path');

const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
}

const fs = require('fs');
const { execSync } = require('child_process');
const http = require('http');
const { WebSocketServer } = require('ws');

const STT_PROXY_PORT = 2998;
const DEEPGRAM_ORIGIN = 'wss://api.deepgram.com';
let sttProxyServer = null;

/** Last resort: Electron sometimes surfaces listen EADDRINUSE as uncaught even with server.on('error'). */
process.on('uncaughtException', (err) => {
  const code = err && err.code;
  const port = err && err.port;
  const msg = String((err && err.message) || '');
  if (code === 'EADDRINUSE' && (port === STT_PROXY_PORT || msg.includes(String(STT_PROXY_PORT)))) {
    try {
      console.warn(
        '[STT] Port',
        STT_PROXY_PORT,
        'already in use — quit other Persuaid windows, or stop `npm run desktop:dev` / `npm run stt:proxy`. App continues; STT uses the process already listening on that port.'
      );
    } catch (_) {}
    return;
  }
});

/** Write to debug.log in userData and /tmp so you can tail -f it when running the app from Finder. */
let debugLogStream = null;
let debugLogStreamTmp = null;
function debugLog(...args) {
  const line = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ') + '\n';
  console.log(...args);
  [debugLogStream, debugLogStreamTmp].forEach((s) => {
    if (s) try { s.write(line); } catch (_) {}
  });
}

/** Packaged-mac microphone / TCC diagnostics — grep logs for [MIC_DEBUG]. */
function logMicDiagnosticsAtStartup() {
  debugLog('[MIC_DEBUG] app.isPackaged:', isPackaged);
  debugLog('[MIC_DEBUG] process.execPath:', process.execPath);
  debugLog('[MIC_DEBUG] process.resourcesPath:', process.resourcesPath);
  try {
    debugLog('[MIC_DEBUG] app.getName():', app.getName());
  } catch (_) {}
  if (process.platform !== 'darwin') return;
  const infoPlist = path.join(process.resourcesPath, '..', 'Info.plist');
  const exists = fs.existsSync(infoPlist);
  debugLog('[MIC_DEBUG] Info.plist path:', infoPlist, 'exists:', exists);
  if (!exists) return;
  try {
    const bid = execSync(`/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "${infoPlist}"`, {
      encoding: 'utf8',
    }).trim();
    debugLog('[MIC_DEBUG] CFBundleIdentifier:', bid);
  } catch (e) {
    debugLog('[MIC_DEBUG] CFBundleIdentifier read failed:', e && e.message);
  }
  try {
    const mic = execSync(`/usr/libexec/PlistBuddy -c 'Print :NSMicrophoneUsageDescription' "${infoPlist}"`, {
      encoding: 'utf8',
    }).trim();
    debugLog(
      '[MIC_DEBUG] NSMicrophoneUsageDescription:',
      mic ? `present (${mic.length} chars): ${mic.slice(0, 120)}${mic.length > 120 ? '…' : ''}` : 'MISSING — TCC dialog text will not work correctly'
    );
  } catch (e) {
    debugLog('[MIC_DEBUG] NSMicrophoneUsageDescription MISSING or PlistBuddy error:', e && e.message);
  }
  try {
    const ver = execSync(`/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' "${infoPlist}"`, {
      encoding: 'utf8',
    }).trim();
    debugLog('[MIC_DEBUG] CFBundleShortVersionString:', ver);
  } catch (_) {}
}

const APP_PROTOCOL = 'app';
const APP_HOST = 'persuaid';

// ─── Dev vs production ─────────────────────────────────────────────────────
// - Packaged app (DMG/.app): ALWAYS serve bundled frontend from Resources/out.
//   Never load localhost:3000 or any external URL.
// - DESKTOP_DEV=1 (npm run desktop:dev): load localhost:3000 for hot reload.
// - Unpacked, no DESKTOP_DEV (npm run desktop): serve from ./out if it exists.
const isPackaged = app.isPackaged;
const forceDevServer = process.env.DESKTOP_DEV === '1';
const outDirUnpacked = path.join(__dirname, '..', 'out');
const outDirPackaged = path.join(process.resourcesPath, 'out');
const bundledOutExists = () => {
  // Next.js static export creates welcome.html (not welcome/index.html)
  const welcomeHtml = path.join(outDirUnpacked, 'welcome.html');
  const welcomeIndex = path.join(outDirUnpacked, 'welcome', 'index.html');
  return fs.existsSync(welcomeHtml) || fs.existsSync(welcomeIndex);
};

const useBundledFrontend = !forceDevServer && (isPackaged || bundledOutExists());
const OUT_DIR = isPackaged ? outDirPackaged : outDirUnpacked;

// Load .env so API keys are available in main process (required for packaged app; optional for dev).
// 1) App config folder (packaged app + optional dev): ~/Library/Application Support/Persuaid/.env
const userDataDir = app.getPath('userData');
const appEnvPath = path.join(userDataDir, '.env');
if (fs.existsSync(appEnvPath)) {
  require('dotenv').config({ path: appEnvPath });
}
// 2) Project .env.local (dev only; not present in packaged app)
if (!isPackaged) {
  const envLocalPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envLocalPath)) {
    require('dotenv').config({ path: envLocalPath });
  }
}

// Custom protocol so the app loads from the bundle (no localhost, no HTTP server).
protocol.registerSchemesAsPrivileged([
  { scheme: APP_PROTOCOL, privileges: { standard: true, secure: true, supportFetchAPI: true } },
  // OAuth `redirectTo`: `persuaid://auth/callback` — main window rewrites to http(s) app URL in will-navigate.
  { scheme: 'persuaid', privileges: { standard: true, secure: true, corsEnabled: true, supportFetchAPI: true } },
]);

const BUNDLE_SERVER_PORT = 2999;
let bundleHttpServer = null;

console.log('Electron startup:', {
  isPackaged,
  forceDevServer,
  bundledOutExists: bundledOutExists(),
  useBundledFrontend,
  OUT_DIR,
});

/** Desktop window icon (bundled `ElectrongPP.png`; dev prefers mac master PNG, then other marks). */
function resolveAppLogoPath() {
  if (app.isPackaged) {
    const packaged = path.join(process.resourcesPath, 'ElectrongPP.png');
    if (fs.existsSync(packaged)) return packaged;
  }
  const root = path.join(__dirname, '..');
  const candidates = [
    path.join(root, 'public', 'MacIconPersuaidLogo1024x1024.png'),
    path.join(root, 'public', 'PersuaidLogo.png'),
    path.join(root, 'public', 'ElectrongPP.png'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function getWindowIcon() {
  const logoPath = resolveAppLogoPath();
  if (!logoPath) return undefined;
  try {
    const img = nativeImage.createFromPath(logoPath);
    return img.isEmpty() ? undefined : img;
  } catch (_) {
    return undefined;
  }
}

/** Next dev server or bundled static server origin — must match where the renderer loads. */
function getDesktopHttpAppOrigin() {
  if (forceDevServer) {
    const devPort = (process.env.NEXT_DEV_PORT || process.env.PORT || '3000').replace(/^:/, '').trim() || '3000';
    return `http://localhost:${devPort}`;
  }
  return `http://127.0.0.1:${BUNDLE_SERVER_PORT}`;
}

/** PKCE uses ?code=; some flows return tokens in the hash (#access_token=… / #error=…). */
function urlHasOAuthReturn(u) {
  try {
    if (u.searchParams.has('code') || u.searchParams.has('error')) return true;
    if (u.hash && u.hash.length > 1) {
      const hp = new URLSearchParams(u.hash.slice(1));
      return (
        hp.has('access_token') ||
        hp.has('code') ||
        hp.has('error') ||
        hp.has('refresh_token')
      );
    }
    return false;
  } catch (_) {
    return false;
  }
}

/**
 * Map IdP / Supabase return URLs to our in-app HTTP `/auth/callback` (same session partition as main).
 */
function rewriteExternalOAuthToApp(urlString, httpAppOrigin) {
  try {
    const u = new URL(urlString);
    if (u.protocol === 'persuaid:' && u.hostname === 'auth' && u.pathname === '/callback') {
      return `${httpAppOrigin}/auth/callback${u.search}${u.hash}`;
    }
    const host = u.hostname.replace(/^www\./, '').toLowerCase();
    if (host !== 'persuaid.app') return null;
    const path = u.pathname === '' ? '/' : u.pathname;
    const atRoot = path === '/' || path === '';
    if (atRoot && urlHasOAuthReturn(u)) {
      const t = new URL(`${httpAppOrigin}/auth/callback`);
      u.searchParams.forEach((value, key) => {
        t.searchParams.set(key, value);
      });
      if (u.hash) t.hash = u.hash;
      return t.toString();
    }
    if (path === '/auth/callback' || path.startsWith('/auth/callback/')) {
      return `${httpAppOrigin}${path}${u.search}${u.hash}`;
    }
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * If the URL is (or rewrites to) our app `/auth/callback` with OAuth query or hash params, return the http URL; else null.
 */
function getOAuthHttpCallbackTarget(urlString, httpAppOrigin) {
  const mapped = rewriteExternalOAuthToApp(urlString, httpAppOrigin);
  const candidate = mapped || urlString;
  try {
    const u = new URL(candidate);
    const app = new URL(httpAppOrigin);
    if (u.origin !== app.origin) return null;
    const p = u.pathname === '' ? '/' : u.pathname;
    if (p !== '/auth/callback' && !p.startsWith('/auth/callback/')) return null;
    if (!urlHasOAuthReturn(u)) return null;
    return u.toString();
  } catch (_) {
    return null;
  }
}

function stripElectronFromUserAgent(webContents) {
  try {
    const ua = webContents.getUserAgent();
    const chromeLike = ua.replace(/\s*Electron\/[^\s]+/gi, '').trim();
    // Never set an empty UA — can cause net::ERR_FAILED on HTTPS loads.
    if (chromeLike.length > 8) webContents.setUserAgent(chromeLike);
  } catch (_) {}
}

function registerPersuaidAsDefaultProtocolClient() {
  try {
    if (!app.isPackaged && process.argv.length >= 2) {
      app.setAsDefaultProtocolClient('persuaid', process.execPath, [path.resolve(process.argv[1])]);
    } else {
      app.setAsDefaultProtocolClient('persuaid');
    }
  } catch (e) {
    console.error('[desktop] setAsDefaultProtocolClient(persuaid):', e && e.message);
  }
}

function handOffOAuthReturnToMainWindow(urlString) {
  const httpAppOrigin = getDesktopHttpAppOrigin();
  const target = getOAuthHttpCallbackTarget(urlString, httpAppOrigin);
  if (!target) {
    console.error('[desktop] OAuth return URL not applicable:', urlString);
    return false;
  }
  if (!mainWindow || mainWindow.isDestroyed()) return false;
  try {
    mainWindow.focus();
    mainWindow.show();
    mainWindow.loadURL(target);
    return true;
  } catch (e) {
    console.error('[desktop] handOffOAuthReturnToMainWindow:', e && e.message);
    return false;
  }
}

function enqueueOAuthDeepLink(url) {
  if (!url || typeof url !== 'string') return;
  pendingOAuthDeepLink = url;
}

function tryFlushPendingOAuthDeepLink() {
  if (!pendingOAuthDeepLink) return;
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (handOffOAuthReturnToMainWindow(pendingOAuthDeepLink)) {
    pendingOAuthDeepLink = null;
  }
}

let mainWindow;
/** Saved window bounds before shrinking to the compact call strip (macOS-style top pill). */
let preCompactBounds = null;
/** Saved bounds / maximize state before live-call HUD resize. */
let preCallHudBounds = null;
let preCallHudMaximized = false;
let callHudActive = false;
/** Call HUD: panel “open” for legacy sync handler (bounds no longer change on hide). */
let hudPanelVisible = true;
/** OAuth return via persuaid:// when using the system browser (see registerPersuaidAsDefaultProtocolClient). */
let pendingOAuthDeepLink = null;
/** Fixed floating HUD size (renderer no longer syncs dynamic size). */
const HUD_FIXED_WIDTH = 460;
const HUD_FIXED_HEIGHT = 880;

/** macOS: window-level vibrancy for live-call HUD only (cleared when false). */
ipcMain.handle('persuaid-set-vibrancy', (_event, enabled) => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (process.platform !== 'darwin') return;
  try {
    mainWindow.setVibrancy(enabled ? 'hud' : null);
  } catch (e) {
    console.error('[persuaid-set-vibrancy]', e && e.message);
  }
});

ipcMain.handle('persuaid-window', (_event, action) => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  try {
    if (action === 'minimize') mainWindow.minimize();
    else if (action === 'close') mainWindow.close();
    else if (action === 'toggle-maximize') {
      if (mainWindow.isMaximized()) mainWindow.unmaximize();
      else mainWindow.maximize();
    }
  } catch (e) {
    console.error('[persuaid-window]', e && e.message);
  }
});

/** Open http(s)://persuaid.app/* in the system browser (pricing, marketing). Renderer must only pass allowed URLs. */
ipcMain.handle('persuaid-open-external', async (_event, url) => {
  try {
    const u = new URL(String(url));
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return { ok: false, error: 'protocol' };
    const host = u.hostname.toLowerCase();
    if (host !== 'persuaid.app' && host !== 'www.persuaid.app') return { ok: false, error: 'host' };
    await shell.openExternal(u.toString());
    return { ok: true };
  } catch (e) {
    console.error('[persuaid-open-external]', e && e.message);
    return { ok: false, error: 'invalid' };
  }
});

/**
 * Google blocks sign-in inside embedded WebViews ("This browser or app may not be secure").
 * Open the system browser; return via `persuaid://auth/callback` → open-url / second-instance.
 */
ipcMain.handle('persuaid-oauth-window', async (_event, startUrl) => {
  try {
    if (!startUrl || typeof startUrl !== 'string') return { ok: false, error: 'invalid_url' };
    if (!mainWindow || mainWindow.isDestroyed()) return { ok: false, error: 'no_window' };
    await shell.openExternal(startUrl);
    return { ok: true, external: true };
  } catch (e) {
    const msg = e && e.message ? String(e.message) : 'oauth_external';
    console.error('[persuaid-oauth-window]', msg);
    return { ok: false, error: msg };
  }
});

/** macOS microphone TCC — used by in-app onboarding (user gesture), not on boot. */
ipcMain.handle('mic:get-status', () => {
  debugLog('[MIC_DEBUG] ipc mic:get-status invoked');
  if (process.platform !== 'darwin') {
    debugLog('[MIC_DEBUG] mic:get-status → non-darwin, status unknown');
    return { status: 'unknown' };
  }
  try {
    const status = systemPreferences.getMediaAccessStatus('microphone');
    debugLog('[MIC_DEBUG] mic:get-status →', status);
    return { status };
  } catch (e) {
    debugLog('[MIC_DEBUG] mic:get-status error:', e && e.message);
    return { status: 'unknown' };
  }
});

ipcMain.handle('mic:request-access', async () => {
  debugLog('[MIC_DEBUG] ipc mic:request-access invoked');
  if (process.platform !== 'darwin') return { status: 'unknown', granted: false };
  const win = mainWindow;
  if (win && !win.isDestroyed()) {
    try {
      win.show();
    } catch (_) {}
    try {
      win.focus();
    } catch (_) {}
  }
  try {
    app.focus({ steal: true });
  } catch (_) {
    try {
      app.focus();
    } catch (_) {}
  }
  const before = systemPreferences.getMediaAccessStatus('microphone');
  debugLog('[MIC_DEBUG] mic:request-access TCC before:', before);
  if (before === 'granted') {
    debugLog('[MIC_DEBUG] mic:request-access skip askForMediaAccess (already granted)');
    return { status: 'granted', granted: true };
  }
  if (before === 'denied' || before === 'restricted') {
    debugLog('[MIC_DEBUG] mic:request-access skip askForMediaAccess (before is', before + ')');
    return { status: before, granted: false };
  }
  debugLog('[MIC_DEBUG] mic:request-access calling askForMediaAccess("microphone") …');
  const granted = await systemPreferences.askForMediaAccess('microphone');
  debugLog('[MIC_DEBUG] mic:request-access askForMediaAccess returned:', granted);
  const after = systemPreferences.getMediaAccessStatus('microphone');
  debugLog('[MIC_DEBUG] mic:request-access TCC after:', after, 'granted bool:', granted);
  debugLog('[macOS] mic:request-access IPC →', after, granted);
  return { status: after, granted };
});

ipcMain.handle('mic:open-settings', async () => {
  const url = 'x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone';
  try {
    await shell.openExternal(url);
    return { ok: true };
  } catch (e) {
    debugLog('[mic:open-settings]', e && e.message);
    return { ok: false };
  }
});

/**
 * Live call: shrink BrowserWindow to a compact floating HUD (pill + panel), centered.
 * Restores prior bounds (or re-maximizes) when disabled.
 */
ipcMain.handle('persuaid-call-hud', (_event, enabled) => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  try {
    if (enabled) {
      if (callHudActive) return;
      preCallHudMaximized = mainWindow.isMaximized();
      if (preCallHudMaximized) {
        mainWindow.unmaximize();
      }
      preCallHudBounds = mainWindow.getBounds();

      const { workArea } = screen.getPrimaryDisplay();
      hudPanelVisible = true;
      const hudW = Math.min(HUD_FIXED_WIDTH, workArea.width - 24);
      const hudH = Math.min(HUD_FIXED_HEIGHT, workArea.height - 24);
      const bx = workArea.x + Math.round((workArea.width - hudW) / 2);
      const by = workArea.y + Math.round((workArea.height - hudH) / 2);

      mainWindow.setBounds({ x: bx, y: by, width: hudW, height: hudH });
      try {
        mainWindow.setAlwaysOnTop(true, 'floating');
      } catch (_) {
        try {
          mainWindow.setAlwaysOnTop(true);
        } catch (_) {}
      }
      mainWindow.setResizable(false);
      try {
        mainWindow.setHasShadow(false);
      } catch (_) {}
      try {
        mainWindow.setBackgroundColor('#00000000');
      } catch (_) {}

      callHudActive = true;
    } else {
      if (!callHudActive) return;
      callHudActive = false;
      hudPanelVisible = true;

      mainWindow.setAlwaysOnTop(false);
      mainWindow.setResizable(true);
      try {
        mainWindow.setHasShadow(true);
      } catch (_) {}

      const isMac = process.platform === 'darwin';
      try {
        mainWindow.setBackgroundColor(isMac ? '#00000000' : '#000000');
      } catch (_) {}

      if (preCallHudMaximized) {
        preCallHudMaximized = false;
        preCallHudBounds = null;
        mainWindow.maximize();
      } else if (preCallHudBounds) {
        mainWindow.setBounds(preCallHudBounds);
        preCallHudBounds = null;
      } else {
        mainWindow.maximize();
      }
    }
  } catch (e) {
    console.error('[persuaid-call-hud]', e && e.message);
  }
});

ipcMain.handle('persuaid-call-hud-panel', (_event, open) => {
  if (!mainWindow || mainWindow.isDestroyed() || !callHudActive) return;
  try {
    hudPanelVisible = !!open;
    /* Window size stays fixed; renderer only toggles visibility. */
  } catch (e) {
    console.error('[persuaid-call-hud-panel]', e && e.message);
  }
});

ipcMain.handle('persuaid-call-hud-sync-size', (_event, size) => {
  if (!mainWindow || mainWindow.isDestroyed() || !callHudActive) return;
  try {
    const h = Number(size && size.height);
    if (!Number.isFinite(h) || h < 1) return;
    const { workArea } = screen.getPrimaryDisplay();
    const b = mainWindow.getBounds();
    const maxH = Math.max(160, workArea.height - 24);
    const nextH = Math.round(Math.min(Math.max(h, 72), maxH));
    /* Top edge fixed so the pill stays put; blur/vibrancy window matches content height. */
    mainWindow.setBounds({ x: b.x, y: b.y, width: b.width, height: nextH });
  } catch (e) {
    console.error('[persuaid-call-hud-sync-size]', e && e.message);
  }
});

ipcMain.handle('call-compact-layout', (_event, compact) => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  try {
    if (compact) {
      if (!preCompactBounds) {
        preCompactBounds = mainWindow.getBounds();
      }
      const { workArea } = screen.getPrimaryDisplay();
      // macOS title bar + webview needs ~90px+; 56px was too short and clipped the pill to a sliver.
      const barH = 120;
      const barW = Math.min(420, Math.max(280, workArea.width - 48));
      const bx = workArea.x + Math.round((workArea.width - barW) / 2);
      const by = workArea.y;
      mainWindow.setBounds({ x: bx, y: by, width: barW, height: barH });
      mainWindow.setAlwaysOnTop(true, 'floating');
      mainWindow.setResizable(false);
      // Apple-like dark gray (not pure black) behind the web frosted layer.
      try {
        mainWindow.setBackgroundColor('#2c2c2e');
      } catch (_) {}
    } else {
      mainWindow.setAlwaysOnTop(false);
      mainWindow.setResizable(true);
      try {
        mainWindow.setBackgroundColor('#000000');
      } catch (_) {}
      if (preCompactBounds) {
        mainWindow.setBounds(preCompactBounds);
        preCompactBounds = null;
      } else {
        mainWindow.maximize();
      }
    }
  } catch (e) {
    console.error('[call-compact-layout]', e && e.message);
  }
});

// Desktop entry: welcome first (handles auth check with timeout), then sign-in → dashboard.
const DESKTOP_ENTRY_PATH = '/welcome';
const DESKTOP_ENTRY_FILE = 'welcome.html';


/** Serve static files from dir (Next.js export: /welcome -> welcome.html, etc.). Used when packaged so DMG loads reliably. */
function createBundleServer(dir) {
  const rootDir = path.resolve(dir);
  return http.createServer((req, res) => {
    let urlPath = req.url.split('?')[0].split('#')[0];
    if (urlPath === '/' || urlPath === '') {
      urlPath = DESKTOP_ENTRY_PATH;
    }
    if (urlPath.startsWith('/')) urlPath = urlPath.slice(1);


    let filePath = path.join(rootDir, urlPath);
    if (!path.extname(filePath)) {
      const htmlPath = filePath + '.html';
      if (fs.existsSync(htmlPath)) {
        filePath = htmlPath;
      } else {
        const dirIndex = path.join(filePath, 'index.html');
        filePath = fs.existsSync(dirIndex) ? dirIndex : htmlPath;
      }
    }
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(rootDir)) {
      console.warn('Forbidden path:', urlPath, '→', resolved);
      res.writeHead(403).end('Forbidden');
      return;
    }
    if (!fs.existsSync(resolved)) {
      console.warn('File not found:', urlPath, '→', resolved);
      res.writeHead(404).end('Not Found');
      return;
    }
    fs.readFile(resolved, (err, data) => {
      if (err) {
        console.error('Error reading file:', resolved, err.message);
        res.writeHead(500).end('Internal Server Error');
        return;
      }
      const ext = path.extname(resolved).toLowerCase();
      const types = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.ico': 'image/x-icon',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
      };
      res.setHeader('Content-Type', types[ext] || 'application/octet-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.end(data);
    });
  });
}

/** Read DEEPGRAM_API_KEY from process.env or from userData/.env (one line: DEEPGRAM_API_KEY=...) */
function getDeepgramApiKey() {
  if (process.env.DEEPGRAM_API_KEY) return process.env.DEEPGRAM_API_KEY.trim();
  try {
    const userDataDir = app.getPath('userData');
    const envPath = path.join(userDataDir, '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const m = content.match(/DEEPGRAM_API_KEY\s*=\s*["']?([^"'\s\n]+)/);
      if (m) return m[1].trim();
    }
  } catch (e) {
    console.warn('Could not read .env from userData:', e.message);
  }
  return null;
}

/** Start in-app STT WebSocket proxy (dev / optional local STT only). Production DMG uses relay URL baked in the static export. */
function startSttProxy(apiKey) {
  if (!apiKey) {
    debugLog('[STT] Not starting proxy – no DEEPGRAM_API_KEY configured');
    return;
  }
  if (sttProxyServer) {
    debugLog('[STT] Proxy already running on port', STT_PROXY_PORT);
    return;
  }

  const server = http.createServer();

  // Attach before WebSocketServer and before listen so EADDRINUSE is always handled (avoids main-process crash dialog).
  server.on('error', (err) => {
    debugLog('[STT] Proxy server error:', err && err.message);
    if (err && err.code === 'EADDRINUSE') {
      debugLog(
        '[STT] Port',
        STT_PROXY_PORT,
        'already in use — another Persuaid, `desktop:dev`, or `stt:proxy`. Not starting a second proxy; existing listener on 2998 will be used.'
      );
    }
    try {
      server.close();
    } catch (_) {}
    if (sttProxyServer === server) sttProxyServer = null;
  });

  const wss = new WebSocketServer({ server });

  wss.on('connection', (clientWs, req) => {
    const rawUrl = req.url || '/v1/listen';
    const pathPart = rawUrl.split('?')[0] || '/v1/listen';
    const query = rawUrl.includes('?') ? rawUrl.slice(rawUrl.indexOf('?')) : '';
    const deepgramUrl = `${DEEPGRAM_ORIGIN}${pathPart}${query}`;

    debugLog('[STT] Client connected to proxy:', rawUrl);
    debugLog('[STT] Connecting upstream to Deepgram:', deepgramUrl);

    const WebSocket = require('ws');
    const upstream = new WebSocket(deepgramUrl, {
      headers: {
        Authorization: `Token ${apiKey}`,
      },
    });

    const pending = [];

    clientWs.on('message', (data) => {
      const size = (data && (data.length || data.byteLength || data.size)) || 0;
      debugLog('[STT] Received audio/message from renderer, bytes:', size);

      if (upstream.readyState === upstream.OPEN) {
        upstream.send(data);
      } else {
        pending.push(data);
      }
    });

    clientWs.on('error', (err) => {
      debugLog('[STT] Client WS error:', err && err.message);
    });

    clientWs.on('close', () => {
      debugLog('[STT] Client WS closed');
      try {
        upstream.send(JSON.stringify({ type: 'CloseStream' }));
      } catch (_) {}
      try {
        upstream.close();
      } catch (_) {}
    });

    upstream.on('open', () => {
      debugLog('[STT] Upstream Deepgram connection open');
      while (pending.length > 0) {
        upstream.send(pending.shift());
      }
    });

    upstream.on('message', (data) => {
      const text = Buffer.isBuffer(data) ? data.toString('utf8') : String(data);
      debugLog('[STT] Message from Deepgram:', text.slice(0, 500));
      if (clientWs.readyState === clientWs.OPEN) {
        clientWs.send(data);
      }
    });

    upstream.on('error', (err) => {
      debugLog('[STT] Deepgram upstream error:', err && err.message);
      try { clientWs.close(1011, 'Upstream error'); } catch (_) {}
    });

    upstream.on('close', (code, reason) => {
      debugLog('[STT] Deepgram upstream closed:', code, String(reason || ''));
      try { clientWs.close(); } catch (_) {}
    });
  });

  server.listen(STT_PROXY_PORT, '127.0.0.1', () => {
    sttProxyServer = server;
    debugLog('[STT] Proxy listening on ws://127.0.0.1:' + STT_PROXY_PORT);
  });
}

/** Serve app bundle via app://persuaid/ (unpacked only). Packaged app uses HTTP server so DMG loads correctly. */
function registerAppProtocol() {
  protocol.registerFileProtocol(APP_PROTOCOL, (request, callback) => {
    try {
      const url = new URL(request.url);
      let pathname = decodeURIComponent(url.pathname);
      if (pathname.startsWith('/')) pathname = pathname.slice(1);
      if (!pathname) pathname = DESKTOP_ENTRY_FILE;
      let filePath = path.join(OUT_DIR, pathname);
      if (!path.extname(filePath)) {
        const htmlPath = filePath + '.html';
        if (fs.existsSync(htmlPath)) filePath = htmlPath;
        else {
          const dirIndex = path.join(filePath, 'index.html');
          filePath = fs.existsSync(dirIndex) ? dirIndex : htmlPath;
        }
      }
      const resolved = path.normalize(path.resolve(filePath));
      const outResolved = path.resolve(OUT_DIR);
      if (!resolved.startsWith(outResolved)) {
        callback({ error: -3 });
        return;
      }
      if (!fs.existsSync(resolved)) {
        callback({ error: -6 });
        return;
      }
      callback({ path: resolved });
    } catch (e) {
      callback({ error: -2 });
    }
  });
}

const preloadPath = path.join(__dirname, 'preload.js');

/** Menu + optional auto-open so you can inspect renderer errors (Console) when debugging Start Call, STT, etc. */
function setupInspectorSupport(win) {
  if (process.env.ELECTRON_OPEN_DEVTOOLS === '1') {
    win.webContents.once('did-finish-load', () => {
      try {
        win.webContents.openDevTools({ mode: 'detach' });
      } catch (_) {}
    });
  }
  const showDevMenu =
    !app.isPackaged ||
    process.env.DESKTOP_DEV === '1' ||
    process.env.ELECTRON_OPEN_DEVTOOLS === '1';

  const isMac = process.platform === 'darwin';

  // macOS: always install an app menu labeled "Persuaid". If we skip this (e.g. packaged + no dev flags),
  // Electron's default menu keeps the name "Electron" in the menu bar.
  if (isMac) {
    const template = [];
    template.push({
      label: APP_DISPLAY_NAME,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    });
    if (showDevMenu) {
      template.push({
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'pasteAndMatchStyle' },
          { role: 'delete' },
          { role: 'selectAll' },
        ],
      });
      template.push({
        label: 'View',
        submenu: [
          { role: 'reload' },
          { type: 'separator' },
          {
            label: 'Toggle Developer Tools',
            role: 'toggleDevTools',
            accelerator: 'Alt+Command+I',
          },
        ],
      });
    }
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
    return;
  }

  if (!showDevMenu) return;
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: 'File',
        submenu: [{ role: 'quit' }],
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'pasteAndMatchStyle' },
          { role: 'delete' },
          { role: 'selectAll' },
        ],
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { type: 'separator' },
          {
            label: 'Toggle Developer Tools',
            role: 'toggleDevTools',
            accelerator: 'Ctrl+Shift+I',
          },
        ],
      },
    ])
  );
}

/** Packaged macOS app launched from the DMG volume: permissions are unreliable — force copy to /Applications. */
function enforceApplicationsInstallOnMac() {
  if (process.platform !== 'darwin' || !app.isPackaged) return true;
  const execPath = process.execPath || '';
  if (!execPath.startsWith('/Volumes/')) return true;
  try {
    dialog.showErrorBox(
      'Move Persuaid to Applications',
      'Open Persuaid from Applications for microphone access and reliable updates.\n\nQuit, drag Persuaid from the disk image into your Applications folder, then launch it from there.'
    );
  } catch (_) {}
  return false;
}

function createWindow() {
  const isMac = process.platform === 'darwin';
  /** Frameless + transparent on macOS so the app can look like a floating glass HUD (no native title bar). */
  const framelessMac = isMac;
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    frame: !framelessMac,
    transparent: framelessMac,
    backgroundColor: framelessMac ? '#00000000' : '#000000',
    icon: getWindowIcon(),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      partition: 'persist:persuaid',
      preload: fs.existsSync(preloadPath) ? preloadPath : undefined,
      webSecurity: false, // Allow loading local files
      // Helps Web Audio / mic capture when DevTools is open or window is in the background.
      backgroundThrottling: false,
    },
    title: 'Persuaid',
  });

  if (framelessMac) {
    try {
      mainWindow.setBackgroundColor('#00000000');
    } catch (_) {}
  }

  // Google OAuth often treats Electron's default User-Agent as an embedded webview and skips or
  // short-circuits the normal account/consent flow. Strip the Electron token so navigations look
  // like a normal Chrome browser (renderer still detects the shell via preload `window.persuaid`).
  try {
    const ua = mainWindow.webContents.getUserAgent();
    const chromeLike = ua.replace(/\s*Electron\/[^\s]+/gi, '').trim();
    if (chromeLike.length > 0) {
      mainWindow.webContents.setUserAgent(chromeLike);
    }
  } catch (_) {}

  // Start maximized (full screen) when entering the workspace / app
  mainWindow.maximize();

  setupInspectorSupport(mainWindow);

  /**
   * OAuth return URLs: Supabase may send the webview to `persuaid://auth/callback?...` (allow-listed)
   * or to the live site if `redirect_to` fails. Rewrite both to the in-app HTTP origin so PKCE + session
   * exchange run in the same partition (desktop:dev + packaged).
   */
  function attachDesktopOAuthReturnRewrites(httpAppOrigin) {
    function rewireOAuthNavigation(event, url) {
      const target = rewriteExternalOAuthToApp(url, httpAppOrigin);
      if (!target) return;
      event.preventDefault();
      console.log('[desktop] OAuth return rewired to app:', target);
      mainWindow.loadURL(target);
    }
    mainWindow.webContents.on('will-navigate', (event, url) => {
      rewireOAuthNavigation(event, url);
    });
    mainWindow.webContents.on('will-redirect', (event, url, _isInPlace, isMainFrame) => {
      if (!isMainFrame) return;
      rewireOAuthNavigation(event, url);
    });
  }

  function loadBundle() {
    const entryFile = path.join(OUT_DIR, DESKTOP_ENTRY_FILE);
    console.log('Checking for entry file:', entryFile);
    console.log('OUT_DIR:', OUT_DIR);
    console.log('Entry file exists:', fs.existsSync(entryFile));
    
    if (!fs.existsSync(entryFile)) {
      console.error('Entry file not found:', entryFile);
      mainWindow.loadURL('data:text/html,' + encodeURIComponent(`
        <!DOCTYPE html><html><head><meta charset="utf-8"><title>Persuaid</title></head><body style="font-family:sans-serif;padding:2rem;max-width:480px;margin:0 auto;color:#333;">
        <h1>App bundle incomplete</h1>
        <p>Run <code>npm run build</code> then try again.</p>
        <p>Looking for: ${entryFile}</p>
        </body></html>
      `));
      return;
    }
    // Serve bundle over HTTP (same as DMG) so the window never gets a white screen.
    const bundleUrl = `http://127.0.0.1:${BUNDLE_SERVER_PORT}${DESKTOP_ENTRY_PATH}`;
    console.log('Serving bundle from', OUT_DIR, '→', bundleUrl);
    bundleHttpServer = createBundleServer(OUT_DIR);
    bundleHttpServer.on('error', (err) => {
      console.error('Bundle server error:', err);
    });
    const showBundleError = (msg) => {
      mainWindow.loadURL('data:text/html,' + encodeURIComponent(`
        <!DOCTYPE html><html><head><meta charset="utf-8"><title>Persuaid</title></head><body style="font-family:sans-serif;padding:2rem;max-width:480px;margin:2rem auto;color:#333;background:#0a0a0a;color:#f9fafb;">
        <h1>Could not load app</h1><p>${msg}</p><p>Try rebuilding with <code>npm run desktop:build</code>.</p>
        </body></html>
      `));
    };
    bundleHttpServer.listen(BUNDLE_SERVER_PORT, '127.0.0.1', () => {
      console.log('Bundle server listening on', bundleUrl);
      mainWindow.webContents.once('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        console.error('Failed to load:', validatedURL, errorCode, errorDescription);
        if (validatedURL === bundleUrl || validatedURL.startsWith('http://127.0.0.1:' + BUNDLE_SERVER_PORT)) {
          showBundleError('The app bundle failed to load. (' + errorDescription + ')');
        }
      });
      mainWindow.webContents.on('did-finish-load', () => {
        console.log('Page loaded successfully');
      });
      setImmediate(() => mainWindow.loadURL(bundleUrl));
    });
    bundleHttpServer.once('error', (err) => {
      console.error('Bundle server failed to listen:', err);
      showBundleError('Could not start app server (port ' + BUNDLE_SERVER_PORT + ' in use?). ' + err.message);
    });
  }

  // In dev mode, load Next.js dev server so /api (token, suggestions) work. Run "npm run dev" in another terminal first.
  if (forceDevServer) {
    const devPort = (process.env.NEXT_DEV_PORT || process.env.PORT || '3000').replace(/^:/, '').trim() || '3000';
    // Use localhost (not 127.0.0.1): Next dev treats them as different origins; 127.0.0.1 triggers
    // "Cross origin request … to /_next/*" and can break HMR/chunks in a future Next major.
    const localOrigin = `http://localhost:${devPort}`;
    const devUrl = `${localOrigin}/welcome`;
    console.log('Desktop dev: loading', devUrl, '(set NEXT_DEV_PORT if Next is not on this port)');
    mainWindow.loadURL(devUrl);
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      if (errorCode !== -3) console.error('Failed to load:', validatedURL, errorCode, errorDescription);
    });
    attachDesktopOAuthReturnRewrites(localOrigin);
    return;
  }

  attachDesktopOAuthReturnRewrites(`http://127.0.0.1:${BUNDLE_SERVER_PORT}`);

  // Production / bundled: serve static export from out/
  loadBundle();

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (bundleHttpServer) {
      bundleHttpServer.close();
      bundleHttpServer = null;
    }
  });
}

if (gotSingleInstanceLock) {
  if (process.platform === 'darwin') {
    app.on('open-url', (event, url) => {
      event.preventDefault();
      enqueueOAuthDeepLink(url);
      tryFlushPendingOAuthDeepLink();
    });
  }

  app.on('second-instance', (_event, argv) => {
    const url = argv.find((a) => typeof a === 'string' && a.startsWith('persuaid://'));
    if (url) {
      enqueueOAuthDeepLink(url);
      tryFlushPendingOAuthDeepLink();
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

if (gotSingleInstanceLock) {
app.whenReady().then(async () => {
  if (!enforceApplicationsInstallOnMac()) {
    app.quit();
    return;
  }
  try {
    fs.writeFileSync('/tmp/persuaid-ready.txt', new Date().toISOString());
  } catch (e) {
    console.error('persuaid ready write failed', e.message);
  }
  try {
    const logPath = path.join(app.getPath('userData'), 'debug.log');
    debugLogStream = fs.createWriteStream(logPath, { flags: 'a' });
    debugLogStream.write('\n--- ' + new Date().toISOString() + ' ---\n');
  } catch (_) {}
  try {
    const tmpLog = '/tmp/persuaid-debug.log';
    debugLogStreamTmp = fs.createWriteStream(tmpLog, { flags: 'a' });
    debugLogStreamTmp.write('\n--- ' + new Date().toISOString() + ' ---\n');
  } catch (_) {}
  logMicDiagnosticsAtStartup();
  registerAppProtocol();
  registerPersuaidAsDefaultProtocolClient();
  const envPath = path.join(app.getPath('userData'), '.env');
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath, override: true });
  }
  debugLog('[STT] Reading .env from:', envPath);
  debugLog('[AI] OpenAI runs on the Next.js server only. Set NEXT_PUBLIC_API_BASE_URL=https://persuaid.app when building the desktop bundle so the app calls /api on Vercel.');
  const allowLocalSttProxy = !isPackaged || process.env.STT_LOCAL_PROXY === '1';
  const deepgramKey = allowLocalSttProxy ? getDeepgramApiKey() : null;
  if (allowLocalSttProxy && deepgramKey) {
    debugLog('[STT] DEEPGRAM_API_KEY loaded: yes (length', deepgramKey.length + ') — starting local ws://127.0.0.1:2998 relay');
    startSttProxy(deepgramKey);
  } else if (!allowLocalSttProxy) {
    debugLog('[STT] Packaged build: local Deepgram proxy disabled. Use NEXT_PUBLIC_STT_PROXY_URL=wss://stt.persuaid.app (Railway relay).');
  } else {
    debugLog('[STT] DEEPGRAM_API_KEY loaded: no – optional for dev; set STT_LOCAL_PROXY=1 in packaged app to enable local relay on 2998.');
  }
  // macOS: never blindly callback(true) for "media". That skips TCC — Persuaid never appears under
  // System Settings → Microphone and getUserMedia can fail or see silence. Route through askForMediaAccess.
  /**
   * Chromium usually sends permission "media" for getUserMedia. On some macOS builds the bundled
   * app loads from http://127.0.0.1 — we then see permission "unknown" with audio in details, or
   * unknown with a localhost URL and empty types. If we only accept "media", we callback(false)
   * and TCC never runs (no prompt, app never listed under Microphone).
   */
  function isGetUserMediaStyleRequest(perm, det) {
    if (perm === 'media') return true;
    if (perm !== 'unknown') return false;
    const mt = det && Array.isArray(det.mediaTypes) ? det.mediaTypes : [];
    const rt = det && Array.isArray(det.requestedMediaTypes) ? det.requestedMediaTypes : [];
    if (mt.includes('audio') || mt.includes('video') || rt.includes('audio') || rt.includes('video')) {
      return true;
    }
    const url = String((det && (det.requestingUrl || det.securityOrigin)) || '');
    if (url.includes('127.0.0.1') || url.includes('localhost')) {
      return true;
    }
    return false;
  }

  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    const reqTypes = details && details.requestedMediaTypes;
    const mediaTypes = details && details.mediaTypes;
    debugLog(
      '[MIC_DEBUG] setPermissionRequestHandler fired permission=',
      permission,
      'details.mediaTypes=',
      mediaTypes,
      'details.requestedMediaTypes=',
      reqTypes,
      'securityOrigin=',
      details && details.securityOrigin,
      'requestingUrl=',
      details && details.requestingUrl
    );
    try {
      debugLog(
        '[MIC_DEBUG] setPermissionRequestHandler details JSON:',
        details != null ? JSON.stringify(details) : '(no details)'
      );
    } catch (e) {
      debugLog('[MIC_DEBUG] setPermissionRequestHandler details (stringify failed):', e && e.message);
    }

    if (!isGetUserMediaStyleRequest(permission, details)) {
      debugLog(
        '[MIC_DEBUG] not a getUserMedia-style request → callback(false). permission=',
        permission
      );
      callback(false);
      return;
    }
    if (permission === 'unknown') {
      debugLog(
        '[MIC_DEBUG] permission=unknown but treating as media capture (localhost / audio) — running macOS TCC path'
      );
    }
    if (process.platform !== 'darwin') {
      debugLog('[MIC_DEBUG] media permission non-darwin → callback(true)');
      callback(true);
      return;
    }
    const types =
      details && Array.isArray(details.mediaTypes) && details.mediaTypes.length > 0
        ? details.mediaTypes
        : ['audio'];
    (async () => {
      try {
        let granted = true;
        if (types.includes('audio')) {
          debugLog('[MIC_DEBUG] Chromium media handler: calling askForMediaAccess("microphone") for audio');
          const m = await systemPreferences.askForMediaAccess('microphone');
          debugLog('[MIC_DEBUG] Chromium media handler: askForMediaAccess(mic) returned', m);
          granted = granted && m;
        }
        if (types.includes('video')) {
          debugLog('[MIC_DEBUG] Chromium media handler: calling askForMediaAccess("camera") for video');
          const v = await systemPreferences.askForMediaAccess('camera');
          granted = granted && v;
        }
        debugLog(
          '[MIC_DEBUG] Chromium media handler final granted=',
          granted,
          '→ callback(' + granted + ')'
        );
        debugLog('[macOS] Chromium media permission → TCC:', types.join(',') || 'audio', '→', granted ? 'granted' : 'denied');
        callback(granted);
      } catch (e) {
        debugLog('[MIC_DEBUG] Chromium media handler error → callback(false):', e && e.message);
        debugLog('[macOS] media permission handler error:', e && e.message);
        callback(false);
      }
    })();
  });
  // macOS: do not override the Dock icon when packaged — `app.dock.setIcon(PNG)` draws a flat
  // square and ignores the bundle’s AppIcon.icns squircle treatment. Unpackaged dev: prefer .icns.
  if (process.platform === 'darwin' && app.dock && !app.isPackaged) {
    const icnsPath = path.join(__dirname, '..', 'build', 'icon.icns');
    const dockPath = fs.existsSync(icnsPath) ? icnsPath : resolveAppLogoPath();
    if (dockPath) {
      try {
        app.dock.setIcon(dockPath);
      } catch (_) {}
    }
  }
  createWindow();
  const argvOAuth = process.argv.find((a) => typeof a === 'string' && a.startsWith('persuaid://'));
  if (argvOAuth) enqueueOAuthDeepLink(argvOAuth);
  tryFlushPendingOAuthDeepLink();
});
}

app.on('window-all-closed', () => {
  if (bundleHttpServer) bundleHttpServer.close();
  if (sttProxyServer) {
    sttProxyServer.close();
    sttProxyServer = null;
  }
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
