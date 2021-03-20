import { app, BrowserWindow, screen, ipcMain, shell } from 'electron';
import { IPCData } from './src/app/shared/model.interface';
import { BrowserWindowConstructorOptions } from 'electron';
import { extractor } from './src/app/shared/extractor';
import { autoUpdater } from 'electron-updater';

let mainWindow: BrowserWindow | null = null;

const args = process.argv.slice(1),
	isDev = args.some((val) => val === '--dev');

const instanceLock = app.requestSingleInstanceLock();
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
			webSecurity: !isDev, //necessary for CORS issues on localhost
			nodeIntegration: true,
			allowRunningInsecureContent: isDev,
			contextIsolation: false
		}
	};

	// Create the browser window.
	mainWindow = new BrowserWindow(windowOptions);
	isDev
		? mainWindow.loadURL('http://localhost:4200')
		: mainWindow.loadFile('dist/index.html');

	if (isDev) mainWindow.webContents.openDevTools();

	const toggle = () => {
		const isMaxi = mainWindow?.isMaximized();
		mainWindow?.webContents.send('window-max-restore-toggle', isMaxi);
	};

	mainWindow.on('maximize', toggle);
	mainWindow.on('unmaximize', toggle);
	mainWindow.on('closed', () => {
		mainWindow = null;
	});

	ipcMain.on('cmd-to-main', (_, data: IPCData) => {
		switch (data.command) {
			case 'open-devtools':
				mainWindow?.webContents.openDevTools();
				break;

			case 'open-window':
				data.links.forEach((link: string) =>
					shell.openExternal(link, { activate: false })
				);
				break;

			case 'minimize-window':
				mainWindow?.minimize();
				break;

			case 'maximize-window':
				mainWindow?.maximize();
				break;

			case 'restore-window':
				mainWindow?.unmaximize();
				break;

			case 'close-window':
				// kann später auch raus
				if (mainWindow?.webContents.isDevToolsOpened())
					mainWindow?.webContents.closeDevTools();

				mainWindow?.close();
				break;

			default:
				console.log(`Recieved unknown command "${data.command}"`);
				break;
		}
	});

	ipcMain.handle('extract', (_, data: any) => extractor.add(data));

	return mainWindow;
};

if (!instanceLock) {
	app.quit();
} else {
	app.on('ready', () => {
		setTimeout(() => {
			createWindow();
			autoUpdater.checkForUpdatesAndNotify();
		}, 400);
	});
	app.on('second-instance', () => {
		if (mainWindow) {
			if (mainWindow.isMinimized()) mainWindow.restore();
			mainWindow.focus();
		}
	});
}

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});
app.on('activate', () => {
	if (mainWindow === null) {
		createWindow();
	}
});
