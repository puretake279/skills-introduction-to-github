// The only bridge between the game page and the computer: the save file and the window size.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  loadSave: () => ipcRenderer.sendSync('save:load'),
  writeSave: (json) => ipcRenderer.sendSync('save:write', String(json)),
  clearSave: () => ipcRenderer.sendSync('save:clear'),
  setWindow: (mode) => ipcRenderer.sendSync('win:set', String(mode)),
});
