// The only bridge between the game page and the computer: reading and writing the save file.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  loadSave: () => ipcRenderer.sendSync('save:load'),
  writeSave: (json) => ipcRenderer.sendSync('save:write', String(json)),
  clearSave: () => ipcRenderer.sendSync('save:clear'),
});
