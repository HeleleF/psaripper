import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { from, Observable, of, throwError } from 'rxjs';
import { catchError, delay, map, switchMap, tap } from 'rxjs/operators';
import { DownloadMethod } from '../model/AppSettings.interface';
import { PSAJobStatus } from '../model/PSAJobData.interface';
import { PSAShowRelease } from '../model/PSAShowRelease.interface';
import { ElectronService } from './electron.service';
import { JobService } from './job.service';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root'
})
export class ExtractAndDownloadService {

  private dp: DOMParser;

  constructor(
    private http: HttpClient,
    private es: ElectronService,
    private js: JobService,
    private ss: SettingsService,
  ) {
    
    this.dp = new DOMParser();

  }

  private sendToJD(link: string) {
    return this.http.get(`http://127.0.0.1:9666/flashgot?source=psa2jd_thisisasecretvalue_xxx&package=pkg&dir=tmp&urls=${encodeURIComponent(link)}`, { responseType: 'text' }).pipe(
      catchError(() => of('')),
      map(html => html.includes('.jar'))
    );
  }

  downloadRelease(link: string) {

    switch (this.ss.get('downloadMethod')) {

      case DownloadMethod.MEGA_CMD:
        console.log('Donwloading with mega...');
        return of(true).pipe(delay(3000));

      case DownloadMethod.JD: 
        console.log('Sending to JD...');
        return this.sendToJD(link);

      case DownloadMethod.BROWSER:
      default: 
        console.log('Opening in default browser...');
        this.es.ipcRenderer!.send('cmd-to-main', { command: 'open-window', link }); //TODO(helene): failed in prod mit undefined error?
        return of(true);
    }

  }

  startExtract(release: PSAShowRelease) {

    const id = Math.random().toString(36).slice(2);
    const whitelist = this.ss.get('linksWhitelist');

    this.js.addNewJob({ id, release, status: PSAJobStatus.STARTING });

    const job$ = from<Promise<string[]>>(this.es.ipcRenderer!.invoke('extract', release)).pipe(
      tap(() => this.js.updateJob(id, { status: PSAJobStatus.EXTRACTED })),
      map(releases => releases.filter(r => {
        const origin = new URL(r).origin;
        return whitelist.includes(origin); 
      })),
      tap(() => this.js.updateJob(id, { status: PSAJobStatus.DOWNLOADING })),
      switchMap(filtered => this.downloadRelease(filtered[0])), //TODO(helene): was wenn nach filtern nichts mehr übrig ist? failed?
      tap(success => this.js.updateJob(id, { 
        status: success ? PSAJobStatus.DONE : PSAJobStatus.FAILED, 
        errorMessage: success ? undefined : 'Extraction failed!'
      }))
    );

    const sub = job$.subscribe(() => sub.unsubscribe());

    return job$;
  }
}