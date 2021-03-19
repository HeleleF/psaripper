import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { PSAJobData } from '../model/PSAJobData.interface';
import { ExtractAndDownloadService } from '../services/extract-and-download.service';
import { JobService } from '../services/job.service';

@Component({
	selector: 'app-home',
	templateUrl: './home.component.html',
	styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
	jobs$: Observable<PSAJobData[]>;
	sub: Subscription | undefined;

	constructor(
		private js: JobService,
		private eds: ExtractAndDownloadService
	) {
		this.jobs$ = this.js.onJobsChanged();
	}

	ngOnInit(): void {}

	ngOnDestroy(): void {
		this.sub?.unsubscribe();
	}

	addNewJob(): void {}

	updateJob(): void {}

	removeJob(id: string): void {
		this.js.removeJob(id);
	}
}
