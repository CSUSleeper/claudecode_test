const { app, BrowserWindow, Tray, Menu, ipcMain, Notification, nativeImage } = require('electron');
const path = require('path');

let mainWindow;
let tray;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 550,
    resizable: false,
    title: 'Pomodoro Timer',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  // Create a simple 16x16 tray icon programmatically
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAARklEQVQ4T2NkYGBg+M9AAWBiYGBgYkAF/4k1gJEBl8p58+ahG8OEy0Ys+hkaGBhwmYKmHlnTf0YGBgYcJqNqRtWMqhkBALmcGSGJwwyfAAAAAElFTkSuQmCC'
  );
  tray = new Tray(icon);
  updateTrayMenu('🍅 Pomodoro');

  tray.on('click', () => {
    mainWindow.show();
  });
}

function updateTrayMenu(title) {
  const contextMenu = Menu.buildFromTemplate([
    { label: title, enabled: false },
    { type: 'separator' },
    {
      label: 'Show',
      click: () => mainWindow.show(),
    },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);
  tray.setContextMenu(contextMenu);
  tray.setToolTip(title);
}

// IPC handlers
ipcMain.on('set-tray-title', (_event, title) => {
  updateTrayMenu(title);
});

ipcMain.on('show-notification', (_event, title, body) => {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show();
  }
});

ipcMain.on('set-always-on-top', (_event, flag) => {
  mainWindow.setAlwaysOnTop(flag);
});

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  // Do nothing — keep running in tray
});

app.on('before-quit', () => {
  app.isQuitting = true;
});
