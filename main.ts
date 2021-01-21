import { app, BrowserWindow, screen, ipcMain } from 'electron';
import { extract } from './src/app/shared/message.interface';
import { IPCData } from './src/app/shared/model.interface';
import { Store } from './electron-store';
import { BrowserWindowConstructorOptions } from 'electron';

let win: BrowserWindow | null = null;
const settingsStore = new Store();

const args = process.argv.slice(1),
  serve = args.some(val => val === '--serve');

const createWindow = (): BrowserWindow => {

  const size = screen.getPrimaryDisplay().workAreaSize;

  const windowOptions: BrowserWindowConstructorOptions = {
    x: 0,
    y: 0,
    width: size.width,
    height: size.height,
    frame: false,
    backgroundColor: '#FFF',
    webPreferences: {
      webSecurity: false, // nur an, damit CORS nicht rumstresst, später kann das weg, weil electron dann ausm file läuft
      nodeIntegration: true,
      allowRunningInsecureContent: serve,
      contextIsolation: false,  // false if you want to run 2e2 test with Spectron
    }
  };

  if (serve) {
    require('electron-reload')(__dirname, { electron: require(`${__dirname}/node_modules/electron`) });
  } else {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    windowOptions.webPreferences!.webSecurity = true;
  }
  
  // Create the browser window.
  win = new BrowserWindow(windowOptions);
  serve ? win.loadURL('http://localhost:4200') : win.loadFile('dist/index.html');

  // TODO: muss später natürlich weg
  win.webContents.openDevTools();

  const toggle = () => win?.webContents.send('window-max-restore-toggle', win?.isMaximized());

  win.on('maximize', toggle);
  win.on('unmaximize', toggle);
  win.on('closed', () => { win = null; });

  return win;
};

// Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
app.on('ready', () => setTimeout(createWindow, 400));
app.on('window-all-closed', () => {

  if (process.platform !== 'darwin') {
    app.quit();
  }
});
app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
});


// eslint-disable-next-line @typescript-eslint/no-misused-promises
ipcMain.on('cmd-to-main', async (ev, data: IPCData) => {

  switch (data.command) {

    case 'minimize-window':
      win?.minimize();
      break;

    case 'maximize-window':
      win?.maximize();
      break;

    case 'restore-window':
      win?.unmaximize();
      break;

    case 'close-window':

      // kann später auch raus
      if (win?.webContents.isDevToolsOpened()) win?.webContents.closeDevTools();

      win?.close();
      break;

    case 'extract-start': {

      const start = Date.now();
      ev.sender.send('cmd-from-main', { command: 'extract-started', file: data.name });
    
      const results = await extract(data.exitLink, data.name);
      ev.sender.send('cmd-from-main', { command: 'extract-done', links: results.length, file: data.name, time: Date.now() - start });
      break;
    }

    case 'get-all': 
      ev.sender.send('cmd-from-main', { command: 'settings-all', settings: settingsStore.getAll() });
      break;

    case 'get': 
      ev.sender.send('cmd-from-main', { command: 'settings-get', settings: settingsStore.get(data.key) });
      break;

    case 'update': 
      ev.sender.send('cmd-from-main', { command: 'settings-update', settings: settingsStore.update(data.key, data.value) });
      break;

    case 'save': 
      settingsStore.save();
      ev.sender.send('cmd-from-main', { command: 'settings-saved' });
      break;

    default: 
      throw new Error('ubb');
  }
});

ipcMain.handle('get-settings', () => settingsStore.getAll());
