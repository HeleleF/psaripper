import { Component, Input, OnInit } from '@angular/core';
import { PSAJobData, PSAJobStatus } from '../model/PSAJobData.interface';

@Component({
	selector: 'app-psa-job',
	templateUrl: './psa-job.component.html',
	styleUrls: ['./psa-job.component.scss']
})
export class PsaJobComponent implements OnInit {
	ST = PSAJobStatus;

	@Input() jobIndex!: number;
	@Input() jobData!: PSAJobData;

	constructor() {}

	ngOnInit(): void {}
}
