import { Component, NgZone, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AppConfig } from '../environments/environment';
import { ElectronService } from './services/electron.service';
import { fromEvent } from 'rxjs';
import { IpcRendererEvent } from 'electron/main';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  title = 'PSARipper';
  isElectron: boolean;
  isMaximized = true;

  constructor(
    private translate: TranslateService,
    private es: ElectronService,
    private ngZone: NgZone
  ) {

    this.translate.setDefaultLang('en');
    this.isElectron = this.es.isElectron;

    console.log(`Run in ${this.isElectron ? 'electron' : 'browser'} with `, AppConfig);
  }

  ngOnInit(): void {

    if (!this.isElectron) return;

    fromEvent<[IpcRendererEvent, boolean]>(this.es.ipcRenderer!, 'window-max-restore-toggle').subscribe({
      next: ([, maxi]) => {
        this.ngZone.run(() => {
          this.isMaximized = maxi;
        });    
      },
    });
  }

  minimizeWindow(): void {
    this.es.ipcRenderer?.send('cmd-to-main', { command: 'minimize-window' });
  }
  maximizeWindow(): void {
    this.es.ipcRenderer?.send('cmd-to-main', { command: 'maximize-window' });
  }
  restoreWindow(): void {
    this.es.ipcRenderer?.send('cmd-to-main', { command: 'restore-window' });
  }
  closeWindow(): void {
    this.es.ipcRenderer?.send('cmd-to-main', { command: 'close-window' });
  }
}
