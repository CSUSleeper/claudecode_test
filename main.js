const { app, BrowserWindow, Tray, Menu, ipcMain, Notification, nativeImage } = require('electron');
const path = require('path');

let mainWindow;
let tray;

// ============================================================
// 创建主窗口
// ============================================================
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 550,
    resizable: false,          // 禁止调整窗口大小，保持固定尺寸
    title: 'Pomodoro Timer',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // 预加载脚本，用于安全地桥接主进程和渲染进程
      contextIsolation: true,   // 开启上下文隔离，渲染进程无法直接访问 Node.js API
      nodeIntegration: false,   // 关闭 Node 集成，防止渲染进程直接使用 require 等
    },
  });

  mainWindow.loadFile('index.html');

  // 拦截窗口关闭事件：点击关闭按钮时不退出应用，只是隐藏窗口到托盘
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();   // 阻止默认的关闭行为
      mainWindow.hide();        // 隐藏窗口（而不是销毁）
    }
    // 如果 app.isQuitting 为 true，说明是用户主动退出，允许正常关闭
  });
}

// ============================================================
// 创建系统托盘图标
// ============================================================
function createTray() {
  // 使用 Base64 编码的 PNG 数据创建一个 16x16 的托盘图标
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAARklEQVQ4T2NkYGBg+M9AAWBiYGBgYkAF/4k1gJEBl8p58+ahG8OEy0Ys+hkaGBhwmYKmHlnTf0YGBgYcJqNqRtWMqhkBALmcGSGJwwyfAAAAAElFTkSuQmCC'
  );
  tray = new Tray(icon);
  updateTrayMenu('🍅 Pomodoro');  // 初始化托盘菜单，显示默认标题

  // 左键点击托盘图标时，重新显示主窗口
  tray.on('click', () => {
    mainWindow.show();
  });
}

// ============================================================
// 更新托盘菜单
// @param {string} title - 托盘菜单顶部显示的文字（如剩余时间）
// ============================================================
function updateTrayMenu(title) {
  const contextMenu = Menu.buildFromTemplate([
    { label: title, enabled: false },  // 顶部标题行，灰色不可点击，用于展示倒计时
    { type: 'separator' },             // 分隔线
    {
      label: 'Show',                   // "显示"菜单项：点击后显示主窗口
      click: () => mainWindow.show(),
    },
    {
      label: 'Quit',                   // "退出"菜单项：点击后彻底退出应用
      click: () => {
        app.isQuitting = true;         // 设置退出标志，让 close 事件处理函数放行
        app.quit();                    // 触发应用退出流程
      },
    },
  ]);
  tray.setContextMenu(contextMenu);
  tray.setToolTip(title);              // 鼠标悬停在托盘图标上时显示的提示文字
}

// ============================================================
// IPC 处理器：渲染进程 → 主进程 的通信桥梁
// ============================================================

// 1. 更新托盘标题（渲染进程在倒计时变化时调用）
ipcMain.on('set-tray-title', (_event, title) => {
  updateTrayMenu(title);
});

// 2. 弹出系统通知（番茄钟结束时调用）
ipcMain.on('show-notification', (_event, title, body) => {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show();
  }
});

// 3. 设置窗口是否置顶
ipcMain.on('set-always-on-top', (_event, flag) => {
  mainWindow.setAlwaysOnTop(flag);
});

// ============================================================
// 应用生命周期
// ============================================================

// 当 Electron 初始化完成时，创建窗口和托盘
app.whenReady().then(() => {
  createWindow();
  createTray();
});

// 所有窗口关闭时的处理：不做任何事，保持托盘运行
// （因为关闭窗口只是隐藏，这个事件在 macOS 上不会触发，
//   在 Windows 上 hide 也不会触发此事件，属于安全兜底）
app.on('window-all-closed', () => {
  // 不调用 app.quit()，保持托盘图标常驻
});

// 应用即将退出时的处理：设置退出标志
// 确保此时关闭窗口不会再次被 hide 拦截，而是真正关闭
app.on('before-quit', () => {
  app.isQuitting = true;
});
