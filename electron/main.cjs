const { app, BrowserWindow, session, shell } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DEV_URL = process.env.ELECTRON_START_URL || '';
const DIST_DIR = path.join(__dirname, '..', 'frontend', 'dist');
const UPLOADS_DIR = path.join(__dirname, '..', 'backend', 'uploads');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.apk': 'application/vnd.android.package-archive',
};

// Tiny static server so BrowserRouter routes (/admin, /scanner ...) and local /uploads work in production.
function startStaticServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);

      // Serve local uploaded images directly from backend/uploads if available
      if (urlPath.startsWith('/uploads/')) {
        const uploadFile = path.join(UPLOADS_DIR, path.basename(urlPath));
        if (uploadFile.startsWith(UPLOADS_DIR) && fs.existsSync(uploadFile) && !fs.statSync(uploadFile).isDirectory()) {
          res.writeHead(200, { 'Content-Type': MIME[path.extname(uploadFile).toLowerCase()] || 'application/octet-stream' });
          fs.createReadStream(uploadFile).pipe(res);
          return;
        }
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not Found');
        return;
      }

      let filePath = path.join(DIST_DIR, urlPath);
      if (!filePath.startsWith(DIST_DIR) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(DIST_DIR, 'index.html');
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
}

async function createWindow() {
  // Allow camera (QR scanner) for our own pages only
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(['media', 'mediaKeySystem', 'clipboard-sanitized-write'].includes(permission));
  });

  // Bypass hotlink / referer blocking from external concert image CDNs (e.g. ThaiTicketMajor, Unsplash)
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const headers = { ...details.requestHeaders };
    if (details.resourceType === 'image' && /^https?:\/\//i.test(details.url) && !details.url.includes('127.0.0.1') && !details.url.includes('localhost')) {
      delete headers.Referer;
      delete headers.referer;
      headers['User-Agent'] =
        headers['User-Agent'] ||
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
    }
    callback({ requestHeaders: headers });
  });

  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 380,
    minHeight: 600,
    backgroundColor: '#07070b',
    title: 'SoundWave Pass',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      additionalArguments: DEV_URL ? [] : ['--soundwave-production'],
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (DEV_URL) {
    await win.loadURL(DEV_URL);
  } else {
    const port = await startStaticServer();
    await win.loadURL(`http://127.0.0.1:${port}/`);
  }
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
