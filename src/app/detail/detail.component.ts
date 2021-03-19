import { Component, OnDestroy, OnInit } from '@angular/core';
import { SettingsService } from '../services/settings.service';
import { AppSettings } from '../model/AppSettings.interface';
import { ElectronService } from '../services/electron.service';

@Component({
	selector: 'app-detail',
	templateUrl: './detail.component.html',
	styleUrls: ['./detail.component.scss']
})
export class DetailComponent implements OnInit, OnDestroy {
	settings: AppSettings;

	constructor(private ss: SettingsService, private es: ElectronService) {
		this.settings = this.ss.getAll();
	}

	ngOnInit(): void {}

	ngOnDestroy(): void {
		this.ss.save();
	}

	reload(): void {}

	saveD(): void {
		console.log(this.settings);
		this.ss.update('downloadMethod', this.settings.downloadMethod);
	}

	openDev(): void {
		this.es.ipcRenderer?.send('cmd-to-main', { command: 'open-devtools' });
	}
}
