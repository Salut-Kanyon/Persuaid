const { app, BrowserWindow, session, protocol } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { WebSocketServer } = require('ws');

const STT_PROXY_PORT = 2998;
const DEEPGRAM_ORIGIN = 'wss://api.deepgram.com';
let sttProxyServer = null;

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

// Custom protocol so the app loads from the bundle (no localhost, no HTTP server).
protocol.registerSchemesAsPrivileged([
  { scheme: APP_PROTOCOL, privileges: { standard: true, secure: true, supportFetchAPI: true } },
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

let mainWindow;

const DESKTOP_ENTRY_PATH = '/welcome';
const DESKTOP_ENTRY_FILE = 'welcome.html';

/** Serve static files from dir (Next.js export: /welcome -> welcome.html, etc.). Used when packaged so DMG loads reliably. */
function createBundleServer(dir) {
  return http.createServer((req, res) => {
    let urlPath = req.url.split('?')[0].split('#')[0];
    // Handle root path
    if (urlPath === '/' || urlPath === '') {
      urlPath = DESKTOP_ENTRY_PATH;
    }
    
    let filePath = path.join(dir, urlPath);
    
    // If no extension, try .html or index.html
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
    const dirResolved = path.resolve(dir);
    
    // Security check: ensure file is within the out directory
    if (!resolved.startsWith(dirResolved)) {
      console.warn('Forbidden path:', urlPath, '→', resolved);
      res.writeHead(403).end('Forbidden');
      return;
    }
    
    // Check if file exists
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

/** Start in-app STT WebSocket proxy so the DMG can use transcription without a separate proxy. */
function startSttProxy(apiKey) {
  if (!apiKey || sttProxyServer) return;
  const server = http.createServer();
  const wss = new WebSocketServer({ server });
  wss.on('connection', (clientWs, req) => {
    const pathPart = req.url?.split('?')[0] || '/v1/listen';
    const query = req.url?.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    const deepgramUrl = `${DEEPGRAM_ORIGIN}${pathPart}${query}`;
    const WebSocket = require('ws');
    const upstream = new WebSocket(deepgramUrl, {
      headers: { Authorization: `Token ${apiKey}` },
    });
    const pending = [];
    clientWs.on('message', (data) => {
      if (upstream.readyState === upstream.OPEN) upstream.send(data);
      else pending.push(data);
    });
    upstream.on('open', () => {
      pending.forEach((d) => upstream.send(d));
      clientWs.on('close', () => {
        try {
          upstream.send(JSON.stringify({ type: 'CloseStream' }));
          upstream.close();
        } catch (_) {}
      });
      upstream.on('message', (data) => {
        if (clientWs.readyState === clientWs.OPEN) {
          clientWs.send(Buffer.isBuffer(data) ? data.toString('utf8') : data);
        }
      });
    });
    upstream.on('error', (err) => {
      try { clientWs.close(1011, 'Upstream error'); } catch (_) {}
    });
    upstream.on('close', () => {
      try { clientWs.close(); } catch (_) {}
    });
    clientWs.on('error', () => {
      try { upstream.close(); } catch (_) {}
    });
  });
  server.listen(STT_PROXY_PORT, '127.0.0.1', () => {
    console.log('STT proxy (in-app) listening on ws://127.0.0.1:' + STT_PROXY_PORT);
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') console.warn('STT proxy port', STT_PROXY_PORT, 'in use');
    else console.warn('STT proxy error:', err.message);
  });
  sttProxyServer = server;
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

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      partition: 'persist:persuaid',
      preload: fs.existsSync(preloadPath) ? preloadPath : undefined,
      webSecurity: false, // Allow loading local files
    },
    title: 'Persuaid',
  });

  // Start maximized (full screen) when entering the workspace / app
  mainWindow.maximize();
  
  // Open DevTools for debugging
  if (!isPackaged) {
    mainWindow.webContents.openDevTools();
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
    bundleHttpServer.listen(BUNDLE_SERVER_PORT, '127.0.0.1', () => {
      console.log('Bundle server listening on', bundleUrl);
      mainWindow.loadURL(bundleUrl);
      mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        console.error('Failed to load:', validatedURL, errorCode, errorDescription);
      });
      mainWindow.webContents.on('did-finish-load', () => {
        console.log('Page loaded successfully');
      });
    });
  }

  // Always use HTTP server for better reliability with Next.js static assets
  loadBundle();

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (bundleHttpServer) {
      bundleHttpServer.close();
      bundleHttpServer = null;
    }
  });
}

app.whenReady().then(() => {
  registerAppProtocol();
  const deepgramKey = getDeepgramApiKey();
  if (deepgramKey) startSttProxy(deepgramKey);
  else console.log('No DEEPGRAM_API_KEY in env or userData/.env – STT will not work in desktop app until set.');
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowed = permission === 'media';
    callback(allowed);
  });
  createWindow();
});

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
