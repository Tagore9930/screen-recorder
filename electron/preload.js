const { contextBridge, ipcRenderer } = require('electron');
window.isElectron = true;
contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('minimize'),
  close: () => ipcRenderer.send('close'),
});
