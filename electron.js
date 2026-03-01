/**
 * PLAYE Studio Pro v3.0 — Electron Main Process
 */

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');
const axios = require('axios');

let mainWindow;
let pythonProcess;
let backendPort = 8000;

const isDev = process.argv.includes('--dev') || !app.isPackaged;
const backendPath = isDev
  ? path.join(__dirname, 'backend')
  : path.join(process.resourcesPath, 'backend');

const PLAYE_ROOT = 'D:\\PLAYE';
const MODELS_DIR = path.join(PLAYE_ROOT, 'models');
const CACHE_DIR = path.join(PLAYE_ROOT, '.cache');
const TEMP_DIR = path.join(PLAYE_ROOT, 'temp');

/** Dynamic Python detection: D:\PLAYE\venv → .venv → py -3.12 → python */
function findPython() {
  const isWin = process.platform === 'win32';
  const ext = isWin ? 'Scripts\\python.exe' : 'bin/python';
  const candidates = [
    path.join(PLAYE_ROOT, 'venv', ext),
    path.join(backendPath, '.venv', ext),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) { console.log(`[Main] Python: ${p}`); return p; }
  }
  if (isWin) {
    try {
      const p = execSync('py -3.12 -c "import sys; print(sys.executable)"', { encoding: 'utf8' }).trim();
      if (fs.existsSync(p)) { console.log(`[Main] Python (py): ${p}`); return p; }
    } catch {}
  }
  const fb = isWin ? 'python' : 'python3';
  console.log(`[Main] Python fallback: ${fb}`);
  return fb;
}
const PYTHON_PATH = findPython();


const downloadQueue = [];
let isDownloading = false;

function emit(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

async function processDownloadQueue() {
  if (isDownloading) return;
  isDownloading = true;

  const safeUnlink = (filePath) => {
    for (let i = 0; i < 5; i++) {
      try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); return; }
      catch { require('child_process').execSync('timeout /t 1 /nobreak >nul 2>&1', { shell: true }); }
    }
  };

  try {
    while (downloadQueue.length) {
      const task = downloadQueue.shift();
      const { id, url, filename } = task;
      const destination = path.join(MODELS_DIR, filename || `${id}.bin`);

      // Skip if already downloaded
      if (fs.existsSync(destination)) {
        emit('download-progress', { id, percent: 100, speed: 0 });
        emit('model-status-changed', { id, installed: true });
        continue;
      }

      const tempDestination = `${destination}.download`;
      safeUnlink(tempDestination);

      let writer;
      try {
        writer = fs.createWriteStream(tempDestination);
        const startedAt = Date.now();

        const response = await axios({ method: 'get', url, responseType: 'stream', timeout: 300000 });
        const total = Number(response.headers['content-length'] || 0);
        let downloaded = 0;

        response.data.on('data', (chunk) => {
          downloaded += chunk.length;
          const elapsed = Math.max((Date.now() - startedAt) / 1000, 0.001);
          const speed = downloaded / elapsed;
          const percent = total > 0 ? Math.round((downloaded / total) * 100) : 0;
          emit('download-progress', { id, percent, speed });
        });

        response.data.pipe(writer);
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
          response.data.on('error', reject);
        });

        // Windows: renameSync fails if target exists
        if (fs.existsSync(destination)) fs.unlinkSync(destination);
        fs.renameSync(tempDestination, destination);
        emit('download-progress', { id, percent: 100, speed: 0 });
        emit('model-status-changed', { id, installed: true });
      } catch (err) {
        // Close writer first, then delete temp file
        if (writer && !writer.destroyed) {
          writer.destroy();
          await new Promise(r => setTimeout(r, 500));
        }
        safeUnlink(tempDestination);
        emit('download-progress', { id, percent: 0, speed: 0, error: err.message });
        console.error(`[Download] ${id} failed:`, err.message);
      }
    }
  } finally {
    isDownloading = false;
  }
}

function findFreePort() {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
  });
}

function validateBackendPortHandshake(port) {
  try {
    const cmd = process.platform === 'win32'
      ? `netstat -ano | findstr :${port}`
      : `netstat -an | grep :${port}`;
    const out = execSync(cmd, { encoding: 'utf8' });
    const hasListen = /LISTEN/i.test(out) || new RegExp(`127\\.0\\.0\\.1:${port}`).test(out);
    if (hasListen) console.log(`[Main] Port handshake OK: :${port}`);
    else console.warn(`[Main] Port handshake warning: no LISTEN socket for :${port}`);
  } catch (err) {
    console.warn(`[Main] Port handshake check skipped for :${port}: ${err.message}`);
  }
}

async function startPythonBackend() {
  // Use fixed port 8000 (matches preload.js default) — avoid timing bugs
  // Only use dynamic port if 8000 is occupied
  try {
    await new Promise((resolve, reject) => {
      const tester = net.createServer();
      tester.once('error', () => reject());
      tester.listen(8000, '127.0.0.1', () => { tester.close(() => resolve()); });
    });
    backendPort = 8000;
  } catch {
    backendPort = await findFreePort();
    console.warn(`[Main] Port 8000 busy, using ${backendPort}`);
  }
  const pythonPath = PYTHON_PATH;

  console.log(`[Main] Starting backend on port ${backendPort}...`);
  console.log(`[Main] Python: ${pythonPath}`);
  console.log(`[Main] Backend dir: ${backendPath}`);

  for (const dir of [MODELS_DIR, CACHE_DIR, TEMP_DIR]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    pythonProcess = spawn(pythonPath, [
      '-u',
      '-m', 'uvicorn',
      'app.main:app',
      '--host', '127.0.0.1',
      '--port', backendPort.toString()
    ], {
      cwd: backendPath,
      env: {
        ...process.env,
        PYTHONUNBUFFERED: '1',
        PLAYE_MODELS_DIR: MODELS_DIR,
        TORCH_HOME: path.join(CACHE_DIR, 'torch'),
        HF_HOME: path.join(CACHE_DIR, 'huggingface'),
        TRANSFORMERS_CACHE: path.join(CACHE_DIR, 'huggingface'),
        PIP_CACHE_DIR: path.join(CACHE_DIR, 'pip'),
        TEMP: TEMP_DIR,
        TMP: TEMP_DIR,
        API_PORT: backendPort.toString()
      }
    });

    const onBackendOutput = (chunk) => {
      const line = chunk.toString();
      console.log(`[Python] ${line.trim()}`);
      if (line.includes('Uvicorn running') || line.includes('Application startup complete')) {
        validateBackendPortHandshake(backendPort);
        resolve();
      }
    };

    pythonProcess.stdout.on('data', onBackendOutput);
    pythonProcess.stderr.on('data', onBackendOutput);

    pythonProcess.on('error', (err) => {
      reject(new Error(`Python не найден: ${pythonPath}\n\n${err.message}`));
    });

    setTimeout(() => reject(new Error('Backend timeout (120s). Проверьте D:\\PLAYE\\venv')), 120000);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    backgroundColor: '#08090c',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'assets/icon.png')
  });

  mainWindow.loadFile(path.join(__dirname, 'frontend/index.html'));
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(`window.API_PORT = ${backendPort};`);
  });

  if (isDev) mainWindow.webContents.openDevTools();
}

ipcMain.handle('get-api-url', () => `http://127.0.0.1:${backendPort}/api`);
ipcMain.handle('open-folder', async (_event, folderPath) => shell.openPath(folderPath || MODELS_DIR));


ipcMain.handle('check-models', async () => {
  // Read manifest and check which model files exist on disk
  try {
    const manifestPath = path.join(MODELS_DIR, 'models_manifest.json');
    if (!fs.existsSync(manifestPath)) return {};
    const raw = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const models = raw.models || raw;
    const statusMap = {};
    for (const [, list] of Object.entries(models)) {
      if (!Array.isArray(list)) continue;
      for (const m of list) {
        if (!m.id || !m.file) continue;
        statusMap[m.id] = fs.existsSync(path.join(MODELS_DIR, m.file));
      }
    }
    return statusMap;
  } catch (err) {
    console.error('[Main] check-models error:', err.message);
    return {};
  }
});

ipcMain.handle('download-model', async (_event, payload = {}) => {
  const id = String(payload.id || payload.model || '');
  const url = String(payload.url || '');
  const filename = String(payload.filename || `${id}.bin`);
  if (!id || !url) throw new Error('id and url are required');
  downloadQueue.push({ id, url, filename });
  processDownloadQueue().catch((err) => {
    emit('download-progress', { id, percent: 0, speed: 0, error: err.message });
  });
  return { status: 'queued', id };
});

ipcMain.handle('download-models-all', async (_event, payload = {}) => {
  const tasks = Array.isArray(payload.tasks) ? payload.tasks : [];
  for (const task of tasks) {
    const id = String(task.id || '');
    const url = String(task.url || '');
    const filename = String(task.file || task.filename || `${id}.bin`);
    if (!id || !url) continue;
    downloadQueue.push({ id, url, filename });
  }
  processDownloadQueue().catch((err) => emit('download-progress', { id: 'queue', percent: 0, speed: 0, error: err.message }));
  return { status: 'queued', count: tasks.length };
});

app.whenReady().then(async () => {
  try {
    await startPythonBackend();
    createWindow();
  } catch (err) {
    dialog.showErrorBox('PLAYE Studio — Ошибка запуска', `${err.message}\n\nЗапустите install.ps1 и повторите попытку.`);
    app.quit();
  }
});

app.on('will-quit', () => {
  if (pythonProcess) {
    pythonProcess.kill();
    pythonProcess = null;
  }
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});


ipcMain.handle('delete-model', async (_event, payload = {}) => {
  const id = String(payload.id || '');
  const file = String(payload.file || '');
  if (!id || !file) throw new Error('id and file are required');
  const destination = path.join(MODELS_DIR, file);
  if (fs.existsSync(destination)) fs.unlinkSync(destination);
  emit('model-status-changed', { id, installed: false });
  return { status: 'deleted', id };
});
