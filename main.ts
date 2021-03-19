import { app, BrowserWindow, screen, ipcMain, shell } from 'electron';
import { IPCData } from './src/app/shared/model.interface';
import { BrowserWindowConstructorOptions } from 'electron';
import { extractor } from './src/app/shared/extractor';

let win: BrowserWindow | null = null;

const args = process.argv.slice(1),
	serve = args.some((val) => val === '--serve');

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
			webSecurity: !serve, //necessary for CORS issues on localhost
			nodeIntegration: true,
			allowRunningInsecureContent: serve,
			contextIsolation: false
		}
	};

	// Create the browser window.
	win = new BrowserWindow(windowOptions);
	serve
		? win.loadURL('http://localhost:4200')
		: win.loadFile('dist/index.html');

	if (serve) win.webContents.openDevTools();

	const toggle = () => {
		const isMaxi = win?.isMaximized();
		win?.webContents.send('window-max-restore-toggle', isMaxi);
	};

	win.on('maximize', toggle);
	win.on('unmaximize', toggle);
	win.on('closed', () => {
		win = null;
	});

	return win;
};

// Added 400 ms to fix the black background issue while using transparent window.
// More detais at https://github.com/electron/electron/issues/15947
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

ipcMain.on('cmd-to-main', (_, data: IPCData) => {
	switch (data.command) {
		case 'open-devtools':
			win?.webContents.openDevTools();
			break;

		case 'open-window':
			data.links.forEach((link: string) =>
				shell.openExternal(link, { activate: false })
			);
			break;

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
			if (win?.webContents.isDevToolsOpened())
				win?.webContents.closeDevTools();

			win?.close();
			break;

		default:
			console.log(`Recieved unknown command "${data.command}"`);
			break;
	}
});

ipcMain.handle('extract', (_, data: any) => extractor.add(data));
