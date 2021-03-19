/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { from, Observable, of } from 'rxjs';
import { catchError, delay, map, switchMap, tap } from 'rxjs/operators';

import { ElectronService } from './electron.service';
import { JobService } from './job.service';
import { SettingsService } from './settings.service';

import { DownloadMethod, DownloadResult } from '../model/AppSettings.interface';
import { PSAJobStatus } from '../model/PSAJobData.interface';
import { PSAMovieRelease, PSAShowRelease } from '../model/PSARelease.interface';

@Injectable({
	providedIn: 'root'
})
export class ExtractAndDownloadService {
	private readonly JD_API = 'http://127.0.0.1:9666/flashgot';
	private readonly JD_TOKEN = 'psa2jd_thisisasecretvalue_xxx';

	constructor(
		private http: HttpClient,
		private es: ElectronService,
		private js: JobService,
		private ss: SettingsService
	) {}

	private sendToJD(links: string[]): Observable<DownloadResult> {
		return this.http
			.get(
				`${this.JD_API}?source=${
					this.JD_TOKEN
				}&package=PSARipper&dir=tmp${
					this.ss.get('jdAutoStart') ? '&autostart=1' : ''
				}&urls=${encodeURIComponent(links.join('\n'))}`,
				{ responseType: 'text' }
			)
			.pipe(
				catchError(() => of('')),
				map((html) => {
					const done = html.includes('.jar');

					return {
						success: done,
						message: done
							? undefined
							: 'JDownloader is not running!'
					};
				})
			);
	}

	downloadRelease(links: string[]): Observable<DownloadResult> {
		switch (this.ss.get('downloadMethod')) {
			case DownloadMethod.MEGA_CMD:
				console.log('Donwloading with mega...');
				return of({
					success: false,
					message: 'Download via MEGA CMD is not supported yet!'
				}).pipe(delay(3000));

			case DownloadMethod.JD:
				console.log('Sending to JD...', links);
				return this.sendToJD(links);

			case DownloadMethod.BROWSER:
			default:
				console.log('Opening in default browser...', links);
				this.es.ipcRenderer!.send('cmd-to-main', {
					command: 'open-window',
					links
				});
				return of({ success: true });
		}
	}

	startExtract(
		release: PSAShowRelease | PSAMovieRelease
	): Observable<DownloadResult> {
		const id = release.exitLinks[0].slice(54, 86);
		const whitelist = this.ss.get('linksWhitelist');

		this.js.addNewJob({ id, release, status: PSAJobStatus.STARTING });

		const extractionResult: Promise<string[]> = this.es.ipcRenderer!.invoke(
			'extract',
			release
		);

		const job$ = from(extractionResult).pipe(
			tap(() =>
				this.js.updateJob(id, { status: PSAJobStatus.EXTRACTED })
			),
			map((releases) =>
				releases.filter((r) => {
					const origin = new URL(r).origin;
					return whitelist.includes(origin);
				})
			),
			tap(() =>
				this.js.updateJob(id, { status: PSAJobStatus.DOWNLOADING })
			),
			switchMap((filtered) => {
				return filtered.length
					? this.downloadRelease(filtered)
					: of({
							success: false,
							message: 'No links left after filtering!'
					  });
			}),
			tap(({ success, message }) =>
				this.js.updateJob(id, {
					status: success ? PSAJobStatus.DONE : PSAJobStatus.FAILED,
					errorMessage: message
				})
			)
		);

		const sub = job$.subscribe(() => sub.unsubscribe());

		return job$;
	}
}
