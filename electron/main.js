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
  // Next.js static export creates welcome.html (not welcome/index.html)
  const welcomeHtml = path.join(outDirUnpacked, 'welcome.html');
  const welcomeIndex = path.join(outDirUnpacked, 'welcome', 'index.html');
  return fs.existsSync(welcomeHtml) || fs.existsSync(welcomeIndex);
};

const useBundledFrontend = !forceDevServer && (isPackaged || bundledOutExists());
const OUT_DIR = isPackaged ? outDirPackaged : outDirUnpacked;

console.log('Electron startup:', {
  isPackaged,
  forceDevServer,
  bundledOutExists: bundledOutExists(),
  useBundledFrontend,
  OUT_DIR,
});

let mainWindow;
let server;

function serveStaticFromOut(dir, port) {
  return http.createServer((req, res) => {
    // Remove query string and hash
    const urlPath = req.url.split('?')[0].split('#')[0];
    let filePath = path.join(dir, urlPath === '/' ? 'index.html' : urlPath);
    
    // Handle Next.js static export routes (e.g., /welcome -> welcome.html)
    if (!path.extname(filePath)) {
      // First try as a file with .html extension (Next.js static export format)
      const htmlPath = filePath + '.html';
      if (fs.existsSync(htmlPath)) {
        filePath = htmlPath;
      } else {
        // Fallback to index.html in directory
        const dirIndexPath = path.join(filePath, 'index.html');
        if (fs.existsSync(dirIndexPath)) {
          filePath = dirIndexPath;
        } else {
          // If neither exists, try the html path anyway
          filePath = htmlPath;
        }
      }
    }
    
    // Security check: ensure file is within the out directory
    const resolvedDir = path.resolve(dir);
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(resolvedDir)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    
    fs.readFile(filePath, (err, data) => {
      if (err) {
        if (err.code === 'ENOENT') {
          // Try to serve index.html as fallback
          const fallbackPath = path.join(dir, 'index.html');
          fs.readFile(fallbackPath, (e, fallback) => {
            if (e) {
              res.writeHead(404, { 'Content-Type': 'text/html' });
              res.end(`<html><body><h1>404 Not Found</h1><p>File not found: ${urlPath}</p></body></html>`);
            } else {
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(fallback);
            }
          });
        } else {
          res.writeHead(500);
          res.end('Internal Server Error');
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
        '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
        '.eot': 'application/vnd.ms-fontobject',
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
    console.log(`Serving bundled frontend from: ${OUT_DIR}`);
    server = serveStaticFromOut(OUT_DIR, port);
    server.on('error', (err) => {
      console.error('Server error:', err);
    });
    server.listen(port, () => {
      const url = `http://localhost:${port}${DESKTOP_ENTRY}`;
      console.log(`Loading URL: ${url}`);
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
