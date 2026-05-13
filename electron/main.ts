import { app, BrowserWindow, session, shell } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { DOWNLOAD_RESULT_CHANNEL } from './ipc-channels';

const MODULE_DIR: string = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT: string = path.join(MODULE_DIR, '..');
const PRELOAD_PATH: string = path.join(MODULE_DIR, 'preload.cjs');
const RENDERER_INDEX_HTML: string = path.join(
  PROJECT_ROOT,
  'dist',
  'index.html',
);

const DEV_SERVER_URL: string | undefined = process.env.VITE_DEV_SERVER_URL;

const WINDOW_DEFAULT_WIDTH: number = 1280;
const WINDOW_DEFAULT_HEIGHT: number = 860;
const WINDOW_MIN_WIDTH: number = 960;
const WINDOW_MIN_HEIGHT: number = 640;

let mainWindow: BrowserWindow | null = null;

/**
 * Creates the main BrowserWindow and loads the renderer entry.
 */
function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: WINDOW_DEFAULT_WIDTH,
    height: WINDOW_DEFAULT_HEIGHT,
    minWidth: WINDOW_MIN_WIDTH,
    minHeight: WINDOW_MIN_HEIGHT,
    backgroundColor: '#f8fafc',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 18, y: 20 },
    show: false,
    webPreferences: {
      preload: PRELOAD_PATH,
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  if (DEV_SERVER_URL) {
    void mainWindow.loadURL(DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    void mainWindow.loadFile(RENDERER_INDEX_HTML);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Registers a listener that forwards the final state of every download
 * triggered from the renderer (via `<a download>` / Blob) back to the
 * originating `webContents`. Used by the renderer to show a toast only
 * after the user has actually confirmed the save location.
 */
function registerDownloadListener(): void {
  session.defaultSession.on('will-download', (_event, item, webContents) => {
    item.once('done', (_doneEvent, state) => {
      webContents.send(DOWNLOAD_RESULT_CHANNEL, {
        state,
        fileName: item.getFilename(),
        savedPath: state === 'completed' ? item.getSavePath() : null,
      });
    });
  });
}

void app.whenReady().then(() => {
  registerDownloadListener();
  createMainWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
