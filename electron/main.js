const { app, BrowserWindow, session } = require('electron');
const path = require('path');
const { ipcMain } = require('electron');

ipcMain.on('minimize', () => {
  mainWindow.minimize();
});

ipcMain.on('close', () => {
  mainWindow.close();
});

let mainWindow;
function createWindow() {
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media') {
      callback(true); // allow mic
    } else {
      callback(false);
    }
  });

  // Desktop desktopCapturer
  session.defaultSession.setDisplayMediaRequestHandler(
    (request, callback) => {
      desktopCapturer.getSources({ types: ['screen'] }).then((sources) => {
        callback({ video: sources[0], audio: 'loopback' });
      });
    },
    { useSystemPicker: true },
  );

  mainWindow = new BrowserWindow({
    width: 350,
    height: 125,
    resizable: false,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, './preload.js'),
      // nodeIntegration: true,
      // contextIsolation: false,
      nodeIntegration: false,
      contextIsolation: true,
      // enableRemoteModule: true,
    },
  });

  mainWindow.loadURL('http://localhost:4200');
  // mainWindow.loadFile(path.join(__dirname, '../dist/screen-recorder/browser/index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.commandLine.appendSwitch('enable-features', 'MediaStream');
app.commandLine.appendSwitch('use-fake-ui-for-media-stream'); // auto allow
app.commandLine.appendSwitch('unsafely-treat-insecure-origin-as-secure', 'file://');

app.whenReady().then(createWindow);
