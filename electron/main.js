const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

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
  const welcomeIndex = path.join(outDirUnpacked, 'welcome', 'index.html');
  return fs.existsSync(welcomeIndex);
};

const useBundledFrontend = !forceDevServer && (isPackaged || bundledOutExists());
const OUT_DIR = isPackaged ? outDirPackaged : outDirUnpacked;

let mainWindow;
let server;

function serveStaticFromOut(dir, port) {
  return http.createServer((req, res) => {
    let filePath = path.join(dir, req.url === '/' ? 'index.html' : req.url);
    if (!path.extname(filePath)) {
      filePath = path.join(filePath, 'index.html');
    }
    if (!filePath.startsWith(path.resolve(dir))) {
      res.writeHead(403);
      res.end();
      return;
    }
    fs.readFile(filePath, (err, data) => {
      if (err) {
        if (err.code === 'ENOENT') {
          fs.readFile(path.join(dir, 'index.html'), (e, fallback) => {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(e ? 'Not found' : fallback);
          });
        } else {
          res.writeHead(500);
          res.end();
        }
        return;
      }
      const ext = path.extname(filePath);
      const types = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.ico': 'image/x-icon',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.woff2': 'font/woff2',
      };
      res.setHeader('Content-Type', types[ext] || 'application/octet-stream');
      res.end(data);
    });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: 'Persuaid',
  });

  const DESKTOP_ENTRY = '/welcome';

  if (useBundledFrontend) {
    // Production (DMG) or testing built app: serve ONLY from bundled out dir.
    const port = 2999;
    server = serveStaticFromOut(OUT_DIR, port);
    server.listen(port, () => {
      const url = `http://localhost:${port}${DESKTOP_ENTRY}`;
      mainWindow.loadURL(url);
    });
  } else {
    // Dev: load Next.js dev server. Run "npm run dev" in another terminal.
    const devUrl = `http://localhost:3000${DESKTOP_ENTRY}`;
    mainWindow.loadURL(devUrl);
    mainWindow.webContents.on('did-fail-load', (_e, code, desc) => {
      if (code === -6 || desc.includes('ERR_CONNECTION_REFUSED')) {
        mainWindow.webContents.executeJavaScript(`
          document.body.innerHTML = '<div style="font-family:sans-serif;padding:2rem;text-align:center;color:#666;">
            <p>Cannot connect to <strong>localhost:3000</strong>.</p>
            <p>Run <strong>npm run dev</strong> in another terminal, then reopen this app or refresh.</p>
          </div>';
        `);
      }
    });
  }

  if (!isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (server) {
      server.close();
      server = null;
    }
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (server) server.close();
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
