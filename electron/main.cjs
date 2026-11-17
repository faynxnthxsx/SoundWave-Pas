const { app, BrowserWindow, ipcMain, session, shell } = require('electron');
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DEV_URL = process.env.ELECTRON_START_URL || '';
const PUBLIC_WEB_ORIGIN = 'https://soundwave-pas.vercel.app';
const DIST_DIR = path.join(__dirname, '..', 'frontend', 'dist');
const UPLOADS_DIR = path.join(__dirname, '..', 'backend', 'uploads');

let mainWindow = null;
let pendingOAuthCleanup = null;
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
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        ...(ext === '.html' ? { 'Cross-Origin-Opener-Policy': 'same-origin-allow-popups' } : {}),
      });
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
  mainWindow = win;
  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null;
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    // Allow printable Tax Invoice / blank popups, Google OAuth, and VeriTrans/Midtrans popups inside Electron
    if (
      !url ||
      url === 'about:blank' ||
      url.startsWith('https://accounts.google.com') ||
      url.startsWith('https://app.sandbox.midtrans.com') ||
      url.startsWith('https://app.midtrans.com')
    ) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          autoHideMenuBar: true,
          backgroundColor: '#07070b',
        },
      };
    }
    if (/^https?:\/\//i.test(url)) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  if (DEV_URL) {
    await win.loadURL(DEV_URL);
  } else {
    const port = await startStaticServer();
    await win.loadURL(`http://127.0.0.1:${port}/`);
  }
}

function buildOAuthResultHtml(isSuccess, detailText) {
  const title = isSuccess ? 'เข้าสู่ระบบ SoundWave Pass สำเร็จ' : 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ';
  const color = isSuccess ? '#22d3ee' : '#f87171';
  const icon = isSuccess ? '✓' : '!';
  return `<!doctype html>
<html lang="th">
<head><meta charset="utf-8" /><title>${title}</title></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#07070b;color:#f8fafc;font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:24px;">
  <div style="max-width:420px;background:#11131d;border:1px solid rgba(255,255,255,0.12);border-radius:16px;padding:28px 24px;">
    <div style="width:48px;height:48px;margin:0 auto 14px;border-radius:999px;background:rgba(34,211,238,0.14);color:${color};display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;">${icon}</div>
    <h2 style="margin:0 0 8px;font-size:18px;color:${color};">${title}</h2>
    <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.5;">${detailText}</p>
  </div>
  <script>setTimeout(function(){ window.close(); }, 1500);</script>
</body>
</html>`;
}

function runExternalGoogleOAuth(clientId) {
  if (typeof pendingOAuthCleanup === 'function') {
    pendingOAuthCleanup('เริ่มการเข้าสู่ระบบด้วย Google รอบใหม่');
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    let expectedState = '';

    const server = http.createServer((req, res) => {
      const reqUrl = new URL(req.url || '/', 'http://127.0.0.1');
      if (reqUrl.pathname !== '/oauth-callback') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not Found');
        return;
      }

      const accessToken = reqUrl.searchParams.get('access_token') || '';
      const idToken = reqUrl.searchParams.get('id_token') || '';
      const error = reqUrl.searchParams.get('error') || '';
      const errorDesc = reqUrl.searchParams.get('error_description') || '';
      const returnedState = reqUrl.searchParams.get('state') || '';

      if (returnedState !== expectedState) {
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(buildOAuthResultHtml(false, 'State ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง'));
        cleanup();
        if (!settled) {
          settled = true;
          reject(new Error('Google OAuth state mismatch'));
        }
        return;
      }

      const ok = Boolean(!error && (accessToken || idToken));
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(
        buildOAuthResultHtml(
          ok,
          ok
            ? 'ระบบส่งข้อมูลกลับไปยังแอป SoundWave Pass Desktop แล้ว คุณสามารถปิดแท็บนี้ได้ทันที'
            : errorDesc || error || 'ไม่ได้รับข้อมูลยืนยันตัวตนจาก Google'
        )
      );

      cleanup();
      if (mainWindow && !mainWindow.isDestroyed()) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }

      if (!settled) {
        settled = true;
        if (ok) {
          resolve({ access_token: accessToken || undefined, credential: idToken || undefined });
        } else {
          reject(new Error(error === 'access_denied' ? 'access_denied' : errorDesc || error || 'Google Sign-In failed'));
        }
      }
    });

    const timeoutId = setTimeout(() => {
      cleanup('หมดเวลาการเข้าสู่ระบบด้วย Google กรุณาลองใหม่อีกครั้ง');
    }, 3 * 60 * 1000);

    function cleanup(cancelReason) {
      clearTimeout(timeoutId);
      if (pendingOAuthCleanup === cancelCurrent) {
        pendingOAuthCleanup = null;
      }
      try {
        server.close();
      } catch {
        /* ignore */
      }
      if (cancelReason && !settled) {
        settled = true;
        reject(new Error(cancelReason));
      }
    }

    function cancelCurrent(reason) {
      cleanup(reason || 'cancelled');
    }

    pendingOAuthCleanup = cancelCurrent;

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      const callbackUrl = `http://127.0.0.1:${port}/oauth-callback`;
      const nonce = crypto.randomBytes(16).toString('hex');
      expectedState =
        '__sw_desktop__' + Buffer.from(JSON.stringify({ callbackUrl, nonce }), 'utf8').toString('base64url');

      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${encodeURIComponent(PUBLIC_WEB_ORIGIN)}` +
        `&response_type=token%20id_token` +
        `&scope=${encodeURIComponent('openid email profile')}` +
        `&state=${encodeURIComponent(expectedState)}` +
        `&nonce=${encodeURIComponent(nonce)}` +
        `&prompt=select_account`;

      shell.openExternal(authUrl).catch((err) => {
        cleanup(err?.message || 'ไม่สามารถเปิดเบราว์เซอร์เพื่อเข้าสู่ระบบ Google ได้');
      });
    });

    server.on('error', (err) => {
      cleanup(err?.message || 'ไม่สามารถเริ่มต้น Local Callback สำหรับ Google Login ได้');
    });
  });
}

ipcMain.handle('soundwave:google-oauth', async (_event, clientId) => {
  if (!clientId) {
    throw new Error('Google Client ID not configured');
  }
  return runExternalGoogleOAuth(String(clientId));
});

ipcMain.handle('soundwave:google-oauth-cancel', async () => {
  if (typeof pendingOAuthCleanup === 'function') {
    pendingOAuthCleanup('cancelled');
  }
  return true;
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
