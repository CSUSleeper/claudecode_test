const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  setTrayTitle: (title) => ipcRenderer.send('set-tray-title', title),
  showNotification: (title, body) => ipcRenderer.send('show-notification', title, body),
  setAlwaysOnTop: (flag) => ipcRenderer.send('set-always-on-top', flag),
});
