// Afterschool Deadline — desktop (Windows) shell.
// Shows the game in a window and keeps the save in a file inside the app's data folder:
//   %APPDATA%\Afterschool Deadline\save.json  (the previous save is kept as save.bak.json)
const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const fs = require('fs');
const path = require('path');

app.setName('Afterschool Deadline');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
if (!app.requestSingleInstanceLock()) app.quit();

const saveFile = () => path.join(app.getPath('userData'), 'save.json');
const backupFile = () => path.join(app.getPath('userData'), 'save.bak.json');

ipcMain.on('save:load', (e) => {
  for (const f of [saveFile(), backupFile()]) {
    try { const t = fs.readFileSync(f, 'utf8'); JSON.parse(t); e.returnValue = t; return; } catch (err) { /* try the next one */ }
  }
  e.returnValue = null;
});
ipcMain.on('save:write', (e, json) => {
  try {
    const f = saveFile(), tmp = f + '.tmp';
    JSON.parse(json);                                   // never write a broken save
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(tmp, json);
    if (fs.existsSync(f)) fs.copyFileSync(f, backupFile());
    fs.renameSync(tmp, f);                              // replace in one step so a crash can't leave half a file
    e.returnValue = true;
  } catch (err) { e.returnValue = false; }
});
ipcMain.on('save:clear', (e) => {
  for (const f of [saveFile(), backupFile()]) { try { fs.rmSync(f, { force: true }); } catch (err) { } }
  e.returnValue = true;
});

// window size chosen in the game's settings: '1280' | '1600' | '1920' | 'full'
const SIZES = { '1280': [1280, 720], '1600': [1600, 900], '1920': [1920, 1080] };
ipcMain.on('win:set', (e, mode) => {
  e.returnValue = true; if (!win) return;
  if (mode === 'full') { win.setFullScreen(true); return; }
  const sz = SIZES[mode] || SIZES['1280'];
  const apply = () => { win.setContentSize(sz[0], sz[1]); win.center(); };
  if (win.isFullScreen()) { win.once('leave-full-screen', apply); win.setFullScreen(false); } else apply();
});

let win = null;
function createWindow() {
  win = new BrowserWindow({
    width: 1280, height: 720, minWidth: 960, minHeight: 540, useContentSize: true,
    backgroundColor: '#000000', title: 'Afterschool Deadline', autoHideMenuBar: true, show: false,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  Menu.setApplicationMenu(null);
  win.once('ready-to-show', () => win.show());
  // F11 / Alt+Enter: fullscreen on and off
  win.webContents.on('before-input-event', (ev, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11' || (input.key === 'Enter' && input.alt)) { win.setFullScreen(!win.isFullScreen()); ev.preventDefault(); }
  });
  // the game never leaves its own page
  win.webContents.on('will-navigate', (ev) => ev.preventDefault());
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.loadFile(path.join(__dirname, 'index.html'));
}

app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
