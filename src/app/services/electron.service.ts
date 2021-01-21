import { Injectable } from '@angular/core';

// If you import a module but never use any of the imported values other than as TypeScript types,
// the resulting javascript file will look as if you never imported the module at all.
import { ipcRenderer } from 'electron';
import { Observable, Subject } from 'rxjs';

import { IPCData } from '../shared/model.interface';

@Injectable({
  providedIn: 'root'
})
export class ElectronService {

  public ipcRenderer: typeof ipcRenderer | undefined;
  private subject$ = new Subject<IPCData>();

  get messages$(): Observable<IPCData> {
    return this.subject$.asObservable();
  }

  get isElectron(): boolean {
    return /Electron/.test(navigator.userAgent);
  }

  constructor() {
    // Conditional imports
    if (this.isElectron) {
      this.ipcRenderer = window.require('electron').ipcRenderer;
      this.ipcRenderer?.on('cmd-from-main', (ev, data: IPCData) => this.subject$.next(data));
    }
  }

  sendMessage(data: IPCData): void {
    this.ipcRenderer?.send('cmd-to-main', data);
  }
}
